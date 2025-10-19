import { redis_commander, redis_listener } from "./initialize";
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
    const nx_settings = await get_nx_settings();
    const cache_collections_config: TObject<CollectionConfig> = nx_settings.cache_collections_config || {};

    for (const config of configs) {
        const { collection_name, extra_parsers, cache_name = collection_name, parse_as, subscription_type = "firebase", debug } = config;
        if (subscription_type === "firebase" || cache_collections_config[collection_name]?.sync_direction === "redis_to_firebase") {
            await snapshot(config);
            continue;
        }

        if (subscription_collections.has(cache_name)) {
            continue;
        }
        subscription_collections.add(cache_name);
        const init_data = await get_collection_data(collection_name);
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
    }
    redis_listener.on("pmessage", async (pattern: string, channel: string, message: string) => {
        const { collection_name, update_type, data: doc }: RedisUpdatePayload<RedisUpdateType> = JSON.parse(message);
        const config = configs.find((config) => config.collection_name === collection_name);
        if (!config || !subscription_collections.has(config.cache_name || config.collection_name)) {
            return;
        }
        const { on_add, on_remove, on_modify, extra_parsers, parse_as, debug } = config;
        const update = [convert_object_timestamps(doc)];
        switch (update_type) {
            case "add":
                if (debug?.on_add) {
                    logger.log(`${config.cache_name || config.collection_name} => Redis snapshot on add: `, update);
                }
                default_parsers(parse_as, update, config);
                on_add?.(update, config);
                extra_parsers?.forEach((parser) => {
                    if (debug?.extra_parsers?.on_add) {
                        logger.log(`${config.cache_name || config.collection_name} => Redis snapshot extra parsers on add: `, update);
                    }
                    parser?.on_add?.(update, config);
                });
                return;
            case "update":
                if (debug?.on_modify) {
                    logger.log(`${config.cache_name || config.collection_name} => Redis snapshot on modify: `, update);
                }
                default_parsers(parse_as, update, config);
                on_modify?.(update, config);
                extra_parsers?.forEach((parser) => {
                    if (debug?.extra_parsers?.on_modify) {
                        logger.log(`${config.cache_name || config.collection_name} => Redis snapshot extra parsers on modify: `, update);
                    }
                    parser?.on_modify?.(update, config);
                });
                return;
            case "delete":
                if (debug?.on_remove) {
                    logger.log(`${config.cache_name || config.collection_name} => Redis snapshot on remove: `, update);
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
                        logger.log(`${config.cache_name || config.collection_name} => Redis snapshot extra parsers on remove: `, update);
                    }
                    parser?.on_remove?.(update, config);
                });
                return;
            default:
                return;
        }
    });
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
    const keys = await scan_redis_keys(get_collection_keys(collection_name), redis_commander);
    let collection_data: any[] = [];
    if (keys.length > 0) {
        const values = await redis_commander.mget(keys);
        collection_data = values.filter(Boolean).map((v: any) => JSON.parse(v).data);
    }
    return collection_data.map((data) => convert_object_timestamps(data));
};

const convert_object_timestamps = (date: TObject<any>) => {
    Object.entries(date).forEach(([key, value]) => {
        const role = typeof value === "object" && value._seconds;
        if (role) {
            date[key] = new Timestamp(value._seconds, value._nanoseconds);
        }
    });
    return date;
};
