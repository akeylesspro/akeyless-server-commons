var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendgrid from "@sendgrid/mail";
import { add_audit_record, get_document_by_id } from ".";
import { isObject } from "lodash";
import { logger } from "../managers";
export const send_email = (mail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const emails_settings = (yield get_document_by_id("nx-settings", "emails"));
        const { sendgrid_api_key, groups, default_from } = emails_settings;
        let { from, to, cc, group_name, html, text, subject, entity_for_audit } = mail;
        // validate data
        if (from && (typeof from !== "string" || !isObject(from))) {
            throw "invalid 'from' email address";
        }
        if (!(to === null || to === void 0 ? void 0 : to.length) && !(group_name === null || group_name === void 0 ? void 0 : group_name.length)) {
            throw "must supply a 'group_name' or 'to' value ";
        }
        if (!(html === null || html === void 0 ? void 0 : html.length) && !(text === null || text === void 0 ? void 0 : text.length)) {
            throw "must supply a 'text' or 'html' value ";
        }
        if (group_name) {
            to = groups[group_name].to;
            if ((_a = groups[group_name].cc) === null || _a === void 0 ? void 0 : _a.length) {
                cc = groups[group_name].cc;
            }
        }
        // set sendgrid account
        sendgrid.setApiKey(sendgrid_api_key);
        // prepare message
        const msg = html
            ? {
                subject,
                from: from || default_from,
                to,
                cc,
                html,
            }
            : {
                subject,
                from: from || default_from,
                to,
                cc,
                text: text,
            };
        // send email
        yield sendgrid.send(msg);
        yield add_audit_record("send_email", entity_for_audit, mail);
        logger.log("email send successfully", msg);
    }
    catch (error) {
        logger.error("error sending email", error);
    }
});
//# sourceMappingURL=email_helpers.js.map