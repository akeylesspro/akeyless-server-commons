import { Timestamp } from "firebase-admin/firestore";
import moment from "moment";
export function timestamp_to_string(firebaseTimestamp) {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return moment(timestamp.toDate()).format("DD-MM-YYYY HH:mm:ss");
}
export function timestamp_to_millis(firebaseTimestamp) {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
export function sort_by_timestamp(a, b, reverse = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
//# sourceMappingURL=times_helpers.js.map