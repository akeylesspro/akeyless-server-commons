# src/types/index.ts

## Purpose

Barrel export file that re-exports all type categories (types, interfaces, enums) for convenient importing. This file allows importing all types from a single import path, making it easier to use types from different categories in your code.

## Exports

All exports are re-exported from their respective subdirectories:

- **`types`** - Exports from `./types`:
  - All type aliases from `types/global.ts` (MW, Service, Route, JsonOK, JsonFailed, MainRouter, AddAuditRecord, LangOptions, EntityOptions)
  - All Firebase types from `types/firebase_types.ts` (QueryDocument, QueryDocuments, Snapshot, OnSnapshotConfig, etc.)

- **`interfaces`** - Exports from `./interfaces`:
  - All interfaces from `interfaces/global.ts` (MandatoryObject, MandatoryParams, LogRequests, AppOptions)
  - All email interfaces from `interfaces/email.ts` (EmailData, EmailAttachment, EmailSettings)

- **`enums`** - Exports from `./enums`:
  - All enums from `enums/global.ts` (SimProvider, NxServiceName, NxServiceNameMap)

## Usage

```typescript
// Import all types from single barrel export
import { 
  MW, 
  JsonOK, 
  MandatoryParams, 
  EmailData, 
  SimProvider,
  QueryDocument,
  Snapshot
} from 'akeyless-server-commons/types';

// Or import specific categories
import { types } from 'akeyless-server-commons/types/types';
import { interfaces } from 'akeyless-server-commons/types/interfaces';
import { enums } from 'akeyless-server-commons/types/enums';

// Or import from specific subdirectories
import { MW } from 'akeyless-server-commons/types/types/global';
import { EmailData } from 'akeyless-server-commons/types/interfaces/email';
import { SimProvider } from 'akeyless-server-commons/types/enums/global';
```

## Type Categories

### Core Types (`types/`)

Foundation types used throughout the package:
- **HTTP Response Types** - `JsonOK<T>`, `JsonFailed` for standardized API responses
- **Express Types** - `MW`, `Service`, `Route` for middleware and route handlers
- **Application Types** - `MainRouter`, `AddAuditRecord` for app-level functions
- **Firebase Types** - Query and snapshot types for Firestore operations

### Interfaces (`interfaces/`)

Configuration and data model interfaces:
- **Middleware Interfaces** - `MandatoryObject`, `MandatoryParams`, `LogRequests` for request validation
- **App Interfaces** - `AppOptions` for server initialization
- **Email Interfaces** - `EmailData`, `EmailAttachment`, `EmailSettings` for email operations

### Enums (`enums/`)

Enumerations and service name types:
- **Provider Enum** - `SimProvider` for SIM card providers
- **Service Types** - `NxServiceName`, `NxServiceNameMap` for service identification

## Context

This barrel export pattern provides:

1. **Convenience** - Import multiple types from different categories in a single statement
2. **Organization** - Types are logically grouped but accessible from one location
3. **Flexibility** - Can still import from specific subdirectories if needed
4. **Type Safety** - All exports maintain full TypeScript type information
5. **Discoverability** - Easy to find and use types across the entire package

## Related Files

- [types/README.md](types/README.md) - Detailed documentation for type aliases
- [interfaces/README.md](interfaces/README.md) - Detailed documentation for interfaces
- [enums/README.md](enums/README.md) - Detailed documentation for enums
- [README.md](README.md) - Overview of the entire types module
