var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { verify_token, json_failed, get_users_by_phone, query_document, get_document_by_id, convert_to_short_phone_number } from "../helpers";
import { logger } from "../managers";
export const verify_user_auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        yield verify_token(authorization);
        next();
    }
    catch (error) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
});
export const get_users_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            return next();
        }
        const users = yield get_users_by_phone(phone_number);
        req.body = Object.assign(Object.assign({}, req.body), users);
        next();
    }
    catch (error) {
        logger.error("error from verify user auth", error);
        res.status(403).send(json_failed(error));
    }
});
export const installer_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const authorization = req.headers.authorization;
        const user_data = yield verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        /// get user from FB
        const user = yield query_document("technicians", "phone", "==", convert_to_short_phone_number(phone_number));
        /// akeyless client is as default
        const default_client_keys = yield get_document_by_id("nx-settings", "default_client");
        const default_client = yield query_document("nx-clients", "key", "==", default_client_keys.camera_installation);
        req.body.user = Boolean((_a = user.clients) === null || _a === void 0 ? void 0 : _a.length) ? user : Object.assign(Object.assign({}, user), { clients: [default_client.id] });
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
});
export const dashboard_user_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        /// getting the user from FB
        const user = yield query_document("nx-users", "phone_number", "==", convert_to_short_phone_number(phone_number));
        req.body.user = user;
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
});
//# sourceMappingURL=users_mw.js.map