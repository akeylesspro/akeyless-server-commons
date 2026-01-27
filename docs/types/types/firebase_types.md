# src/types/types/firebase_types.ts

## Purpose

Type definitions for Firestore queries and snapshot subscription flow.

## Exports

- Query helpers:
  - `QueryDocuments`, `QueryDocumentsByConditions`
  - `QueryDocument`, `QueryDocumentOptional`
  - `QueryDocumentByConditions`
  - `WhereCondition`
- Snapshot types:
  - `OnSnapshotCallback`
  - `OnSnapshotParsers`
  - `ExtraSnapshotConfig`
  - `OnSnapshotConfig`
  - `Snapshot`, `SnapshotBulk`
  - `SnapshotBulkByNames` and related param/options types
  - `InitSnapshotsOptions`

## Context

These types underpin Firebase helpers and Redis snapshot orchestration, ensuring consistent config shapes and callbacks.
