import { Timestamp } from "firebase-admin/firestore";
import moment from "moment";
import { firebase_timestamp } from "akeyless-types-commons";

export function timestamp_to_string(firebaseTimestamp: firebase_timestamp): string {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return moment(timestamp.toDate()).format("DD-MM-YYYY HH:mm:ss");
}
export function timestamp_to_millis(firebaseTimestamp: firebase_timestamp): number {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
export function sort_by_timestamp(a: firebase_timestamp, b: firebase_timestamp, reverse: boolean = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
