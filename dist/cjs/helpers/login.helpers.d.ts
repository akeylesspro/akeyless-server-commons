export declare const convert_to_short_phone_number: (phone_number: string) => string;
export declare const get_users_by_phone: (phone_number: string) => Promise<{
    installer: any;
    dashboard_user: any;
}>;
