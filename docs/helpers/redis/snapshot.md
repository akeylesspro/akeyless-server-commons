# src/helpers/redis/snapshot.ts

## Purpose

Consume Redis Pub/Sub updates and hydrate cache using Redis data, with Firebase snapshot fallback when Redis is unavailable or unsupported.

## Dependencies

- Redis helpers: `get_redis_commander`, `get_redis_listener`, connection flags.
- Firebase snapshot helpers: `snapshot`, parsers, `get_nx_settings`.
- `get_collection_keys`, `scan_redis_keys`.
- `logger`, Firestore `Timestamp`, types from `akeyless-types-commons`.

## Exports and behavior

- `redis_snapshots_bulk(configs)`:
  - Validates each config (connectivity, subscription type, settings).
  - If valid, hydrates cache from Redis and subscribes to updates.
  - If invalid, triggers Firebase snapshot (when appropriate).
  - Listens for Redis `pmessage` events and applies parsers.

## Internal flow

- `validate_config(config)`:
  - Ensures Redis connections exist.
  - Ensures subscription type is `redis`.
  - Checks `nx-settings.cache_collections_config` for collection.
  - Prevents duplicate subscriptions per cache name.
- `parse_redis_snapshot(config, redis_update?)`:
  - On first time: load Redis collection and apply parsers.
  - On updates: apply add/update/delete logic with parsers.
- `default_parsers(parse_as, update, config)`:
  - Uses `parse_add_update_as_object/array` depending on `parse_as`.
- `get_collection_data(collection_name)`:
  - Scans Redis keys, loads JSON values, converts timestamps.
- `convert_object_timestamps(data)`:
  - Recursively replaces timestamp-like objects with Firestore `Timestamp`.

## Context

Allows Redis to be the live data source while keeping the same cache parsing behavior as Firebase snapshots.
