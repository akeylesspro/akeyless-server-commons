import { REDIS_UPDATES_PREFIX } from "akeyless-types-commons";
import Redis from "ioredis";

const get_key = (...args: string[]) => {
    return args.join(":");
};

export const get_doc_key = (collection: string, doc_id: string) => {
    return get_key(collection, doc_id);
};

export const get_collection_keys = (collection: string) => {
    return get_key(collection, "*");
};

export const get_channel = (...args: string[]) => {
    return get_key(REDIS_UPDATES_PREFIX, ...args);
};

export const scan_redis_keys = async (pattern: string, redis_publisher: Redis): Promise<string[]> => {
    const found_keys: string[] = [];
    let cursor = "0";
    do {
        const [next_cursor, keys] = await redis_publisher.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = next_cursor;
        found_keys.push(...keys);
    } while (cursor !== "0");
    return found_keys;
};
