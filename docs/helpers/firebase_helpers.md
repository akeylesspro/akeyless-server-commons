# src/helpers/firebase_helpers.ts

## Purpose

Initialize Firebase Admin SDK and provide comprehensive Firestore CRUD operations, real-time snapshot subscriptions, Firebase Storage helpers, authentication token verification, and audit logging. This is the central integration point for all Firebase operations in the application.

## Dependencies

- `firebase-admin` - Firebase Admin SDK for Node.js
  - `firestore` - Database operations
  - `auth` - Authentication and token verification
  - `messaging` - FCM push notifications
  - `storage` - File storage operations
- `dotenv` - Environment variable loading
- `init_env_variables` - Environment validation helper
- Managers:
  - `cache_manager` - In-memory cache for collections
  - `logger` - Logging utility
  - `translation_manager` - Translation cache
- Redis snapshot integration: `redis_snapshots_bulk` from `./redis`
- Types from `src/types` - TypeScript type definitions
- `akeyless-types-commons` - Shared types (`TObject`)

## Initialization

### Firebase Admin Setup

The module initializes Firebase Admin SDK on import by:

1. **Reading Environment Variables** - Validates and loads required service account credentials:
   - `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, `client_id`
   - `auth_uri`, `token_uri`, `auth_provider_x509_cert_url`, `client_x509_cert_url`, `universe_domain`

2. **Service Account Configuration** - Builds `service_account_firebase` object:
   - Replaces `\\n` with actual newlines in `private_key`
   - Validates all required fields are present

3. **Firebase App Initialization**:
   ```typescript
   firebase_admin.initializeApp({
     credential: firebase_admin.credential.cert(service_account_firebase),
     storageBucket: `${project_id}.appspot.com`
   });
   ```

4. **Exported Instances**:
   - `db` - Firestore database instance
   - `messaging` - FCM messaging instance
   - `auth` - Firebase Auth instance
   - `storage` - Firebase Storage instance
   - `service_account_firebase` - Service account configuration object

## Firestore CRUD Operations

### `simple_extract_data(doc: FirebaseFirestore.DocumentSnapshot): TObject<any>`

Extracts document data and merges it with the document ID.

**Parameters:**
- `doc` - Firestore document snapshot

**Returns:** Object containing document data with `id` property added

**Behavior:**
- Merges `doc.data()` with `{ id: doc.id }`
- Ensures every document has an accessible `id` field

**Example:**
```typescript
const doc = await db.collection('users').doc('123').get();
const data = simple_extract_data(doc);
// Returns: { id: '123', name: 'John', email: 'john@example.com' }
```

### `get_all_documents(collection_path: string): Promise<TObject<any>[]>`

Fetches all documents from a collection.

**Parameters:**
- `collection_path` - Firestore collection path

**Returns:** Promise resolving to array of document objects (with `id` included)

**Throws:** Re-throws Firestore errors with logging

**Example:**
```typescript
const users = await get_all_documents('nx-users');
// Returns: [{ id: '1', name: 'John' }, { id: '2', name: 'Jane' }]
```

### `query_documents(collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any): Promise<TObject<any>[]>`

Queries documents using a single where clause.

**Parameters:**
- `collection_path` - Collection path
- `field_name` - Field to query
- `operator` - Firestore operator (`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `array-contains`, etc.)
- `value` - Value to compare against

**Returns:** Promise resolving to array of matching documents

**Throws:** Logs and re-throws Firestore errors

**Example:**
```typescript
const activeUsers = await query_documents('nx-users', 'status', '==', 'active');
const premiumUsers = await query_documents('nx-users', 'plan', 'in', ['premium', 'enterprise']);
```

### `query_documents_by_conditions(collection_path: string, where_conditions: Array<{field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any}>): Promise<TObject<any>[]>`

Queries documents using multiple where clauses (AND conditions).

**Parameters:**
- `collection_path` - Collection path
- `where_conditions` - Array of condition objects

**Returns:** Promise resolving to array of matching documents

**Behavior:**
- Chains multiple `where()` clauses
- All conditions must be satisfied (AND logic)

**Example:**
```typescript
const results = await query_documents_by_conditions('orders', [
  { field_name: 'status', operator: '==', value: 'pending' },
  { field_name: 'amount', operator: '>', value: 100 }
]);
```

