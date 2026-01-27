# src/helpers/redis

## Contents

- `index.ts`: barrel exports.
- `initialize.ts`: Redis clients for commander/listener with retry and subscription bootstrap.
- `keys.ts`: key/pattern helpers and scan.
- `snapshot.ts`: Redis-backed snapshot syncing into cache with Firebase fallback.

## Context

Redis helpers allow cache hydration and live updates using Redis Pub/Sub while preserving compatibility with Firebase snapshot flows.
