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
exports.send_email = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const _1 = require(".");
const managers_1 = require("../managers");
const send_email = (email_data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const emails_settings = (yield (0, _1.get_document_by_id)("nx-settings", "emails"));
        const { sendgrid_api_key, groups, default_from } = emails_settings;
        let { from, to, cc, group_name, body_html, body_plain_text, subject, entity_for_audit } = email_data;
        /// validate data
        if (!(to === null || to === void 0 ? void 0 : to.length) && !(group_name === null || group_name === void 0 ? void 0 : group_name.length)) {
            throw "must supply a 'group_name' or 'to' value ";
        }
        if (!(body_html === null || body_html === void 0 ? void 0 : body_html.length) && !(body_plain_text === null || body_plain_text === void 0 ? void 0 : body_plain_text.length)) {
            throw "must supply a 'body_plain_text' or 'html' value ";
        }
        /// merge to and cc
        if (group_name) {
            if (!groups[group_name]) {
                throw "must supply a valid 'group_name'";
            }
            if (!to) {
                to = groups[group_name].to;
            }
            else {
                to = typeof to === "string" ? [...groups[group_name].to, to] : [...groups[group_name].to, ...to];
            }
            if (!cc) {
                if ((_a = groups[group_name].cc) === null || _a === void 0 ? void 0 : _a.length) {
                    cc = groups[group_name].cc;
                }
            }
            else {
                cc = typeof cc === "string" ? [...(groups[group_name].cc || []), cc] : [...(groups[group_name].cc || []), ...cc];
            }
        }
        /// set sendgrid account
        mail_1.default.setApiKey(sendgrid_api_key);
        /// prepare message
        const msg = body_html
            ? {
                subject,
                from: from || default_from,
                to,
                cc,
                html: body_html,
            }
            : {
                subject,
                from: from || default_from,
                to,
                cc,
                text: body_plain_text,
            };
        /// send email
        const email_result = yield mail_1.default.send(msg);
        if (email_result[0].statusCode !== 202) {
            throw email_result[0].body;
        }
        /// add audit
        managers_1.logger.log("email send successfully", Object.assign(Object.assign({}, email_data), msg));
        yield (0, _1.add_audit_record)("send_email", entity_for_audit, Object.assign(Object.assign({}, email_data), msg));
    }
    catch (error) {
        managers_1.logger.error("error sending email", { error, email_data });
    }
});
exports.send_email = send_email;
//# sourceMappingURL=email_helpers.js.map