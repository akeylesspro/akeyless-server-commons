# src/types/enums

## Overview

The enums subdirectory contains shared enumerations and service name type definitions used across the Akeyless platform. These enums provide type-safe constants for SIM providers and service identification.

## Contents

### `global.ts`

Platform-wide enums and service name types.

**Key Exports:**
- `SimProvider` - Enumeration of SIM card providers (partner, pelephone, celcom, monogoto, unknown)
- `NxServiceName` - Union type for service names ("bi", "call_center", "dashboard", "devices", etc.)
- `NxServiceNameMap` - Record type mapping service names to URLs

**See:** [global.md](global.md) for detailed documentation

### `index.ts`

Barrel export file that re-exports all enums from `global.ts`.

**See:** [index.md](index.md) for export details

## Usage

```typescript
// Import all enums
import { SimProvider, NxServiceName, NxServiceNameMap } from 'akeyless-server-commons/types/enums';

// Import specific module
import { SimProvider, NxServiceName } from 'akeyless-server-commons/types/enums/global';
```

## Context

These enums are used throughout the package:

- **SimProvider** - Used by phone number helpers for SIM provider detection and SMS routing
- **NxServiceName** - Used by global helpers for service URL resolution and inter-service communication
- **Type Safety** - Provides compile-time checking for valid enum values and service names
- **IntelliSense** - Enables IDE autocomplete for valid enum values