### `query_document_by_conditions(collection_path: string, where_conditions: Array<{field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any}>, log: boolean = true): Promise<TObject<any>>`

Queries for a single document using multiple where clauses.

**Parameters:**
- `collection_path` - Collection path
- `where_conditions` - Array of condition objects
- `log` - Whether to log errors (default: `true`)

**Returns:** Promise resolving to first matching document

**Throws:** `"no data returned from DB"` if no documents match

**Example:**
```typescript
const user = await query_document_by_conditions('nx-users', [
  { field_name: 'email', operator: '==', value: 'user@example.com' },
  { field_name: 'status', operator: '==', value: 'active' }
]);
```

### `query_document(collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any, ignore_log: boolean = false): Promise<TObject<any>>`

Queries for a single document using a single where clause.

**Parameters:**
- `collection_path` - Collection path
- `field_name` - Field to query
- `operator` - Firestore operator
- `value` - Value to compare
- `ignore_log` - Skip error logging (default: `false`)

**Returns:** Promise resolving to first matching document

**Throws:** 
- Error message if no documents found: `"No data to return from: collection: {path}, field_name: {field}, operator: {op}, value: {value}"`

**Example:**
```typescript
const user = await query_document('nx-users', 'email', '==', 'user@example.com');
```

### `query_document_optional(collection_path: string, field_name: string, operator: FirebaseFirestore.WhereFilterOp, value: any, ignore_log: boolean = true): Promise<TObject<any> | null>`

Queries for a single document, returning `null` if not found (non-throwing version).

**Parameters:**
- Same as `query_document`
- `ignore_log` - Defaults to `true`

**Returns:** Promise resolving to document or `null`

**Behavior:**
- Never throws errors
- Returns `null` if no match found
- Useful for optional lookups

**Example:**
```typescript
const user = await query_document_optional('nx-users', 'email', '==', 'user@example.com');
if (user) {
  // User exists
}
```

### `get_document_by_id(collection_path: string, doc_id: string): Promise<TObject<any>>`

Retrieves a document by its ID.

**Parameters:**
- `collection_path` - Collection path
- `doc_id` - Document ID

**Returns:** Promise resolving to document object

**Throws:** `"Document not found, document id: {doc_id}"` if document doesn't exist

**Example:**
```typescript
const user = await get_document_by_id('nx-users', 'user-123');
```

### `get_document_by_id_optional(collection_path: string, doc_id: string): Promise<TObject<any> | null>`

Retrieves a document by ID, returning `null` if not found.

**Parameters:**
- Same as `get_document_by_id`

**Returns:** Promise resolving to document or `null`

**Behavior:**
- Never throws errors
- Returns `null` if document doesn't exist

**Example:**
```typescript
const user = await get_document_by_id_optional('nx-users', 'user-123');
```

### `set_document(collection_path: string, doc_id: string, data: {}, merge: boolean = true): Promise<void>`

Creates or updates a document by ID.

**Parameters:**
- `collection_path` - Collection path
- `doc_id` - Document ID
- `data` - Document data object
- `merge` - If `true`, merges with existing data; if `false`, replaces entire document (default: `true`)

**Returns:** Promise resolving when complete

**Throws:** Error message if operation fails

**Example:**
```typescript
// Merge (update existing fields, keep others)
await set_document('nx-users', 'user-123', { name: 'John' }, true);

// Replace (overwrite entire document)
await set_document('nx-users', 'user-123', { name: 'John', email: 'john@example.com' }, false);
```

### `add_document(collection_path: string, data: {}, include_id: boolean = false, custom_id?: string): Promise<string>`

Adds a new document to a collection.

**Parameters:**
- `collection_path` - Collection path
- `data` - Document data object
- `include_id` - Whether to include `id` field in document data (default: `false`)
- `custom_id` - Optional custom document ID (if not provided, Firestore generates one)

**Returns:** Promise resolving to document ID

**Throws:** Error message if operation fails

**Example:**
```typescript
// Auto-generated ID
const id = await add_document('nx-users', { name: 'John', email: 'john@example.com' });

// Custom ID
const id = await add_document('nx-users', { name: 'John' }, false, 'user-123');

// Include ID in document
const id = await add_document('nx-users', { name: 'John' }, true);
// Document will contain: { id: '...', name: 'John' }
```

