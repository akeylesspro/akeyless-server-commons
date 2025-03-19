import { NxUser, DefaultClient } from "akeyless-types-commons";
import { query_document, query_document_optional } from "./firebase_helpers";

export const convert_to_short_phone_number = (phone_number: string): string => {
    return `0${phone_number.split("+972")[1]}`;
};
interface Users {
    nx_user?: NxUser;
}
export const get_users_by_phone = async (phone_number: string, default_client_key: DefaultClient = DefaultClient.default): Promise<Users> => {
    let nx_user;

    const nx_user_q: NxUser | null = await query_document_optional("nx-users", "phone_number", "in", [
        convert_to_short_phone_number(phone_number),
        phone_number,
    ]);
    if (!nx_user_q) {
        throw "User not found";
    }

    if (nx_user_q) {
        nx_user = nx_user_q;
    }
    return {
        nx_user,
    };
};
