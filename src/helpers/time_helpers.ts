import { Timestamp } from "firebase-admin/firestore";
import moment from "moment";
import { FB_TIMESTAMP } from "../types";

export function timestamp_to_string(firebaseTimestamp: FB_TIMESTAMP): string {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return moment(timestamp.toDate()).format("DD-MM-YYYY HH:mm:ss");
}
export function timestamp_to_millis(firebaseTimestamp: FB_TIMESTAMP): number {
    const timestamp = new Timestamp(firebaseTimestamp._seconds, firebaseTimestamp._nanoseconds);
    return timestamp.toMillis();
}
export function sort_by_timestamp(a: FB_TIMESTAMP, b: FB_TIMESTAMP, reverse: boolean = false) {
    return reverse ? timestamp_to_millis(b) - timestamp_to_millis(a) : timestamp_to_millis(a) - timestamp_to_millis(b);
}
