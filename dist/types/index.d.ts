import { Express, Request, Response, NextFunction } from 'express';
import { TObject, Installer } from 'akeyless-types-commons';

type JsonOK<T> = (data?: T) => {
    success: true;
    data: T | undefined;
};
type JsonFailed = (error?: any, msg?: string) => {
    success: false;
    error: any;
};
type MainRouter = (app: Express) => void;
type MW = (req: Request, res: Response, next: NextFunction) => void;
type Service = (req: Request, res: Response) => void;
type Route = (req: Request, res: Response, next?: NextFunction) => Response;
type AddAuditRecord = (action: string, entity: string, details: TObject<any>, user?: Installer) => Promise<void>;

type QueryDocuments = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any) => Promise<TObject<any>[]>;
type WhereCondition = {
    field_name: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
};
type QueryDocumentsByConditions = (collection_path: string, where_conditions: WhereCondition[]) => Promise<TObject<any>[]>;
type QueryDocumentByConditions = (collection_path: string, where_conditions: WhereCondition[], log?: boolean) => Promise<TObject<any>>;
type QueryDocument = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any, ignore_log?: boolean) => Promise<TObject<any>>;
type QueryDocumentOptional = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any) => Promise<TObject<any> | null>;
type OnSnapshotCallback = (documents: any[]) => void;
interface OnSnapshotConfig {
    on_first_time?: OnSnapshotCallback;
    on_add?: OnSnapshotCallback;
    on_modify?: OnSnapshotCallback;
    on_remove?: OnSnapshotCallback;
    alternative_name?: string;
}
type Snapshot = (collection_name: string, config: OnSnapshotConfig) => Promise<void>;
type SnapshotBulk = (snapshots: ReturnType<Snapshot>[], label?: string) => Promise<void>;

interface MandatoryObject {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    length?: number;
    required_keys?: string[];
}
interface MandatoryParams {
    body?: MandatoryObject[];
    headers?: MandatoryObject[];
}
type LangOptions = "he" | "en" | "ru" | (string & {});
type EntityOptions = "nx_devices" | (string & {});

interface EmailData {
    subject: string;
    entity_for_audit: string;
    to?: string | string[];
    from?: string | {
        email: string;
        name?: string;
    };
    group_name?: string;
    cc?: string | string[];
    body_plain_text?: string;
    body_html?: string;
}
interface EmailSettings {
    default_from: {
        email: string;
        name?: string;
    };
    groups: Record<string, {
        cc?: string[];
        to: string[];
    }>;
    sendgrid_api_key: string;
}

declare enum SomeEnum {
}

export { type AddAuditRecord, type EmailData, type EmailSettings, type EntityOptions, type JsonFailed, type JsonOK, type LangOptions, type MW, type MainRouter, type MandatoryObject, type MandatoryParams, type OnSnapshotCallback, type OnSnapshotConfig, type QueryDocument, type QueryDocumentByConditions, type QueryDocumentOptional, type QueryDocuments, type QueryDocumentsByConditions, type Route, type Service, type Snapshot, type SnapshotBulk, SomeEnum, type WhereCondition };
