# src/managers/logger_manager.ts

## Purpose

Singleton logger with timestamped logs, table formatting, and Axios-aware error handling.

## Dependencies

- `moment-timezone` for timestamping.
- `axios` for error detection.
- `parse_error` helper for safe serialization.

## Exports and behavior

- `LoggerManager` singleton:
  - `log(msg, data?)`:
    - Formats timestamp in `Asia/Jerusalem`.
    - Uses `console.table` when data is a suitable array of objects.
  - `error(msg, data?)`:
    - Special handling for Axios errors.
    - Serializes errors via `parse_error`.
  - `warn(msg, data?)`:
    - Standard warning output.
- `logger`: singleton instance.

## Context

Used throughout helpers/middlewares for consistent logging behavior.
