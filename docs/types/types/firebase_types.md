# src/types/types/firebase_types.ts

## Purpose

Comprehensive type definitions for Firestore query operations and real-time snapshot subscription flows. These types provide type safety for Firebase Firestore queries, snapshot listeners, and Redis-backed cache synchronization. Used extensively by Firebase helpers and snapshot management systems.

## Dependencies

- **External Types:**
  - `TObject` - Generic object type from `akeyless-types-commons`
  - `FirebaseFirestore.WhereFilterOp` - Firebase Firestore where filter operators

## Exports

### Query Function Types

#### `QueryDocuments` Type

Type definition for querying multiple documents from a Firestore collection with a single where condition.

**Type Definition:**
```typescript
type QueryDocuments = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any
) => Promise<TObject<any>[]>;
```

**Parameters:**
- `collection_path: string` - Firestore collection path (e.g., `"nx-users"`)
- `field_name: string` - Field name to query against
- `operator: FirebaseFirestore.WhereFilterOp` - Firestore operator (`"=="`, `">"`, `"<="`, etc.)
- `value: any` - Value to compare against

**Returns:** `Promise<TObject<any>[]>` - Array of matching documents

**Usage:**
```typescript
const users = await query_documents("nx-users", "status", "==", "active");
```

#### `QueryDocumentsByConditions` Type

Type definition for querying multiple documents with multiple where conditions.

**Type Definition:**
```typescript
type QueryDocumentsByConditions = (
    collection_path: string,
    where_conditions: WhereCondition[]
) => Promise<TObject<any>[]>;
```

**Parameters:**
- `collection_path: string` - Firestore collection path
- `where_conditions: WhereCondition[]` - Array of where conditions

**Returns:** `Promise<TObject<any>[]>` - Array of matching documents

**Usage:**
```typescript
const users = await query_documents_by_conditions("nx-users", [
  { field_name: "status", operator: "==", value: "active" },
  { field_name: "role", operator: "==", value: "admin" }
]);
```

#### `QueryDocument` Type

Type definition for querying a single document (throws error if not found).

**Type Definition:**
```typescript
type QueryDocument = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignore_log?: boolean
) => Promise<TObject<any>>;
```

**Parameters:**
- `collection_path: string` - Firestore collection path
- `field_name: string` - Field name to query against
- `operator: FirebaseFirestore.WhereFilterOp` - Firestore operator
- `value: any` - Value to compare against
- `ignore_log?: boolean` - Optional flag to skip logging

**Returns:** `Promise<TObject<any>>` - Single matching document (throws if not found)

**Usage:**
```typescript
const user = await query_document("nx-users", "email", "==", "user@example.com");
```

#### `QueryDocumentOptional` Type

Type definition for querying a single document that may not exist (returns null if not found).

**Type Definition:**
```typescript
type QueryDocumentOptional = (
    collection_path: string,
    field_name: string,
    operator: FirebaseFirestore.WhereFilterOp,
    value: any,
    ignore_log?: boolean
) => Promise<TObject<any> | null>;
```

**Parameters:** Same as `QueryDocument`

**Returns:** `Promise<TObject<any> | null>` - Single matching document or null

**Usage:**
```typescript
const user = await query_document_optional("nx-users", "email", "==", "user@example.com");
if (user) {
  // User exists
}
```

#### `QueryDocumentByConditions` Type

Type definition for querying a single document with multiple where conditions.

**Type Definition:**
```typescript
type QueryDocumentByConditions = (
    collection_path: string,
    where_conditions: WhereCondition[],
    log?: boolean
) => Promise<TObject<any>>;
```

**Parameters:**
- `collection_path: string` - Firestore collection path
- `where_conditions: WhereCondition[]` - Array of where conditions
- `log?: boolean` - Optional flag to enable logging

**Returns:** `Promise<TObject<any>>` - Single matching document

### `WhereCondition` Interface

Interface defining a single Firestore where condition for queries.

**Interface Definition:**
```typescript
interface WhereCondition {
    field_name: string;                              // Field name to query against
    operator: FirebaseFirestore.WhereFilterOp;      // Firestore operator
    value: any;                                      // Value to compare against
}
```

