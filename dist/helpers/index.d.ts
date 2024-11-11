import { Express } from 'express';
import { TObject, Installer, firebase_timestamp, DefaultClient, NxUser, EventFromDevice } from 'akeyless-types-commons';
import * as firebase_admin_messaging from 'firebase-admin/messaging';
import firebase_admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

type JsonOK<T> = (data?: T) => {
    success: true;
    data: T | undefined;
};
type JsonFailed = (error?: any, msg?: string) => {
    success: false;
    error: any;
};
type MainRouter = (app: Express) => void;
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
type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;
interface OnSnapshotParsers {
    on_first_time?: OnSnapshotCallback;
    on_add?: OnSnapshotCallback;
    on_modify?: OnSnapshotCallback;
    on_remove?: OnSnapshotCallback;
}
interface OnSnapshotConfig extends OnSnapshotParsers {
    collection_name?: string;
    extra_parsers?: OnSnapshotParsers[];
}
type Snapshot = (config: OnSnapshotConfig) => Promise<void>;
type SnapshotBulk = (snapshots: ReturnType<Snapshot>[], label?: string) => Promise<void>;
type CollectionName = "units" | "usersUnits" | "mobile_users_app_pro" | "app_pro_extra_pushes";
type SnapshotBulkByNamesParamObject = {
    collection_name: CollectionName;
    extra_parsers: OnSnapshotParsers[];
};
type SnapshotBulkByNamesParam = string | SnapshotBulkByNamesParamObject;
type SnapshotBulkByNames = (params: SnapshotBulkByNamesParam[]) => Promise<void>;

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

declare const init_env_variables: (required_vars: string[]) => TObject<string>;
declare const json_ok: JsonOK<TObject<any> | TObject<any>[]>;
declare const json_failed: JsonFailed;
declare const parse_error: (error: any) => any;
declare const get_version: (packageJsonPath: string) => string;
declare const sleep: (ms?: number) => Promise<unknown>;
declare const add_audit_record: AddAuditRecord;

declare const db: firebase_admin.firestore.Firestore;
declare const messaging: firebase_admin_messaging.Messaging;
declare const simple_extract_data: (doc: FirebaseFirestore.DocumentSnapshot) => TObject<any>;
declare const get_all_documents: (collection_path: string) => Promise<any[]>;
declare const query_documents: QueryDocuments;
declare const query_documents_by_conditions: QueryDocumentsByConditions;
declare const query_document_by_conditions: QueryDocumentByConditions;
declare const query_document: QueryDocument;
declare const query_document_optional: QueryDocumentOptional;
declare const get_document_by_id: (collection_path: string, doc_id: string) => Promise<TObject<any>>;
declare const set_document: (collection_path: string, doc_id: string, data: {}) => Promise<void>;
declare const add_document: (collection_path: string, data: {}, include_id?: boolean) => Promise<void>;
declare const delete_document: (collection_path: string, doc_id: string) => Promise<void>;
declare const verify_token: (bearer_token: string) => Promise<DecodedIdToken>;
declare const snapshot: Snapshot;
declare const init_snapshots: () => Promise<void>;
declare const snapshot_bulk: SnapshotBulk;
declare const snapshot_bulk_by_names: SnapshotBulkByNames;

declare const start_server: (main_router: MainRouter, project_name: string, version: string) => Promise<void>;
declare const basic_init: (main_router: MainRouter, project_name: string, version: string) => Promise<void>;
declare const nextjs_init: (project_name: string, version: string) => Promise<void>;

/**
 * Converts a Firebase Timestamp object into a formatted string.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @param {string} [format="DD-MM-YYYY HH:mm:ss"] - Optional the format string used to format the date. Default is "DD-MM-YYYY HH:mm:ss".
 * @returns {string} - A formatted date string according to the specified format or the default format.
 */
declare function timestamp_to_string(firebaseTimestamp: firebase_timestamp, format?: string): string;
/**
 * Converts a Firebase Timestamp object into milliseconds since the Unix epoch.
 *
 * @param {firebase_timestamp} firebaseTimestamp - The Firebase timestamp object containing _seconds and _nanoseconds.
 * @returns {number} - Time in milliseconds
 */
declare function timestamp_to_millis(firebaseTimestamp: firebase_timestamp): number;
declare function sort_by_timestamp(a: firebase_timestamp, b: firebase_timestamp, reverse?: boolean): number;

declare const convert_to_short_phone_number: (phone_number: string) => string;
interface Users {
    installer?: Installer;
    nx_user?: NxUser;
}
declare const get_users_by_phone: (phone_number: string, default_client_key?: DefaultClient) => Promise<Users>;

declare const send_sms: (phone_number: string, text: string, entity_for_audit: string) => Promise<void>;
declare const push_event_to_mobile_users: (event: EventFromDevice) => Promise<void>;
type FuncSendFcmMessage = (title: string, body: string, fcm_tokens: string[], custom_sound?: string) => Promise<{
    success: boolean;
    response: string;
    success_count?: number;
    failure_count?: number;
}>;
declare const send_fcm_message: FuncSendFcmMessage;

declare const send_email: (email_data: EmailData) => Promise<void>;

export { add_audit_record, add_document, basic_init, convert_to_short_phone_number, db, delete_document, get_all_documents, get_document_by_id, get_users_by_phone, get_version, init_env_variables, init_snapshots, json_failed, json_ok, messaging, nextjs_init, parse_error, push_event_to_mobile_users, query_document, query_document_by_conditions, query_document_optional, query_documents, query_documents_by_conditions, send_email, send_fcm_message, send_sms, set_document, simple_extract_data, sleep, snapshot, snapshot_bulk, snapshot_bulk_by_names, sort_by_timestamp, start_server, timestamp_to_millis, timestamp_to_string, verify_token };
