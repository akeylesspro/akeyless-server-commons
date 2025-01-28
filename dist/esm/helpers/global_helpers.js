var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NxServiceName } from "../types";
import { readFileSync } from "fs";
import { logger } from "../managers";
import { db } from "./";
import { Timestamp } from "firebase-admin/firestore";
export const init_env_variables = (required_vars = []) => {
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
            process.exit(1);
        }
    });
    const env_vars = {};
    Object.keys(process.env).forEach((var_name) => {
        const env_val = process.env[var_name];
        env_vars[var_name] = env_val;
    });
    return env_vars;
};
export const json_ok = (data) => {
    return {
        success: true,
        data,
    };
};
export const json_failed = (error, msg) => {
    return {
        success: false,
        error: error || "general error: something happened ",
        msg: msg || "",
    };
};
export const parse_error = (error) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};
export const get_version = (packageJsonPath) => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};
export const sleep = (ms = 2500) => new Promise((resolve) => setTimeout(resolve, ms));
export const add_audit_record = (action, entity, details, user) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        action,
        entity,
        details,
        datetime: Timestamp.now(),
        user: user || null,
    };
    try {
        yield db.collection("nx-audit").add(data);
    }
    catch (error) {
        throw { msg: "unable to add audit record", data };
    }
});
export const get_nx_service_urls = (env_name = "mode") => {
    if (!process.env[env_name]) {
        throw new Error("missing [mode] environment variable");
    }
    const env_value = process.env[env_name].toLowerCase();
    const is_local = ["local"].includes(env_value);
    const is_prod = ["production", "prod"].includes(env_value);
    const is_qa = ["qa"].includes(env_value);
    const result = {};
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
//# sourceMappingURL=global_helpers.js.map