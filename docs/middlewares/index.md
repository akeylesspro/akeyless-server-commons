# src/middlewares/index.ts

## Purpose

Barrel export file that re-exports all middleware modules for convenient importing. This file allows importing all middlewares from a single import path.

## Exports

All exports are re-exported from their respective modules:

- **`global_mw`** - Exports from `./global_mw`:
  - `mandatory` - Middleware factory for mandatory parameter validation
  - `optional` - Middleware factory for optional parameter validation
  - `request_logger` - Middleware factory for conditional request logging

- **`auth_mw`** - Exports from `./auth_mw`:
  - `verify_user_auth` - Firebase user authentication middleware
  - `nx_user_login` - NX user login middleware
  - `client_login` - API client authentication middleware

- **`error_handling`** - Exports from `./error_handling`:
  - `async_error_handler` - Wrapper for async route handlers
  - `error_handler` - Global Express error handler middleware

- **`trim_mw`** - Exports from `./trim_mw`:
  - `trim_body_middleware` - Middleware to trim string values in request bodies

## Usage

```typescript
// Import all middlewares from single path
import { mandatory, verify_user_auth, async_error_handler, trim_body_middleware } from 'akeyless-server-commons/middlewares';

// Or import specific modules
import { mandatory } from 'akeyless-server-commons/middlewares/global_mw';
import { verify_user_auth } from 'akeyless-server-commons/middlewares/auth_mw';
```

## Context

This barrel export pattern allows consumers to import multiple middlewares from a single import statement, improving code organization and reducing import complexity.
