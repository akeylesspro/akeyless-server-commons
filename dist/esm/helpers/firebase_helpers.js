var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import firebase_admin from "firebase-admin";
import { init_env_variables } from "./global_helpers";
import { cache_manager, logger, translation_manager } from "../managers";
// initial firebase
const required_env_vars = [
    "mode",
    "port",
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
    credential: firebase_admin.credential.cert(service_account_firebase),
});
export const db = firebase_admin.firestore();
/// extract
const simple_extract_data = (doc) => {
    const doc_data = doc.data();
    return Object.assign(Object.assign({}, doc_data), { id: doc.id });
};
/// documents
export const get_all_documents = (collection_path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield db.collection(collection_path).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return simple_extract_data(doc);
        });
        return documents;
    }
    catch (error) {
        logger.error("Error fetching documents:", error);
        throw error;
    }
});
export const query_documents = (collection_path, field_name, operator, value) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const querySnapshot = yield db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents;
    }
    catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        throw error;
    }
});
export const query_documents_by_conditions = (collection_path, where_conditions) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = yield query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents;
    }
    catch (error) {
        logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        throw error;
    }
});
export const query_document_by_conditions = (collection_path_1, where_conditions_1, ...args_1) => __awaiter(void 0, [collection_path_1, where_conditions_1, ...args_1], void 0, function* (collection_path, where_conditions, log = true) {
    try {
        let query = db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = yield query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        if (!documents[0]) {
            throw "no data returned from DB";
        }
        return documents[0];
    }
    catch (error) {
        if (log) {
            logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        }
        throw error;
    }
});
/// document
export const query_document = (collection_path_1, field_name_1, operator_1, value_1, ...args_1) => __awaiter(void 0, [collection_path_1, field_name_1, operator_1, value_1, ...args_1], void 0, function* (collection_path, field_name, operator, value, ignore_log = false) {
    try {
        const querySnapshot = yield db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        if (documents.length < 1) {
            throw `No data to return from: 
      collection: ${collection_path}, 
      field_name: ${field_name}, 
      operator: ${operator}, 
      value:${value}`;
        }
        return documents[0];
    }
    catch (error) {
        if (!ignore_log) {
            logger.error("Error querying document:", error);
        }
        throw error;
    }
});
export const query_document_optional = (collection_path, field_name, operator, value) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const querySnapshot = yield db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents[0] || null;
    }
    catch (error) {
        logger.error("Error querying document:", error);
        return null;
    }
});
export const get_document_by_id = (collection_path, doc_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = db.collection(collection_path).doc(doc_id);
        const doc = yield docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc);
    }
    catch (error) {
        logger.error("error from get_document_by_id", error);
        throw error;
    }
});
export const set_document = (collection_path, doc_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db
            .collection(collection_path)
            .doc(doc_id)
            .set(Object.assign({}, data), { merge: true });
    }
    catch (error) {
        logger.error(`failed to create document by id: ${doc_id} in collection: ${collection_path}`, error);
        throw `failed to create document by id ${doc_id} in collection ${collection_path}`;
    }
});
export const add_document = (collection_path_1, data_1, ...args_1) => __awaiter(void 0, [collection_path_1, data_1, ...args_1], void 0, function* (collection_path, data, include_id = false) {
    try {
        const new_document = db.collection(collection_path).doc();
        const update = include_id ? Object.assign(Object.assign({}, data), { id: new_document.id }) : data;
        yield new_document.set(update);
    }
    catch (error) {
        logger.error(`failed to create document in collection: ${collection_path}`, error);
        throw `failed to create document in collection ${collection_path}`;
    }
});
export const delete_document = (collection_path, doc_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.collection(collection_path).doc(doc_id).delete();
    }
    catch (error) {
        throw `Failed to delete document with id ${doc_id} from collection ${collection_path}`;
    }
});
/// token
export const verify_token = (bearer_token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = bearer_token.split(/bearer\s+(.+)/i)[1];
        if (!token) {
            throw "validation error: Token not found";
        }
        const res = yield firebase_admin.auth().verifyIdToken(token);
        return res;
    }
    catch (error) {
        logger.error("error from verify_token", error);
        throw error;
    }
});
/// parsers
export const parse_translations = (documents) => {
    const data = {};
    documents.forEach((doc) => {
        data[doc.id] = doc;
        delete data[doc.id].id;
    });
    translation_manager.setTranslation(data);
};
export const parse_settings = (documents, name) => {
    const data = {};
    documents.forEach((doc) => {
        data[doc.id] = doc;
    });
    cache_manager.setObjectData(name, data);
};
/// snapshots
let snapshots_first_time = [];
export const snapshot = (collection_name, config) => {
    return new Promise((resolve) => {
        db.collection(collection_name).onSnapshot((snapshot) => {
            var _a, _b, _c, _d;
            const documents = snapshot.docs.flatMap((doc) => simple_extract_data(doc));
            if (!snapshots_first_time.includes(collection_name)) {
                (_a = config.on_first_time) === null || _a === void 0 ? void 0 : _a.call(config, documents);
                snapshots_first_time.push(collection_name);
                resolve();
            }
            else {
                (_b = config.on_add) === null || _b === void 0 ? void 0 : _b.call(config, snapshot
                    .docChanges()
                    .filter((change) => change.type === "added")
                    .map((change) => simple_extract_data(change.doc)));
                (_c = config.on_modify) === null || _c === void 0 ? void 0 : _c.call(config, snapshot
                    .docChanges()
                    .filter((change) => change.type === "modified")
                    .map((change) => simple_extract_data(change.doc)));
                (_d = config.on_remove) === null || _d === void 0 ? void 0 : _d.call(config, snapshot
                    .docChanges()
                    .filter((change) => change.type === "removed")
                    .map((change) => simple_extract_data(change.doc)));
            }
        }, (error) => {
            logger.error(`Error listening to collection: ${collection_name}`, error);
        });
    });
};
export const init_snapshots = () => __awaiter(void 0, void 0, void 0, function* () {
    logger.log("==> init snapshots start... ");
    const snapshots = [
        snapshot("nx-translations", { on_first_time: parse_translations, on_add: parse_translations }),
        snapshot("nx-settings", {
            on_first_time: (docs) => parse_settings(docs, "nx-settings"),
            on_add: (docs) => parse_settings(docs, "nx-settings"),
        }),
        snapshot("settings", { on_first_time: (docs) => parse_settings(docs, "settings"), on_add: (docs) => parse_settings(docs, "settings") }),
    ];
    yield Promise.all(snapshots);
    logger.log("==> init snapshots end ✅");
});
export const snapshots_bulk = (snapshots, label) => __awaiter(void 0, void 0, void 0, function* () {
    logger.log(`==> ${label || "custom snapshots"} start... `);
    yield Promise.all(snapshots);
    logger.log(`==> ${label || "custom snapshots"} end ✅`);
});
//# sourceMappingURL=firebase_helpers.js.map