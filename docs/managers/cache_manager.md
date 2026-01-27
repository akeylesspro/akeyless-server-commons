# src/managers/cache_manager.ts

## Purpose

Singleton in-memory cache manager for storing arrays and objects by key. Provides fast access to frequently accessed data that is populated by Firebase snapshots or Redis subscriptions. Data persists for the lifetime of the server process.

## Architecture

### Singleton Pattern

The `CacheManager` uses the singleton pattern to ensure a single shared cache instance across the entire application. This provides:
- Consistent data access
- Memory efficiency (single cache instance)
- Thread-safe access (Node.js single-threaded event loop)

### Data Storage

The cache stores data in a single object (`data`) that can contain both arrays and objects:
- Array data: `data[key] = [item1, item2, ...]`
- Object data: `data[key] = { id1: item1, id2: item2, ... }`

## Exports and behavior

### `CacheManager` Class

Singleton class for cache management.

#### `getInstance(): CacheManager`

Returns the singleton instance of CacheManager.

**Returns:** `CacheManager` instance

**Behavior:**
- Creates instance on first call
- Returns same instance on subsequent calls
- Thread-safe in Node.js (single-threaded)

**Example:**
```typescript
const manager = CacheManager.getInstance();
```

#### `setArrayData(key: string, data: any[]): void`

Stores an array in the cache.

**Parameters:**
- `key` - Cache key (string identifier)
- `data` - Array to store

**Behavior:**
- Stores array directly under key
- Overwrites existing data if key exists
- No validation (can store any array)

**Example:**
```typescript
cache_manager.setArrayData('users', [
  { id: '1', name: 'John' },
  { id: '2', name: 'Jane' }
]);
```

#### `getArrayData(key: string): any[]`

Retrieves an array from the cache.

**Parameters:**
- `key` - Cache key

**Returns:** Array stored under key, or empty array `[]` if not found

**Behavior:**
- Returns cached array if exists
- Returns empty array if key doesn't exist
- Never returns `null` or `undefined`

**Example:**
```typescript
const users = cache_manager.getArrayData('users');
// Returns: [{ id: '1', name: 'John' }, ...] or []

if (users.length > 0) {
  // Process users
}
```

#### `setObjectData(key: string, data: any): void`

Stores an object in the cache.

**Parameters:**
- `key` - Cache key
- `data` - Object to store (can be any type, not just plain objects)

**Behavior:**
- Stores data directly under key
- Overwrites existing data if key exists
- No validation (can store any value)

**Example:**
```typescript
// Store settings object
cache_manager.setObjectData('nx-settings', {
  emails: { sendgrid_api_key: '...' },
  sms_provider: { ... }
});

// Store nested object
cache_manager.setObjectData('settings', {
  'setting-1': { value: 'A' },
  'setting-2': { value: 'B' }
});
```

#### `getObjectData(key: string, default_value: any = null): any`

Retrieves an object from the cache.

**Parameters:**
- `key` - Cache key
- `default_value` - Value to return if key doesn't exist (default: `null`)

**Returns:** Cached value or `default_value` if not found

**Behavior:**
- Returns cached value if exists
- Returns `default_value` if key doesn't exist
- Can return any type (object, array, primitive, etc.)

**Example:**
```typescript
// Get settings
const settings = cache_manager.getObjectData('nx-settings');
// Returns: { emails: {...}, ... } or null

// Get with default
const config = cache_manager.getObjectData('config', {});
// Returns: cached config or {} if not found

// Safe access pattern
const settings = cache_manager.getObjectData('nx-settings', {});
const apiKey = settings.emails?.sendgrid_api_key;
```

### `cache_manager: CacheManager`

Exported singleton instance for direct use.

**Usage:**
```typescript
import { cache_manager } from 'akeyless-server-commons/managers';

// Use directly
cache_manager.setArrayData('key', []);
const data = cache_manager.getArrayData('key');
```

## Common Patterns

### Array Cache Pattern

Used for collections that are accessed as arrays:

```typescript
// Populate from snapshot
cache_manager.setArrayData('users', usersArray);

// Access
const users = cache_manager.getArrayData('users');
const user = users.find(u => u.id === '123');
```

### Object Cache Pattern

Used for collections accessed by ID:

```typescript
// Populate from snapshot (keyed by ID)
const usersObject = {
  'user-1': { id: 'user-1', name: 'John' },
  'user-2': { id: 'user-2', name: 'Jane' }
};
cache_manager.setObjectData('users', usersObject);

// Access
const users = cache_manager.getObjectData('users', {});
const user = users['user-1'];
```

### Settings Pattern

Common pattern for settings objects:

```typescript
// Settings are typically objects
const settings = cache_manager.getObjectData('nx-settings', {});
const apiKey = settings.emails?.sendgrid_api_key;

// Safe access with defaults
const smsConfig = cache_manager.getObjectData('sms_provider', {
  multisend: { user: '', password: '', from: '' }
});
```

## Cache Population

Cache is populated by:

1. **Firebase Snapshots** - Real-time Firestore listeners update cache
2. **Redis Snapshots** - Redis Pub/Sub updates cache
3. **Task Results** - Task helpers save results to cache
4. **Manual Updates** - Application code can update cache directly

**Typical Flow:**
1. Server starts → Snapshots initialize
2. Snapshots load data → Populate cache
3. Application reads from cache → Fast access
4. Snapshots receive updates → Cache updated automatically

## Context

The cache manager is central to application performance:

- **Fast Access** - In-memory access (no database queries)
- **Real-time Updates** - Updated by snapshots automatically
- **Flexible Storage** - Supports both arrays and objects
- **Singleton Pattern** - Single shared instance
- **Simple API** - Easy to use get/set methods

**Best Practices:**
- Use array cache for collections accessed sequentially
- Use object cache for collections accessed by ID
- Always provide default values for object access
- Don't mutate cached arrays/objects directly (create copies)
- Cache is process-local (not shared across instances)

**Performance Considerations:**
- Cache is in-memory (very fast)
- No serialization overhead
- Memory usage depends on data size
- Cache persists until server restart
- Consider memory limits for large datasets

**Common Use Cases:**
- Settings and configuration
- User and device data
- Translation data
- Task results
- Frequently accessed collections

**Limitations:**
- Data lost on server restart
- Not shared across server instances
- Memory usage grows with data size
- No expiration or TTL (data persists until overwritten)
