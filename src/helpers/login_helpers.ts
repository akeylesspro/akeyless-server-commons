import { NxUser, DefaultClient, MobileAppUser } from "akeyless-types-commons";
import { query_document, query_document_optional } from "./firebase_helpers";
import { logger } from "../managers";

export const convert_to_short_phone_number = (phone_number: string): string => {
    return `0${phone_number.split("+972")[1]}`;
};

/// nx user
export const get_user_by_identifier = async (identifier: string): Promise<NxUser> => {
    const phone_query: NxUser | null = await query_document_optional("nx-users", "phone_number", "in", [
        convert_to_short_phone_number(identifier),
        identifier,
    ]);

    if (!phone_query) {
        const email_query: NxUser | null = await query_document("nx-users", "email", "==", identifier);
        return email_query;
    }
    return phone_query;
};

export const get_user_by_identifier_optional = async (identifier: string, with_error_log?: boolean): Promise<NxUser | null> => {
    try {
        return await get_user_by_identifier(identifier || "unknown");
    } catch (error) {
        if (with_error_log) {
            logger.error("Error fetching user by identifier:", error);
        }
        return null;
    }
};

/// mobile app user
export const get_mobile_app_user_by_uid = async (uid: string): Promise<MobileAppUser> => {
    const user = await query_document("mobile_users_app_pro", "uid", "==", uid);
    return user as MobileAppUser;
};
export const get_mobile_app_user_by_uid_optional = async (uid: string, with_error_log?: boolean): Promise<MobileAppUser | null> => {
    try {
        return await get_mobile_app_user_by_uid(uid);
    } catch (error) {
        if (with_error_log) {
            logger.error("Error fetching mobile app user by UID:", error);
        }
        return null;
    }
};
