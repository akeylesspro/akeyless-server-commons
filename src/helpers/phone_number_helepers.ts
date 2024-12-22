export const isInternational = (phone_number: string) => {
    return phone_number.startsWith("+");
};
export const isInternationalIsraelPhone = (phone_number: string) => {
    return phone_number.startsWith("+9725");
};
export const isIccid = (number: string) => {
    if (number.length < 19 || number.length > 22) return false;
    if (!/^\d+$/.test(number)) return false;
    if (!number.startsWith("89")) return false;
    return true;
};

export const local_israel_phone_format = (international_number: string) => {
    return international_number.replace("+972", "0");
};
