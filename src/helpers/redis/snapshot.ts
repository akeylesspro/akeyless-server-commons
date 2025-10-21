import { get_redis_commander, get_redis_listener, redis_commander_connected, redis_listener_connected } from "./initialize";
import { OnSnapshotConfig } from "../../types";
import { CollectionConfig, RedisUpdatePayload, RedisUpdateType, TObject } from "akeyless-types-commons";
import {
    get_nx_settings,
    parse_add_update_as_array,
    parse_add_update_as_object,
    parse_delete_as_array,
    parse_delete_as_object,
    snapshot,
} from "../firebase_helpers";
import { get_collection_keys, scan_redis_keys } from "./keys";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "../../managers";

const subscription_collections = new Set<string>();

export const redis_snapshots_bulk = async (configs: OnSnapshotConfig[]) => {
    /// on first time
    for (const config of configs) {
        const validation = await validate_config(config);
        if (!validation.success) {
            logger.warn(validation.message!, config);
            if (validation.trigger_firebase_snapshot) {
                await snapshot(config);
            }
            continue;
        }
        await parse_redis_snapshot(config);
    }
    /// on update
    get_redis_listener().on("pmessage", async (pattern: string, channel: string, message: string) => {
        const { collection_name, update_type, data: doc }: RedisUpdatePayload<RedisUpdateType> = JSON.parse(message);
        const update = [convert_object_timestamps(doc)];
        const relevant_configs = configs.filter((config) => config.collection_name === collection_name);
        for (const config of relevant_configs) {
            await parse_redis_snapshot(config, { update_type, update });
        }
    });
};

interface ValidateConfigResult {
    success: boolean;
    trigger_firebase_snapshot?: boolean;
    message?: string;
}

const validate_config = async (config: OnSnapshotConfig): Promise<ValidateConfigResult> => {
    const nx_settings = await get_nx_settings();
    const cache_collections_config: TObject<CollectionConfig> = nx_settings.cache_collections_config || {};
    const { collection_name, cache_name = collection_name, subscription_type = "firebase" } = config;
    if (!redis_commander_connected || !redis_listener_connected) {
        return {
            success: false,
            trigger_firebase_snapshot: true,
            message: `⚠️ Redis commander or listener not connected, triggered firebase snapshot for collection: "${collection_name}"`,
        };
    }

    if (subscription_type === "firebase") {
        return {
            success: false,
            trigger_firebase_snapshot: true,
            message: `⚠️ subscription type is "firebase", triggered firebase snapshot for collection: "${collection_name}"`,
        };
    }

    if (!cache_collections_config[collection_name] || cache_collections_config[collection_name].sync_direction === "redis_to_firebase") {
        return {
            success: false,
            trigger_firebase_snapshot: true,
            message: `⚠️ collection: "${collection_name}" not found in cache_collections_config in "nx-settings" or sync_direction is "redis_to_firebase", triggered firebase snapshot for collection: "${collection_name}"`,
        };
    }

    if (subscription_collections.has(cache_name)) {
        return {
            success: false,
            trigger_firebase_snapshot: false,
            message: `⚠️ collection: "${collection_name}" already has a subscription, skipped redis snapshot for collection: "${collection_name}"`,
        };
    }
    subscription_collections.add(cache_name);
    return { success: true };
};

const parse_redis_snapshot = async (config: OnSnapshotConfig, redis_update?: { update_type: RedisUpdateType; update: TObject<any>[] }) => {
    const {
        collection_name: config_collection_name,
        cache_name = config_collection_name,
        extra_parsers,
        parse_as,
        debug,
        on_add,
        on_remove,
        on_modify,
    } = config;

    if (!redis_update) {
        const init_data = await get_collection_data(config_collection_name);
        default_parsers(parse_as, init_data, config);
        if (debug?.on_first_time) {
            logger.log(
                `${cache_name} => Redis snapshot on first time: `,
                debug.on_first_time === "documents" ? init_data : { length: init_data.length }
            );
        }
        config.on_first_time?.(init_data, config);
        extra_parsers?.forEach((parser) => {
            if (debug?.extra_parsers?.on_first_time) {
                logger.log(
                    `${cache_name} => Redis snapshot extra parsers on first time: `,
                    debug.extra_parsers.on_first_time === "documents" ? init_data : { length: init_data.length }
                );
            }
            parser?.on_first_time?.(init_data, config);
        });
        return;
    }

    if (!subscription_collections.has(cache_name)) {
        return;
    }
    const { update_type, update } = redis_update;
    switch (update_type) {
        case "add":
            if (debug?.on_add) {
                logger.log(`${cache_name} => Redis snapshot on add: `, update);
            }
            default_parsers(parse_as, update, config);
            on_add?.(update, config);
            extra_parsers?.forEach((parser) => {
                if (debug?.extra_parsers?.on_add) {
                    logger.log(`${cache_name} => Redis snapshot extra parsers on add: `, update);
                }
                parser?.on_add?.(update, config);
            });
            return;
        case "update":
            if (debug?.on_modify) {
                logger.log(`${cache_name} => Redis snapshot on modify: `, update);
            }
            default_parsers(parse_as, update, config);
            on_modify?.(update, config);
            extra_parsers?.forEach((parser) => {
                if (debug?.extra_parsers?.on_modify) {
                    logger.log(`${cache_name} => Redis snapshot extra parsers on modify: `, update);
                }
                parser?.on_modify?.(update, config);
            });
            return;
        case "delete":
            if (debug?.on_remove) {
                logger.log(`${cache_name} => Redis snapshot on remove: `, update);
            }
            if (parse_as === "object") {
                parse_delete_as_object(update, config);
            }
            if (parse_as === "array") {
                parse_delete_as_array(update, config);
            }
            on_remove?.(update, config);
            extra_parsers?.forEach((parser) => {
                if (debug?.extra_parsers?.on_remove) {
                    logger.log(`${cache_name} => Redis snapshot extra parsers on remove: `, update);
                }
                parser?.on_remove?.(update, config);
            });
            return;
        default:
            return;
    }
};

const default_parsers = (parse_as: "array" | "object" | undefined, update: TObject<any>[], config: OnSnapshotConfig) => {
    if (parse_as === "object") {
        parse_add_update_as_object(update, config);
    }
    if (parse_as === "array") {
        parse_add_update_as_array(update, config);
    }
};

const get_collection_data = async (collection_name: string) => {
    const redis_commander = get_redis_commander();
    const keys = await scan_redis_keys(get_collection_keys(collection_name), redis_commander);
    let collection_data: any[] = [];
    if (keys.length > 0) {
        const values = await redis_commander.mget(keys);
        collection_data = values.filter(Boolean).map((v: any) => JSON.parse(v).data);
    }
    return collection_data.map((data) => convert_object_timestamps(data));
};

const convert_object_timestamps = (data: TObject<any>) => {
    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "object" && value && value._seconds) {
            data[key] = new Timestamp(value._seconds, value._nanoseconds);
        }
    });
    return data;
};
