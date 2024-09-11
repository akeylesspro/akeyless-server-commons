import { Request, Response, Express, NextFunction } from "express";
import { Installer, TObject } from "akeyless-types-commons";
export type JsonOK<T> = (data?: T) => {
    success: true;
    data: T | undefined;
};
export type JsonFailed = (error?: any, msg?: string) => {
    success: false;
    error: any;
};
export type MainRouter = (app: Express) => void;
export type MW = (req: Request, res: Response, next: NextFunction) => void;
export type Service = (req: Request, res: Response) => void;
export type Route = (req: Request, res: Response, next?: NextFunction) => Response;
export type AddAuditRecord = (action: string, entity: string, details: TObject<any>, user?: Installer) => Promise<void>;
