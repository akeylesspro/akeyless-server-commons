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
