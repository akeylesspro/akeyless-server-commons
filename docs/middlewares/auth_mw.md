# src/middlewares/auth_mw.ts

## Purpose

Authentication middleware for Firebase users, NX users, and API clients.

## Dependencies

- Helpers: `verify_token`, `json_failed`, `query_document_optional`, `get_user_by_identifier`
- `logger` manager
- Types: `MW`
- `NxUser`, `Client` from `akeyless-types-commons`

## Exports and behavior

- `verify_user_auth`:
  - Validates Firebase bearer token.
  - Stores decoded user in `req.body.firebase_user`.
  - Responds 403 on failure.
- `nx_user_login`:
  - Validates token and finds NX user by phone/email.
  - Stores user with `full_name` in `req.body.user`.
  - Responds 403 on failure.
- `client_login`:
  - Validates API token against `nx-clients.api_token`.
  - Stores client in `req.body.client`.
  - Responds 403 on failure.

## Context

Used to protect endpoints and to attach authenticated user/client data to the request.
