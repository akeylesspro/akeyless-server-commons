import { AddAuditRecord, JsonFailed, JsonOK, NxServiceName } from "../types";
import { readFileSync } from "fs";
import { logger } from "../managers";
import { db } from "./";
import { TObject } from "akeyless-types-commons";
import { Timestamp } from "firebase-admin/firestore";

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
        error: error || "general error: something happened ",
        msg: msg || "",
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

export const get_nx_service_urls = (): TObject<string> => {
    if (!process.env.mode) {
        throw new Error("missing [mode] environment variable");
    }
    const is_prod = ["production", "prod"].includes(process.env.mode.toLowerCase());
    const result: TObject<string> = {};
    result[NxServiceName.bi] = is_prod ? "https://nx-api.info/api/bi" : "https://nx-api.xyz/api/bi";
    result[NxServiceName.call_center] = is_prod ? "https://nx-api.info/api/call-center" : "https://nx-api.xyz/api/call-center";
    result[NxServiceName.dashboard] = is_prod ? "https://akeyless-dashboard.online" : "https://akeyless-dashboard.xyz";
    result[NxServiceName.devices] = is_prod ? "https://nx-api.info/api/devices" : "https://nx-api.xyz/api/devices";
    result[NxServiceName.installer] = is_prod ? "https://installerapp.online" : "https://installerapp.xyz";
    result[NxServiceName.ox_server] = is_prod ? "https://akeyless-online.info" : "https://akeyless-online.xyz";
    result[NxServiceName.toolbox] = is_prod ? "https://akeyless-toolbox.online" : "https://akeyless-toolbox.xyz";
    return result;
};
