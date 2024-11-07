import { performance } from "perf_hooks";
import firebase_admin from "firebase-admin";
import {
    OnSnapshotConfig,
    QueryDocument,
    QueryDocumentByConditions,
    QueryDocumentOptional,
    QueryDocuments,
    QueryDocumentsByConditions,
    Snapshot,
    SnapshotBulk,
} from "../types";
import { cache_manager, logger, translation_manager } from "../managers";
import { DecodedIdToken } from "firebase-admin/auth";
import { TObject } from "akeyless-types-commons";
import dotenv from "dotenv";
import { init_env_variables } from "./global_helpers";
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
const service_account_firebase = {
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
});
export const db = firebase_admin.firestore();
export const messaging = firebase_admin.messaging();

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
            logger.error("Error querying document:", error);
        }
        throw error;
    }
};

export const query_document_optional: QueryDocumentOptional = async (collection_path, field_name, operator, value) => {
    try {
        const querySnapshot = await db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
        return documents[0] || null;
    } catch (error) {
        logger.error("Error querying document:", error);
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

export const set_document = async (collection_path: string, doc_id: string, data: {}): Promise<void> => {
    try {
        await db
            .collection(collection_path)
            .doc(doc_id)
            .set({ ...data }, { merge: true });
    } catch (error) {
        logger.error(`failed to create document by id: ${doc_id} in collection: ${collection_path}`, error);
        throw `failed to create document by id ${doc_id} in collection ${collection_path}`;
    }
};

export const add_document = async (collection_path: string, data: {}, include_id = false): Promise<void> => {
    try {
        const new_document = db.collection(collection_path).doc();
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
export const verify_token = async (bearer_token: string): Promise<DecodedIdToken> => {
    try {
        const token: string | undefined = bearer_token.split(/bearer\s+(.+)/i)[1];
        if (!token) {
            throw "validation error: Token not found";
        }
        const res = await firebase_admin.auth().verifyIdToken(token);
        return res;
    } catch (error) {
        logger.error("error from verify_token", error);
        throw error;
    }
};

/// parsers
const parse__add_update__translations = (documents: any[]): void => {
    const data: TObject<any> = translation_manager.getTranslationData();
    documents.forEach((doc: TObject<any>) => {
        data[doc.id] = doc;
        delete data[doc.id].id;
    });
    translation_manager.setTranslationData(data);
};

const parse__delete__translations = (documents: any[]): void => {
    const data: TObject<any> = translation_manager.getTranslationData();
    documents.forEach((doc: TObject<any>) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    translation_manager.setTranslationData(data);
};

const parse__add_update__settings = (documents: any[], name_for_cache: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        data[doc.id] = doc;
    });
    cache_manager.setObjectData(name_for_cache, data);
};

const parse__delete__settings = (documents: any[], name_for_cache: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    cache_manager.setObjectData(name_for_cache, data);
};

const parse_add_update__as_object = (documents: any[], config: OnSnapshotConfig, doc_key_property: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(config.name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        data[doc[doc_key_property]] = doc;
    });
    cache_manager.setObjectData(doc_key_property, data);
};

const parse__delete__as_object = (documents: any[], config: OnSnapshotConfig, doc_key_property: string): void => {
    const data: TObject<any> = cache_manager.getObjectData(config.name_for_cache, {});
    documents.forEach((doc: TObject<any>) => {
        if (data[doc[doc_key_property]]) {
            delete data[doc[doc_key_property]];
        }
    });
    cache_manager.setObjectData(doc_key_property, data);
};

const parse__add_update__as_array = (documents: any[], config: OnSnapshotConfig): void => {
    parse__delete__as_array(documents, config);
    const existing_array: any[] = cache_manager.getArrayData(config.name_for_cache);
    const updated_array = [...existing_array, ...documents];
    cache_manager.setArrayData(config.name_for_cache, updated_array);
};

const parse__delete__as_array = (documents: any[], config: OnSnapshotConfig): void => {
    const existing_array: any[] = cache_manager.getArrayData(config.name_for_cache);
    const keys_to_delete = documents.map((doc) => doc.id);
    const updated_array = existing_array.filter((doc) => !keys_to_delete.includes(doc.id));
    cache_manager.setArrayData(config.name_for_cache, updated_array);
};

/// snapshots
let snapshots_first_time: string[] = [];

export const snapshot: Snapshot = (collection_name, config) => {
    config.name_for_cache = config.name_for_cache || collection_name;
    return new Promise<void>((resolve) => {
        db.collection(collection_name).onSnapshot(
            (snapshot) => {
                const documents = snapshot.docs.flatMap((doc: FirebaseFirestore.DocumentSnapshot) => simple_extract_data(doc));
                if (!snapshots_first_time.includes(config.name_for_cache || collection_name)) {
                    config.on_first_time?.(documents, config);
                    snapshots_first_time.push(config.name_for_cache || collection_name);
                    resolve();
                } else {
                    config.on_add?.(
                        snapshot
                            .docChanges()
                            .filter((change) => change.type === "added")
                            .map((change) => simple_extract_data(change.doc)),
                        config
                    );
                    config.on_modify?.(
                        snapshot
                            .docChanges()
                            .filter((change) => change.type === "modified")
                            .map((change) => simple_extract_data(change.doc)),
                        config
                    );
                    config.on_remove?.(
                        snapshot
                            .docChanges()
                            .filter((change) => change.type === "removed")
                            .map((change) => simple_extract_data(change.doc)),
                        config
                    );
                }
            },
            (error) => {
                logger.error(`Error listening to collection: ${collection_name}`, error);
            }
        );
    });
};

export const init_snapshots = async (): Promise<void> => {
    const start = performance.now();
    logger.log("==> init snapshots started... ");
    const snapshots: ReturnType<Snapshot>[] = [
        snapshot("nx-translations", {
            on_first_time: parse__add_update__translations,
            on_add: parse__add_update__translations,
            on_modify: parse__add_update__translations,
            on_remove: parse__delete__translations,
        }),
        snapshot("nx-settings", {
            on_first_time: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_add: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_modify: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_remove: (docs) => parse__delete__settings(docs, "nx-settings"),
        }),
        snapshot("settings", {
            on_first_time: (docs) => parse__add_update__settings(docs, "settings"),
            on_add: (docs) => parse__add_update__settings(docs, "settings"),
            on_modify: (docs) => parse__add_update__settings(docs, "settings"),
            on_remove: (docs) => parse__delete__settings(docs, "settings"),
        }),
    ];
    await Promise.all(snapshots);
    logger.log(`==> init snapshots ended in ${(performance.now() - start).toFixed(2)} ms`);
};

export const snapshots_bulk: SnapshotBulk = async (snapshots, label?) => {
    logger.log(`==> ${label || "custom snapshots"} start... `);
    await Promise.all(snapshots);
    logger.log(`==> ${label || "custom snapshots"} end`);
};

export const init_snapshots_cars = async (): Promise<void> => {
    const start = performance.now();
    logger.log("==> init snapshots-cars started... ");
    const snapshots: ReturnType<Snapshot>[] = [
        snapshot("units", {
            on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
            on_add: (docs, config) => parse__add_update__as_array(docs, config),
            on_modify: (docs, config) => parse__add_update__as_array(docs, config),
            on_remove: (docs, config) => parse__add_update__as_array(docs, config),
        }),
        snapshot("usersUnits", {
            on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
            on_add: (docs, config) => parse__add_update__as_array(docs, config),
            on_modify: (docs, config) => parse__add_update__as_array(docs, config),
            on_remove: (docs, config) => parse__add_update__as_array(docs, config),
        }),
    ];
    await Promise.all(snapshots);
    logger.log(`==> init snapshots-cars ended in ${(performance.now() - start).toFixed(2)} ms`);
};

export const init_snapshots_mobile = async (): Promise<void> => {
    const start = performance.now();
    logger.log("==> init snapshots-mobile started... ");
    const snapshots: ReturnType<Snapshot>[] = [
        snapshot("mobile_users_app_pro", {
            on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
            on_add: (docs, config) => parse__add_update__as_array(docs, config),
            on_modify: (docs, config) => parse__add_update__as_array(docs, config),
            on_remove: (docs, config) => parse__delete__as_array(docs, config),
        }),
        snapshot("app_pro_extra_pushes", {
            on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
            on_add: (docs, config) => parse__add_update__as_array(docs, config),
            on_modify: (docs, config) => parse__add_update__as_array(docs, config),
            on_remove: (docs, config) => parse__delete__as_array(docs, config),
        }),
    ];
    await Promise.all(snapshots);
    logger.log(`==> init snapshots-cars mobile in ${(performance.now() - start).toFixed(2)} ms`);
};
