import { performance } from "perf_hooks";
import firebase_admin from "firebase-admin";
import {
    AddAuditRecord,
    OnSnapshotConfig,
    QueryDocument,
    QueryDocumentByConditions,
    QueryDocumentOptional,
    QueryDocuments,
    QueryDocumentsByConditions,
    Snapshot,
    SnapshotBulk,
    SnapshotBulkByNames,
} from "../types";
import { cache_manager, logger, translation_manager } from "../managers";
import { DecodedIdToken } from "firebase-admin/auth";
import { TObject } from "akeyless-types-commons";
import dotenv from "dotenv";
import { init_env_variables } from "./global_helpers";
import { Timestamp } from "firebase-admin/firestore";
import { redis_snapshots_bulk } from "./redis";
dotenv.config();

// initial firebase
const required_env_vars = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "auth_uri",
    "token_uri",
    "auth_provider_x509_cert_url",
    "client_x509_cert_url",
    "universe_domain",
];
const env_data = init_env_variables(required_env_vars);
export const service_account_firebase = {
    type: env_data.type,
    project_id: env_data.project_id,
    private_key_id: env_data.private_key_id,
    private_key: env_data.private_key.replace(/\\n/g, "\n"),
    client_email: env_data.client_email,
    client_id: env_data.client_id,
    auth_uri: env_data.auth_uri,
    token_uri: env_data.token_uri,
    auth_provider_x509_cert_url: env_data.auth_provider_x509_cert_url,
    client_x509_cert_url: env_data.client_x509_cert_url,
    universe_domain: env_data.universe_domain,
};
firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(service_account_firebase as firebase_admin.ServiceAccount),
    storageBucket: `${service_account_firebase.project_id}.appspot.com`,
});
export const db = firebase_admin.firestore();
export const messaging = firebase_admin.messaging();
export const auth = firebase_admin.auth();
export const storage = firebase_admin.storage();

/// extract
export const simple_extract_data = (doc: FirebaseFirestore.DocumentSnapshot): TObject<any> => {
    const doc_data = doc.data();
    return {
        ...doc_data,
        id: doc.id,
    };
};

/// documents
export const get_all_documents = async (collection_path: string) => {
    try {
        const snapshot = await db.collection(collection_path).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return simple_extract_data(doc);
        });
        return documents;
    } catch (error) {
        logger.error("Error fetching documents:", error);
        throw error;
    }
};

export const query_documents: QueryDocuments = async (collection_path, field_name, operator, value) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        throw error;
    }
};

export const query_documents_by_conditions: QueryDocumentsByConditions = async (collection_path, where_conditions) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents;
    } catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        throw error;
    }
};

export const query_document_by_conditions: QueryDocumentByConditions = async (collection_path, where_conditions, log = true) => {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = await query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        if (!documents[0]) {
            throw "no data returned from DB";
        }
        return documents[0];
    } catch (error) {
        if (log) {
            logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        }
        throw error;
    }
};

/// document
export const query_document: QueryDocument = async (collection_path, field_name, operator, value, ignore_log = false) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        if (documents.length < 1) {
            throw `No data to return from: collection: ${collection_path}, field_name: ${field_name}, operator: ${operator}, value:${value}`;
        }
        return documents[0];
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying document: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        throw error;
    }
};

export const query_document_optional: QueryDocumentOptional = async (collection_path, field_name, operator, value, ignore_log = true) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents[0] || null;
    } catch (error) {
        if (!ignore_log) {
            logger.error("Error querying optional document: " + JSON.stringify({ collection_path, field_name, operator, value }), error);
        }
        return null;
    }
};

export const get_document_by_id = async (collection_path: string, doc_id: string): Promise<TObject<any>> => {
    try {
        const docRef = db.collection(collection_path).doc(doc_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc);
    } catch (error) {
        logger.error("error from get_document_by_id", error);
        throw error;
    }
};

export const get_document_by_id_optional = async (collection_path: string, doc_id: string): Promise<TObject<any> | null> => {
    try {
        const docRef = db.collection(collection_path).doc(doc_id);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc);
    } catch (error) {
        logger.error("error from get_document_by_id_optional", error);
        return null;
    }
};

