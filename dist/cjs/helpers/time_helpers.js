"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timestamp_to_string = timestamp_to_string;
exports.timestamp_to_millis = timestamp_to_millis;
exports.sort_by_timestamp = sort_by_timestamp;
const firestore_1 = require("firebase-admin/firestore");
const moment_1 = __importDefault(require("moment"));
/**
 * Converts a Firebase Timestamp object into a formatted string.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @param {string} [format="DD-MM-YYYY HH:mm:ss"] - Optional the format string used to format the date. Default is "DD-MM-YYYY HH:mm:ss".
 * @returns {string} - A formatted date string according to the specified format or the default format.
 */
function timestamp_to_string(firebaseTimestamp, format = "DD-MM-YYYY HH:mm:ss") {
    const timestamp = new firestore_1.Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return (0, moment_1.default)(timestamp.toDate()).utc().format(format);
}
/**
 * Converts a Firebase Timestamp object into milliseconds since the Unix epoch.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @returns {number} - Time in milliseconds
 */
function timestamp_to_millis(firebaseTimestamp) {
    const timestamp = new firestore_1.Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
function sort_by_timestamp(a, b, reverse = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
//# sourceMappingURL=time_helpers.js.map