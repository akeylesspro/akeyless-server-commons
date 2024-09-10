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
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_users_by_phone = exports.convert_to_short_phone_number = void 0;
const managers_1 = require("../managers");
const firebase_helpers_1 = require("./firebase_helpers");
const convert_to_short_phone_number = (phone_number) => {
    return `0${phone_number.split("+972")[1]}`;
};
exports.convert_to_short_phone_number = convert_to_short_phone_number;
const get_users_by_phone = (phone_number) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let installer;
    let dashboard_user;
    const installer_q = yield (0, firebase_helpers_1.query_document_optional)("technicians", "phone", "==", (0, exports.convert_to_short_phone_number)(phone_number));
    const dashboard_user_q = yield (0, firebase_helpers_1.query_document_optional)("nx-users", "phone_number", "==", (0, exports.convert_to_short_phone_number)(phone_number));
    if (!installer_q && !dashboard_user_q) {
        throw "User not found";
    }
    if (installer_q) {
        const default_client_keys = managers_1.cache_manager.getObjectData("nx-settings").default_client;
        const default_client = yield (0, firebase_helpers_1.query_document)("nx-clients", "key", "==", default_client_keys.camera_installation);
        installer = Boolean((_a = installer_q.clients) === null || _a === void 0 ? void 0 : _a.length) ? installer_q : Object.assign(Object.assign({}, installer_q), { clients: [default_client.id] });
    }
    if (dashboard_user_q) {
        dashboard_user = dashboard_user_q;
    }
    return {
        installer,
        dashboard_user,
    };
});
exports.get_users_by_phone = get_users_by_phone;
//# sourceMappingURL=login.helpers.js.map