### `delete_document(collection_path: string, doc_id: string): Promise<void>`

Deletes a document by ID.

**Parameters:**
- `collection_path` - Collection path
- `doc_id` - Document ID

**Returns:** Promise resolving when complete

**Throws:** Error message if operation fails

**Example:**
```typescript
await delete_document('nx-users', 'user-123');
```

## Authentication

### `verify_token(authorization: string | undefined): Promise<DecodedIdToken>`

Verifies a Firebase ID token from Authorization header.

**Parameters:**
- `authorization` - Authorization header value (should be `"Bearer {token}"`)

**Returns:** Promise resolving to decoded Firebase ID token

**Throws:**
- `"Authorization token is required"` - If authorization header is missing
- `"Invalid authorization token"` - If header doesn't start with "bearer"
- `"validation error: Token not found"` - If token extraction fails
- `"User not found"` - If token verification fails

**Behavior:**
- Extracts token from `Bearer {token}` format (case-insensitive)
- Verifies token using Firebase Admin Auth
- Returns decoded token with user information

**Example:**
```typescript
const decodedToken = await verify_token(req.headers.authorization);
// Returns: { uid: '...', email: '...', ... }
```

## Snapshot Parsers

Snapshot parsers transform Firestore document changes into cache updates.

### `parse_add_update_translations(documents: any[]): void`

Updates translation cache when translations are added or modified.

**Behavior:**
- Updates `translation_manager` cache
- Removes `id` field from documents before storing
- Used internally by translation snapshot subscriptions

### `parse_delete_translations(documents: any[]): void`

Removes translations from cache when deleted.

**Behavior:**
- Removes entries from `translation_manager` cache by document ID

### `parse_add_update_settings(documents: any[], name_for_cache: string): void`

Updates settings cache when settings are added or modified.

**Parameters:**
- `documents` - Array of document objects
- `name_for_cache` - Cache key name

**Behavior:**
- Updates `cache_manager` object cache
- Stores documents keyed by their `id`

### `parse_delete_settings(documents: any[], name_for_cache: string): void`

Removes settings from cache when deleted.

**Parameters:**
- Same as `parse_add_update_settings`

### `parse_add_update_as_object(documents: TObject<any>[], config: OnSnapshotConfig): void`

Generic parser for object-based caches (documents keyed by ID).

**Parameters:**
- `documents` - Array of document objects
- `config` - Snapshot configuration with `cache_name` and `doc_key_property`

**Behavior:**
- Stores documents in `cache_manager` as object, keyed by `doc_key_property` (default: `"id"`)

**Example:**
```typescript
// Documents: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
// Cache result: { '1': { id: '1', name: 'A' }, '2': { id: '2', name: 'B' } }
```

### `parse_delete_as_object(documents: TObject<any>[], config: OnSnapshotConfig): void`

Removes documents from object-based cache.

**Parameters:**
- Same as `parse_add_update_as_object`

**Behavior:**
- Deletes entries from cache object by `doc_key_property`

### `parse_add_update_as_array(documents: TObject<any>[], config: OnSnapshotConfig): void`

Generic parser for array-based caches.

**Parameters:**
- `documents` - Array of document objects
- `config` - Snapshot configuration with `cache_name` and optional `on_remove` callback

**Behavior:**
- Appends documents to existing array in `cache_manager`
- Calls `on_remove` callback if provided before adding

**Example:**
```typescript
// Existing cache: [{ id: '1' }]
// New documents: [{ id: '2' }, { id: '3' }]
// Result: [{ id: '1' }, { id: '2' }, { id: '3' }]
```

### `parse_delete_as_array(documents: TObject<any>[], config: OnSnapshotConfig): void`

Removes documents from array-based cache.

**Parameters:**
- Same as `parse_add_update_as_array`

**Behavior:**
- Filters out documents by matching `id` field

## Snapshot Orchestration

### `snapshot(config: OnSnapshotConfig): Promise<void>`

Creates a Firestore real-time snapshot listener for a collection.

