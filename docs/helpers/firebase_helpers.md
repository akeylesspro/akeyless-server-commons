# src/helpers/firebase_helpers.ts

## Purpose

Initialize Firebase Admin SDK and provide Firestore/Storage helpers, snapshot subscriptions, audit logging, and cached settings access.

## Dependencies

- `firebase-admin` for auth, firestore, messaging, storage.
- `dotenv` and `init_env_variables` for service account bootstrap.
- Managers: `cache_manager`, `logger`, `translation_manager`.
- Redis snapshot integration: `redis_snapshots_bulk`.
- Types from `src/types`.

## Initialization

- Reads required service account env vars and builds `service_account_firebase`.
- Initializes Firebase Admin app and exports `db`, `messaging`, `auth`, `storage`.

## Firestore CRUD helpers

- `simple_extract_data(doc)`: merges `doc.data()` with `id`.
- `get_all_documents(collection_path)`: fetches all documents.
- `query_documents(...)`: single where clause returning array.
- `query_documents_by_conditions(...)`: multiple where clauses returning array.
- `query_document_by_conditions(...)`: multiple where clauses returning single document or error.
- `query_document(...)`: single where clause returning first doc or error.
- `query_document_optional(...)`: single where clause returning first doc or null.
- `get_document_by_id(...)`: returns doc by id or throws.
- `get_document_by_id_optional(...)`: returns doc by id or null.
- `set_document(collection, doc_id, data, merge?)`: creates/merges.
- `add_document(collection, data, include_id?, custom_id?)`: adds doc and returns id.
- `delete_document(collection, doc_id)`: deletes doc.

## Auth helper

- `verify_token(authorization)`: validates bearer token using Firebase auth.

## Snapshot parsers

- Translation parsers update `translation_manager` cache.
- Settings parsers update `cache_manager`.
- Generic parsers for object/array caches:
  - `parse_add_update_as_object`, `parse_delete_as_object`
  - `parse_add_update_as_array`, `parse_delete_as_array`

## Snapshot orchestration

- `snapshot(config)`: Firestore snapshot listener with:
  - first-time bootstrap,
  - incremental updates,
  - exponential backoff on failure,
  - boot-safety resolution to avoid deadlocks.
- `init_snapshots(options?)`: common snapshots for settings and translations.
- `snapshot_bulk(promises, label?)`: logs duration across multiple snapshots.
- `get_default_parsers(parse_as)`: default parser set by data shape.
- `snapshot_bulk_by_names(params, options?)`: orchestrates Firebase + Redis snapshot subscriptions.

## Audit and storage helpers

- `add_audit_record(action, entity, details, user?)`: writes to `nx-audit`.
- `save_file_in_storage(file_path, buffer, options?)`: saves file and returns signed URL.
- `get_file_url_from_storage(file_path)`: reads and returns signed URL.
- `get_nx_settings()`: cached settings from Firestore (`nx-settings`).

## Context

This is the central integration point for Firestore data access and caching. Helpers and middlewares rely on these exports for auth, settings, and notifications.
