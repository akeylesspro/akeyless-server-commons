import { TObject } from "akeyless-types-commons";
export type QueryDocuments = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any
) => Promise<TObject<any>[]>;

export type WhereCondition = {
    field_name: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
};

export type QueryDocumentsByConditions = (collection_path: string, where_conditions: WhereCondition[]) => Promise<TObject<any>[]>;

export type QueryDocumentByConditions = (collection_path: string, where_conditions: WhereCondition[], log?: boolean) => Promise<TObject<any>>;

export type QueryDocument = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignore_log?: boolean
) => Promise<TObject<any>>;

export type QueryDocumentOptional = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any
) => Promise<TObject<any> | null>;

export type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;
export interface OnSnapshotConfig {
    on_first_time?: OnSnapshotCallback;
    on_add?: OnSnapshotCallback;
    on_modify?: OnSnapshotCallback;
    on_remove?: OnSnapshotCallback;
    name_for_cache?: string;
}

export type Snapshot = (collection_name: string, config: OnSnapshotConfig) => Promise<void>;
export type SnapshotBulk = (snapshots: ReturnType<Snapshot>[], label?: string) => Promise<void>;
