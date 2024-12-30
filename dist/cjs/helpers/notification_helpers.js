"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send_fcm_message = exports.push_event_to_mobile_users = exports.send_sms = void 0;
const axios_1 = __importDefault(require("axios"));
const managers_1 = require("../managers");
const global_helpers_1 = require("./global_helpers");
const firebase_helpers_1 = require("./firebase_helpers");
const phone_number_helepers_1 = require("./phone_number_helepers");
const twilio_1 = require("twilio");
const firestore_1 = require("firebase-admin/firestore");
const uuid_1 = require("uuid");
const send_local_sms = (number, text) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultValues = {
        sms_provider: {
            multisend: { from: "972549781180", password: "akeyless123", user: "akeyless" },
        },
    };
    const { sms_provider: { multisend }, } = managers_1.cache_manager.getObjectData("nx-settings") || defaultValues;
    const msgId = (0, uuid_1.v4)();
    let data = new FormData();
    data.append("user", multisend.user);
    data.append("password", multisend.password);
    data.append("from", multisend.from);
    data.append("recipient", number);
    data.append("message", text);
    data.append("customermessageid", msgId);
    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://api.multisend.co.il/v2/sendsms",
        data: data,
    };
    const response = yield (0, axios_1.default)(config);
    if (response.status !== 200) {
        throw `http request to multisend status ${response.status}`;
    }
    if (!response.data.success) {
        throw `http request to multisend error ${JSON.stringify(response.data.error)}`;
    }
    yield add__new_sms_to_db(number, text, "multisend", msgId);
    managers_1.logger.log("send_local_sms. message sent successfully", { number, text, response: response.data });
});
const send_international_sms = (number, text) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultValues = {
        sms_provider: {
            twilio: { account_sid: "ACde071699dbbdeb99a93b9a55d049d2b8", from: "+12185857393", token: "47fafa1a186e0352058195715d917a55" },
        },
    };
    const { sms_provider: { twilio }, } = managers_1.cache_manager.getObjectData("nx-settings") || defaultValues;
    const twilioClient = new twilio_1.Twilio(twilio.account_sid, twilio.token);
    const message = yield twilioClient.messages.create({
        messagingServiceSid: "MG283f51b01563a07e9b18fc92e0f5b4ff",
        body: text,
        to: number,
        // from: twilio.from,
    });
    if (message.errorMessage) {
        throw `twilioClient.messages.create failed: ${message.errorMessage} `;
    }
    yield add__new_sms_to_db(number, text, "twilio", message.sid);
    managers_1.logger.log("send_international_sms. message sent successfully", { number, text, response: message });
});
const login_to_monogoto = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const defaultValues = {
            sms_provider: {
                monogoto: {
                    Password: "KOBI@2024",
                    UserName: "kobi@akeyless-sys.com",
                    desc: "need to put them in the body of login request",
                    from: "Akeyless",
                },
            },
        };
        const { sms_provider: { monogoto }, } = managers_1.cache_manager.getObjectData("nx-settings") || defaultValues;
        const data = { UserName: monogoto.UserName, Password: monogoto.Password };
        const response = yield (0, axios_1.default)({
            method: "post",
            url: `https://console.monogoto.io/Auth`,
            data,
        });
        return response.data;
    }
    catch (error) {
        throw `login_to_monogoto failed: ` + error;
    }
});
const send_iccid_sms = (number, text) => __awaiter(void 0, void 0, void 0, function* () {
    const defaultValues = {
        sms_provider: {
            monogoto: {
                Password: "KOBI@2024",
                UserName: "kobi@akeyless-sys.com",
                desc: "need to put them in the body of login request",
                from: "Akeyless",
            },
        },
    };
    const { sms_provider: { monogoto }, } = managers_1.cache_manager.getObjectData("nx-settings") || defaultValues;
    const monogoto_auth = yield login_to_monogoto();
    const data = { Message: text, From: monogoto.from };
    const response = yield (0, axios_1.default)({
        method: "post",
        url: `https://console.monogoto.io/thing/ThingId_ICCID_${number}/sms`,
        data: data,
        headers: {
            Authorization: `Bearer ${monogoto_auth.token}`,
            apikey: monogoto_auth.CustomerId,
        },
    });
    if (response.status !== 200) {
        throw `request to monogoto status: ${response.status}`;
    }
    yield add__new_sms_to_db(number, text, "monogoto", response.data);
    managers_1.logger.log("send_iccid_sms. message sent successfully", { number, text, response: response.data });
});
const send_sms = (number, text, entity_for_audit) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let service = "multisend";
        const send = () => __awaiter(void 0, void 0, void 0, function* () {
            if ((0, phone_number_helepers_1.isIccid)(number)) {
                service = "monogoto";
                return yield send_iccid_sms(number, text);
            }
            if ((0, phone_number_helepers_1.isLongPhoneNumber)(number)) {
                service = "twilio";
                return send_international_sms(number, text);
            }
            return yield send_local_sms(number, text);
        });
        yield send();
        yield (0, global_helpers_1.add_audit_record)("send_sms", entity_for_audit || "general", {
            destination: number,
            message: text,
            service,
        });
    }
    catch (error) {
        managers_1.logger.error(`${entity_for_audit}, send_sms failed:`, error);
        throw `${entity_for_audit}, send_sms failed: ` + error;
    }
});
exports.send_sms = send_sms;
const add__new_sms_to_db = (recipient, content, service, external_id) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = firestore_1.Timestamp.now();
    const data = {
        external_id,
        content,
        recipient,
        service,
        timestamp,
        status: "new",
    };
    yield (0, firebase_helpers_1.add_document)("nx-sms-out", data);
});
const push_event_to_mobile_users = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const units = managers_1.cache_manager.getArrayData("units");
    const users_units = managers_1.cache_manager.getArrayData("usersUnits");
    const mobile_users_app_pro = managers_1.cache_manager.getArrayData("mobile_users_app_pro");
    const app_pro_extra_pushes = managers_1.cache_manager.getArrayData("app_pro_extra_pushes");
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
            managers_1.logger.log(`push_event_to_mobile_users. event ${event.event_id} / ${event.event_name} is disabled for user ${mobile_user.uid} / ${mobile_user.short_phone_number}`);
            continue;
        }
        const mobile_user_language = mobile_user.language;
        const language = { heb: "he", en: "en", ru: "ru" }[mobile_user_language];
        const message_title = managers_1.translation_manager.get_translation("push_notifications", language, "title", "event_from_device");
        const message_body = managers_1.translation_manager.get_translation("events_from_device", language, "", event.event_name);
        yield (0, exports.send_fcm_message)(message_title, message_body, [mobile_user.fcm_token], "");
    }
});
exports.push_event_to_mobile_users = push_event_to_mobile_users;
const send_fcm_message = (title, body, fcm_tokens, custom_sound) => __awaiter(void 0, void 0, void 0, function* () {
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
        const response = yield firebase_helpers_1.messaging.sendEachForMulticast(message);
        const { successCount: success_count, failureCount: failure_count, responses } = response;
        if (success_count && !failure_count) {
            managers_1.logger.log(`send_fcm_message. Successfully sent to all ${success_count} recipients. `, { title, body });
        }
        else if (success_count && failure_count) {
            managers_1.logger.log(`send_fcm_message. Successfully sent to ${success_count} recipients, but failed to sent to ${failure_count} recipients`, {
                title,
                body,
                responses,
            });
        }
        else {
            managers_1.logger.log(`send_fcm_message. Failed to sent to ${failure_count} recipients`, { title, body, responses: response.responses });
        }
        return {
            success: success_count > 0 && failure_count == 0,
            response: JSON.stringify(response.responses),
        };
    }
    catch (error) {
        managers_1.logger.error("Exception", error.message);
        return {
            success: false,
            response: `Exception: ${error.message}`,
        };
    }
});
exports.send_fcm_message = send_fcm_message;
//# sourceMappingURL=notification_helpers.js.map