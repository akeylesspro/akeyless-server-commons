import { TObject, JsonFailed, JsonOK } from "../types";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();

export const init_env_variables = (required_vars: string[]) => {
    const data: TObject<string> = {};
    required_vars.forEach((varName) => {
        const env_val = process.env[varName];
        if (!env_val) {
            logger.error(`--- Error: Missing environment variable ${varName} ---`);
            process.exit(1);
        }
        data[varName] = env_val;
    });
    return data;
};

import { logger } from "../managers";
import { init_snapshots } from "./firebase_helpers";

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

export const get_version = (filePath: string): string => {
    const packageJsonPath = join(__dirname, filePath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};

export const sleep = (ms: number = 2500) => new Promise((resolve) => setTimeout(resolve, ms));
