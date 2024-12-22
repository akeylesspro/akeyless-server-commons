import { EventFromDevice } from "akeyless-types-commons";
type SmsFunction = (number: string, text: string, entity_for_audit: string) => Promise<void>;
export declare const send_local_sms: SmsFunction;
export declare const send_international_sms: SmsFunction;
export declare const send_iccid_sms: SmsFunction;
export declare const send_sms: SmsFunction;
export declare const push_event_to_mobile_users: (event: EventFromDevice) => Promise<void>;
type FuncSendFcmMessage = (title: string, body: string, fcm_tokens: string[], custom_sound?: string) => Promise<{
    success: boolean;
    response: string;
    success_count?: number;
    failure_count?: number;
}>;
export declare const send_fcm_message: FuncSendFcmMessage;
export {};
