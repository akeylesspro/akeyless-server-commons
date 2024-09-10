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
function timestamp_to_string(firebaseTimestamp) {
    const timestamp = new firestore_1.Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return (0, moment_1.default)(timestamp.toDate()).format("DD-MM-YYYY HH:mm:ss");
}
function timestamp_to_millis(firebaseTimestamp) {
    const timestamp = new firestore_1.Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
function sort_by_timestamp(a, b, reverse = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
//# sourceMappingURL=times_helpers.js.map