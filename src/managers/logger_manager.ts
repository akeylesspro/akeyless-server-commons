import moment_timezone from "moment-timezone";
import { TObject } from "akeyless-types-commons";
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
    private is_gcp(): boolean {
        return !!(process.env.KUBERNETES_SERVICE_HOST || process.env.K_SERVICE);
    }
    private emit(severity: "INFO" | "WARNING" | "ERROR", text: string): void {
        if (this.is_gcp()) {
            // GCP: structured JSON on stdout so Cloud Logging reads `severity`, not the stream
            console.log(JSON.stringify({ severity, message: text }));
            return;
        }
        const method = severity === "ERROR" ? console.error : severity === "WARNING" ? console.warn : console.log;
        method(text);
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
        const text = `${this.get_date()} - ${msg}${
            data === undefined ? "" : `: ${isObject(data) || Array.isArray(data) ? JSON.stringify(data) : data}`
        }`;
        this.emit("INFO", text);
    }
    public error(msg: string, data?: any) {
        let text: string;
        if (axios.isAxiosError(data)) {
            if (!!data.response?.data) {
                text = `${this.get_date()} - ${msg}, axios error: ${data.message}, data: ${JSON.stringify(data)}`;
            } else {
                text = `${this.get_date()} - ${msg}, axios error: ${data.message}`;
            }
        } else {
            text = `${this.get_date()} - ${msg}${data === undefined ? "" : `: ${JSON.stringify(parse_error(data))}`}`;
        }
        this.emit("ERROR", text);
    }
    public warn(msg: string, data?: any) {
        const text = `${this.get_date()} - ${msg}${data === undefined ? "" : `: ${JSON.stringify(data)}`}`;
        this.emit("WARNING", text);
    }
}

export const logger = LoggerManager.getInstance();
