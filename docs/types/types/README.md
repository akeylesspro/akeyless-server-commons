# src/types/types

## Overview

The types subdirectory contains TypeScript type aliases for HTTP responses, Express middleware, route handlers, Firebase operations, and application-level helper functions. These types provide the foundation for type safety across all modules in the package.

## Contents

### `global.ts`

Core type definitions for Express middleware, routes, JSON responses, and application helpers.

**Key Types:**
- `JsonOK<T>` - Success response function type
- `JsonFailed` - Error response function type
- `MW` - Express middleware type
- `Service` - Async route handler type
- `Route` - Route handler type with optional next
- `MainRouter` - Router registration function type
- `AddAuditRecord` - Audit logging function type
- `LangOptions` - Language code union type
- `EntityOptions` - Entity name union type

**See:** [global.md](global.md) for detailed documentation

### `firebase_types.ts`

Comprehensive type definitions for Firestore query operations and real-time snapshot subscriptions.

**Key Types:**
- Query function types (`QueryDocument`, `QueryDocuments`, `QueryDocumentOptional`, etc.)
- Snapshot types (`OnSnapshotConfig`, `Snapshot`, `SnapshotBulk`, etc.)
- `WhereCondition` - Firestore where condition interface
- `InitSnapshotsOptions` - Snapshot initialization options

**See:** [firebase_types.md](firebase_types.md) for detailed documentation

### `index.ts`

Barrel export file that re-exports all type aliases from `global.ts` and `firebase_types.ts`.

**See:** [index.md](index.md) for export details

## Usage

```typescript
// Import all types
import { MW, JsonOK, QueryDocument, Snapshot } from 'akeyless-server-commons/types/types';

// Import specific modules
import { MW, Service, Route } from 'akeyless-server-commons/types/types/global';
import { QueryDocument, Snapshot } from 'akeyless-server-commons/types/types/firebase_types';
```

## Context

These types are used throughout the package:

- **Core Types** (`global.ts`) - Used by all modules for middleware, routes, and responses
- **Firebase Types** (`firebase_types.ts`) - Used by Firebase helpers and snapshot system
- **Type Safety** - Ensures consistent API shapes and compile-time checking
- **IntelliSense** - Provides better IDE autocomplete and documentation
