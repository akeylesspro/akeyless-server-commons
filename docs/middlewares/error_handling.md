# src/middlewares/error_handling.ts

## Purpose

Async error wrapper and global Express error handler.

## Dependencies

- `logger` manager
- Types: `Service`

## Exports and behavior

- `async_error_handler(service)`:
  - Wraps a service and forwards async errors to Express.
- `error_handler(err, req, res, next)`:
  - Logs stack and returns 500 JSON response.

## Context

Used by server bootstrap to standardize error handling for async routes.
