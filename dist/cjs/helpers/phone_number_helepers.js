"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.local_israel_phone_format = exports.isIccid = exports.isInternationalIsraelPhone = exports.isInternational = void 0;
const isInternational = (phone_number) => {
    return phone_number.startsWith("+");
};
exports.isInternational = isInternational;
const isInternationalIsraelPhone = (phone_number) => {
    return phone_number.startsWith("+9725");
};
exports.isInternationalIsraelPhone = isInternationalIsraelPhone;
const isIccid = (number) => {
    if (number.length < 19 || number.length > 22)
        return false;
    if (!/^\d+$/.test(number))
        return false;
    if (!number.startsWith("89"))
        return false;
    return true;
};
exports.isIccid = isIccid;
const local_israel_phone_format = (international_number) => {
    return international_number.replace("+972", "0");
};
exports.local_israel_phone_format = local_israel_phone_format;
//# sourceMappingURL=phone_number_helepers.js.map