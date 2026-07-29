import Redis, { ChainableCommander } from "ioredis";
import { CollectionConfig, RedisUpdatePayload, RedisUpdateType, TObject } from "akeyless-types-commons";
import { get_redis_commander } from "./initialize";
import { get_nx_settings } from "../firebase_helpers";
import { logger } from "../../managers";

export type RedisWriteTarget = Redis | ChainableCommander;

const HSCAN_COUNT = 1000;

export const parse_redis_value = (raw: string): TObject<any> => {
    const parsed = JSON.parse(raw);
    return parsed.data ?? parsed;
};

const is_big_collection = async (collection: string): Promise<boolean> => {
    try {
        const nx_settings = await get_nx_settings();
        const cache_collections_config2: TObject<CollectionConfig> = nx_settings.cache_collections_config2 || {};
        return cache_collections_config2[collection]?.is_big_collection === true;
    } catch {
        return false;
    }
};

const hscan_all = async (commander: Redis, hash_key: string): Promise<TObject<string>> => {
    const entries: TObject<string> = {};
    let cursor = "0";
    do {
        const [next_cursor, flat] = await commander.hscan(hash_key, cursor, "COUNT", HSCAN_COUNT);
        cursor = next_cursor;
        for (let i = 0; i < flat.length; i += 2) {
            entries[flat[i]] = flat[i + 1];
        }
    } while (cursor !== "0");
    return entries;
};

const is_expired = (envelope: TObject<any>, now: number): boolean => {
    return typeof envelope.expires_at === "number" && envelope.expires_at <= now;
};

const drop_expired_fields = (commander: Redis, hash_key: string, fields: string[]) => {
    if (!fields.length) {
        return;
    }
    commander.hdel(hash_key, ...fields).catch((error) => logger.error(`Error deleting expired fields from "${hash_key}"`, error));
};

export const write_doc = (
    target: RedisWriteTarget,
    collection: string,
    id: string,
    envelope: RedisUpdatePayload<RedisUpdateType>,
    opts?: { ttl_ms?: number }
) => {
    const payload =
        opts?.ttl_ms === undefined ? envelope : { ...envelope, expires_at: (envelope.update_time ?? Date.now()) + opts.ttl_ms };
    return target.hset(collection, id, JSON.stringify(payload));
};

export const remove_doc = (target: RedisWriteTarget, collection: string, id: string) => {
    return target.hdel(collection, id);
};

export const read_doc = async (collection: string, id: string): Promise<TObject<any> | null> => {
    const commander = get_redis_commander();
    const raw = await commander.hget(collection, id);
    if (!raw) {
        return null;
    }
    const envelope = JSON.parse(raw);
    if (is_expired(envelope, Date.now())) {
        drop_expired_fields(commander, collection, [id]);
        return null;
    }
    return envelope.data ?? envelope;
};

export const read_collection_entries = async (collection: string): Promise<Map<string, TObject<any>>> => {
    const commander = get_redis_commander();
    const entries = (await is_big_collection(collection)) ? await hscan_all(commander, collection) : await commander.hgetall(collection);

    const now = Date.now();
    const expired_fields: string[] = [];
    const envelopes = new Map<string, TObject<any>>();
    for (const [field, raw] of Object.entries(entries)) {
        try {
            const envelope = JSON.parse(raw);
            if (is_expired(envelope, now)) {
                expired_fields.push(field);
                continue;
            }
            envelopes.set(field, envelope);
        } catch (error) {
            logger.error(`Error parsing Redis hash field "${collection}" -> "${field}"`, error);
        }
    }
    drop_expired_fields(commander, collection, expired_fields);
    return envelopes;
};

export const read_collection = async (collection: string, opts?: { id_from_field?: boolean }): Promise<TObject<any>[]> => {
    const envelopes = await read_collection_entries(collection);
    const documents: TObject<any>[] = [];
    for (const [field, envelope] of envelopes) {
        const data = envelope.data ?? envelope;
        documents.push(opts?.id_from_field ? { ...data, id: field } : data);
    }
    return documents;
};