**Properties:**
- `field_name: string` - The document field to query
- `operator: FirebaseFirestore.WhereFilterOp` - Comparison operator (`"=="`, `">"`, `"<="`, `"in"`, etc.)
- `value: any` - The value to compare against

**Usage:**
```typescript
const condition: WhereCondition = {
  field_name: "status",
  operator: "==",
  value: "active"
};
```

### Snapshot Types

#### `OnSnapshotCallback` Type

Type definition for snapshot event callback functions.

**Type Definition:**
```typescript
type OnSnapshotCallback = (documents: any[], config: OnSnapshotConfig) => void;
```

**Parameters:**
- `documents: any[]` - Array of documents from the snapshot
- `config: OnSnapshotConfig` - The snapshot configuration object

**Returns:** `void`

**Usage:**
```typescript
const callback: OnSnapshotCallback = (documents, config) => {
  console.log(`Received ${documents.length} documents from ${config.collection_name}`);
};
```

#### `OnSnapshotParsers` Interface

Interface defining callback functions for different snapshot events.

**Interface Definition:**
```typescript
interface OnSnapshotParsers {
    on_first_time?: OnSnapshotCallback;    // Called when snapshot is first established
    on_add?: OnSnapshotCallback;           // Called when documents are added
    on_modify?: OnSnapshotCallback;        // Called when documents are modified
    on_remove?: OnSnapshotCallback;        // Called when documents are removed
}
```

**Properties:**
- `on_first_time?: OnSnapshotCallback` - Callback for initial snapshot load
- `on_add?: OnSnapshotCallback` - Callback for document additions
- `on_modify?: OnSnapshotCallback` - Callback for document modifications
- `on_remove?: OnSnapshotCallback` - Callback for document deletions

**Usage:**
```typescript
const parsers: OnSnapshotParsers = {
  on_first_time: (docs, config) => {
    console.log("Initial load:", docs.length);
  },
  on_add: (docs, config) => {
    console.log("New documents added:", docs.length);
  },
  on_modify: (docs, config) => {
    console.log("Documents modified:", docs.length);
  },
  on_remove: (docs, config) => {
    console.log("Documents removed:", docs.length);
  }
};
```

#### `ExtraSnapshotConfig` Interface

Interface defining additional configuration options for snapshot subscriptions.

**Interface Definition:**
```typescript
interface ExtraSnapshotConfig {
    collection_name: string;                          // Collection name (required)
    extra_parsers?: OnSnapshotParsers[];             // Additional parser callbacks (optional)
    conditions?: WhereCondition[];                   // Where conditions for filtering (optional)
    cache_name?: string;                              // Cache key name (optional)
    parse_as?: "object" | "array";                    // Parse result as object or array (optional)
    doc_key_property?: string;                        // Property to use as document key (optional)
    subscription_type?: "redis" | "firebase";         // Subscription backend type (optional)
    debug?: Debug & {                                 // Debug configuration (optional)
        extra_parsers?: Debug;
    };
}
```

**Properties:**
- `collection_name: string` - Name of the Firestore collection to subscribe to
- `extra_parsers?: OnSnapshotParsers[]` - Array of additional parser callbacks for complex scenarios
- `conditions?: WhereCondition[]` - Where conditions to filter the snapshot
- `cache_name?: string` - Key name for caching in cache_manager
- `parse_as?: "object" | "array"` - How to parse and store the snapshot data
- `doc_key_property?: string` - Document property to use as the key when parsing as object
- `subscription_type?: "redis" | "firebase"` - Backend for snapshot subscription (Redis Pub/Sub or Firebase)
- `debug?: Debug & { extra_parsers?: Debug }` - Debug configuration for logging

#### `OnSnapshotConfig` Type

Combined type that includes both parser callbacks and extra configuration.

**Type Definition:**
```typescript
type OnSnapshotConfig = OnSnapshotParsers & ExtraSnapshotConfig;
```

