export const is_long_phone_number = (phone_number) => {
    return phone_number.startsWith("+");
};
export const is_israel_long_phone_number = (phone_number) => {
    return phone_number.startsWith("+9725");
};
export const is_international_phone_number = (phone_number) => {
    return is_long_phone_number(phone_number) && !is_israel_long_phone_number(phone_number);
};
export const is_iccid = (number) => {
    if (number.length < 19 || number.length > 22)
        return false;
    if (!/^\d+$/.test(number))
        return false;
    if (!number.startsWith("89"))
        return false;
    return true;
};
export const convert_to_short_israel_phone = (international_number) => {
    return international_number.replace("+972", "0");
};
//# sourceMappingURL=phone_number_helpers.js.map