export const set_document = async (collection_path: string, doc_id: string, data: {}, merge: boolean = true): Promise<void> => {
    try {
        await db
            .collection(collection_path)
            .doc(doc_id)
            .set({ ...data }, { merge });
    } catch (error) {
        logger.error(`failed to create document by id: ${doc_id} in collection: ${collection_path}`, error);
        throw `failed to create document by id ${doc_id} in collection ${collection_path}`;
    }
};

export const add_document = async (collection_path: string, data: {}, include_id = false, custom_id?: string): Promise<void> => {
    try {
        const new_document = custom_id ? db.collection(collection_path).doc(custom_id) : db.collection(collection_path).doc();
        const update = include_id ? { ...data, id: new_document.id } : data;
        await new_document.set(update);
    } catch (error) {
        logger.error(`failed to create document in collection: ${collection_path}`, error);
        throw `failed to create document in collection ${collection_path}`;
    }
};

export const delete_document = async (collection_path: string, doc_id: string): Promise<void> => {
    try {
        await db.collection(collection_path).doc(doc_id).delete();
    } catch (error) {
        throw `Failed to delete document with id ${doc_id} from collection ${collection_path}`;
    }
};

/// token
export const verify_token = async (authorization: string | undefined): Promise<DecodedIdToken> => {
    try {
        if (!authorization) {
            throw "Authorization token is required";
        }
        if (!authorization.toLowerCase().startsWith("bearer")) {
            throw "Invalid authorization token";
        }
        const token = authorization.split(/bearer\s+(.+)/i)[1];

        if (!token) {
            throw "validation error: Token not found";
        }
        const res = await firebase_admin.auth().verifyIdToken(token);
        if (!res) {
            throw "User not found";
        }
        return res;
    } catch (error) {
        logger.error("error from verify_token", error);
        throw error;
    }
};

/// parsers
const parse_add_update_translations = (documents: any[]): void => {
    const data: TObject<any> = translation_manager.getTranslationData();
    documents.forEach((doc: TObject<any>) => {
        data[doc.id] = doc;
        delete data[doc.id].id;
    });
    translation_manager.setTranslationData(data);
};

const parse_delete_translations = (documents: any[]): void => {
    const data: TObject<any> = translation_manager.getTranslationData();
    documents.forEach((doc: TObject<any>) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    translation_manager.setTranslationData(data);
};

const parse_add_update_settings = (documents: any[], name_for_cache: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        data[doc.id] = doc;
    });
    cache_manager.setObjectData(name_for_cache, data);
};

const parse_delete_settings = (documents: any[], name_for_cache: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    cache_manager.setObjectData(name_for_cache, data);
};

export const parse_add_update_as_object = (documents: any[], config: OnSnapshotConfig): void => {
    const { collection_name, cache_name = collection_name, doc_key_property = "id" } = config;
    const data: TObject<any> = cache_manager.getObjectData(cache_name, {});
    documents.forEach((doc: TObject<any>) => {
        data[doc[doc_key_property]] = doc;
    });
    cache_manager.setObjectData(cache_name, data);
};

export const parse_delete_as_object = (documents: any[], config: OnSnapshotConfig): void => {
    const { collection_name, cache_name = collection_name, doc_key_property = "id" } = config;
    const data: TObject<any> = cache_manager.getObjectData(cache_name, {});
    documents.forEach((doc: TObject<any>) => {
        if (data[doc[doc_key_property]]) {
            delete data[doc[doc_key_property]];
        }
    });
    cache_manager.setObjectData(cache_name, data);
};

export const parse_add_update_as_array = (documents: any[], config: OnSnapshotConfig): void => {
    const { on_remove, collection_name, cache_name = collection_name } = config;
    on_remove?.(documents, config);
    const existing_array: any[] = cache_manager.getArrayData(cache_name);
    const updated_array = [...existing_array, ...documents];
    cache_manager.setArrayData(cache_name, updated_array);
};

export const parse_delete_as_array = (documents: any[], config: OnSnapshotConfig): void => {
    const { collection_name, cache_name = collection_name } = config;
    const existing_array: any[] = cache_manager.getArrayData(cache_name);
    const keys_to_delete = documents.map((doc) => doc.id);
    const updated_array = existing_array.filter((doc) => !keys_to_delete.includes(doc.id));
    cache_manager.setArrayData(cache_name, updated_array);
};

/// snapshots
let snapshots_first_time: string[] = [];

