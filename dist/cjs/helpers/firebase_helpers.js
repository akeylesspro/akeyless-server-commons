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
exports.snapshot_bulk_by_names = exports.snapshot_bulk = exports.init_snapshots = exports.snapshot = exports.verify_token = exports.delete_document = exports.add_document = exports.set_document = exports.get_document_by_id_optional = exports.get_document_by_id = exports.query_document_optional = exports.query_document = exports.query_document_by_conditions = exports.query_documents_by_conditions = exports.query_documents = exports.get_all_documents = exports.simple_extract_data = exports.messaging = exports.db = void 0;
const perf_hooks_1 = require("perf_hooks");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const managers_1 = require("../managers");
const dotenv_1 = __importDefault(require("dotenv"));
const global_helpers_1 = require("./global_helpers");
dotenv_1.default.config();
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
exports.messaging = firebase_admin_1.default.messaging();
/// extract
const simple_extract_data = (doc) => {
    const doc_data = doc.data();
    return Object.assign(Object.assign({}, doc_data), { id: doc.id });
};
exports.simple_extract_data = simple_extract_data;
/// documents
const get_all_documents = (collection_path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield exports.db.collection(collection_path).get();
        const documents = snapshot.docs.flatMap((doc) => {
            return (0, exports.simple_extract_data)(doc);
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
        const documents = documentsData.flatMap((doc) => (0, exports.simple_extract_data)(doc));
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
        const documents = documentsData.flatMap((doc) => (0, exports.simple_extract_data)(doc));
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
        const documents = documentsData.flatMap((doc) => (0, exports.simple_extract_data)(doc));
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
        const documents = documentsData.flatMap((doc) => (0, exports.simple_extract_data)(doc));
        if (documents.length < 1) {
            throw `No data to return from: collection: ${collection_path}, field_name: ${field_name}, operator: ${operator}, value:${value}`;
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
        const documents = documentsData.flatMap((doc) => (0, exports.simple_extract_data)(doc));
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
        return (0, exports.simple_extract_data)(doc);
    }
    catch (error) {
        managers_1.logger.error("error from get_document_by_id", error);
        throw error;
    }
});
exports.get_document_by_id = get_document_by_id;
const get_document_by_id_optional = (collection_path, doc_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docRef = exports.db.collection(collection_path).doc(doc_id);
        const doc = yield docRef.get();
        if (!doc.exists) {
            throw "Document not found, document id: " + doc_id;
        }
        return (0, exports.simple_extract_data)(doc);
    }
    catch (error) {
        managers_1.logger.error("error from get_document_by_id_optional", error);
        return null;
    }
});
exports.get_document_by_id_optional = get_document_by_id_optional;
const set_document = (collection_path_1, doc_id_1, data_1, ...args_1) => __awaiter(void 0, [collection_path_1, doc_id_1, data_1, ...args_1], void 0, function* (collection_path, doc_id, data, merge = true) {
    try {
        yield exports.db
            .collection(collection_path)
            .doc(doc_id)
            .set(Object.assign({}, data), { merge });
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
const verify_token = (authorization) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!authorization || !authorization.toLocaleLowerCase().startsWith("bearer")) {
            throw "Invalid authorization token";
        }
        const token = authorization.split(/bearer\s+(.+)/i)[1];
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
const parse__add_update__translations = (documents) => {
    const data = managers_1.translation_manager.getTranslationData();
    documents.forEach((doc) => {
        data[doc.id] = doc;
        delete data[doc.id].id;
    });
    managers_1.translation_manager.setTranslationData(data);
};
const parse__delete__translations = (documents) => {
    const data = managers_1.translation_manager.getTranslationData();
    documents.forEach((doc) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    managers_1.translation_manager.setTranslationData(data);
};
const parse__add_update__settings = (documents, name_for_cache) => {
    const data = managers_1.cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc) => {
        data[doc.id] = doc;
    });
    managers_1.cache_manager.setObjectData(name_for_cache, data);
};
const parse__delete__settings = (documents, name_for_cache) => {
    const data = managers_1.cache_manager.getObjectData(name_for_cache, {});
    documents.forEach((doc) => {
        if (data[doc.id]) {
            delete data[doc.id];
        }
    });
    managers_1.cache_manager.setObjectData(name_for_cache, data);
};
const parse_add_update__as_object = (documents, config, doc_key_property) => {
    const data = managers_1.cache_manager.getObjectData(config.collection_name, {});
    documents.forEach((doc) => {
        data[doc[doc_key_property]] = doc;
    });
    managers_1.cache_manager.setObjectData(doc_key_property, data);
};
const parse__delete__as_object = (documents, config, doc_key_property) => {
    const data = managers_1.cache_manager.getObjectData(config.collection_name, {});
    documents.forEach((doc) => {
        if (data[doc[doc_key_property]]) {
            delete data[doc[doc_key_property]];
        }
    });
    managers_1.cache_manager.setObjectData(doc_key_property, data);
};
const parse__add_update__as_array = (documents, config) => {
    var _a;
    (_a = config.on_remove) === null || _a === void 0 ? void 0 : _a.call(config, documents, config);
    const existing_array = managers_1.cache_manager.getArrayData(config.collection_name);
    const updated_array = [...existing_array, ...documents];
    managers_1.cache_manager.setArrayData(config.collection_name, updated_array);
};
const parse__delete__as_array = (documents, config) => {
    const existing_array = managers_1.cache_manager.getArrayData(config.collection_name);
    const keys_to_delete = documents.map((doc) => doc.id);
    const updated_array = existing_array.filter((doc) => !keys_to_delete.includes(doc.id));
    managers_1.cache_manager.setArrayData(config.collection_name, updated_array);
};
/// snapshots
let snapshots_first_time = [];
const snapshot = (config) => {
    return new Promise((resolve) => {
        exports.db.collection(config.collection_name).onSnapshot((snapshot) => {
            var _a, _b, _c, _d, _e, _f;
            if (!snapshots_first_time.includes(config.collection_name)) {
                snapshots_first_time.push(config.collection_name);
                const documents = snapshot.docs.flatMap((doc) => (0, exports.simple_extract_data)(doc));
                (_a = config.on_first_time) === null || _a === void 0 ? void 0 : _a.call(config, documents, config);
                (_b = config.extra_parsers) === null || _b === void 0 ? void 0 : _b.forEach((extra_parser) => {
                    var _a;
                    (_a = extra_parser.on_first_time) === null || _a === void 0 ? void 0 : _a.call(extra_parser, documents, config);
                });
                resolve();
            }
            else {
                const get_docs_from_snapshot = (action) => {
                    return snapshot
                        .docChanges()
                        .filter((change) => change.type === action)
                        .map((change) => (0, exports.simple_extract_data)(change.doc));
                };
                (_c = config.on_add) === null || _c === void 0 ? void 0 : _c.call(config, get_docs_from_snapshot("added"), config);
                (_d = config.on_modify) === null || _d === void 0 ? void 0 : _d.call(config, get_docs_from_snapshot("modified"), config);
                (_e = config.on_remove) === null || _e === void 0 ? void 0 : _e.call(config, get_docs_from_snapshot("removed"), config);
                (_f = config.extra_parsers) === null || _f === void 0 ? void 0 : _f.forEach((extra_parser) => {
                    var _a, _b, _c;
                    (_a = extra_parser.on_add) === null || _a === void 0 ? void 0 : _a.call(extra_parser, get_docs_from_snapshot("added"), config);
                    (_b = extra_parser.on_modify) === null || _b === void 0 ? void 0 : _b.call(extra_parser, get_docs_from_snapshot("modified"), config);
                    (_c = extra_parser.on_remove) === null || _c === void 0 ? void 0 : _c.call(extra_parser, get_docs_from_snapshot("removed"), config);
                });
            }
        }, (error) => {
            managers_1.logger.error(`Error listening to collection: ${config.collection_name}`, error);
        });
    });
};
exports.snapshot = snapshot;
const init_snapshots = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, exports.snapshot_bulk)([
        (0, exports.snapshot)({
            collection_name: "nx-translations",
            on_first_time: parse__add_update__translations,
            on_add: parse__add_update__translations,
            on_modify: parse__add_update__translations,
            on_remove: parse__delete__translations,
        }),
        (0, exports.snapshot)({
            collection_name: "nx-settings",
            on_first_time: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_add: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_modify: (docs) => parse__add_update__settings(docs, "nx-settings"),
            on_remove: (docs) => parse__delete__settings(docs, "nx-settings"),
        }),
        (0, exports.snapshot)({
            collection_name: "settings",
            on_first_time: (docs) => parse__add_update__settings(docs, "settings"),
            on_add: (docs) => parse__add_update__settings(docs, "settings"),
            on_modify: (docs) => parse__add_update__settings(docs, "settings"),
            on_remove: (docs) => parse__delete__settings(docs, "settings"),
        }),
    ], "Common snapshots");
});
exports.init_snapshots = init_snapshots;
const snapshot_bulk = (snapshots, label) => __awaiter(void 0, void 0, void 0, function* () {
    const start = perf_hooks_1.performance.now();
    managers_1.logger.log(`==> ${label || "custom snapshots"} started... `);
    yield Promise.all(snapshots);
    managers_1.logger.log(`==> ${label || "custom snapshots"} ended. It took ${(perf_hooks_1.performance.now() - start).toFixed(2)} ms`);
});
exports.snapshot_bulk = snapshot_bulk;
const snapshot_bulk_by_names = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const start = perf_hooks_1.performance.now();
    managers_1.logger.log(`==> snapshot_bulk_by_names started... `);
    const snapshots = params.map((param) => {
        return typeof param === "string"
            ? (0, exports.snapshot)({
                collection_name: param,
                on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
                on_add: (docs, config) => parse__add_update__as_array(docs, config),
                on_modify: (docs, config) => parse__add_update__as_array(docs, config),
                on_remove: (docs, config) => parse__delete__as_array(docs, config),
            })
            : (0, exports.snapshot)({
                collection_name: param.collection_name,
                extra_parsers: param.extra_parsers,
                on_first_time: (docs, config) => parse__add_update__as_array(docs, config),
                on_add: (docs, config) => parse__add_update__as_array(docs, config),
                on_modify: (docs, config) => parse__add_update__as_array(docs, config),
                on_remove: (docs, config) => parse__delete__as_array(docs, config),
            });
    });
    yield Promise.all(snapshots);
    managers_1.logger.log(`==> snapshot_bulk_by_names ended. It took ${(perf_hooks_1.performance.now() - start).toFixed(2)} ms`);
});
exports.snapshot_bulk_by_names = snapshot_bulk_by_names;
//# sourceMappingURL=firebase_helpers.js.map