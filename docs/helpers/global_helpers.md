# src/helpers/global_helpers.ts

## Purpose

General-purpose server utilities: env validation, JSON response helpers, URL mapping, geocoding, type guards, trimming, and HTTP helpers.

## Dependencies

- `fs.readFileSync` for package version reads.
- `axios` and `https` for HTTP calls.
- `cache_manager`, `logger` from `src/managers`.
- Types from `src/types` and `akeyless-types-commons`.

## Exports and behavior

- `init_env_variables(required_vars?)`: validates required env vars, logs and exits on missing, returns all env vars as string map.
- `json_ok(data)`: returns `{ success: true, data }`.
- `json_failed(error, msg?)`: returns `{ success: false, error, msg }` with normalized error text.
- `parse_error(error)`: normalizes `Error` instances into `{ name, message }`.
- `get_version(packageJsonPath)`: reads package.json and returns its `version`.
- `sleep(ms?)`: promise-based delay (default 2500ms).
- `get_nx_service_urls(env_name?)`: resolves service base URLs by env (`prod`, `qa`, `local`).
- `get_address_by_geo({lat,lng}, language)`: Google Geocode lookup using cached `nx-settings` API key and language mapping; returns short address or empty string.
- `validate_and_cast<T>(variable, condition)`: TypeScript predicate helper.
- `get_or_default(value, default_value)`: returns value or computed default.
- `trim_strings(input)`: recursively trims strings in objects/arrays, preserves Date/RegExp/Map/Set.
- `remove_nulls_and_undefined(obj)`: removes `null`/`undefined` entries.
- `ignore_ssl_request(config)`: for `qa` mode, disables SSL verification before `axios` call.

## Context

Used across helpers and middlewares for consistent error shapes, env bootstrapping, and data normalization.
