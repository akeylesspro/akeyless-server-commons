"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.local_israel_phone_format = exports.isIccid = exports.isInternationalPhoneNumber = exports.isIsraelLongPhoneNumber = exports.isLongPhoneNumber = void 0;
const isLongPhoneNumber = (phone_number) => {
    return phone_number.startsWith("+");
};
exports.isLongPhoneNumber = isLongPhoneNumber;
const isIsraelLongPhoneNumber = (phone_number) => {
    return phone_number.startsWith("+9725");
};
exports.isIsraelLongPhoneNumber = isIsraelLongPhoneNumber;
const isInternationalPhoneNumber = (phone_number) => {
    return (0, exports.isLongPhoneNumber)(phone_number) && !(0, exports.isIsraelLongPhoneNumber)(phone_number);
};
exports.isInternationalPhoneNumber = isInternationalPhoneNumber;
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