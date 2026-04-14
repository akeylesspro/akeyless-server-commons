import { CollectionConfig, TObject } from "akeyless-types-commons";
import { WhereCondition } from "../../types";
import { logger } from "../../managers";
import { get_redis_commander, redis_commander_connected } from "./initialize";
import { get_doc_key, get_collection_keys, scan_redis_keys } from "./keys";
import {
    get_nx_settings,
    get_all_documents,
    query_documents,
    query_documents_by_conditions,
    query_document_by_conditions,
    query_document,
    query_document_optional,
    get_document_by_id,
    get_document_by_id_optional,
} from "../firebase_helpers";

const should_use_redis = async (collection_path: string): Promise<boolean> => {
    if (!redis_commander_connected) {
        logger.warn(`⚠️ Redis commander not connected, falling back to Firebase for collection: "${collection_path}"`);
        return false;
    }
    try {
        const nx_settings = await get_nx_settings();
        const cache_collections_config: TObject<CollectionConfig> = nx_settings.cache_collections_config || {};
        const config = cache_collections_config[collection_path];
        if (!config) {
            logger.warn(`⚠️ Collection "${collection_path}" not found in cache_collections_config, falling back to Firebase`);
            return false;
        }
    } catch {
        logger.warn(`⚠️ Failed to validate Redis config for collection: "${collection_path}", falling back to Firebase`);
        return false;
    }
    return true;
};

const parse_redis_value = (raw: string): TObject<any> => {
    const parsed = JSON.parse(raw);
    return parsed.data ?? parsed;
};

const get_all_collection_docs = async (collection_path: string): Promise<TObject<any>[]> => {
    const commander = get_redis_commander();
    const keys = await scan_redis_keys(get_collection_keys(collection_path), commander);
    if (keys.length === 0) return [];
    const values = await commander.mget(keys);
    return values.filter(Boolean).map((v) => {
        const data = parse_redis_value(v!);
        const key = keys[values.indexOf(v)];
        /// example key: "nx-users(collection):123(doc_id)"
        const id = key.split(":").slice(1).join(":");
        return { ...data, id };
    });
};

const apply_operator = (doc_value: any, operator: FirebaseFirestore.WhereFilterOp, value: any): boolean => {
    switch (operator) {
        case "==":
            return doc_value === value;
        case "!=":
            return doc_value !== value;
        case "<":
            return doc_value < value;
        case "<=":
            return doc_value <= value;
        case ">":
            return doc_value > value;
        case ">=":
            return doc_value >= value;
        case "in":
            return Array.isArray(value) && value.includes(doc_value);
        case "not-in":
            return Array.isArray(value) && !value.includes(doc_value);
        case "array-contains":
            return Array.isArray(doc_value) && doc_value.includes(value);
        case "array-contains-any":
            return Array.isArray(doc_value) && Array.isArray(value) && value.some((v: any) => doc_value.includes(v));
        default:
            return false;
    }
};

const filter_by_condition = (docs: TObject<any>[], field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any): TObject<any>[] => {
    return docs.filter((doc) => apply_operator(doc[field_name], operator, value));
};

const filter_by_conditions = (docs: TObject<any>[], conditions: WhereCondition[]): TObject<any>[] => {
    return conditions.reduce((filtered, { field_name, operator, value }) => {
        return filter_by_condition(filtered, field_name, operator, value);
    }, docs);
};

// ── extract ──

export const redis_simple_extract_data = (raw: string): TObject<any> => {
    const data = parse_redis_value(raw);
    return data;
};

// ── documents ──

export const redis_get_all_documents = async (collection_path: string): Promise<TObject<any>[]> => {
    if (!(await should_use_redis(collection_path))) {
        return get_all_documents(collection_path);
    }
    try {
        return await get_all_collection_docs(collection_path);
    } catch (error) {
        logger.error("Error fetching documents from Redis:", error);
        throw error;
    }
};

