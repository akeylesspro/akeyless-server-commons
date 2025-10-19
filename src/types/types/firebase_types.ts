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
    value: any,
    ignore_log?: boolean
) => Promise<TObject<any> | null>;

export type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;

export interface OnSnapshotParsers {
    on_first_time?: OnSnapshotCallback;
    on_add?: OnSnapshotCallback;
    on_modify?: OnSnapshotCallback;
    on_remove?: OnSnapshotCallback;
}

interface ExtraSnapshotConfig {
    collection_name: string;
    extra_parsers?: OnSnapshotParsers[];
    conditions?: WhereCondition[];
    cache_name?: string;
    parse_as?: "object" | "array";
    doc_key_property?: string;
    subscription_type?: "redis" | "firebase";
    debug?: Debug & {
        extra_parsers?: Debug;
    };
}
interface Debug {
    on_first_time?: "documents" | "length";
    on_add?: boolean;
    on_modify?: boolean;
    on_remove?: boolean;
}

export type OnSnapshotConfig = OnSnapshotParsers & ExtraSnapshotConfig;

export type Snapshot = (config: OnSnapshotConfig) => Promise<void>;
export type SnapshotBulk = (snapshots: ReturnType<Snapshot>[], label?: string) => Promise<void>;

export type SnapshotBulkByNamesParamObject = Omit<ExtraSnapshotConfig, "extra_parsers"> & {
    extra_parsers: OnSnapshotParsers[];
};
export type SnapshotBulkByNamesParam = string | SnapshotBulkByNamesParamObject;
export type SnapshotBulkByNames = (
    params: SnapshotBulkByNamesParam[],
    options?: { label?: string; subscription_type?: "redis" | "firebase"; debug?: ExtraSnapshotConfig["debug"] }
) => Promise<void>;
