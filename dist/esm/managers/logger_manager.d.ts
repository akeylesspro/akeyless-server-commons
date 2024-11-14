import { TObject } from "akeyless-types-commons";
declare class LoggerManager {
    private static instance;
    private constructor();
    static getInstance(): LoggerManager;
    private get_date;
    log(msg: string, data?: TObject<any> | any[]): void;
    error(msg: string, data?: any): void;
    warn(msg: string, data?: any): void;
}
export declare const logger: LoggerManager;
export {};
