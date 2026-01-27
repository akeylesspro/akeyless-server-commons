# src/helpers/tasks_helpers.ts

## Purpose

Task execution orchestration with status tracking, caching, and optional storage persistence.

## Dependencies

- `cache_manager`, `logger`
- Firebase helpers: `set_document`, `get_document_by_id_optional`
- Firebase Admin `storage`
- Types from `akeyless-types-commons`

## Exports and behavior

- `TaskName` enum: named recurring tasks.
- `TaskStatus` enum: running/completed/failed/suspended.
- `TaskSaveOptions`: `storage` | `db` | `none`.
- `execute_task(source, task_name, task, options?)`:
  - Writes "running" status to `nx-tasks`.
  - Executes task and saves data to cache, Firestore, or Storage.
  - Updates `nx-tasks` with completion or failure info.
- `get_task_data(task_name)`:
  - Reads cache first.
  - Falls back to Firestore and Storage (if URL stored).
  - Caches fetched data.
- `get_task_data_from_storage(task_name)`:
  - Reads JSON file from Firebase Storage.
- `keep_task_data_in_storage(task_name, data)`:
  - Writes JSON to Firebase Storage and returns signed URL.

## Context

Used for scheduled/recurring backend tasks with persisted output and cache acceleration.
