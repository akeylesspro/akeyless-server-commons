import firebase_admin from "firebase-admin";
import { QueryDocument, QueryDocumentByConditions, QueryDocumentOptional, QueryDocuments, QueryDocumentsByConditions, Snapshot, SnapshotBulk, SnapshotBulkByNames } from "../types";
import { DecodedIdToken } from "firebase-admin/auth";
import { TObject } from "akeyless-types-commons";
export declare const db: firebase_admin.firestore.Firestore;
export declare const messaging: import("firebase-admin/messaging").Messaging;
export declare const auth: import("firebase-admin/auth").Auth;
export declare const simple_extract_data: (doc: FirebaseFirestore.DocumentSnapshot) => TObject<any>;
export declare const get_all_documents: (collection_path: string) => Promise<any[]>;
export declare const query_documents: QueryDocuments;
export declare const query_documents_by_conditions: QueryDocumentsByConditions;
export declare const query_document_by_conditions: QueryDocumentByConditions;
export declare const query_document: QueryDocument;
export declare const query_document_optional: QueryDocumentOptional;
export declare const get_document_by_id: (collection_path: string, doc_id: string) => Promise<TObject<any>>;
export declare const get_document_by_id_optional: (collection_path: string, doc_id: string) => Promise<TObject<any> | null>;
export declare const set_document: (collection_path: string, doc_id: string, data: {}, merge?: boolean) => Promise<void>;
export declare const add_document: (collection_path: string, data: {}, include_id?: boolean) => Promise<void>;
export declare const delete_document: (collection_path: string, doc_id: string) => Promise<void>;
export declare const verify_token: (authorization: string | undefined) => Promise<DecodedIdToken>;
export declare const snapshot: Snapshot;
export declare const init_snapshots: () => Promise<void>;
export declare const snapshot_bulk: SnapshotBulk;
export declare const snapshot_bulk_by_names: SnapshotBulkByNames;
