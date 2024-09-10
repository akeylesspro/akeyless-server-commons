import { TObject, JsonFailed, JsonOK } from "../types";
export declare const init_env_variables: (required_vars: string[]) => TObject<string>;
export declare const json_ok: JsonOK<TObject<any> | TObject<any>[]>;
export declare const json_failed: JsonFailed;
export declare const parse_error: (error: any) => any;
export declare const get_version: (filePath: string) => string;
export declare const sleep: (ms?: number) => Promise<unknown>;
