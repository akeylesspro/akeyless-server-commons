import moment_timezone from "moment-timezone";
import axios from "axios";
import { isObject } from "lodash";
import { parse_error } from "../helpers";
class LoggerManager {
    constructor() { }
    static getInstance() {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }
    get_date() {
        return moment_timezone().tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm:ss.SS");
    }
    log(msg, data) {
        const is_table = !process.env.KUBERNETES_SERVICE_HOST &&
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
        console.log(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${isObject(data) || Array.isArray(data) ? JSON.stringify(data) : data}`);
    }
    error(msg, data) {
        var _a;
        if (axios.isAxiosError(data)) {
            console.error(`${this.get_date()} - ${msg}, axios error message: ${data.message}`);
            if ((_a = data.response) === null || _a === void 0 ? void 0 : _a.data) {
                this.error("axios error data", data.response.data);
                console.error(`axios error data`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
            }
            return;
        }
        console.error(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify(parse_error(data))}`);
    }
    warn(msg, data) {
        console.warn(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
    }
}
export const logger = LoggerManager.getInstance();
//# sourceMappingURL=logger_manager.js.map