export const snapshot: Snapshot = (config) => {
    const { collection_name, cache_name = collection_name, conditions, debug } = config;
    return new Promise<void>((resolve) => {
        let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(collection_name);
        if (conditions) {
            conditions.forEach((condition) => {
                const { field_name, operator, value } = condition;
                q = q.where(field_name, operator, value);
            });
        }
        q.onSnapshot(
            (snapshot) => {
                if (!snapshots_first_time.includes(cache_name)) {
                    snapshots_first_time.push(cache_name);
                    const documents = snapshot.docs.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
                    if (debug?.on_first_time) {
                        logger.log(`${cache_name} => Firebase snapshot on first time: `, documents);
                    }
                    config.on_first_time?.(documents, config);
                    config.extra_parsers?.forEach((extra_parser) => {
                        if (debug?.extra_parsers?.on_first_time) {
                            logger.log(`${cache_name} => Firebase snapshot extra parsers on first time: `, documents);
                        }
                        extra_parser.on_first_time?.(documents, config);
                    });

                    resolve();
                } else {
                    const get_docs_from_snapshot = (action: string): TObject<any>[] => {
                        return snapshot
                            .docChanges()
                            .filter((change) => change.type === action)
                            .map((change) => simple_extract_data(change.doc));
                    };
                    const [added, modified, removed] = [
                        get_docs_from_snapshot("added"),
                        get_docs_from_snapshot("modified"),
                        get_docs_from_snapshot("removed"),
                    ];
                    if (added.length) {
                        if (debug?.on_add) {
                            logger.log(`${cache_name} => Firebase snapshot on add: `, added);
                        }
                        config.on_add?.(added, config);
                    }
                    if (modified.length) {
                        if (debug?.on_modify) {
                            logger.log(`${cache_name} => Firebase snapshot on modify: `, modified);
                        }
                        config.on_modify?.(modified, config);
                    }
                    if (removed.length) {
                        if (debug?.on_remove) {
                            logger.log(`${cache_name} => Firebase snapshot on remove: `, removed);
                        }
                        config.on_remove?.(removed, config);
                    }

                    config.extra_parsers?.forEach((extra_parser) => {
                        if (added.length) {
                            if (debug?.extra_parsers?.on_add) {
                                logger.log(`${cache_name} => Firebase snapshot extra parsers on add: `, added);
                            }
                            extra_parser.on_add?.(added, config);
                        }
                        if (modified.length) {
                            if (debug?.extra_parsers?.on_modify) {
                                logger.log(`${cache_name} => Firebase snapshot extra parsers on modify: `, modified);
                            }
                            extra_parser.on_modify?.(modified, config);
                        }
                        if (removed.length) {
                            if (debug?.extra_parsers?.on_remove) {
                                logger.log(`${cache_name} => Firebase snapshot extra parsers on remove: `, removed);
                            }
                            extra_parser.on_remove?.(removed, config);
                        }
                    });
                }
            },
            (error) => {
                logger.error(`Error listening to collection: ${config.collection_name}`, error);
            }
        );
    });
};

export const init_snapshots = async (): Promise<void> => {
    await snapshot_bulk(
        [
            snapshot({
                collection_name: "nx-translations",
                on_first_time: parse_add_update_translations,
                on_add: parse_add_update_translations,
                on_modify: parse_add_update_translations,
                on_remove: parse_delete_translations,
            }),
            snapshot({
                collection_name: "nx-settings",
                on_first_time: (docs) => parse_add_update_settings(docs, "nx-settings"),
                on_add: (docs) => parse_add_update_settings(docs, "nx-settings"),
                on_modify: (docs) => parse_add_update_settings(docs, "nx-settings"),
                on_remove: (docs) => parse_delete_settings(docs, "nx-settings"),
            }),
            snapshot({
                collection_name: "settings",
                on_first_time: (docs) => parse_add_update_settings(docs, "settings"),
                on_add: (docs) => parse_add_update_settings(docs, "settings"),
                on_modify: (docs) => parse_add_update_settings(docs, "settings"),
                on_remove: (docs) => parse_delete_settings(docs, "settings"),
            }),
        ],
        "Common snapshots"
    );
};

export const snapshot_bulk: SnapshotBulk = async (snapshots, label?) => {
    const start = performance.now();
    logger.log(`==> ${label || "custom snapshots"} started... `);
    await Promise.all(snapshots);
    logger.log(`==> ${label || "custom snapshots"} ended. It took ${(performance.now() - start).toFixed(2)} ms`);
};

