import { REDIS_UPDATES_PREFIX } from "akeyless-types-commons";

const get_key = (...args: string[]) => {
    return args.join(":");
};

export const get_doc_key = (collection: string, doc_id: string) => {
    return get_key(collection, doc_id);
};

export const get_collection_keys = (collection: string) => {
    return get_key(collection, "*");
};

export const get_collection_hash_key = (collection: string) => {
    return collection;
};

export const get_channel = (...args: string[]) => {
    return get_key(REDIS_UPDATES_PREFIX, ...args);
};
