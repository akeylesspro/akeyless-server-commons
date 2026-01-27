# src/managers/cache_manager.ts

## Purpose

Singleton in-memory cache for arrays and objects by key.

## Exports and behavior

- `CacheManager` class:
  - `getInstance()` returns singleton.
  - `setArrayData(key, data)` and `getArrayData(key)` (defaults to empty array).
  - `setObjectData(key, data)` and `getObjectData(key, default_value?)`.
- `cache_manager`: singleton instance.

## Context

Used across helpers for caching settings, snapshots, and task data.
