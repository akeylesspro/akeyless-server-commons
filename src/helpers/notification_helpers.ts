import axios from "axios";
import { cache_manager, logger, translation_manager } from "../managers";
import { add_audit_record } from "./global_helpers";
import { messaging } from "./firebase_helpers";
import { MulticastMessage } from "firebase-admin/messaging";
import { EventFromDevice } from "akeyless-types-commons";
import { isIccid, isInternational, isInternationalIsraelPhone, local_israel_phone_format } from "./phone_number_helepers";

type SmsFunction = (number: string, text: string, entity_for_audit: string) => Promise<void>;

export const send_local_sms: SmsFunction = async (number, text, entity_for_audit) => {
    try {
        const {
            sms_provider: { multisend },
        } = cache_manager.getObjectData("nx-settings");
        let data = new FormData();
        data.append("user", multisend.user);
        data.append("password", multisend.password);
        data.append("from", multisend.from);
        data.append("recipient", number);
        data.append("message", text);
        const config = {
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
        await add_audit_record("send_sms_local", entity_for_audit, {
            destination: number,
            message: text,
        });
    } catch (error) {
        logger.error(`${entity_for_audit}, send_local_sms failed:`, error);
        throw `${entity_for_audit}, send_local_sms failed: ` + error;
    }
};

export const send_international_sms: SmsFunction = async (number, text, entity_for_audit) => {
    try {
        await add_audit_record("send_sms_international", entity_for_audit, {
            destination: number,
            message: text,
        });
    } catch (error) {
        logger.error(`${entity_for_audit}, send_international_sms failed:`, error);
        throw `${entity_for_audit}, send_international_sms failed: ` + error;
    }
};
const login_to_monogoto = async () => {
    try {
        const {
            sms_provider: { monogoto },
        } = cache_manager.getObjectData("nx-settings");
        const data = { UserName: monogoto.UserName, Password: monogoto.Password };

        const response = await axios({
            method: "post",
            url: `https://console.monogoto.io/Auth`,
            data: data,
        });
        return response.data;
    } catch (error) {
        throw `login_to_monogoto failed: ` + error;
    }
};
export const send_iccid_sms: SmsFunction = async (number, text, entity_for_audit) => {
    try {
        const {
            sms_provider: { monogoto },
        } = cache_manager.getObjectData("nx-settings");
        const monogoto_auth = await login_to_monogoto();
        const data = { Message: text, From: monogoto.from };
        const response = await axios({
            method: "post",
            url: `https://console.monogoto.io/thing/ThingId_ICCID_${number}/sms`,
            data: data,
            headers: {
                Authorization: `Bearer ${monogoto_auth.token}`,
                apikey: monogoto_auth.CustomerId,
            },
        });
        console.log("response.data", response.data);

        // await add_audit_record("send_sms_iccid", entity_for_audit, {
        //     destination: number,
        //     message: text,
        // });
    } catch (error) {
        logger.error(`${entity_for_audit}, send_iccid_sms failed:`, error);
        throw `${entity_for_audit}, send_iccid_sms failed: ` + error;
    }
};

export const send_sms: SmsFunction = async (number, text, entity_for_audit) => {
    if (isIccid(number)) {
        return await send_iccid_sms(number, text, entity_for_audit);
    }
    if (isInternational(number)) {
        if (isInternationalIsraelPhone(number)) {
            return await send_local_sms(local_israel_phone_format(number), text, entity_for_audit);
        }
        return send_international_sms(number, text, entity_for_audit);
    }
    return await send_local_sms(number, text, entity_for_audit);
};

export const push_event_to_mobile_users = async (event: EventFromDevice) => {
    const units = cache_manager.getArrayData("units");
    const users_units = cache_manager.getArrayData("usersUnits");
    const mobile_users_app_pro = cache_manager.getArrayData("mobile_users_app_pro");
    const app_pro_extra_pushes = cache_manager.getArrayData("app_pro_extra_pushes");

    console.log(
        `units: ${units.length}, users_units: ${users_units.length}, mobile_users_app_pro: ${mobile_users_app_pro.length}, app_pro_extra_pushes: ${app_pro_extra_pushes.length}`
    );

    if (!units.length || !users_units.length || !mobile_users_app_pro.length) {
        throw "push_event_to_mobile_users. missing cached data for any of the following: units, usersUnits, mobile_users_app_pro, app_pro_extra_pushes";
    }

    ///-- main driver
    const unit = units.find((unit) => unit.carId == event.car_number);
    const main_driver = mobile_users_app_pro.find((user) => user.short_phone_number == unit.userPhone);

    ///-- secondary drivers
    const secondary_units = users_units.filter((unit) => unit.carId == event.car_number);
    const secondary_phone_numbers = secondary_units.map((unit) => unit.phone);
    const secondary_drivers = mobile_users_app_pro.filter((user) => secondary_phone_numbers.includes(user.long_phone_number));

    ///-- extra users
    const extra_uids = app_pro_extra_pushes.filter((doc) => doc.car_number == event.car_number).map((doc) => doc.uid);
    const extra_drivers = extra_uids.length > 0 ? mobile_users_app_pro.filter((user) => extra_uids.includes(user.uid)) : [];

    const drivers = [main_driver, ...secondary_drivers, ...extra_drivers];
    for (const mobile_user of drivers) {
        const source = event.source == "erm" || event.source == "erm2" ? "erm" : event.source;
        if (mobile_user.disabled_events?.[event.car_number]?.[source]?.includes(event.event_id)) {
            logger.log(
                `push_event_to_mobile_users. event ${event.event_id} / ${event.event_name} is disabled for user ${mobile_user.uid} / ${mobile_user.short_phone_number}`
            );
            continue;
        }
        const mobile_user_language: "heb" | "en" | "ru" = mobile_user.language;
        const language: string = { heb: "he", en: "en", ru: "ru" }[mobile_user_language];
        const message_title = translation_manager.get_translation("push_notifications", language, "title", "event_from_device");
        const message_body = translation_manager.get_translation("events_from_device", language, "", event.event_name);
        await send_fcm_message(message_title, message_body, [mobile_user.fcm_token], "");
    }
};

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
        } else if (success_count && failure_count) {
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
    } catch (error: any) {
        logger.error("Exception", error.message);
        return {
            success: false,
            response: `Exception: ${error.message}`,
        };
    }
};
