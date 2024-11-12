"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const axios_1 = __importDefault(require("axios"));
const lodash_1 = require("lodash");
const helpers_1 = require("../helpers");
class LoggerManager {
    constructor() { }
    static getInstance() {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }
    get_date() {
        return (0, moment_timezone_1.default)().tz("Asia/Jerusalem").format("DD/MM/YYYY HH:mm:ss.SS");
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
        console.log(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${(0, lodash_1.isObject)(data) || Array.isArray(data) ? JSON.stringify(data) : data}`);
    }
    error(msg, data) {
        var _a;
        if (axios_1.default.isAxiosError(data)) {
            console.error(`${this.get_date()} - ${msg}, axios error message: ${data.message}`);
            if ((_a = data.response) === null || _a === void 0 ? void 0 : _a.data) {
                this.error("axios error data", data.response.data);
                console.error(`axios error data`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
            }
            return;
        }
        console.error(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify((0, helpers_1.parse_error)(data))}`);
    }
    warn(msg, data) {
        console.warn(`${this.get_date()} - ${msg}`, data === undefined ? "" : `: ${JSON.stringify(data)}`);
    }
}
exports.logger = LoggerManager.getInstance();
//# sourceMappingURL=logger_manager.js.map