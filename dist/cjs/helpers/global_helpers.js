"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_nx_service_urls = exports.add_audit_record = exports.sleep = exports.get_version = exports.parse_error = exports.json_failed = exports.json_ok = exports.init_env_variables = void 0;
const types_1 = require("../types");
const fs_1 = require("fs");
const managers_1 = require("../managers");
const _1 = require("./");
const firestore_1 = require("firebase-admin/firestore");
const init_env_variables = (required_vars = []) => {
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            managers_1.logger.error(`--- Error: Missing mandatory environment variable: ${varName}. ---`);
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
exports.init_env_variables = init_env_variables;
const json_ok = (data) => {
    return {
        success: true,
        data,
    };
};
exports.json_ok = json_ok;
const json_failed = (error, msg) => {
    return {
        success: false,
        error: error || "general error: something happened ",
        msg: msg || "",
    };
};
exports.json_failed = json_failed;
const parse_error = (error) => {
    return error instanceof Error ? { name: error.name, message: error.message } : error;
};
exports.parse_error = parse_error;
const get_version = (packageJsonPath) => {
    const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, "utf8"));
    return packageJson.version;
};
exports.get_version = get_version;
const sleep = (ms = 2500) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
const add_audit_record = (action, entity, details, user) => __awaiter(void 0, void 0, void 0, function* () {
    const data = {
        action,
        entity,
        details,
        datetime: firestore_1.Timestamp.now(),
        user: user || null,
    };
    try {
        yield _1.db.collection("nx-audit").add(data);
    }
    catch (error) {
        throw { msg: "unable to add audit record", data };
    }
});
exports.add_audit_record = add_audit_record;
const get_nx_service_urls = (env_name = "mode") => {
    if (!process.env[env_name]) {
        throw new Error("missing [mode] environment variable");
    }
    const env_value = process.env[env_name].toLowerCase();
    const is_local = ["local"].includes(env_value);
    const is_prod = ["production", "prod"].includes(env_value);
    const is_qa = ["qa"].includes(env_value);
    const result = {};
    result[types_1.NxServiceName.bi] = is_local ? "http://localhost:9002/api/bi" : is_prod ? "https://nx-api.info/api/bi" : "https://nx-api.xyz/api/bi";
    result[types_1.NxServiceName.call_center] = is_local
        ? "http://localhost:9003/api/call-center"
        : is_prod
            ? "https://nx-api.info/api/call-center"
            : "https://nx-api.xyz/api/call-center";
    result[types_1.NxServiceName.dashboard] = is_local
        ? "http://localhost"
        : is_prod
            ? "https://akeyless-dashboard.online"
            : "https://akeyless-dashboard.xyz";
    result[types_1.NxServiceName.devices] = is_local
        ? "http://localhost:9001/api/devices"
        : is_prod
            ? "https://nx-api.info/api/devices"
            : "https://nx-api.xyz/api/devices";
    result[types_1.NxServiceName.installer] = is_local ? "http://localhost" : is_prod ? "https://installerapp.online" : "https://installerapp.xyz";
    result[types_1.NxServiceName.ox_server] = is_local ? "http://localhost" : is_prod ? "https://akeyless-online.info" : "https://akeyless-online.xyz";
    result[types_1.NxServiceName.toolbox] = is_local ? "http://localhost" : is_prod ? "https://akeyless-toolbox.online" : "https://akeyless-toolbox.xyz";
    return result;
};
exports.get_nx_service_urls = get_nx_service_urls;
//# sourceMappingURL=global_helpers.js.map