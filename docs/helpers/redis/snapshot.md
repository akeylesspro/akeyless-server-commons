# src/helpers/redis/snapshot.ts

## Purpose

Consume Redis Pub/Sub updates and hydrate cache using Redis data, with automatic fallback to Firebase snapshots when Redis is unavailable or unsupported. Provides the same cache parsing interface as Firebase snapshots, allowing seamless switching between data sources.

## Dependencies

- Redis helpers: `get_redis_commander`, `get_redis_listener`, connection flags
- Firebase snapshot helpers: `snapshot`, parsers, `get_nx_settings`
- `get_collection_keys`, `scan_redis_keys` - Key utilities
- `logger` - Logging manager
- Firestore `Timestamp` - Timestamp conversion
- Types from `akeyless-types-commons`:
  - `CollectionConfig` - Collection configuration
  - `RedisUpdatePayload` - Pub/Sub message format
  - `RedisUpdateType` - Update type enum
  - `TObject` - Generic object type

## Main Function

### `redis_snapshots_bulk(configs: OnSnapshotConfig[]): Promise<void>`

Orchestrates Redis snapshot subscriptions with validation and Firebase fallback.

**Parameters:**
- `configs` - Array of snapshot configurations

**Returns:** Promise resolving when all snapshots are initialized

**Behavior:**
1. **First-Time Initialization:**
   - Validates each config via `validate_config`
   - If validation fails:
     - Logs warning
     - Triggers Firebase snapshot if `trigger_firebase_snapshot` is true
     - Continues to next config
   - If validation succeeds:
     - Calls `parse_redis_snapshot` for initial data load
     - Sets up Pub/Sub listener

2. **Update Subscription:**
   - Sets up `pmessage` listener on Redis listener client
   - Listens for pattern: `get_collection_keys(REDIS_UPDATES_PREFIX)`
   - On message:
     - Parses JSON payload
     - Extracts: `collection_name`, `update_type`, `data`
     - Finds relevant configs matching collection name
     - Calls `parse_redis_snapshot` with update data

**Message Format:**
```typescript
{
  collection_name: string;
  update_type: "add" | "update" | "delete";
  data: TObject<any>; // Document data
}
```

**Example:**
```typescript
await redis_snapshots_bulk([
  {
    collection_name: 'nx-users',
    cache_name: 'users',
    parse_as: 'object',
    subscription_type: 'redis'
  }
]);
```

## Validation

### `validate_config(config: OnSnapshotConfig): Promise<ValidateConfigResult>` (Internal)

Validates if Redis snapshot is possible for a configuration.

**Returns:** Validation result:
- `success: boolean` - Whether Redis snapshot is valid
- `trigger_firebase_snapshot: boolean` - Whether to fallback to Firebase
- `message?: string` - Warning message

**Validation Checks:**
1. **Connection Check:**
   - If Redis commander or listener not connected → fail, trigger Firebase

2. **Subscription Type:**
   - If `subscription_type !== "redis"` → fail, trigger Firebase

3. **Collection Configuration:**
   - Checks `nx-settings.cache_collections_config[collection_name]`
   - If not found → fail, trigger Firebase
   - If `sync_direction === "redis_to_firebase"` → fail, trigger Firebase
   - (Only `firebase_to_redis` direction supports Redis snapshots)

4. **Duplicate Subscription:**
   - Checks if `cache_name` already has subscription
   - If duplicate → fail, don't trigger Firebase (skip)

**Settings Structure:**
```typescript
{
  cache_collections_config: {
    [collectionName: string]: {
      sync_direction: "firebase_to_redis" | "redis_to_firebase";
      // ... other config
    };
  };
}
```

## Snapshot Parsing

### `parse_redis_snapshot(config: OnSnapshotConfig, redis_update?: { update_type: RedisUpdateType; update: TObject<any>[] }): Promise<void>` (Internal)

Parses Redis snapshot data and updates cache.

**Parameters:**
- `config` - Snapshot configuration
- `redis_update` - Optional update data (if provided, processes update; otherwise, initial load)

