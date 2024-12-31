"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.local_israel_phone_format = exports.is_iccid = exports.is_international_phone_number = exports.is_israel_long_phone_number = exports.is_long_phone_number = void 0;
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
const local_israel_phone_format = (international_number) => {
    return international_number.replace("+972", "0");
};
exports.local_israel_phone_format = local_israel_phone_format;
//# sourceMappingURL=phone_number_helepers.js.map