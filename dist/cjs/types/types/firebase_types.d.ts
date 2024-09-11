import { TObject } from "./global";
export type QueryDocuments = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any) => Promise<TObject<any>[]>;
export type WhereCondition = {
    field_name: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
};
export type QueryDocumentsByConditions = (collection_path: string, where_conditions: WhereCondition[]) => Promise<TObject<any>[]>;
export type QueryDocumentByConditions = (collection_path: string, where_conditions: WhereCondition[]) => Promise<TObject<any>>;
export type QueryDocument = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any, ignore_log?: boolean) => Promise<TObject<any>>;
export type QueryDocumentOptional = (collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any) => Promise<TObject<any> | null>;
export type OnSnapshotCallback = (documents: any[]) => void;
export interface OnSnapshotConfig {
    parse?: OnSnapshotCallback;
    on_add?: OnSnapshotCallback;
    on_modify?: OnSnapshotCallback;
    on_remove?: OnSnapshotCallback;
    is_ignore_first_time_changes?: boolean;
}
export type Snapshot = (collection_name: string, config: OnSnapshotConfig) => Promise<void>;
