"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.long_short_phone_numbers = exports.get_sim_provider = exports.is_sim_provider_monogoto = exports.is_sim_provider_celcom = exports.is_sim_provider_pelephone = exports.is_sim_provider_partner = exports.convert_to_short_israel_phone = exports.is_iccid = exports.is_international_phone_number = exports.is_israel_long_phone_number = exports.is_long_phone_number = void 0;
const enums_1 = require("../types/enums");
const is_long_phone_number = (phone_number) => {
    return phone_number.startsWith("+");
};
exports.is_long_phone_number = is_long_phone_number;
const is_israel_long_phone_number = (phone_number) => {
    return phone_number.startsWith("+9725");
};
exports.is_israel_long_phone_number = is_israel_long_phone_number;
const is_international_phone_number = (phone_number) => {
    return (0, exports.is_long_phone_number)(phone_number) && !(0, exports.is_israel_long_phone_number)(phone_number);
};
exports.is_international_phone_number = is_international_phone_number;
const is_iccid = (number) => {
    if (number.length < 19 || number.length > 22)
        return false;
    if (!/^\d+$/.test(number))
        return false;
    if (!number.startsWith("89"))
        return false;
    return true;
};
exports.is_iccid = is_iccid;
const convert_to_short_israel_phone = (international_number) => {
    return international_number.replace("+972", "0");
};
exports.convert_to_short_israel_phone = convert_to_short_israel_phone;
const is_sim_provider_partner = (phone_number) => {
    const { short_phone_number } = (0, exports.long_short_phone_numbers)(phone_number);
    return short_phone_number.startsWith("054");
};
exports.is_sim_provider_partner = is_sim_provider_partner;
const is_sim_provider_pelephone = (phone_number) => {
    const { short_phone_number } = (0, exports.long_short_phone_numbers)(phone_number);
    return short_phone_number.startsWith("050");
};
exports.is_sim_provider_pelephone = is_sim_provider_pelephone;
const is_sim_provider_celcom = (phone_number) => {
    const { short_phone_number } = (0, exports.long_short_phone_numbers)(phone_number);
    return short_phone_number.startsWith("052");
};
exports.is_sim_provider_celcom = is_sim_provider_celcom;
const is_sim_provider_monogoto = (phone_number) => {
    return (0, exports.is_iccid)(phone_number);
};
exports.is_sim_provider_monogoto = is_sim_provider_monogoto;
const get_sim_provider = (phone_number) => {
    if ((0, exports.is_sim_provider_partner)(phone_number)) {
        return enums_1.SimProvider.partner;
    }
    if ((0, exports.is_sim_provider_pelephone)(phone_number)) {
        return enums_1.SimProvider.pelephone;
    }
    if ((0, exports.is_sim_provider_celcom)(phone_number)) {
        return enums_1.SimProvider.celcom;
    }
    if ((0, exports.is_sim_provider_monogoto)(phone_number)) {
        return enums_1.SimProvider.monogoto;
    }
    return enums_1.SimProvider.unknown;
};
exports.get_sim_provider = get_sim_provider;
const long_short_phone_numbers = (phone_number) => {
    phone_number = phone_number.trim();
    if (!phone_number.length) {
        return {
            short_phone_number: phone_number,
            long_phone_number: phone_number,
            is_israeli: true,
        };
    }
    if ((0, exports.is_iccid)(phone_number)) {
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
        long_phone_number = `+9725${short_phone_number.slice(2)}`;
    }
    else if (phone_number.startsWith("+972")) {
        long_phone_number = phone_number;
        short_phone_number = long_phone_number.replace("+9725", "05");
    }
    else if (phone_number.startsWith("+1")) {
        long_phone_number = phone_number;
        short_phone_number = long_phone_number.replace("+1", "");
    }
    return {
        short_phone_number,
        long_phone_number,
        is_israeli: long_phone_number.startsWith("+972"),
    };
};
exports.long_short_phone_numbers = long_short_phone_numbers;
//# sourceMappingURL=phone_number_helpers.js.map