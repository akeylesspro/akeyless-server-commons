# src/helpers/login_helpers.ts

## Purpose

User lookup helpers for NX users and mobile app users based on identifiers.

## Dependencies

- `query_document_optional` from `firebase_helpers`
- `logger` manager (imported, not used)
- Types from `akeyless-types-commons`

## Exports and behavior

- `convert_to_short_phone_number(phone_number)`: converts `+972` to local `0` prefix.
- `get_user_by_identifier(identifier, ignore_log?)`:
  - If identifier looks like email, query `nx-users` by `email`.
  - Otherwise query by `phone_number` using both long and short formats.
- `get_mobile_app_user_by_uid(uid, ignore_log?)`:
  - Queries `mobile_users_app_pro` by `uid`.

## Context

Used by auth middleware and services that need to resolve users from tokens or identifiers.
