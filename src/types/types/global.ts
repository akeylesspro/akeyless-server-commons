import { Request, Response, Express, NextFunction } from "express";
import { Installer } from "../";

export type JsonOK<T> = (data?: T) => { success: true; data: T | undefined };

export type JsonFailed = (error?: any, msg?: string) => { success: false; error: any };

export type MainRouter = (app: Express) => void;

export type MW = (req: Request, res: Response, next: NextFunction) => void;

export type Service = (req: Request, res: Response) => void;

export type Route = (req: Request, res: Response, next?: NextFunction) => Response;

export type NumberObject = { [key: number]: number };

export type TObject<T> = { [key: string]: T };

export type AddAuditRecord = (action: string, entity: string, details: TObject<any>, user?: Installer) => Promise<void>;
