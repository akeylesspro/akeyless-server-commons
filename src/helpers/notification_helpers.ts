import axios from "axios";
import { cache_manager, logger } from "../managers";
import { add_audit_record } from "./global_helpers";
import { messaging } from "./firebase_helpers";
import { MulticastMessage } from "firebase-admin/messaging";

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

export const push_event_to_mobile_users = async (event: Event) => {};

type FuncSendFcmMessage = (
    title: string,
    body: string,
    fcm_tokens: string[],
    custom_sound?: string
) => Promise<{ success: boolean; response: string; success_count?: number; failure_count?: number }>;

export const send_fcm_message: FuncSendFcmMessage = async (title, body, fcm_tokens, custom_sound) => {
    fcm_tokens = [...new Set(fcm_tokens)];
    if (fcm_tokens.length == 0) {
        return {
            success: false,
            response: "No recipients",
        };
    }
    fcm_tokens = [...new Set(fcm_tokens)];
    if (fcm_tokens.length == 0) {
        return {
            success: false,
            response: "No recipients",
            success_count: 0,
            failure_count: 0,
        };
    }

    const message: MulticastMessage = {
        tokens: fcm_tokens,
        notification: {
            title: title,
            body: body,
        },
        android: {
            ttl: 3600 * 1000,
            priority: "high",
            notification: {
                sound: custom_sound || "default",
                channelId: custom_sound,
                title: title,
                body: body,
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: custom_sound ? `${custom_sound}.wav` : "default",
                    alert: {
                        title: title,
                        body: body,
                    },
                },
            },
        },
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        const { successCount: success_count, failureCount: failure_count, responses } = response;
        if (success_count && !failure_count) {
            logger.log(`send_fcm_message. Successfully sent to all ${success_count} recipients. `, { title, body });
        }
        if (success_count && failure_count) {
            logger.log(`send_fcm_message. Successfully sent to ${success_count} recipients, but failed to sent to ${failure_count} recipients`, {
                title,
                body,
                responses,
            });
        } else {
            logger.log(`send_fcm_message. Failed to sent to ${failure_count} recipients`, { title, body, responses: response.responses });
        }
        return {
            success: success_count > 0 && failure_count == 0,
            response: JSON.stringify(response.responses),
        };
    } catch (error) {
        logger.error("Exception", error.message);
        return {
            success: false,
            response: `Exception: ${error.message}`,
        };
    }
};
