import { NxUser, Installer, DefaultClient } from "../types";
import { query_document, query_document_optional } from "./firebase_helpers";

export const convert_to_short_phone_number = (phone_number: string): string => {
    return `0${phone_number.split("+972")[1]}`;
};
interface Users {
    installer?: Installer;
    nx_user?: NxUser;
}
export const get_users_by_phone = async (phone_number: string, default_client_key: DefaultClient = DefaultClient.default): Promise<Users> => {
    let installer;
    let nx_user;
    const installer_q: Installer | null = await query_document_optional("technicians", "phone", "==", convert_to_short_phone_number(phone_number));
    const nx_user_q: NxUser | null = await query_document_optional("nx-users", "phone_number", "==", convert_to_short_phone_number(phone_number));
    if (!installer_q && !nx_user_q) {
        throw "User not found";
    }
    if (installer_q) {
        const default_client = await query_document("nx-clients", "key", "==", default_client_key);
        installer = Boolean(installer_q.clients?.length) ? installer_q : { ...installer_q, clients: [default_client.id] };
    }
    if (nx_user_q) {
        nx_user = nx_user_q;
    }
    return {
        installer,
        nx_user,
    };
};
