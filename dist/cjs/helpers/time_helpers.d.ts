import { firebase_timestamp } from "akeyless-types-commons";
export declare function timestamp_to_string(firebaseTimestamp: firebase_timestamp): string;
export declare function timestamp_to_millis(firebaseTimestamp: firebase_timestamp): number;
export declare function sort_by_timestamp(a: firebase_timestamp, b: firebase_timestamp, reverse?: boolean): number;
