import { Timestamp } from "firebase-admin/firestore";
import moment from "moment";
import { firebase_timestamp } from "akeyless-types-commons";

/**
 * Converts a Firebase Timestamp object into a formatted string.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @param {string} [format="DD-MM-YYYY HH:mm:ss"] - Optional the format string used to format the date. Default is "DD-MM-YYYY HH:mm:ss".
 * @returns {string} - A formatted date string according to the specified format or the default format.
 */
export function timestamp_to_string(firebaseTimestamp: firebase_timestamp, format: string = "DD-MM-YYYY HH:mm:ss"): string {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return moment(timestamp.toDate()).utc().format(format);
}
/**
 * Converts a Firebase Timestamp object into milliseconds since the Unix epoch.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @returns {number} - Time in milliseconds
 */
export function timestamp_to_millis(firebaseTimestamp: firebase_timestamp): number {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
export function sort_by_timestamp(a: firebase_timestamp, b: firebase_timestamp, reverse: boolean = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
export interface TimePassedByDate {
    seconds_passed: number;
    minutes_passed: number;
    hours_passed: number;
    days_passed: number;
    time_passed_formatted_short: string;
    time_passed_formatted_long: string;
}
export const calculate_time_passed = (datetime: Date): TimePassedByDate => {
    const now = new Date();
    const diff_in_milliseconds = Math.max(0, now.getTime() - datetime.getTime()); 

    const seconds_passed = Math.floor(diff_in_milliseconds / 1000);
    const minutes_passed = Math.floor(seconds_passed / 60);
    const hours_passed = Math.floor(minutes_passed / 60);
    const days_passed = Math.floor(hours_passed / 24);
    const remaining_hours = hours_passed % 24;
    const remaining_minutes = minutes_passed % 60;
    const remaining_seconds = seconds_passed % 60;

    const pad_zero = (value: number) => (value < 10 ? `0${value}` : `${value}`);

    let parts = [];
    if (days_passed > 0) parts.push(days_passed); 
    if (remaining_hours > 0 || days_passed > 0) parts.push(pad_zero(remaining_hours)); 
    parts.push(pad_zero(remaining_minutes)); 
    parts.push(pad_zero(remaining_seconds)); 
    const time_passed_formatted_short = parts.join(":");

    parts = [];
    if (days_passed > 0) parts.push(`${days_passed} d`);
    if (days_passed > 0 || remaining_hours > 0) parts.push(`${remaining_hours} h`);
    if (days_passed > 0 || remaining_hours > 0 || remaining_minutes > 0) parts.push(`${remaining_minutes} min`);
    parts.push(`${remaining_seconds} sec`);
    const time_passed_formatted_long = parts.join(" ");

    return {
        seconds_passed,
        minutes_passed,
        hours_passed,
        days_passed,
        time_passed_formatted_short,
        time_passed_formatted_long,
    };
};
