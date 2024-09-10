import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";
dotenv.config();
export const init_env_variables = (required_vars) => {
    const data = {};
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
export const get_version = (filePath) => {
    const packageJsonPath = join(__dirname, filePath);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
};
export const sleep = (ms = 2500) => new Promise((resolve) => setTimeout(resolve, ms));
//# sourceMappingURL=global_helpers.js.map