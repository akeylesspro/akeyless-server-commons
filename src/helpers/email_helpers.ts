import sendgrid from "@sendgrid/mail";
import { get_document_by_id } from ".";
import { isObject } from "lodash";
import { EmailSettings, Mail } from "../types";
import { logger } from "../managers";

export const send_email = async (mail: Mail) => {
    try {
        const emails_settings = (await get_document_by_id("nx-settings", "emails")) as EmailSettings;
        const { sendgrid_api_key, groups, default_from } = emails_settings;
        let { from, to, cc, group_name, html, text, subject } = mail;
        // validate data
        if (from && (typeof from !== "string" || !isObject(from))) {
            throw "invalid 'from' email address";
        }
        if (!to?.length && !group_name?.length) {
            throw "must supply a 'group_name' or 'to' value ";
        }
        if (!html?.length && !text?.length) {
            throw "must supply a 'text' or 'html' value ";
        }
        if (group_name) {
            to = groups[group_name].to;
            if (groups[group_name].cc?.length) {
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
                  text: text!,
              };
        // send email
        await sendgrid.send(msg);
        logger.log("email send successfully", msg);
    } catch (error) {
        logger.error("error sending email", error);
    }
};
