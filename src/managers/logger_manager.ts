import moment_timezone from "moment-timezone";
import { TObject } from "../types";
import axios from "axios";
import { isObject } from "lodash";
import { parse_error } from "../helpers";

class LoggerManager {
    private static instance: LoggerManager;
    private constructor() {}
    public static getInstance(): LoggerManager {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }
    private get_date(): string {
        return moment_timezone().tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm:ss.SS");
    }
    public log(msg: string, data?: TObject<any> | any[]): void {
        const is_table =
            !process.env.KUBERNETES_SERVICE_HOST &&
            Array.isArray(data) &&
            data.length > 1 &&
            data.every((val) => {
                if (typeof val === "object" && !Array.isArray(val)) {
                    return Object.values(val).every((v) => ["string", "number", "boolean"].includes(typeof v) || v === null);
                }
                return false;
            }) &&
            data.some((val) => Object.values(val).length > 1);
        if (is_table) {
            console.log(`${this.get_date()} - `, msg, ": ");
            console.table(data);
            return;
        }
        console.log(
            `${this.get_date()} - ${msg}`,
            data === undefined ? "" : `: ${isObject(data) || Array.isArray(data) ? JSON.stringify(data) : data}`
        );
    }
    public error(msg: string, data?: any) {
        if (axios.isAxiosError(data)) {
            console.error(`${this.get_date()} - ${msg}, axios error message: ${data.message}`);
            if (data.response?.data) {
                this.error("axios error data", data.response.data);
                console.error(`axios error data`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
            }
            return;
        }

        console.error(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify(parse_error(data))}`);
    }
    public warn(msg: string, data?: any) {
        console.warn(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
    }
}

export const logger = LoggerManager.getInstance();