export const snapshot_bulk_by_names: SnapshotBulkByNames = async (params, options) => {
    const { label = "snapshot_bulk_by_names", subscription_type = "firebase", debug } = options || {};
    const start = performance.now();
    logger.log(`==> Snapshots ${label} => [${subscription_type}] started... `);
    const configs: OnSnapshotConfig[] = params.map((param) => {
        const result: OnSnapshotConfig =
            typeof param === "string"
                ? {
                      collection_name: param,
                      subscription_type,
                      debug,
                      on_first_time: (docs, config) => parse_add_update_as_array(docs, config),
                      on_add: (docs, config) => parse_add_update_as_array(docs, config),
                      on_modify: (docs, config) => parse_add_update_as_array(docs, config),
                      on_remove: (docs, config) => parse_delete_as_array(docs, config),
                  }
                : {
                      collection_name: param.collection_name,
                      extra_parsers: param.extra_parsers,
                      conditions: param.conditions,
                      cache_name: param.cache_name,
                      subscription_type: param.subscription_type || subscription_type,
                      debug: param.debug || debug,
                      on_first_time: (docs, config) => parse_add_update_as_array(docs, config),
                      on_add: (docs, config) => parse_add_update_as_array(docs, config),
                      on_modify: (docs, config) => parse_add_update_as_array(docs, config),
                      on_remove: (docs, config) => parse_delete_as_array(docs, config),
                  };

        return result;
    });
    const redis_snapshots = configs.filter((config) => config.subscription_type === "redis");
    const firebase_snapshots = configs
        .filter((config) => config.subscription_type === "firebase")
        .map((config) => {
            return snapshot(config);
        });
    await redis_snapshots_bulk(redis_snapshots);
    await Promise.all(firebase_snapshots);
    logger.log(`==> Snapshots ${label} => [${subscription_type}] ended. It took ${(performance.now() - start).toFixed(2)} ms`);
};

export const add_audit_record: AddAuditRecord = async (action, entity, details, user) => {
    const data = {
        action,
        entity,
        details,
        datetime: Timestamp.now(),
        user: user || null,
    };
    try {
        await db.collection("nx-audit").add(data);
    } catch (error: any) {
        throw { msg: "unable to add audit record", data };
    }
};

export interface SaveFileOptions {
    content_type?: string;
    content_disposition?: string;
    cache_control?: string;
    make_public?: boolean;
    signed_url_ttl_ms?: number;
    resumable?: boolean;
}

export const save_file_in_storage = async (file_path: string, buffer: Buffer | Uint8Array, options: SaveFileOptions = {}): Promise<string> => {
    try {
        const bucket = storage.bucket();
        const normalized_path = file_path.replace(/^\/+/, "");
        const file = bucket.file(normalized_path);

        const metadata = {
            contentType: options.content_type,
            cacheControl: options.cache_control,
            contentDisposition: options.content_disposition,
        };

        await file.save(buffer, {
            metadata,
            resumable: options.resumable ?? false,
        });

        if (options.make_public ?? true) {
            await file.makePublic();
        }

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + (options.signed_url_ttl_ms ?? 1000 * 60 * 60 * 24 * 7),
        });
        return url;
    } catch (error: any) {
        logger.error("error from save_file_in_storage", { error: error?.message || error });
        throw error;
    }
};

export const get_file_url_from_storage = async (file_path: string): Promise<string> => {
    try {
        const bucket = storage.bucket();
        const normalized_path = file_path.replace(/^\/+/, "");
        const file = bucket.file(normalized_path);

        const [exists] = await file.exists();
        if (!exists) {
            throw new Error("file not exist");
        }

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        });
        return url;
    } catch (error: any) {
        logger.error(`error from get_file_url_from_storage, file_path: ${file_path}`, error);
        throw error;
    }
};

export const get_nx_settings = async () => {
    const cache = cache_manager.getObjectData("nx-settings");
    if (cache) {
        return cache;
    }
    const docs = await get_all_documents("nx-settings");
    const nx_settings: TObject<any> = {};
    docs.forEach((doc) => {
        nx_settings[doc.id] = doc;
    });
    cache_manager.setObjectData("nx-settings", nx_settings);
    return nx_settings;
};
