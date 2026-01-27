# src/helpers/redis/keys.ts

## Purpose

Redis key/pattern utilities and a SCAN helper.

## Dependencies

- `ioredis`
- `REDIS_UPDATES_PREFIX` from `akeyless-types-commons`

## Exports and behavior

- `get_doc_key(collection, doc_id)`: builds `collection:doc_id`.
- `get_collection_keys(collection)`: builds `collection:*` pattern.
- `get_channel(...args)`: builds update channel with `REDIS_UPDATES_PREFIX`.
- `scan_redis_keys(pattern, redis_publisher)`:
  - Iteratively scans with `MATCH`/`COUNT`.
  - Returns all matching keys.

## Context

Used by snapshot logic to locate keys and subscribe to update channels.
