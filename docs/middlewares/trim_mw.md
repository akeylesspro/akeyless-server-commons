# src/middlewares/trim_mw.ts

## Purpose

Middleware to trim string values in request bodies.

## Dependencies

- `trim_strings` helper
- `MW` type

## Exports and behavior

- `trim_body_middleware()`:
  - If `req.body` is an object, recursively trims all string fields.
  - Continues to next middleware.

## Context

Used in server bootstrap to normalize input payloads.
