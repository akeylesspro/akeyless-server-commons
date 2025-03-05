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
const akeyless_types_commons_1 = require("akeyless-types-commons");
const firebase_helpers_1 = require("./firebase_helpers");
const convert_to_short_phone_number = (phone_number) => {
    return `0${phone_number.split("+972")[1]}`;
};
exports.convert_to_short_phone_number = convert_to_short_phone_number;
const get_users_by_phone = (phone_number_1, ...args_1) => __awaiter(void 0, [phone_number_1, ...args_1], void 0, function* (phone_number, default_client_key = akeyless_types_commons_1.DefaultClient.default) {
    let nx_user;
    const nx_user_q = yield (0, firebase_helpers_1.query_document_optional)("nx-users", "phone_number", "in", [
        (0, exports.convert_to_short_phone_number)(phone_number),
        phone_number,
    ]);
    if (!nx_user_q) {
        throw "User not found";
    }
    if (nx_user_q) {
        nx_user = nx_user_q;
    }
    return {
        nx_user,
    };
});
exports.get_users_by_phone = get_users_by_phone;
//# sourceMappingURL=login_helpers.js.map