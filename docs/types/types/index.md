# src/types/types/index.ts

## Purpose

Barrel export file that re-exports all type aliases from the types subdirectory. This file allows importing all types from a single import path.

## Exports

All exports are re-exported from their respective modules:

- **`global`** - Exports from `./global`:
  - `JsonOK<T>`, `JsonFailed` - Response type definitions
  - `MW`, `Service`, `Route` - Express handler types
  - `MainRouter` - Router registration type
  - `AddAuditRecord` - Audit logging function type
  - `LangOptions`, `EntityOptions` - String union types

- **`firebase_types`** - Exports from `./firebase_types`:
  - Query function types (`QueryDocument`, `QueryDocuments`, `QueryDocumentOptional`, etc.)
  - Snapshot types (`OnSnapshotConfig`, `Snapshot`, `SnapshotBulk`, etc.)
  - `WhereCondition` - Firestore where condition interface
  - `InitSnapshotsOptions` - Snapshot initialization options

## Usage

```typescript
// Import all types from barrel export
import { MW, JsonOK, QueryDocument, Snapshot } from 'akeyless-server-commons/types/types';

// Or import specific modules
import { MW, Service } from 'akeyless-server-commons/types/types/global';
import { QueryDocument } from 'akeyless-server-commons/types/types/firebase_types';
```

## Context

This barrel export pattern allows consumers to import multiple types from a single import statement, improving code organization and reducing import complexity.
