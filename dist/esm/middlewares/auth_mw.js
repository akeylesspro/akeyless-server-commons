var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { verify_token, json_failed, get_users_by_phone, query_document, convert_to_short_phone_number, query_document_optional } from "../helpers";
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
export const nx_user_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield verify_token(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const nx_user = yield query_document("nx-users", "phone_number", "in", [convert_to_short_phone_number(phone_number), phone_number]);
        req.body.nx_user = nx_user;
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
});
export const client_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw "Invalid authorization token";
        }
        const client_data = (yield query_document_optional("nx-clients", "api_token", "==", token));
        if (!client_data) {
            throw "Client not found " + token;
        }
        req.body.client = client_data;
        next();
    }
    catch (error) {
        res.status(403).send(json_failed(error));
    }
});
//# sourceMappingURL=auth_mw.js.map