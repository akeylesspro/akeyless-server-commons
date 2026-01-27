# src/helpers/redis/keys.ts

## Purpose

Redis key and pattern utilities for building consistent key names and channel names. Provides helpers for document keys, collection patterns, update channels, and key scanning operations.

## Dependencies

- `ioredis` - Redis client library
- `REDIS_UPDATES_PREFIX` - Prefix constant from `akeyless-types-commons` for update channels

## Key Building

### `get_key(...args: string[]): string` (Internal)

Joins key parts with colon separator.

**Parameters:**
- `args` - Variable number of string arguments

**Returns:** Colon-separated key string

**Example:**
```typescript
get_key('collection', 'doc-id'); // 'collection:doc-id'
get_key('a', 'b', 'c'); // 'a:b:c'
```

## Document and Collection Keys

### `get_doc_key(collection: string, doc_id: string): string`

Builds a Redis key for a specific document.

**Parameters:**
- `collection` - Collection name
- `doc_id` - Document ID

**Returns:** Redis key in format `"{collection}:{doc_id}"`

**Example:**
```typescript
get_doc_key('nx-users', 'user-123');
// Returns: 'nx-users:user-123'
```

**Usage:**
- Used for storing individual document data in Redis
- Format: `collection:document_id`

### `get_collection_keys(collection: string): string`

Builds a Redis key pattern for all documents in a collection.

**Parameters:**
- `collection` - Collection name

**Returns:** Redis pattern in format `"{collection}:*"`

**Example:**
```typescript
get_collection_keys('nx-users');
// Returns: 'nx-users:*'
```

**Usage:**
- Used for pattern matching in SCAN operations
- Used for Pub/Sub subscription patterns
- Matches all keys starting with `"{collection}:"`

## Channel Names

### `get_channel(...args: string[]): string`

Builds a Redis Pub/Sub channel name with update prefix.

**Parameters:**
- `args` - Variable number of string arguments

**Returns:** Channel name in format `"{REDIS_UPDATES_PREFIX}:{args.join(':')}"`

**Example:**
```typescript
get_channel('nx-users', 'user-123');
// Returns: '{REDIS_UPDATES_PREFIX}:nx-users:user-123'

get_channel('collection', 'action');
// Returns: '{REDIS_UPDATES_PREFIX}:collection:action'
```

**Usage:**
- Used for Pub/Sub update channels
- Prefix ensures update channels are namespaced
- Format: `{prefix}:collection:document` or `{prefix}:collection:action`

## Key Scanning

### `scan_redis_keys(pattern: string, redis_publisher: Redis): Promise<string[]>`

Scans Redis for all keys matching a pattern using SCAN command.

**Parameters:**
- `pattern` - Redis key pattern (supports `*` wildcard)
- `redis_publisher` - Redis client instance (commander)

**Returns:** Promise resolving to array of matching key strings

**Behavior:**
1. Starts with cursor `"0"`
2. Iteratively calls `SCAN` with:
   - Current cursor
   - `MATCH` pattern
   - `COUNT 100` (processes 100 keys per iteration)
3. Accumulates keys from each iteration
4. Continues until cursor returns to `"0"` (scan complete)
5. Returns all found keys

**SCAN Command:**
- Non-blocking alternative to `KEYS` command
- Safe for production use (doesn't block Redis)
- Processes keys in batches
- May return duplicate keys (client should deduplicate if needed)

**Example:**
```typescript
const commander = get_redis_commander();
const keys = await scan_redis_keys('nx-users:*', commander);
// Returns: ['nx-users:user-1', 'nx-users:user-2', ...]

// Get all keys in collection
const collectionKeys = await scan_redis_keys(
  get_collection_keys('nx-users'),
  commander
);
```

**Performance Notes:**
- More efficient than `KEYS` for large datasets
- Processes 100 keys per iteration (configurable via COUNT)
- May take multiple iterations for large collections
- Consider caching results for frequently accessed patterns

## Key Naming Conventions

### Document Keys
- Format: `{collection}:{document_id}`
- Example: `nx-users:user-123`
- Used for individual document storage

### Collection Patterns
- Format: `{collection}:*`
- Example: `nx-users:*`
- Used for pattern matching and scanning

### Update Channels
- Format: `{REDIS_UPDATES_PREFIX}:{collection}:{document_id}`
- Example: `{prefix}:nx-users:user-123`
- Used for Pub/Sub notifications

## Context

These utilities ensure consistent key naming across the application:

- **Consistency** - All keys follow the same pattern
- **Namespacing** - Collections are clearly separated
- **Pattern Matching** - Easy to find related keys
- **Pub/Sub** - Update channels are properly namespaced

**Best Practices:**
- Always use these helpers instead of manual string concatenation
- Use `get_doc_key` for document operations
- Use `get_collection_keys` for pattern matching
- Use `get_channel` for Pub/Sub channels
- Use `scan_redis_keys` instead of `KEYS` command

**Common Patterns:**
```typescript
// Store document
const key = get_doc_key('nx-users', 'user-123');
await commander.set(key, JSON.stringify(userData));

// Get all documents in collection
const pattern = get_collection_keys('nx-users');
const keys = await scan_redis_keys(pattern, commander);
const values = await commander.mget(...keys);

// Subscribe to updates
const channel = get_channel('nx-users', 'user-123');
await listener.subscribe(channel);
```
