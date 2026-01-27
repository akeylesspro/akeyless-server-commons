# src/helpers/redis/initialize.ts

## Purpose

Initialize Redis commander and listener clients with retry logic and Pub/Sub subscription setup.

## Dependencies

- `ioredis`
- `init_env_variables` for `redis_ip`
- `logger`
- `get_collection_keys` and `REDIS_UPDATES_PREFIX` for subscription pattern

## Exports and behavior

- `redis_commander_connected`, `redis_listener_connected`: connection flags.
- `init_redis()`:
  - Creates commander and listener clients.
  - Subscribes listener to updates pattern.
  - Resolves on readiness or after timeout (fails open).
- `get_redis_commander()`, `get_redis_listener()`:
  - Accessors that throw if not initialized.

## Context

Used by snapshot helpers to read collections and subscribe to update events without blocking service startup.
