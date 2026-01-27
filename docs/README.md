# server_commons docs

This documentation mirrors the `src` tree and explains each TypeScript file.
Each folder also has a `README.md` and `README.html` that list its contents.

**📖 Start here:** [Complete Project Summary](summary.html) - Comprehensive guide to what the package contains, how it works, and how to use it.

## Project map (high level)

- `src/helpers`: stateless utility functions for env bootstrapping, Firebase data access, Redis snapshots, messaging/email, phone utilities, geo, tasks, and server bootstrap.
- `src/managers`: singletons for cache, logging, and translations.
- `src/middlewares`: Express middleware for validation, auth, error handling, logging, and body trimming.
- `src/types`: shared types, enums, and interfaces used across helpers/managers/middlewares.
- `src/index.ts`: package barrel that exports helpers/managers/middlewares/types.

## Cross-module relationships

- Helpers depend on managers for caching, logging, and translations.
- Middlewares depend on helpers for JSON responses, auth verification, and trimming.
- Redis snapshot helpers bridge Redis updates into the same parsing flow as Firebase snapshots.
- Types are imported across helpers/managers/middlewares to keep API shapes consistent.

See each file doc for details.
