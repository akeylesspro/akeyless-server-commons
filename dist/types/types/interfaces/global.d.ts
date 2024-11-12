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
export type LangOptions = "he" | "en" | "ru" | (string & {});
export type EntityOptions = "nx_devices" | (string & {});
