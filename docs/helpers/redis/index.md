# src/helpers/redis/index.ts

## Purpose

Barrel export file that re-exports all Redis helper modules for convenient importing. Provides a single entry point for accessing Redis initialization, key utilities, and snapshot functionality.

## Exports

- **`initialize`** - Redis client initialization with dual-client architecture (commander/listener), connection management, retry logic, and automatic Pub/Sub subscription setup
- **`keys`** - Redis key and pattern utilities for building consistent key names, collection patterns, update channels, and key scanning operations using SCAN command
- **`snapshot`** - Redis Pub/Sub snapshot integration with automatic fallback to Firebase snapshots, providing the same cache parsing interface as Firebase snapshots for seamless data source switching

## Usage

```typescript
// Import all Redis helpers
import { init_redis, get_redis_commander, get_doc_key, redis_snapshots_bulk } from 'akeyless-server-commons/helpers/redis';

// Or import specific modules
import { init_redis } from 'akeyless-server-commons/helpers/redis/initialize';
import { get_doc_key } from 'akeyless-server-commons/helpers/redis/keys';
```

## Context

This barrel export provides convenient access to all Redis-related functionality. The Redis helpers work together to provide:

- **Dual-Client Architecture** - Separate clients for commands and subscriptions
- **Key Management** - Consistent key naming and pattern matching
- **Snapshot Integration** - Real-time cache updates via Redis Pub/Sub with Firebase fallback