**Usage:**
```typescript
const config: OnSnapshotConfig = {
  collection_name: "nx-users",
  conditions: [{ field_name: "status", operator: "==", value: "active" }],
  cache_name: "active-users",
  parse_as: "array",
  on_first_time: (docs) => console.log("Loaded", docs.length),
  on_add: (docs) => console.log("Added", docs.length)
};
```

### Snapshot Function Types

#### `Snapshot` Type

Type definition for creating a single snapshot subscription.

**Type Definition:**
```typescript
type Snapshot = (config: OnSnapshotConfig) => Promise<void>;
```

**Parameters:**
- `config: OnSnapshotConfig` - Snapshot configuration

**Returns:** `Promise<void>` - Resolves when snapshot is established

**Usage:**
```typescript
await snapshot({
  collection_name: "nx-users",
  cache_name: "users",
  on_first_time: (docs) => console.log("Loaded", docs.length)
});
```

#### `SnapshotBulk` Type

Type definition for creating multiple snapshot subscriptions together.

**Type Definition:**
```typescript
type SnapshotBulk = (snapshots: ReturnType<Snapshot>[], label?: string) => Promise<void>;
```

**Parameters:**
- `snapshots: ReturnType<Snapshot>[]` - Array of snapshot promises
- `label?: string` - Optional label for logging

**Returns:** `Promise<void>` - Resolves when all snapshots are established

**Usage:**
```typescript
await snapshot_bulk([
  snapshot({ collection_name: "nx-users", cache_name: "users" }),
  snapshot({ collection_name: "nx-devices", cache_name: "devices" })
], "Initial load");
```

#### `SnapshotBulkByNames` Type

Type definition for creating bulk snapshots by collection names with shared configuration.

**Type Definition:**
```typescript
type SnapshotBulkByNames = (
    params: SnapshotBulkByNamesParam[],
    options?: SnapshotBulkByNamesOptions
) => Promise<void>;
```

**Parameters:**
- `params: SnapshotBulkByNamesParam[]` - Array of collection names or configuration objects
- `options?: SnapshotBulkByNamesOptions` - Shared options for all snapshots

**Returns:** `Promise<void>`

**Related Types:**
- `SnapshotBulkByNamesParam` - `string | SnapshotBulkByNamesParamObject`
- `SnapshotBulkByNamesParamObject` - `Omit<ExtraSnapshotConfig, "extra_parsers"> & { extra_parsers: OnSnapshotParsers[] }`
- `SnapshotBulkByNamesOptions` - `Pick<ExtraSnapshotConfig, "debug" | "subscription_type" | "parse_as" | "doc_key_property"> & { label?: string }`

**Usage:**
```typescript
await snapshot_bulk_by_names(
  ["nx-users", "nx-devices"],
  { subscription_type: "firebase", parse_as: "array" }
);
```

#### `InitSnapshotsOptions` Interface

Interface for snapshot initialization options used during server startup.

**Interface Definition:**
```typescript
interface InitSnapshotsOptions extends Pick<ExtraSnapshotConfig, "subscription_type" | "debug"> {}
```

**Properties:**
- Inherits `subscription_type` and `debug` from `ExtraSnapshotConfig`

**Usage:**
```typescript
const options: InitSnapshotsOptions = {
  subscription_type: "firebase",
  debug: {
    on_first_time: "length"
  }
};
```

## Context

These types are fundamental to:

1. **Firebase Helpers** - All Firestore query functions use these types
2. **Snapshot System** - Real-time data synchronization uses snapshot types
3. **Redis Integration** - Redis-backed snapshots use the same type system
4. **Cache Management** - Snapshot data is stored in cache_manager using these types
5. **Server Bootstrap** - Initial snapshot loading uses `InitSnapshotsOptions`

## Type Relationships

- Query types (`QueryDocument`, `QueryDocuments`, etc.) are used by Firebase helper functions
- Snapshot types (`OnSnapshotConfig`, `Snapshot`, etc.) are used by snapshot initialization
- `WhereCondition` is used by both query and snapshot types
- `InitSnapshotsOptions` is used by server bootstrap functions
