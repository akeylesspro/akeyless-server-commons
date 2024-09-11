"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.get_version = exports.parse_error = exports.json_failed = exports.json_ok = exports.init_env_variables = void 0;
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const init_env_variables = (required_vars) => {
    const data = {};
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            managers_1.logger.error(`--- Error: Missing environment, variable: ${varName}. ---`);
            process.exit(1);
        }
        data[varName] = env_val;
    });
    return data;
};
exports.init_env_variables = init_env_variables;
const managers_1 = require("../managers");
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
//# sourceMappingURL=global_helpers.js.map