export const redis_query_documents = async (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any
): Promise<TObject<any>[]> => {
    if (!(await should_use_redis(collection_path))) {
        return query_documents(collection_path, field_name, operator, value);
    }
    try {
        const all_docs = await get_all_collection_docs(collection_path);
        return filter_by_condition(all_docs, field_name, operator, value);
    } catch (error) {
        logger.error(`Error querying documents from Redis: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        throw error;
    }
};

export const redis_query_documents_by_conditions = async (collection_path: string, where_conditions: WhereCondition[]): Promise<TObject<any>[]> => {
    if (!(await should_use_redis(collection_path))) {
        return query_documents_by_conditions(collection_path, where_conditions);
    }
    try {
        const all_docs = await get_all_collection_docs(collection_path);
        return filter_by_conditions(all_docs, where_conditions);
    } catch (error) {
        logger.error(`Error querying documents from Redis: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        throw error;
    }
};

export const redis_query_document_by_conditions = async (
    collection_path: string,
    where_conditions: WhereCondition[],
    ignore_logs = false
): Promise<TObject<any>> => {
    if (!(await should_use_redis(collection_path))) {
        return query_document_by_conditions(collection_path, where_conditions, !ignore_logs);
    }
    try {
        const all_docs = await get_all_collection_docs(collection_path);
        const documents = filter_by_conditions(all_docs, where_conditions);
        if (!documents[0]) {
            throw "no data returned from Redis";
        }
        return documents[0];
    } catch (error) {
        if (!ignore_logs) {
            logger.error(`Error querying document from Redis: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        }
        throw error;
    }
};

// ── document ──

export const redis_query_document = async (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignore_log = false
): Promise<TObject<any>> => {
    if (!(await should_use_redis(collection_path))) {
        return query_document(collection_path, field_name, operator, value, ignore_log);
    }
    try {
        const all_docs = await get_all_collection_docs(collection_path);
        const documents = filter_by_condition(all_docs, field_name, operator, value);
        const base_error = `collection: ${collection_path}, field_name: ${field_name}, operator: ${operator}, value:${value}`;
        if (documents.length < 1) {
            throw `[Redis] No data to return from: ${base_error}`;
        }
        if (documents.length > 1) {
            throw `[Redis] Multiple documents found in: ${base_error}`;
        }
        return documents[0];
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying document from Redis: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        throw error;
    }
};

export const redis_query_document_optional = async (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignore_log = true
): Promise<TObject<any> | null> => {
    if (!(await should_use_redis(collection_path))) {
        return query_document_optional(collection_path, field_name, operator, value, ignore_log);
    }
    try {
        const all_docs = await get_all_collection_docs(collection_path);
        const documents = filter_by_condition(all_docs, field_name, operator, value);
        return documents[0] || null;
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying optional document from Redis: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        return null;
    }
};

export const redis_get_document_by_id = async (collection_path: string, doc_id: string): Promise<TObject<any>> => {
    if (!(await should_use_redis(collection_path))) {
        return get_document_by_id(collection_path, doc_id);
    }
    try {
        const commander = get_redis_commander();
        const key = get_doc_key(collection_path, doc_id);
        const raw = await commander.get(key);
        if (!raw) {
            throw "Document not found in Redis, document id: " + doc_id;
        }
        return redis_simple_extract_data(raw);
    } catch (error) {
        logger.error("error from redis_get_document_by_id", error);
        throw error;
    }
};

export const redis_get_document_by_id_optional = async (collection_path: string, doc_id: string): Promise<TObject<any> | null> => {
    if (!(await should_use_redis(collection_path))) {
        return get_document_by_id_optional(collection_path, doc_id);
    }
    try {
        const commander = get_redis_commander();
        const key = get_doc_key(collection_path, doc_id);
        const raw = await commander.get(key);
        if (!raw) {
            return null;
        }
        return redis_simple_extract_data(raw);
    } catch (error) {
        logger.error("error from redis_get_document_by_id_optional", error);
        return null;
    }
};
