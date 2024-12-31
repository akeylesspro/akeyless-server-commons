export const is_long_phone_number = (phone_number: string) => {
    return phone_number.startsWith("+");
};

export const is_israel_long_phone_number = (phone_number: string) => {
    return phone_number.startsWith("+9725");
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
    return international_number.replace("+972", "0");
};
