# src/types/types/global.ts

## Purpose

Core type aliases for HTTP responses, middleware, routes, and app-level helpers.

## Exports

- `JsonOK<T>`: success response shape.
- `JsonFailed`: failure response shape.
- `MainRouter`: function that registers routes on an Express app.
- `MW`: Express middleware type.
- `Service`: async handler signature.
- `Route`: handler signature with optional `next`.
- `AddAuditRecord`: audit function signature.
- `LangOptions`: allowed language values.
- `EntityOptions`: allowed entity values.
