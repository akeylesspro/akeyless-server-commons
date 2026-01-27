# src/global.d.ts

## Purpose

Adds a global TypeScript declaration for `NodeJS.Global` to optionally include a `cache_manager` instance.

## Details

- Imports `CacheManager` type from `src/managers`.
- Extends `NodeJS.Global` with an optional `cache_manager?: CacheManager`.
- Exports an empty object to ensure the file is treated as a module.

## Context

This allows consumers to attach a shared cache manager on the Node global object when needed, without TypeScript errors.
