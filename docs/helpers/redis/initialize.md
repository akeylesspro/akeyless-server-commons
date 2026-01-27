# src/helpers/redis/initialize.ts

## Purpose

Initialize Redis commander and listener clients with connection management, retry logic, and Pub/Sub subscription setup. Uses a dual-client architecture: commander for read/write operations and listener for subscribing to update channels.

## Dependencies

- `ioredis` - Redis client library for Node.js
- `init_env_variables` - Environment variable validation
- `logger` - Logging manager
- `get_collection_keys` - Redis key pattern helper
- `REDIS_UPDATES_PREFIX` - Prefix constant from `akeyless-types-commons`

## Architecture

### Dual Client Pattern

The module creates two separate Redis clients:

1. **Commander Client** (`redis_commander`):
   - Used for read/write operations (GET, SET, MGET, SCAN, etc.)
   - Can respond to PING commands
   - Used by snapshot loading and cache operations

2. **Listener Client** (`redis_listener`):
   - Used exclusively for Pub/Sub subscriptions
   - Cannot respond to PING commands (subscriber mode)
   - Listens for collection update events

**Why Two Clients?**
- Redis clients in subscriber mode cannot execute regular commands
- Separating concerns allows both subscription and command execution

## Exports and behavior

### `redis_commander_connected: boolean`

Connection status flag for commander client. Updated automatically on connect/disconnect events.

### `redis_listener_connected: boolean`

Connection status flag for listener client. Updated automatically on connect/disconnect events.

### `init_redis(): Promise<void>`

Initializes both Redis clients and sets up Pub/Sub subscription.

**Returns:** Promise resolving when both clients are connected and listener is subscribed

**Behavior:**
1. **Idempotency:**
   - Returns immediately if already initialized
   - Prevents multiple initializations

2. **Client Creation:**
   - Creates commander client via `create_redis_instance("commander")`
   - Creates listener client via `create_redis_instance("listener")`
   - Sets `redis_initialized` flag

3. **Connection Tracking:**
   - Tracks `commander_ready` and `listener_ready` flags
   - Tracks `listener_subscribed` flag to prevent duplicate subscriptions

4. **Commander Connection:**
   - Waits for `connect` event
   - Sets `commander_ready = true`
   - Checks if both clients ready

5. **Listener Connection:**
   - Waits for `connect` event
   - Sets `listener_ready = true`
   - **Subscription Setup:**
     - Only subscribes once (on first connect)
     - Uses pattern subscription: `get_collection_keys(REDIS_UPDATES_PREFIX)`
     - Pattern format: `"{REDIS_UPDATES_PREFIX}:*"`
     - ioredis automatically resubscribes on reconnection
   - Checks if both clients ready

6. **Resolution:**
   - Resolves promise when both clients are ready
   - Allows server to continue startup

7. **Timeout Handling:**
   - 5-second timeout for connection
   - If timeout expires, resolves anyway (fail-open)
   - Logs warning but doesn't block startup

8. **Error Handling:**
   - Rejects promise only if both clients fail before timeout
   - Individual client errors don't block resolution
   - Errors are logged but don't prevent startup

**Example:**
```typescript
try {
  await init_redis();
  console.log('Redis initialized');
} catch (error) {
  console.error('Redis initialization failed', error);
}
```

### `get_redis_commander(): Redis`

Returns the commander Redis client instance.

**Returns:** ioredis Redis client instance

**Throws:** `Error("Redis commander not initialized. Call init_redis() first.")` if not initialized

**Example:**
```typescript
const commander = get_redis_commander();
const value = await commander.get('key');
await commander.set('key', 'value');
```

### `get_redis_listener(): Redis`

Returns the listener Redis client instance.

**Returns:** ioredis Redis client instance

**Throws:** `Error("Redis listener not initialized. Call init_redis() first.")` if not initialized

**Note:** Listener is typically accessed internally by snapshot helpers, not directly by application code.

## Internal Functions

### `create_redis_instance(role: "commander" | "listener"): Redis` (Internal)

Creates a Redis client instance with appropriate configuration.

**Parameters:**
- `role` - Client role: `"commander"` or `"listener"`

**Returns:** Configured ioredis Redis client

**Configuration:**
- **Base Config (both roles):**
  - `host` - From `process.env.redis_ip` (required)
  - `lazyConnect: true` - Don't connect immediately
  - `enableOfflineQueue: false` - Don't queue commands when offline
  - `maxRetriesPerRequest: 0` - Don't retry failed commands automatically
  - `reconnectOnError: () => false` - Don't auto-reconnect on errors
  - `retryStrategy` - Custom retry logic (max 2 attempts)

- **Listener-Specific:**
  - `enableReadyCheck: false` - Required for subscriber mode (can't respond to PING)

**Retry Strategy:**
- Maximum 2 retry attempts
- 1-second delay between retries
- Logs warnings on retry
- Returns `null` after max attempts (stops retrying)
- Logs error on final failure

**Event Handlers:**
- `connect` - Logs success, updates connection flags
- `error` - Logs errors
- `close` - Logs warning, updates connection flags
- `end` - Logs warning, updates connection flags

**Connection:**
- Calls `client.connect()` asynchronously
- Logs errors but doesn't throw (handled by promise)

## Environment Variables

### Required

- `redis_ip` - Redis server IP address or hostname

**Example:**
```bash
redis_ip=192.168.1.100
# or
redis_ip=redis.example.com
```

## Connection Lifecycle

1. **Initialization:**
   - `init_redis()` called
   - Clients created with `lazyConnect: true`
   - `connect()` called asynchronously

2. **Connection:**
   - Clients attempt connection to `redis_ip`
   - On success: `connect` event fired, flags updated
   - On failure: Retry up to 2 times

3. **Subscription:**
   - Listener subscribes to update pattern
   - Pattern: `"{REDIS_UPDATES_PREFIX}:*"`

4. **Runtime:**
   - Commander used for read/write operations
   - Listener receives Pub/Sub messages
   - Auto-reconnection handled by ioredis

5. **Disconnection:**
   - `close` or `end` events fired
   - Connection flags updated
   - ioredis attempts reconnection automatically

## Error Handling

- **Connection Failures:**
  - Retries up to 2 times
  - Logs errors but doesn't throw
  - Server continues without Redis (fail-open)

- **Initialization Timeout:**
  - 5-second timeout
  - Resolves promise even if not connected
  - Allows server to start without Redis

- **Runtime Errors:**
  - Logged but don't crash server
  - Connection flags updated
  - ioredis handles reconnection

## Context

This module provides the foundation for Redis integration:

- **Dual Client Architecture** - Separates commands from subscriptions
- **Fail-Open Design** - Server continues even if Redis unavailable
- **Automatic Reconnection** - ioredis handles reconnection automatically
- **Connection Status** - Exported flags for health checks
- **Pub/Sub Setup** - Automatic subscription to update channels

**Best Practices:**
- Always call `init_redis()` during server startup
- Check connection flags before using Redis operations
- Handle Redis unavailability gracefully
- Use commander for all read/write operations
- Don't use listener for regular commands

**Common Patterns:**
```typescript
// Initialize during startup
await init_redis();

// Check connection before use
if (redis_commander_connected) {
  const commander = get_redis_commander();
  await commander.set('key', 'value');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    redis_commander: redis_commander_connected,
    redis_listener: redis_listener_connected
  });
});
```