**Parameters:**
- `config` - Snapshot configuration object:
  - `collection_name` - Firestore collection path
  - `cache_name` - Cache key name (defaults to `collection_name`)
  - `conditions` - Optional array of where conditions for filtered snapshots
  - `on_first_time` - Callback when initial data loads
  - `on_add` - Callback when documents are added
  - `on_modify` - Callback when documents are modified
  - `on_remove` - Callback when documents are removed
  - `extra_parsers` - Additional parser callbacks
  - `debug` - Debug logging configuration

**Returns:** Promise that resolves after first-time data load

**Behavior:**
1. Sets up Firestore `onSnapshot` listener
2. On first load:
   - Extracts all documents
   - Calls `on_first_time` callback
   - Calls `extra_parsers` callbacks
   - Resolves promise (allows server boot to continue)
3. On subsequent changes:
   - Separates changes into added/modified/removed
   - Calls respective callbacks
   - Calls `extra_parsers` callbacks
4. Error handling:
   - Exponential backoff retry (max 30 seconds)
   - Prevents boot deadlock by resolving promise even on errors
   - Automatically resubscribes after errors

**Critical Boot Safety:**
- Uses `safe_resolve()` to prevent multiple resolutions
- Resolves promise even on errors to avoid blocking server startup
- Tracks first-time loads to prevent duplicate initial processing

**Example:**
```typescript
await snapshot({
  collection_name: 'nx-users',
  cache_name: 'users',
  on_first_time: (docs) => {
    console.log(`Loaded ${docs.length} users`);
  },
  on_add: (docs) => {
    console.log(`Added: ${docs.length} users`);
  },
  debug: {
    on_first_time: 'documents',
    on_add: true
  }
});
```

### `init_snapshots(options?: InitSnapshotsOptions): Promise<void>`

Initializes common snapshots for settings and translations.

**Parameters:**
- `options` - Optional configuration:
  - `subscription_type` - `"firebase"` or `"redis"` (default: `"firebase"`)
  - `debug` - Debug logging configuration

**Behavior:**
- Subscribes to:
  - `nx-settings` collection (parsed as object)
  - `settings` collection (parsed as object)
  - `nx-translations` collection (with translation-specific parsers)
- Uses `snapshot_bulk_by_names` for orchestration

**Example:**
```typescript
await init_snapshots({
  subscription_type: 'firebase',
  debug: { on_first_time: 'documents' }
});
```

### `snapshot_bulk(snapshots: Promise<void>[], label?: string): Promise<void>`

Executes multiple snapshot promises in parallel and logs total duration.

**Parameters:**
- `snapshots` - Array of snapshot promises
- `label` - Optional label for logging (default: `"custom snapshots"`)

**Returns:** Promise resolving when all snapshots complete

**Behavior:**
- Executes all snapshots in parallel using `Promise.all`
- Logs start and end times with duration

**Example:**
```typescript
await snapshot_bulk([
  snapshot({ collection_name: 'users' }),
  snapshot({ collection_name: 'orders' })
], 'User and order snapshots');
```

### `get_default_parsers(parse_as: "array" | "object"): OnSnapshotParsers`

Returns default parser set based on data shape.

**Parameters:**
- `parse_as` - `"array"` or `"object"`

**Returns:** Object with `on_first_time`, `on_add`, `on_modify`, `on_remove` parsers

**Behavior:**
- Returns appropriate parsers for array or object cache storage

### `snapshot_bulk_by_names(params: Array<string | OnSnapshotConfig>, options?: ExtraSnapshotConfig): Promise<void>`

Orchestrates multiple snapshot subscriptions with support for both Firebase and Redis.

**Parameters:**
- `params` - Array of collection names (strings) or full config objects
- `options` - Configuration:
  - `label` - Label for logging (default: `"snapshot_bulk_by_names"`)
  - `subscription_type` - `"firebase"` or `"redis"` (default: `"firebase"`)
  - `parse_as` - `"array"` or `"object"` (default: `"array"`)
  - `doc_key_property` - Property to use as cache key (default: `"id"`)
  - `debug` - Debug logging configuration

**Returns:** Promise resolving when all snapshots are initialized

**Behavior:**
1. Deduplicates collections by name
2. For each collection:
   - Builds snapshot config (merges defaults with provided config)
   - Routes to Firebase or Redis based on `subscription_type`
