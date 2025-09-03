import sendgrid, { MailDataRequired } from "@sendgrid/mail";
import { add_audit_record, get_document_by_id, ignore_ssl_request } from ".";
import { EmailSettings, EmailData, EmailAttachment } from "../types";
import { logger } from "../managers";
import * as fs from "fs";
import * as path from "path";

export const create_attachment_from_file = async (
    file_path: string,
    filename?: string,
    disposition: "attachment" | "inline" = "attachment"
): Promise<EmailAttachment> => {
    try {
        const content = fs.readFileSync(file_path);
        const base64_content = content.toString("base64");
        const mime_type = get_mime_type(file_path);

        return {
            content: base64_content,
            filename: filename || path.basename(file_path),
            type: mime_type,
            disposition,
        };
    } catch (error) {
        logger.error("error creating attachment from file", { error, file_path });
        throw error;
    }
};

export const create_attachment_from_buffer = (
    buffer: Buffer | Uint8Array,
    filename: string,
    mime_type: string,
    disposition: "attachment" | "inline" = "attachment"
): EmailAttachment => {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    return {
        content: buf.toString("base64"),
        filename,
        type: mime_type,
        disposition,
    };
};

export const create_attachment_from_url = async (url: string, filename: string) => {
    try {
        const response = await ignore_ssl_request({
            method: "GET",
            url,
            responseType: "arraybuffer",
            timeout: 20000,
        });

        const buffer = Buffer.from(response.data);
        const content_type = (response.headers?.["content-type"] as string) || "application/pdf";

        return {
            content: buffer.toString("base64"),
            filename: filename,
            type: content_type,
            disposition: "attachment",
        };
    } catch (error) {
        logger.error("error creating attachment from url", { error, url });
        throw error;
    }
};

const get_mime_type = (file_path: string): string => {
    const ext = path.extname(file_path).toLowerCase();
    const mime_types: Record<string, string> = {
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".json": "application/json",
        ".xml": "application/xml",
        ".zip": "application/zip",
        ".rar": "application/x-rar-compressed",
        ".7z": "application/x-7z-compressed",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".svg": "image/svg+xml",
        ".mp3": "audio/mpeg",
        ".mp4": "video/mp4",
        ".avi": "video/x-msvideo",
        ".mov": "video/quicktime",
    };

    return mime_types[ext] || "application/octet-stream";
};

export const send_email = async (email_data: EmailData, options?: { debug?: boolean }) => {
    try {
        const emails_settings = (await get_document_by_id("nx-settings", "emails")) as EmailSettings;
        const { sendgrid_api_key, groups, default_from, default_cc } = emails_settings;
        let { from, to, cc, group_name, body_html, body_plain_text, subject, entity_for_audit, attachments } = email_data;
        const cc_array: string[] = cc ? (Array.isArray(cc) ? cc : [cc as string]) : [];
        cc = [...cc_array, ...default_cc];
        /// validate data
        if (!to?.length && !group_name?.length) {
            throw "must supply a 'group_name' or 'to' value ";
        }
        if (!body_html?.length && !body_plain_text?.length) {
            throw "must supply a 'body_plain_text' or 'html' value ";
        }
        if (to?.length && !group_name?.length) {
        }
        /// merge to and cc
        if (group_name) {
            if (!groups[group_name]) {
                throw "must supply a valid 'group_name'";
            }
            if (!to) {
                to = groups[group_name].to;
            } else {
                to = typeof to === "string" ? [...groups[group_name].to, to] : [...groups[group_name].to, ...to];
            }
            cc.push(...(groups[group_name].cc || []));
        }
        /// set sendgrid account
        sendgrid.setApiKey(sendgrid_api_key);
        /// prepare message
        const msg: MailDataRequired = body_html
            ? {
                  subject,
                  from: from || default_from,
                  to,
                  cc,
                  html: body_html,
                  attachments: attachments,
              }
            : {
                  subject,
                  from: from || default_from,
                  to,
                  cc,
                  text: body_plain_text!,
                  attachments: attachments,
              };
        if (!attachments?.length) {
            delete msg.attachments;
        }
        /// send email
        const email_result = await sendgrid.send(msg);
        if (email_result[0].statusCode !== 202) {
            throw email_result[0].body;
        }
        /// add audit
        await add_audit_record("send_email", entity_for_audit, { ...email_data, ...msg });

        if (options?.debug) {
            logger.log("email send successfully", { ...email_data, ...msg });
        }
    } catch (error) {
        logger.error("error sending email", error);
        if (options?.debug) {
            logger.error("email payload", { message: JSON.stringify(email_data) });
        }
    }
};
