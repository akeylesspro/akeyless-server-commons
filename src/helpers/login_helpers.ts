import { NxUser, DefaultClient, MobileAppUser } from "akeyless-types-commons";
import { query_document, query_document_optional } from "./firebase_helpers";
import { logger } from "../managers";

export const convert_to_short_phone_number = (phone_number: string): string => {
    return `0${phone_number.split("+972")[1]}`;
};

/// nx user
export const get_user_by_identifier = async (identifier: string, ignore_log = false): Promise<NxUser> => {
    const phone_query: NxUser | null = await query_document_optional(
        "nx-users",
        "phone_number",
        "in",
        [convert_to_short_phone_number(identifier), identifier],
        ignore_log
    );

    if (!phone_query) {
        const email_query: NxUser | null = await query_document("nx-users", "email", "==", identifier, ignore_log);
        return email_query;
    }
    return phone_query;
};

export const get_user_by_identifier_optional = async (identifier: string, ignore_log = false): Promise<NxUser | null> => {
    try {
        return await get_user_by_identifier(identifier || "unknown", ignore_log);
    } catch (error) {
        return null;
    }
};

/// mobile app user
export const get_mobile_app_user_by_uid = async (uid: string, ignore_log = false): Promise<MobileAppUser> => {
    const user = await query_document("mobile_users_app_pro", "uid", "==", uid, ignore_log);
    return user as MobileAppUser;
};
export const get_mobile_app_user_by_uid_optional = async (uid: string, ignore_log = false): Promise<MobileAppUser | null> => {
    try {
        return await get_mobile_app_user_by_uid(uid, ignore_log);
    } catch (error) {
        return null;
    }
};
