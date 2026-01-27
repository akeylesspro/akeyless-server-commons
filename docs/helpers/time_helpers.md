# src/helpers/time_helpers.ts

## Purpose

Time conversion and formatting helpers for Firebase timestamps, Dates, and string inputs.

## Dependencies

- `moment` and `moment-timezone`
- Firebase `Timestamp`
- `firebase_timestamp` type from `akeyless-types-commons`

## Exports and behavior

- `sort_by_timestamp(a, b, reverse?)`: comparator based on milliseconds.
- `calculate_time_passed(datetime)`: returns elapsed time fields and formatted strings.
- `any_datetime_to_string(value, options?)`:
  - Accepts `Timestamp`, `Date`, string, number, or `firebase_timestamp`.
  - Supports input format, output format, timezone, and default fallback.
- `any_datetime_to_millis(value, options?)`:
  - Converts supported inputs to milliseconds with fallback.
- `timestamp_to_string(firebase_timestamp, format?)`: legacy conversion using Firebase `Timestamp`.
- `timestamp_to_millis(firebase_timestamp)`: legacy conversion to millis.

## Context

Used by services that work with Firebase timestamps and need consistent display and sorting logic.
