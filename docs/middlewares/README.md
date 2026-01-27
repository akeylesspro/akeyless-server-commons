# src/middlewares

## Overview

The middlewares module provides Express middleware functions for common server-side concerns including request validation, authentication, error handling, and data normalization. These middlewares can be composed together to build robust API endpoints with consistent behavior.

## Contents

### `global_mw.ts`

Comprehensive validation middleware and request logging utilities.

**Exports:**
- `mandatory({ body, headers })` - Middleware factory that enforces mandatory parameter validation
- `optional({ body, headers })` - Middleware factory that validates optional parameters if present
- `request_logger(log_requests)` - Middleware factory for conditional request logging

**Features:**
- Type validation (string, number, boolean, object, array)
- Length constraints for strings and arrays
- Array element type validation
- Object required keys validation
- Configurable request logging (URL, headers, query, body)

**See:** [global_mw.md](global_mw.md) for detailed documentation

### `auth_mw.ts`

Authentication middleware for different user/client types.

**Exports:**
- `verify_user_auth` - Validates Firebase bearer tokens and attaches `firebase_user` to request
- `nx_user_login` - Validates Firebase tokens and resolves NX user, attaches `user` with `full_name` to request
- `client_login` - Validates API tokens against `nx-clients` collection, attaches `client` to request

**Features:**
- Firebase token verification
- NX user lookup by phone/email
- API client authentication
- Standardized 403 error responses

**See:** [auth_mw.md](auth_mw.md) for detailed documentation

### `error_handling.ts`

Error handling utilities for async routes and global error management.

**Exports:**
- `async_error_handler(service)` - Wraps async route handlers to catch and forward errors
- `error_handler(err, req, res, next)` - Global Express error handler middleware

**Features:**
- Automatic error catching for async routes
- Centralized error logging
- Standardized error responses (500 status)
- Stack trace logging

**See:** [error_handling.md](error_handling.md) for detailed documentation

### `trim_mw.ts`

Request body normalization middleware.

**Exports:**
- `trim_body_middleware()` - Middleware that trims all string values in request bodies

**Features:**
- Recursive string trimming
- Handles nested objects and arrays
- Non-destructive (only modifies strings)
- Safe for missing or non-object bodies

**See:** [trim_mw.md](trim_mw.md) for detailed documentation

### `index.ts`

Barrel export file for convenient importing.

**See:** [index.md](index.md) for export details

## Common Usage Patterns

### Request Validation + Authentication

```typescript
app.post('/api/users',
  trim_body_middleware(),
  mandatory({
    body: [
      { key: 'email', type: 'string', length: 5 },
      { key: 'name', type: 'string' }
    ]
  }),
  nx_user_login,
  async_error_handler(async (req, res) => {
    // req.body.user is available and validated
    res.json(json_ok({ user: req.body.user }));
  })
);
```

### Error Handling Setup

```typescript
// Wrap async routes
app.get('/api/data', async_error_handler(async (req, res) => {
  const data = await fetchData();
  res.json(json_ok(data));
}));

// Register global error handler last
app.use(error_handler);
```

### Request Logging

```typescript
// Development: log everything
if (process.env.NODE_ENV === 'development') {
  app.use(request_logger({ url: true, headers: true, body: true, query: true }));
}

// Production: log only URLs
else {
  app.use(request_logger({ url: true }));
}
```

## Middleware Order

Recommended middleware order:

1. **Body Parsing** - `express.json()`, `express.urlencoded()`
2. **Request Logging** - `request_logger()` (optional)
3. **Body Trimming** - `trim_body_middleware()` (optional)
4. **Validation** - `mandatory()` or `optional()`
5. **Authentication** - `verify_user_auth`, `nx_user_login`, or `client_login`
6. **Route Handlers** - Your business logic
7. **Error Handler** - `error_handler()` (last)

## Context

These middlewares standardize request handling across all Akeyless microservices:

- **Consistency** - Same validation and authentication patterns everywhere
- **Type Safety** - TypeScript types ensure correct usage
- **Error Handling** - Centralized error management
- **Security** - Authentication and input validation built-in
- **Observability** - Request logging for debugging and monitoring

## Dependencies

- **Helpers:** Uses `json_failed`, `verify_token`, `get_user_by_identifier`, `query_document_optional`, `trim_strings`
- **Managers:** Uses `logger` for logging
- **Types:** Uses `MW`, `Service`, `MandatoryParams`, `LogRequests` types

## Related Modules

- **Helpers** - Middlewares use helpers for JSON responses, auth verification, and data manipulation
- **Types** - Middlewares use types for consistent interfaces and type safety
- **Managers** - Middlewares use managers for logging and caching
