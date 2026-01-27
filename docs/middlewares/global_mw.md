# src/middlewares/global_mw.ts

## Purpose

Validation middleware for mandatory/optional parameters and request logging utilities.

## Dependencies

- `json_failed` from helpers for error responses.
- Types: `MandatoryObject`, `MandatoryParams`, `LogRequests`, `MW`, `Route`, `Service`.
- `logger` manager.

## Exports and behavior

- `mandatory({ body, headers })`:
  - Enforces presence, type, min-length, and object required keys.
  - Responds with `json_failed` on validation error.
- `optional({ body, headers })`:
  - Applies the same validation rules but only if parameters exist.
- `request_logger(log_requests)`:
  - Conditionally logs URL, headers, query, and body based on flags.

## Internal logic

`validateParameter` validates:
- requiredness
- type (string/number/boolean/object/array)
- length constraints for strings and arrays
- array element types
- required object keys and non-empty values

## Context

Used to standardize input validation and optional request logging across Express routes.
