export interface EmailData {
    subject: string;
    entity_for_audit: string;
    to?: string | string[];
    from?: string | {
        email: string;
        name?: string;
    };
    group_name?: string;
    cc?: string | string[];
    body_plain_text?: string;
    body_html?: string;
}
export interface EmailSettings {
    default_from: {
        email: string;
        name?: string;
    };
    groups: Record<string, {
        cc?: string[];
        to: string[];
    }>;
    sendgrid_api_key: string;
}
