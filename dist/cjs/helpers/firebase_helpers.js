"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshots_bulk = exports.init_snapshots = exports.snapshot = exports.parse_settings = exports.parse_translations = exports.verify_token = exports.delete_document = exports.add_document = exports.set_document = exports.get_document_by_id = exports.query_document_optional = exports.query_document = exports.query_document_by_conditions = exports.query_documents_by_conditions = exports.query_documents = exports.get_all_documents = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const global_helpers_1 = require("./global_helpers");
const managers_1 = require("../managers");
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
const env_data = (0, global_helpers_1.init_env_variables)(required_env_vars);
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
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(service_account_firebase),
});
exports.db = firebase_admin_1.default.firestore();
/// extract
const simple_extract_data = (doc) => {
    const doc_data = doc.data();
    return Object.assign(Object.assign({}, doc_data), { id: doc.id });
};
/// documents
const get_all_documents = (collection_path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield exports.db.collection(collection_path).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return simple_extract_data(doc);
        });
        return documents;
    }
    catch (error) {
        managers_1.logger.error("Error fetching documents:", error);
        throw error;
    }
});
exports.get_all_documents = get_all_documents;
const query_documents = (collection_path, field_name, operator, value) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const querySnapshot = yield exports.db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents;
    }
    catch (error) {
        managers_1.logger.error(`Error querying documents: ${collection_path} - ${field_name} - ${operator} - ${value} `, error);
        throw error;
    }
});
exports.query_documents = query_documents;
const query_documents_by_conditions = (collection_path, where_conditions) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let query = exports.db.collection(collection_path);
        where_conditions.forEach((condition) => {
            query = query.where(condition.field_name, condition.operator, condition.value);
        });
        const querySnapshot = yield query.get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents;
    }
    catch (error) {
        managers_1.logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        throw error;
    }
});
exports.query_documents_by_conditions = query_documents_by_conditions;
const query_document_by_conditions = (collection_path_1, where_conditions_1, ...args_1) => __awaiter(void 0, [collection_path_1, where_conditions_1, ...args_1], void 0, function* (collection_path, where_conditions, log = true) {
    try {
        let query = exports.db.collection(collection_path);
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
            managers_1.logger.error(`Error querying documents: ${collection_path} - ${JSON.stringify(where_conditions)} `, error);
        }
        throw error;
    }
});
exports.query_document_by_conditions = query_document_by_conditions;
/// document
const query_document = (collection_path_1, field_name_1, operator_1, value_1, ...args_1) => __awaiter(void 0, [collection_path_1, field_name_1, operator_1, value_1, ...args_1], void 0, function* (collection_path, field_name, operator, value, ignore_log = false) {
    try {
        const querySnapshot = yield exports.db.collection(collection_path).where(field_name, operator, value).get();
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
            managers_1.logger.error("Error querying document:", error);
        }
        throw error;
    }
});
exports.query_document = query_document;
const query_document_optional = (collection_path, field_name, operator, value) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const querySnapshot = yield exports.db.collection(collection_path).where(field_name, operator, value).get();
        const documentsData = querySnapshot.docs;
        const documents = documentsData.flatMap((doc) => simple_extract_data(doc));
        return documents[0] || null;
    }
    catch (error) {
        managers_1.logger.error("Error querying document:", error);
        return null;
    }
});
exports.query_document_optional = query_document_optional;
const get_document_by_id = (collection_path, doc_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = exports.db.collection(collection_path).doc(doc_id);
        const doc = yield docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return simple_extract_data(doc);
    }
    catch (error) {
        managers_1.logger.error("error from get_document_by_id", error);
        throw error;
    }
});
exports.get_document_by_id = get_document_by_id;
const set_document = (collection_path, doc_id, data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.db
            .collection(collection_path)
            .doc(doc_id)
            .set(Object.assign({}, data), { merge: true });
    }
    catch (error) {
        managers_1.logger.error(`failed to create document by id: ${doc_id} in collection: ${collection_path}`, error);
        throw `failed to create document by id ${doc_id} in collection ${collection_path}`;
    }
});
exports.set_document = set_document;
const add_document = (collection_path_1, data_1, ...args_1) => __awaiter(void 0, [collection_path_1, data_1, ...args_1], void 0, function* (collection_path, data, include_id = false) {
    try {
        const new_document = exports.db.collection(collection_path).doc();
        const update = include_id ? Object.assign(Object.assign({}, data), { id: new_document.id }) : data;
        yield new_document.set(update);
    }
    catch (error) {
        managers_1.logger.error(`failed to create document in collection: ${collection_path}`, error);
        throw `failed to create document in collection ${collection_path}`;
    }
});
exports.add_document = add_document;
const delete_document = (collection_path, doc_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.db.collection(collection_path).doc(doc_id).delete();
    }
    catch (error) {
        throw `Failed to delete document with id ${doc_id} from collection ${collection_path}`;
    }
});
exports.delete_document = delete_document;
/// token
const verify_token = (bearer_token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = bearer_token.split(/bearer\s+(.+)/i)[1];
        if (!token) {
            throw "validation error: Token not found";
        }
        const res = yield firebase_admin_1.default.auth().verifyIdToken(token);
        return res;
    }
    catch (error) {
        managers_1.logger.error("error from verify_token", error);
        throw error;
    }
});
exports.verify_token = verify_token;
/// parsers
const parse_translations = (documents) => {
    const data = {};
    documents.forEach((doc) => {
        data[doc.id] = doc;
        delete data[doc.id].id;
    });
    managers_1.translation_manager.setTranslation(data);
};
exports.parse_translations = parse_translations;
const parse_settings = (documents, name) => {
    const data = {};
    documents.forEach((doc) => {
        data[doc.id] = doc;
    });
    managers_1.cache_manager.setObjectData(name, data);
};
exports.parse_settings = parse_settings;
/// snapshots
let snapshots_first_time = [];
const snapshot = (collection_name, config) => {
    var _a;
    config.is_ignore_first_time_changes = (_a = config.is_ignore_first_time_changes) !== null && _a !== void 0 ? _a : true;
    return new Promise((resolve) => {
        exports.db.collection(collection_name).onSnapshot((snapshot) => {
            var _a, _b, _c, _d;
            const is_first_time = !snapshots_first_time.includes(collection_name);
            const documents = snapshot.docs.flatMap((doc) => simple_extract_data(doc));
            (_a = config.parse) === null || _a === void 0 ? void 0 : _a.call(config, documents);
            if (!is_first_time || !config.is_ignore_first_time_changes) {
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
            if (is_first_time) {
                snapshots_first_time.push(collection_name);
                resolve();
            }
        }, (error) => {
            managers_1.logger.error(`Error listening to collection: ${collection_name}`, error);
        });
    });
};
exports.snapshot = snapshot;
const init_snapshots = () => __awaiter(void 0, void 0, void 0, function* () {
    managers_1.logger.log("==> init snapshots start... ");
    const snapshots = [
        (0, exports.snapshot)("nx-translations", { parse: exports.parse_translations }),
        (0, exports.snapshot)("nx-settings", { parse: (docs) => (0, exports.parse_settings)(docs, "nx-settings") }),
        (0, exports.snapshot)("settings", { parse: (docs) => (0, exports.parse_settings)(docs, "settings") }),
    ];
    yield Promise.all(snapshots);
    managers_1.logger.log("==> init snapshots end ✅");
});
exports.init_snapshots = init_snapshots;
const snapshots_bulk = (snapshots, label) => __awaiter(void 0, void 0, void 0, function* () {
    managers_1.logger.log(`==> ${label || "custom snapshots"} start... `);
    yield Promise.all(snapshots);
    managers_1.logger.log(`==> ${label || "custom snapshots"} end ✅`);
});
exports.snapshots_bulk = snapshots_bulk;
//# sourceMappingURL=firebase_helpers.js.map