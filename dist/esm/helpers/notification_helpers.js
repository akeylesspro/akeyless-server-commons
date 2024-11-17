var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import { cache_manager, logger, translation_manager } from "../managers";
import { add_audit_record } from "./global_helpers";
import { messaging } from "./firebase_helpers";
export const send_sms = (phone_number, text, entity_for_audit) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield axios(config);
        if (response.status !== 200) {
            throw `http request to multisend status ${response.status}`;
        }
        if (!response.data.success) {
            throw `http request to multisend error ${JSON.stringify(response.data.error)}`;
        }
        if (!response.data.success) {
            throw response.data.error;
        }
        yield add_audit_record("send_sms", entity_for_audit, {
            destination: phone_number,
            message: text,
        });
    }
    catch (error) {
        logger.error(`${entity_for_audit}, send_sms failed:`, error);
        throw `${entity_for_audit}, send_sms failed: ` + error;
    }
});
export const push_event_to_mobile_users = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const units = cache_manager.getArrayData("units");
    const users_units = cache_manager.getArrayData("usersUnits");
    const mobile_users_app_pro = cache_manager.getArrayData("mobile_users_app_pro");
    const app_pro_extra_pushes = cache_manager.getArrayData("app_pro_extra_pushes");
    console.log(`units: ${units.length}, users_units: ${users_units.length}, mobile_users_app_pro: ${mobile_users_app_pro.length}, app_pro_extra_pushes: ${app_pro_extra_pushes.length}`);
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
        if ((_c = (_b = (_a = mobile_user.disabled_events) === null || _a === void 0 ? void 0 : _a[event.car_number]) === null || _b === void 0 ? void 0 : _b[source]) === null || _c === void 0 ? void 0 : _c.includes(event.event_id)) {
            logger.log(`push_event_to_mobile_users. event ${event.event_id} / ${event.event_name} is disabled for user ${mobile_user.uid} / ${mobile_user.short_phone_number}`);
            continue;
        }
        const mobile_user_language = mobile_user.language;
        const language = { heb: "he", en: "en", ru: "ru" }[mobile_user_language];
        const message_title = translation_manager.get_translation("push_notifications", language, "title", "event_from_device");
        const message_body = translation_manager.get_translation("events_from_device", language, "", event.event_name);
        yield send_fcm_message(message_title, message_body, [mobile_user.fcm_token], "");
    }
});
export const send_fcm_message = (title, body, fcm_tokens, custom_sound) => __awaiter(void 0, void 0, void 0, function* () {
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
    const message = {
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
        const response = yield messaging.sendEachForMulticast(message);
        const { successCount: success_count, failureCount: failure_count, responses } = response;
        if (success_count && !failure_count) {
            logger.log(`send_fcm_message. Successfully sent to all ${success_count} recipients. `, { title, body });
        }
        else if (success_count && failure_count) {
            logger.log(`send_fcm_message. Successfully sent to ${success_count} recipients, but failed to sent to ${failure_count} recipients`, {
                title,
                body,
                responses,
            });
        }
        else {
            logger.log(`send_fcm_message. Failed to sent to ${failure_count} recipients`, { title, body, responses: response.responses });
        }
        return {
            success: success_count > 0 && failure_count == 0,
            response: JSON.stringify(response.responses),
        };
    }
    catch (error) {
        logger.error("Exception", error.message);
        return {
            success: false,
            response: `Exception: ${error.message}`,
        };
    }
});
//# sourceMappingURL=notification_helpers.js.map