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
exports.send_sms = void 0;
const axios_1 = __importDefault(require("axios"));
const managers_1 = require("../managers");
const global_helpers_1 = require("./global_helpers");
const send_sms = (phone_number, text, entity_for_audit) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sms_provider } = managers_1.cache_manager.getObjectData("nx-settings");
        let data = new FormData();
        data.append("user", sms_provider.user);
        data.append("password", sms_provider.password);
        data.append("from", sms_provider.from);
        data.append("recipient", phone_number);
        data.append("message", text);
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.multisend.co.il/v2/sendsms",
            data: data,
        };
        const response = yield (0, axios_1.default)(config);
        if (response.status !== 200) {
            throw `http request to multisend status ${response.status}`;
        }
        if (!response.data.success) {
            throw `http request to multisend error ${JSON.stringify(response.data.error)}`;
        }
        if (!response.data.success) {
            throw response.data.error;
        }
        yield (0, global_helpers_1.add_audit_record)("send_sms", entity_for_audit, {
            destination: phone_number,
            message: text,
        });
    }
    catch (error) {
        managers_1.logger.error(`${entity_for_audit}, send_sms failed:`, error);
        throw `${entity_for_audit}, send_sms failed: ` + error;
    }
});
exports.send_sms = send_sms;
//# sourceMappingURL=sms_helpers.js.map