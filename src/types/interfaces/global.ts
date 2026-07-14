import { InitSnapshotsOptions } from "../types";

export interface MandatoryObject {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    length?: number;
    required_keys?: string[];
    array_types?: ("string" | "number" | "boolean" | "object")[];
}

export interface MandatoryParams {
    body?: MandatoryObject[];
    headers?: MandatoryObject[];
}

export interface LogRequests {
    url?: boolean;
    headers?: boolean;
    query?: boolean;
    body?: boolean;
    gcp?: boolean;
}

export interface AppOptions {
    port?: number;
    log_requests?: LogRequests;
    init_snapshot_options?: InitSnapshotsOptions;
    initialize_redis?: boolean;
    enable_axios_keep_alive?: boolean;
    on_shutdown?: () => void | Promise<void> | undefined;
}
