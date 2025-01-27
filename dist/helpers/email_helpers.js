import sendgrid from "@sendgrid/mail";
import { add_audit_record, get_document_by_id } from ".";
import { logger } from "../managers";
export const send_email = async (email_data) => {
    try {
        const emails_settings = (await get_document_by_id("nx-settings", "emails"));
        const { sendgrid_api_key, groups, default_from } = emails_settings;
        let { from, to, cc, group_name, body_html, body_plain_text, subject, entity_for_audit } = email_data;
        /// validate data
        if (!to?.length && !group_name?.length) {
            throw "must supply a 'group_name' or 'to' value ";
        }
        if (!body_html?.length && !body_plain_text?.length) {
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
                if (groups[group_name].cc?.length) {
                    cc = groups[group_name].cc;
                }
            }
            else {
                cc = typeof cc === "string" ? [...(groups[group_name].cc || []), cc] : [...(groups[group_name].cc || []), ...cc];
            }
        }
        /// set sendgrid account
        sendgrid.setApiKey(sendgrid_api_key);
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
        if (!msg.cc) {
            delete msg.cc;
        }
        /// send email
        const email_result = await sendgrid.send(msg);
        if (email_result[0].statusCode !== 202) {
            throw email_result[0].body;
        }
        /// add audit
        logger.log("email send successfully", { ...email_data, ...msg });
        await add_audit_record("send_email", entity_for_audit, { ...email_data, ...msg });
    }
    catch (error) {
        logger.error("error sending email", { error, email_data });
    }
};
