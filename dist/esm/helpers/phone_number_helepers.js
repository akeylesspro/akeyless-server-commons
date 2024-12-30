export const isLongPhoneNumber = (phone_number) => {
    return phone_number.startsWith("+");
};
export const isIsraelLongPhoneNumber = (phone_number) => {
    return phone_number.startsWith("+9725");
};
export const isInternationalPhoneNumber = (phone_number) => {
    return isLongPhoneNumber(phone_number) && !isIsraelLongPhoneNumber(phone_number);
};
export const isIccid = (number) => {
    if (number.length < 19 || number.length > 22)
        return false;
    if (!/^\d+$/.test(number))
        return false;
    if (!number.startsWith("89"))
        return false;
    return true;
};
export const local_israel_phone_format = (international_number) => {
    return international_number.replace("+972", "0");
};
//# sourceMappingURL=phone_number_helepers.js.map