import { JsonFailed, JsonOK, NxServiceNameMap } from "../types";
import { readFileSync } from "fs";
import { cache_manager, logger } from "../managers";
import { Geo, LanguageOptions, TObject } from "akeyless-types-commons";
import axios, { AxiosRequestConfig } from "axios";
import https from "https";

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

const BASE_URLS: Record<"local" | "prod" | "qa", NxServiceNameMap> = {
    local: {
        bi: "http://localhost:9002/api/bi",
        call_center: "http://localhost:9003/api/call-center",
        dashboard: "http://localhost",
        devices: "http://localhost:9001/api/devices",
        end_users: "http://10.100.102.9:9011/api/end-users",
        notifications: "http://localhost:9006/api/notifications",
        installer: "http://localhost",
        ox_server: "http://localhost",
        toolbox: "http://localhost",
    },
    prod: {
        bi: "https://nx-api.info/api/bi",
        call_center: "https://nx-api.info/api/call-center",
        dashboard: "https://akeyless-dashboard.online",
        devices: "https://nx-api.info/api/devices",
        end_users: "https://nx-api.info/api/end-users",
        notifications: "https://nx-api.info/api/notifications",
        installer: "https://installerapp.online",
        ox_server: "https://akeyless-online.info",
        toolbox: "https://akeyless-toolbox.online",
    },
    qa: {
        bi: "https://nx-api.xyz/api/bi",
        call_center: "https://nx-api.xyz/api/call-center",
        dashboard: "https://akeyless-dashboard.xyz",
        devices: "https://nx-api.xyz/api/devices",
        end_users: "https://nx-api.xyz/api/end-users",
        notifications: "https://nx-api.xyz/api/notifications",
        installer: "https://installerapp.xyz",
        ox_server: "https://akeyless-online.xyz",
        toolbox: "https://akeyless-toolbox.xyz",
    },
};

export function get_nx_service_urls(env_name: string = "mode"): NxServiceNameMap {
    const env_value = process.env[env_name]?.toLowerCase();
    if (!env_value) throw new Error(`missing [${env_name}] environment variable`);

    const env_key = ["production", "prod"].includes(env_value) ? "prod" : env_value === "qa" ? "qa" : "local";
    return BASE_URLS[env_key];
}

export const get_address_by_geo = async ({ lat, lng }: Geo, currentLanguage: LanguageOptions): Promise<string> => {
    const address_not_found = "";
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return address_not_found;
    }
    const language = currentLanguage === LanguageOptions.He ? "iw" : "en";
    const google_setting = cache_manager.getObjectData("nx-settings")["google"];
    const geocode_api_key = google_setting["geocode_api_key"];
    if (!geocode_api_key) {
        throw new Error("missing env google api key");
    }
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${geocode_api_key}&language=${language}`;
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

export const trim_strings = <T>(input: any): any => {
    if (typeof input === "string") {
        return input.trim();
    }

    if (Array.isArray(input)) {
        return input.map(trim_strings);
    }

    if (input instanceof Date || input instanceof RegExp || input instanceof Map || input instanceof Set) {
        return input;
    }

    if (input !== null && typeof input === "object") {
        const trimmed_object: Record<string, any> = {};
        for (const key of Object.getOwnPropertyNames(input)) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                trimmed_object[key] = trim_strings(input[key]);
            }
        }
        return trimmed_object;
    }

    return input;
};

export const remove_nulls_and_undefined = (obj: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null));
};

export const ignore_ssl_request = async (config: AxiosRequestConfig) => {
    const { mode } = init_env_variables(["mode"]);
    if (mode === "qa") {
        config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    return await axios(config);
};
