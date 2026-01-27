# src/helpers/redis

## Contents

This directory contains Redis integration helpers for cache hydration and live updates using Redis Pub/Sub while preserving compatibility with Firebase snapshot flows.

- **`index.ts`** - Barrel export file that re-exports all Redis helper modules for convenient importing

- **`initialize.ts`** - Redis client initialization with dual-client architecture (commander for read/write, listener for Pub/Sub), connection management, retry logic, and automatic subscription setup. Provides connection status flags and accessor functions for both clients.

- **`keys.ts`** - Redis key and pattern utilities for building consistent key names, collection patterns, update channels, and key scanning operations using SCAN command. Ensures consistent key naming across the application.

- **`snapshot.ts`** - Redis Pub/Sub snapshot integration with automatic fallback to Firebase snapshots. Provides the same cache parsing interface as Firebase snapshots for seamless data source switching. Validates configurations, loads initial data from Redis, and subscribes to update channels.

## Context

Redis helpers allow cache hydration and live updates using Redis Pub/Sub while preserving compatibility with <a href="../firebase_helpers.html">Firebase snapshot</a> flows. The Redis integration provides:

- **Dual-Client Architecture** - Separate clients for commands and subscriptions (Redis clients in subscriber mode cannot execute regular commands)
- **Automatic Fallback** - Falls back to Firebase when Redis unavailable or unsupported
- **Real-time Updates** - Pub/Sub for live cache updates
- **Consistent Interface** - Same parsing interface as Firebase snapshots
- **Configuration-Driven** - Settings determine data source

## Usage Patterns

### Initialization

```typescript
import { init_redis } from 'akeyless-server-commons/helpers/redis';

// Initialize during server startup
await init_redis();
```

### Key Operations

```typescript
import { get_doc_key, get_collection_keys, scan_redis_keys } from 'akeyless-server-commons/helpers/redis/keys';
import { get_redis_commander } from 'akeyless-server-commons/helpers/redis/initialize';

const commander = get_redis_commander();

// Build document key
const key = get_doc_key('nx-users', 'user-123');
await commander.set(key, JSON.stringify(userData));

// Scan collection
const pattern = get_collection_keys('nx-users');
const keys = await scan_redis_keys(pattern, commander);
```

### Snapshot Integration

```typescript
import { redis_snapshots_bulk } from 'akeyless-server-commons/helpers/redis/snapshot';

await redis_snapshots_bulk([
  {
    collection_name: 'nx-users',
    cache_name: 'users',
    parse_as: 'object',
    subscription_type: 'redis'
  }
]);
```

## Best Practices

- Always call `init_redis()` during server startup
- Check connection flags before using Redis operations
- Handle Redis unavailability gracefully (automatic fallback)
- Use commander for all read/write operations
- Don't use listener for regular commands
- Configure `cache_collections_config` in `nx-settings` for Redis snapshots
