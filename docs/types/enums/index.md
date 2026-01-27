# src/types/enums/index.ts

## Purpose

Barrel export file that re-exports all enums from the enums subdirectory. This file allows importing all enums from a single import path.

## Exports

All exports are re-exported from the `global` module:

- **`global`** - Exports from `./global`:
  - `SimProvider` - SIM card provider enumeration
  - `NxServiceName` - Service name union type
  - `NxServiceNameMap` - Service name to URL mapping type

## Usage

```typescript
// Import all enums from barrel export
import { SimProvider, NxServiceName, NxServiceNameMap } from 'akeyless-server-commons/types/enums';

// Or import specific module
import { SimProvider, NxServiceName } from 'akeyless-server-commons/types/enums/global';
```

## Context

This barrel export pattern allows consumers to import multiple enums from a single import statement, improving code organization and reducing import complexity.
