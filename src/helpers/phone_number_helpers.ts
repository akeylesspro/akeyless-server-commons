import { SimProvider } from "../types/enums";

export const is_long_phone_number = (phone_number: string) => {
    return phone_number.startsWith("+");
};

export const is_israel_long_phone_number = (phone_number: string) => {
    return phone_number.startsWith("+972");
};

export const is_thailand_long_phone_number = (phone_number: string) => {
    return phone_number.startsWith("+66");
};

export const is_international_phone_number = (phone_number: string) => {
    return is_long_phone_number(phone_number) && !is_israel_long_phone_number(phone_number);
};

export const is_iccid = (number: string) => {
    if (number.length < 19 || number.length > 22) return false;
    if (!/^\d+$/.test(number)) return false;
    if (!number.startsWith("89")) return false;
    return true;
};

export const convert_to_short_israel_phone = (international_number: string) => {
    const base = international_number.replace("+972", "");
    return base.startsWith("130") ? base : `0${base}`;
};

export const is_sim_provider_partner = (phone_number: string) => {
    const { short_phone_number } = long_short_phone_numbers(phone_number);
    return short_phone_number.startsWith("054") || short_phone_number.startsWith("1302");
};

export const is_sim_provider_pelephone = (phone_number: string) => {
    const { short_phone_number } = long_short_phone_numbers(phone_number);
    return short_phone_number.startsWith("050");
};

export const is_sim_provider_celcom = (phone_number: string) => {
    const { short_phone_number } = long_short_phone_numbers(phone_number);
    return short_phone_number.startsWith("052") || short_phone_number.startsWith("1303");
};

export const is_sim_provider_monogoto = (phone_number: string) => {
    return is_iccid(phone_number);
};

export const get_sim_provider = (phone_number: string): SimProvider => {
    if (is_sim_provider_partner(phone_number)) {
        return SimProvider.partner;
    }
    if (is_sim_provider_pelephone(phone_number)) {
        return SimProvider.pelephone;
    }
    if (is_sim_provider_celcom(phone_number)) {
        return SimProvider.celcom;
    }
    if (is_sim_provider_monogoto(phone_number)) {
        return SimProvider.monogoto;
    }
    return SimProvider.unknown;
};
interface LongShortPhoneNumbers {
    short_phone_number: string;
    long_phone_number: string;
    is_israeli: boolean;
}
export const long_short_phone_numbers = (phone_number: string): LongShortPhoneNumbers => {
    phone_number = phone_number.trim();
    if (!phone_number.length) {
        return {
            short_phone_number: phone_number,
            long_phone_number: phone_number,
            is_israeli: true,
        };
    }
    if (is_iccid(phone_number)) {
        return {
            short_phone_number: phone_number,
            long_phone_number: phone_number,
            is_israeli: false,
        };
    }

    let short_phone_number = phone_number;
    let long_phone_number = phone_number;
    if (phone_number.startsWith("05")) {
        short_phone_number = phone_number;
        long_phone_number = long_phone_number.replace("05", "+9725");
    } else if (phone_number.startsWith("103")) {
        short_phone_number = phone_number;
        long_phone_number = `+972${short_phone_number}`;
    } else if (phone_number.startsWith("+972")) {
        long_phone_number = phone_number;
        short_phone_number = long_phone_number.replace("+9725", "05");
    } else if (phone_number.startsWith("+1")) {
        long_phone_number = phone_number;
        short_phone_number = long_phone_number.replace("+1", "");
    }
    return {
        short_phone_number,
        long_phone_number,
        is_israeli: long_phone_number.startsWith("+972"),
    };
};
