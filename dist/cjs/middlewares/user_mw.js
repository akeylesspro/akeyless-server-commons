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
exports.nx_user_login = exports.installer_login = exports.get_users_login = exports.verify_user_auth = void 0;
const helpers_1 = require("../helpers");
const managers_1 = require("../managers");
const verify_user_auth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        yield (0, helpers_1.verify_token)(authorization);
        next();
    }
    catch (error) {
        managers_1.logger.error("error from verify user auth", error);
        res.status(403).send((0, helpers_1.json_failed)(error));
    }
});
exports.verify_user_auth = verify_user_auth;
const get_users_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield (0, helpers_1.verify_token)(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            return next();
        }
        const users = yield (0, helpers_1.get_users_by_phone)(phone_number);
        req.body = Object.assign(Object.assign({}, req.body), users);
        next();
    }
    catch (error) {
        managers_1.logger.error("error from verify user auth", error);
        res.status(403).send((0, helpers_1.json_failed)(error));
    }
});
exports.get_users_login = get_users_login;
const installer_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield (0, helpers_1.verify_token)(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const users = yield (0, helpers_1.get_users_by_phone)(phone_number);
        const installer = users.installer;
        if (!installer) {
            throw "Installer not fund";
        }
        req.body.user = installer;
        next();
    }
    catch (error) {
        res.status(403).send((0, helpers_1.json_failed)(error));
    }
});
exports.installer_login = installer_login;
const nx_user_login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorization = req.headers.authorization;
        const user_data = yield (0, helpers_1.verify_token)(authorization);
        const { phone_number } = user_data;
        if (!phone_number) {
            throw "Invalid authorization token";
        }
        const nx_user = yield (0, helpers_1.query_document)("nx-users", "phone_number", "in", [(0, helpers_1.convert_to_short_phone_number)(phone_number), phone_number]);
        req.body.nx_user = nx_user;
        next();
    }
    catch (error) {
        res.status(403).send((0, helpers_1.json_failed)(error));
    }
});
exports.nx_user_login = nx_user_login;
//# sourceMappingURL=user_mw.js.map