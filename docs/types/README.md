# src/types

## Overview

The types module provides comprehensive TypeScript type definitions, interfaces, and enums used throughout the Akeyless server commons package. These types ensure type safety, consistency, and provide clear contracts for all modules including helpers, managers, and middlewares.

## Contents

### `types/` - Type Aliases

Core type definitions for HTTP responses, middleware, routes, Firebase operations, and application-level helpers.

**Modules:**
- **`types/global.ts`** - Core types for Express middleware, routes, JSON responses, and app helpers
  - `JsonOK<T>`, `JsonFailed` - Response type definitions
  - `MW`, `Service`, `Route` - Express handler types
  - `MainRouter` - Router registration type
  - `AddAuditRecord` - Audit logging function type
  - `LangOptions`, `EntityOptions` - String union types

- **`types/firebase_types.ts`** - Firebase Firestore query and snapshot types
  - Query function types (`QueryDocument`, `QueryDocuments`, etc.)
  - Snapshot types (`OnSnapshotConfig`, `Snapshot`, etc.)
  - `WhereCondition` interface
  - `InitSnapshotsOptions` interface

**See:** [types/README.md](types/README.md) for detailed documentation

### `interfaces/` - TypeScript Interfaces

Interfaces for configuration objects, data models, and middleware options.

**Modules:**
- **`interfaces/global.ts`** - Middleware and app configuration interfaces
  - `MandatoryObject` - Validation rule interface
  - `MandatoryParams` - Validation parameters interface
  - `LogRequests` - Request logging configuration
  - `AppOptions` - Server initialization options

- **`interfaces/email.ts`** - Email data models
  - `EmailData` - Email composition interface
  - `EmailAttachment` - Attachment interface
  - `EmailSettings` - Email configuration interface

**See:** [interfaces/README.md](interfaces/README.md) for detailed documentation

### `enums/` - Enumerations

Shared enums and service name type definitions.

**Modules:**
- **`enums/global.ts`** - Platform-wide enums
  - `SimProvider` - SIM card provider enumeration
  - `NxServiceName` - Service name union type
  - `NxServiceNameMap` - Service name to URL mapping type

**See:** [enums/README.md](enums/README.md) for detailed documentation

### `index.ts` - Barrel Export

Barrel export file that re-exports all types, interfaces, and enums for convenient importing.

**See:** [index.md](index.md) for export details

## Usage

```typescript
// Import all types
import { MW, JsonOK, MandatoryParams } from 'akeyless-server-commons/types';

// Import specific categories
import { types } from 'akeyless-server-commons/types/types';
import { interfaces } from 'akeyless-server-commons/types/interfaces';
import { enums } from 'akeyless-server-commons/types/enums';

// Import specific modules
import { MW } from 'akeyless-server-commons/types/types/global';
import { EmailData } from 'akeyless-server-commons/types/interfaces/email';
import { SimProvider } from 'akeyless-server-commons/types/enums/global';
```

## Type Categories

### Core Types (`types/global.ts`)

Foundation types used throughout the package:
- **HTTP Response Types** - `JsonOK`, `JsonFailed` for standardized API responses
- **Express Types** - `MW`, `Service`, `Route` for middleware and route handlers
- **Application Types** - `MainRouter`, `AddAuditRecord` for app-level functions
- **Utility Types** - `LangOptions`, `EntityOptions` for string unions

### Firebase Types (`types/firebase_types.ts`)

Types for Firestore operations and real-time snapshots:
- **Query Types** - Function signatures for Firestore queries
- **Snapshot Types** - Configuration and callback types for real-time subscriptions
- **Condition Types** - `WhereCondition` for query filtering

### Middleware Interfaces (`interfaces/global.ts`)

Configuration interfaces for middleware:
- **Validation Interfaces** - `MandatoryObject`, `MandatoryParams` for request validation
- **Logging Interfaces** - `LogRequests` for request logging configuration
- **App Interfaces** - `AppOptions` for server initialization

### Email Interfaces (`interfaces/email.ts`)

Data models for email operations:
- **Composition Interface** - `EmailData` for email sending
- **Attachment Interface** - `EmailAttachment` for email attachments
- **Settings Interface** - `EmailSettings` for email configuration

### Enums (`enums/global.ts`)

Enumerations and service name types:
- **Provider Enum** - `SimProvider` for SIM card providers
- **Service Types** - `NxServiceName`, `NxServiceNameMap` for service identification

## Context

These shared types provide:

1. **Type Safety** - Compile-time type checking across all modules
2. **Consistency** - Standardized types ensure consistent API shapes
3. **IntelliSense** - Better IDE autocomplete and documentation
4. **Refactoring Safety** - TypeScript catches breaking changes
5. **Documentation** - Types serve as inline documentation

## Related Modules

- **Helpers** - Use types for function signatures and return types
- **Managers** - Use types for method signatures and configuration
- **Middlewares** - Use types for middleware functions and validation rules

## Type Relationships

```
types/global.ts
  ├── Used by: All modules (MW, Service, JsonOK, etc.)
  └── Foundation types

types/firebase_types.ts
  ├── Used by: firebase_helpers, redis helpers
  └── Query and snapshot types

interfaces/global.ts
  ├── Used by: global_mw, start helpers
  └── Middleware and app configuration

interfaces/email.ts
  ├── Used by: email_helpers
  └── Email data models

enums/global.ts
  ├── Used by: phone_number_helpers, global_helpers
  └── Platform-wide enums
```
