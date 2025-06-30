import { AddAuditRecord, JsonFailed, JsonOK, NxServiceName } from "../types";
import { readFileSync } from "fs";
import { logger } from "../managers";
import { db } from "./";
import { Geo, LanguageOptions, TObject } from "akeyless-types-commons";
import { Timestamp } from "firebase-admin/firestore";
import axios from "axios";

export const init_env_variables = (required_vars: string[] = []) => {
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
            process.exit(1);
        }
    });
    const env_vars: TObject<string> = {};
    Object.keys(process.env).forEach((var_name) => {
        const env_val = <string>process.env[var_name];
        env_vars[var_name] = env_val;
    });
    return env_vars;
};

export const json_ok: JsonOK<TObject<any> | TObject<any>[]> = (data) => {
    return {
        success: true,
        data,
    };
};

export const json_failed: JsonFailed = (error, msg) => {
    return {
        success: false,
        error: error.message || error || "general error: something happened ",
        msg: msg,
    };
};

export const parse_error = (error: any) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};

export const get_version = (packageJsonPath: string): string => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};

export const sleep = (ms: number = 2500) => new Promise((resolve) => setTimeout(resolve, ms));

export const add_audit_record: AddAuditRecord = async (action, entity, details, user) => {
    const data = {
        action,
        entity,
        details,
        datetime: Timestamp.now(),
        user: user || null,
    };
    try {
        await db.collection("nx-audit").add(data);
    } catch (error: any) {
        throw { msg: "unable to add audit record", data };
    }
};

export const get_nx_service_urls = (env_name: string = "mode"): TObject<string> => {
    if (!process.env[env_name]) {
        throw new Error("missing [mode] environment variable");
    }
    const env_value = process.env[env_name].toLowerCase();
    const is_local = ["local"].includes(env_value);
    const is_prod = ["production", "prod"].includes(env_value);
    const is_qa = ["qa"].includes(env_value);
    const result: TObject<string> = {};
    result[NxServiceName.bi] = is_local ? "http://localhost:9002/api/bi" : is_prod ? "https://nx-api.info/api/bi" : "https://nx-api.xyz/api/bi";
    result[NxServiceName.call_center] = is_local
        ? "http://localhost:9003/api/call-center"
        : is_prod
        ? "https://nx-api.info/api/call-center"
        : "https://nx-api.xyz/api/call-center";
    result[NxServiceName.dashboard] = is_local
        ? "http://localhost"
        : is_prod
        ? "https://akeyless-dashboard.online"
        : "https://akeyless-dashboard.xyz";
    result[NxServiceName.devices] = is_local
        ? "http://localhost:9001/api/devices"
        : is_prod
        ? "https://nx-api.info/api/devices"
        : "https://nx-api.xyz/api/devices";
    result[NxServiceName.installer] = is_local ? "http://localhost" : is_prod ? "https://installerapp.online" : "https://installerapp.xyz";
    result[NxServiceName.ox_server] = is_local ? "http://localhost" : is_prod ? "https://akeyless-online.info" : "https://akeyless-online.xyz";
    result[NxServiceName.toolbox] = is_local ? "http://localhost" : is_prod ? "https://akeyless-toolbox.online" : "https://akeyless-toolbox.xyz";
    return result;
};

export const get_address_by_geo = async ({ lat, lng }: Geo, currentLanguage: LanguageOptions): Promise<string> => {
    const address_not_found = "";
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return address_not_found;
    }
    const language = currentLanguage === LanguageOptions.He ? "iw" : "en";
    const apiKey = process.env.google_api_key;
    if (!apiKey) {
        throw new Error("missing env google api key");
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=${language}`;
    try {
        const response = await axios.get(url);
        if (response?.data?.results[0]) {
            return response.data.results[0].formatted_address.slice(0, 35) as string;
        } else {
            return address_not_found;
        }
    } catch (error: any) {
        logger.error("getAddressByGeo error:", error);
        return address_not_found;
    }
};

export const validate_and_cast = <T extends any>(variable: any, condition: Boolean): variable is T => !!condition;

export const get_or_default = <T>(value: T | undefined, default_value: T | (() => T)): T => {
    if (value !== undefined) {
        return value;
    }
    return typeof default_value === "function" ? (default_value as () => T)() : default_value;
};

export const trim_strings = (input: any): any => {
    if (typeof input === "string") {
        return input.trim();
    } else if (Array.isArray(input)) {
        return input.map(trim_strings);
    } else if (input !== null && typeof input === "object") {
        const trimmed_object: Record<string, any> = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                trimmed_object[key] = trim_strings(input[key]);
            }
        }
        return trimmed_object;
    }
    return input;
};