3. Executes Firebase snapshots and Redis subscriptions in parallel
4. Logs total duration

**Example:**
```typescript
await snapshot_bulk_by_names(
  ['nx-users', 'nx-orders', { collection_name: 'nx-products', cache_name: 'products' }],
  {
    subscription_type: 'firebase',
    parse_as: 'object',
    label: 'User data snapshots'
  }
);
```

## Audit and Storage Helpers

### `add_audit_record(action: string, entity: string, details: any, user?: string): Promise<void>`

Writes an audit record to the `nx-audit` collection.

**Parameters:**
- `action` - Action name (e.g., `"send_email"`, `"user_login"`)
- `entity` - Entity identifier (e.g., `"user_registration"`, `"order_123"`)
- `details` - Additional details object
- `user` - Optional user identifier

**Returns:** Promise resolving when audit record is written

**Behavior:**
- Creates audit record with:
  - `action`, `entity`, `details`
  - `datetime` - Current Firestore timestamp
  - `user` - User identifier or `null`

**Throws:** Error object if write fails

**Example:**
```typescript
await add_audit_record('send_email', 'user_registration', {
  to: 'user@example.com',
  subject: 'Welcome'
}, 'user-123');
```

### `save_file_in_storage(file_path: string, buffer: Buffer | Uint8Array, options?: SaveFileOptions): Promise<string>`

Saves a file to Firebase Storage and returns a signed URL.

**Parameters:**
- `file_path` - Storage path (leading slashes are removed)
- `buffer` - File content as Buffer or Uint8Array
- `options` - Optional configuration:
  - `content_type` - MIME type
  - `content_disposition` - Content-Disposition header
  - `cache_control` - Cache-Control header
  - `make_public` - Make file publicly accessible (default: `true`)
  - `signed_url_ttl_ms` - Signed URL expiration in milliseconds (default: 7 days)
  - `resumable` - Use resumable upload (default: `false`)

**Returns:** Promise resolving to signed URL

**Throws:** Re-throws storage errors with logging

**Example:**
```typescript
const url = await save_file_in_storage(
  'reports/invoice-123.pdf',
  pdfBuffer,
  {
    content_type: 'application/pdf',
    make_public: true,
    signed_url_ttl_ms: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
);
```

### `get_file_url_from_storage(file_path: string): Promise<string>`

Gets a signed URL for an existing file in Firebase Storage.

**Parameters:**
- `file_path` - Storage path

**Returns:** Promise resolving to signed URL (valid for 7 days)

**Throws:**
- `Error("file not exist")` - If file doesn't exist

**Example:**
```typescript
const url = await get_file_url_from_storage('reports/invoice-123.pdf');
```

### `get_nx_settings(): Promise<TObject<any>>`

Retrieves `nx-settings` collection data, using cache if available.

**Returns:** Promise resolving to settings object (keyed by document ID)

**Behavior:**
1. Checks `cache_manager` for cached settings
2. If cached, returns immediately
3. If not cached:
   - Fetches all documents from `nx-settings` collection
   - Organizes into object keyed by document ID
   - Caches result
   - Returns settings object

**Example:**
```typescript
const settings = await get_nx_settings();
const emailSettings = settings.emails;
const smsSettings = settings.sms_provider;
```

## Context

This module is the central integration point for all Firebase operations:

- **Data Access** - All Firestore CRUD operations go through these helpers
- **Real-time Sync** - Snapshot subscriptions keep caches up-to-date
- **Authentication** - Token verification for protected routes
- **File Storage** - Firebase Storage integration for file uploads/downloads
- **Audit Trail** - Centralized audit logging for compliance

**Architecture Notes:**
- Snapshots use a "fail-open" approach to prevent boot deadlocks
- Cache is populated by snapshots, reducing Firestore read operations
- Supports both Firebase and Redis snapshot sources
- All operations include comprehensive error logging

**Best Practices:**
- Use cached data from `cache_manager` when possible (populated by snapshots)
- Use `query_document_optional` or `get_document_by_id_optional` for non-critical lookups
- Always use `add_audit_record` for important operations
- Prefer `snapshot_bulk_by_names` for multiple collections
- Use appropriate `parse_as` setting based on how data is accessed (array vs object lookup)
