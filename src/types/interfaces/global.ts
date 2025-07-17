export interface MandatoryObject {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    length?: number;
    required_keys?: string[];
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
}
