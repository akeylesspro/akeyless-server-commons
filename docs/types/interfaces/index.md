# src/types/interfaces/index.ts

## Purpose

Barrel export file that re-exports all interfaces from the interfaces subdirectory. This file allows importing all interfaces from a single import path.

## Exports

All exports are re-exported from their respective modules:

- **`global`** - Exports from `./global`:
  - `MandatoryObject` - Validation rule interface
  - `MandatoryParams` - Validation parameters interface
  - `LogRequests` - Request logging configuration interface
  - `AppOptions` - Server initialization options interface

- **`email`** - Exports from `./email`:
  - `EmailData` - Email composition interface
  - `EmailAttachment` - Email attachment interface
  - `EmailSettings` - Email configuration interface

## Usage

```typescript
// Import all interfaces from barrel export
import { MandatoryParams, EmailData, AppOptions } from 'akeyless-server-commons/types/interfaces';

// Or import specific modules
import { MandatoryParams, AppOptions } from 'akeyless-server-commons/types/interfaces/global';
import { EmailData, EmailAttachment } from 'akeyless-server-commons/types/interfaces/email';
```

## Context

This barrel export pattern allows consumers to import multiple interfaces from a single import statement, improving code organization and reducing import complexity.
