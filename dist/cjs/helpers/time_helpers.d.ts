import { FB_TIMESTAMP } from "../types";
export declare function timestamp_to_string(firebaseTimestamp: FB_TIMESTAMP): string;
export declare function timestamp_to_millis(firebaseTimestamp: FB_TIMESTAMP): number;
export declare function sort_by_timestamp(a: FB_TIMESTAMP, b: FB_TIMESTAMP, reverse?: boolean): number;
