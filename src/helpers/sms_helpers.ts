import axios from "axios";
import { cache_manager, logger } from "../managers";
import { add_audit_record } from "./global_helpers";

export const send_sms = async (phone_number: string, text: string, entity_for_audit: string): Promise<void> => {
    try {
        const { sms_provider } = cache_manager.getObjectData("nx-settings");
        let data = new FormData();
        data.append("user", sms_provider.user);
        data.append("password", sms_provider.password);
        data.append("from", sms_provider.from);
        data.append("recipient", phone_number);
        data.append("message", text);
        let config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.multisend.co.il/v2/sendsms",
            data: data,
        };
        const response = await axios(config);
        if (response.status !== 200) {
            throw `http request to multisend status ${response.status}`;
        }
        if (!response.data.success) {
            throw `http request to multisend error ${JSON.stringify(response.data.error)}`;
        }
        if (!response.data.success) {
            throw response.data.error;
        }
        await add_audit_record("send_sms", entity_for_audit, {
            destination: phone_number,
            message: text,
        });
    } catch (error) {
        logger.error(`${entity_for_audit}, send_sms failed:`, error);
        throw `${entity_for_audit}, send_sms failed: ` + error;
    }
};
