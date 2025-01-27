import { Express } from "express";
import { MainRouter } from "../types";
export declare const start_server: (main_router: MainRouter, project_name: string, version: string) => Promise<Express>;
export declare const basic_init: (main_router: MainRouter, project_name: string, version: string) => Promise<Express>;
export declare const nextjs_init: (project_name: string, version: string) => Promise<void>;
