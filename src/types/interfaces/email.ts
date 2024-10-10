export type EmailGroupNames = "general";

export interface Mail {
    to?: string | string[];
    from?: string | { email: string; name?: string };
    subject: string;
    group_name?: EmailGroupNames;
    cc?: string | string[];
    text?: string;
    html?: string;
}

export interface EmailSettings {
    default_from: {
        email: string;
        name?: string;
    };
    groups: Record<EmailGroupNames, { cc?: string[]; to: string[] }>;
    sendgrid_api_key: string;
}
