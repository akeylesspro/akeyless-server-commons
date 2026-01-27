# src/types/interfaces

## Overview

The interfaces subdirectory contains TypeScript interfaces for configuration objects, data models, and middleware options. These interfaces provide type safety for complex objects used throughout the package.

## Contents

### `global.ts`

Interfaces for request validation middleware configuration and application initialization options.

**Key Interfaces:**
- `MandatoryObject` - Validation rule interface for single parameters
- `MandatoryParams` - Validation parameters interface (body/headers)
- `LogRequests` - Request logging configuration interface
- `AppOptions` - Server initialization options interface

**See:** [global.md](global.md) for detailed documentation

### `email.ts`

Interfaces for email-related data structures used by SendGrid email helpers.

**Key Interfaces:**
- `EmailData` - Email composition interface (subject, to, from, body, attachments, etc.)
- `EmailAttachment` - Email attachment interface (content, filename, type, disposition)
- `EmailSettings` - Email configuration interface (default_from, default_cc, groups, sendgrid_api_key)

**See:** [email.md](email.md) for detailed documentation

### `index.ts`

Barrel export file that re-exports all interfaces from `global.ts` and `email.ts`.

**See:** [index.md](index.md) for export details

## Usage

```typescript
// Import all interfaces
import { MandatoryParams, EmailData, AppOptions } from 'akeyless-server-commons/types/interfaces';

// Import specific modules
import { MandatoryParams, AppOptions } from 'akeyless-server-commons/types/interfaces/global';
import { EmailData, EmailAttachment } from 'akeyless-server-commons/types/interfaces/email';
```

## Context

These interfaces are used throughout the package:

- **Middleware Interfaces** (`global.ts`) - Used by validation and logging middlewares
- **Email Interfaces** (`email.ts`) - Used by email helpers for SendGrid integration
- **Type Safety** - Ensures consistent object shapes and compile-time validation
- **Configuration** - Provides clear contracts for configuration objects
