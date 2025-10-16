import { redis_commander, redis_listener } from "./initialize";
import { OnSnapshotConfig } from "../../types";
import { RedisUpdatePayload, RedisUpdateType, TObject } from "akeyless-types-commons";
import { parse_add_update_as_array, parse_add_update_as_object, parse_delete_as_array, parse_delete_as_object } from "../firebase_helpers";
import { get_collection_keys, scan_redis_keys } from "./keys";
import { Timestamp } from "firebase-admin/firestore";

const subscription_collections = new Set<string>();

export const cache_snapshots_bulk = async (configs: OnSnapshotConfig[]) => {
    for (const config of configs) {
        const { collection_name, extra_parsers, cache_name = collection_name, parse_as } = config;
        if (subscription_collections.has(cache_name)) {
            continue;
        }

        subscription_collections.add(cache_name);
        const init_data = await get_collection_data(collection_name);
        default_parsers(parse_as, init_data, config);
        config.on_first_time?.(init_data, config);
        extra_parsers?.forEach((parser) => parser?.on_first_time?.(init_data, config));
    }
    redis_listener.on("pmessage", async (pattern: string, channel: string, message: string) => {
        const { collection_name, update_type, data: doc }: RedisUpdatePayload<RedisUpdateType> = JSON.parse(message);
        const config = configs.find((config) => config.collection_name === collection_name);
        if (!config) {
            return;
        }
        const { on_add, on_remove, on_modify, extra_parsers, parse_as } = config;
        const update = [convert_object_timestamps(doc)];
        switch (update_type) {
            case "add":
                default_parsers(parse_as, update, config);
                on_add?.(update, config);
                extra_parsers?.forEach((parser) => parser?.on_add?.(update, config));
                return;
            case "update":
                default_parsers(parse_as, update, config);
                on_modify?.(update, config);
                extra_parsers?.forEach((parser) => parser?.on_modify?.(update, config));
                return;
            case "delete":
                if (parse_as === "object") {
                    parse_delete_as_object(update, config);
                }
                if (parse_as === "array") {
                    parse_delete_as_array(update, config);
                }
                on_remove?.(update, config);
                extra_parsers?.forEach((parser) => parser?.on_remove?.(update, config));
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
