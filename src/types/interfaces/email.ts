export interface EmailData {
    subject: string;
    entity_for_audit: string;
    to?: string | string[];
    from?: string | { email: string; name?: string };
    group_name?: string;
    cc?: string | string[];
    body_plain_text?: string;
    body_html?: string;
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    content: string;
    filename: string;
    type?: string;
    disposition?: "attachment" | "inline";
    content_id?: string;
}

export interface EmailSettings {
    default_from: {
        email: string;
        name?: string;
    };
    default_cc: string[];
    groups: Record<string, { cc?: string[]; to: string[] }>;
    sendgrid_api_key: string;
}
