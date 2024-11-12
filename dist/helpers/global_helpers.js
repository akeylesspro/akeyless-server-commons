import { readFileSync } from "fs";
import { logger } from "../managers";
import { db } from "./";
import { Timestamp } from "firebase-admin/firestore";
export const init_env_variables = (required_vars) => {
    const data = {};
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            logger.error(`--- Error: Missing environment, variable: ${varName}. ---`);
            process.exit(1);
        }
        data[varName] = env_val;
    });
    return data;
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
export const add_audit_record = async (action, entity, details, user) => {
    const data = {
        action,
        entity,
        details,
        datetime: Timestamp.now(),
        user: user || null,
    };
    try {
        await db.collection("nx-audit").add(data);
    }
    catch (error) {
        throw { msg: "unable to add audit record", data };
    }
};