**Behavior:**
1. **Initial Load (no `redis_update`):**
   - Calls `get_collection_data` to load all documents
   - Applies default parsers based on `parse_as`
   - Calls `on_first_time` callback if provided
   - Calls `extra_parsers` callbacks
   - Logs debug info if enabled

2. **Update Processing (with `redis_update`):**
   - Validates subscription exists (prevents processing unsubscribed collections)
   - Routes to appropriate handler based on `update_type`:
     - `"add"` → calls `on_add` callbacks
     - `"update"` → calls `on_modify` callbacks
     - `"delete"` → calls `on_remove` callbacks
   - Applies default parsers
   - Calls extra parsers
   - Logs debug info if enabled

**Update Types:**
- `"add"` - New document added
- `"update"` - Existing document modified
- `"delete"` - Document deleted

### `default_parsers(parse_as: "array" | "object" | undefined, update: TObject<any>[], config: OnSnapshotConfig): void` (Internal)

Applies default cache parsers based on data shape.

**Parameters:**
- `parse_as` - Data shape: `"array"` or `"object"`
- `update` - Array of documents to process
- `config` - Snapshot configuration

**Behavior:**
- If `parse_as === "object"`: calls `parse_add_update_as_object`
- If `parse_as === "array"`: calls `parse_add_update_as_array`

## Data Loading

### `get_collection_data(collection_name: string): Promise<any[]>` (Internal)

Loads all documents from Redis for a collection.

**Parameters:**
- `collection_name` - Collection name

**Returns:** Promise resolving to array of document objects

**Behavior:**
1. Gets Redis commander client
2. Scans for all keys matching `"{collection}:*"`
3. Uses `MGET` to fetch all values in parallel
4. Parses JSON values
5. Extracts `data` property from each value
6. Converts timestamps using `convert_object_timestamps`
7. Returns array of documents

**Redis Value Format:**
```json
{
  "data": { /* document data */ },
  "timestamp": "...",
  // ... other metadata
}
```

### `convert_object_timestamps(data: TObject<any>): TObject<any>` (Internal)

Recursively converts timestamp-like objects to Firestore Timestamp instances.

**Parameters:**
- `data` - Object to convert

**Returns:** Object with converted timestamps

**Behavior:**
- Recursively traverses object properties
- If value has `_seconds` property → converts to `Timestamp`
- Continues recursion for nested objects

**Timestamp Format:**
```typescript
{
  _seconds: number;
  _nanoseconds?: number;
}
```

## Subscription Tracking

The module maintains `subscription_collections` Set to track which cache names have active subscriptions, preventing duplicate subscriptions.

## Context

This module enables Redis as a live data source:

- **Seamless Integration** - Same interface as Firebase snapshots
- **Automatic Fallback** - Falls back to Firebase when Redis unavailable
- **Real-time Updates** - Pub/Sub for live cache updates
- **Consistent Parsing** - Uses same parsers as Firebase snapshots
- **Configuration-Driven** - Settings determine data source

**Best Practices:**
- Configure `cache_collections_config` in `nx-settings`
- Set `sync_direction: "firebase_to_redis"` for Redis snapshots
- Use `subscription_type: "redis"` in snapshot config
- Handle Redis unavailability gracefully (automatic fallback)
- Monitor subscription status for health checks

**Data Flow:**
1. External service updates Redis → Publishes update message
2. Redis listener receives message → Parses payload
3. `parse_redis_snapshot` called → Updates cache
4. Application reads from cache → Gets latest data

**Firebase Fallback:**
- Triggered when Redis unavailable
- Triggered when collection not configured for Redis
- Uses same cache parsers for consistency
- No code changes needed in application

**Common Patterns:**
```typescript
// Redis snapshot (if available)
await redis_snapshots_bulk([
  {
    collection_name: 'nx-users',
    subscription_type: 'redis',
    parse_as: 'object'
  }
]);

// Falls back to Firebase automatically if Redis fails
```
