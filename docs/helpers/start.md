# src/helpers/start.ts

## Purpose

Express server bootstrap with common middleware, logging, error handling, and optional Redis initialization.

## Dependencies

- `express`, `cors`
- `logger` manager
- `init_env_variables`, `init_snapshots`
- Middlewares: `error_handler`, `request_logger`, `trim_body_middleware`
- Redis initializer: `init_redis`
- Types: `AppOptions`, `MainRouter`, `LogRequests`

## Exports and behavior

- `start_server(main_router, project_name, version, options?)`:
  - Initializes Express app.
  - Loads env variables (expects `mode` and `port`).
  - Applies CORS, JSON, URL-encoded, trim, request logger.
  - Installs provided `main_router`.
  - Adds global `error_handler`.
  - Starts server and optionally initializes Redis.
  - Resolves with the running `Express` app.
- `basic_init(main_router, project_name, version, options?)`:
  - Calls `start_server`.
  - Initializes snapshots via `init_snapshots`.
  - Exits process on failure.

## Context

Used by services to standardize boot flow and ensure caches are populated early.
