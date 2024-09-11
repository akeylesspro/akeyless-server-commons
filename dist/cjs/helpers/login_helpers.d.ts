import { NxUser, Installer, DefaultClient } from "akeyless-types-commons";
export declare const convert_to_short_phone_number: (phone_number: string) => string;
interface Users {
    installer?: Installer;
    nx_user?: NxUser;
}
export declare const get_users_by_phone: (phone_number: string, default_client_key?: DefaultClient) => Promise<Users>;
export {};
