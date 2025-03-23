import { NxUser, DefaultClient } from "akeyless-types-commons";
import { query_document, query_document_optional } from "./firebase_helpers";

export const convert_to_short_phone_number = (phone_number: string): string => {
    return `0${phone_number.split("+972")[1]}`;
};

export const get_user_by_identifier = async (identifier: string): Promise<NxUser> => {
    const phone_query: NxUser | null = await query_document_optional("nx-users", "phone_number", "in", [
        convert_to_short_phone_number(identifier),
        identifier,
    ]);

    if (!phone_query) {
        const email_query: NxUser | null = await query_document_optional("nx-users", "email", "==", identifier);
        if (!email_query) {
            throw "User not found";
        }
        return email_query;
    }
    return phone_query;
};
