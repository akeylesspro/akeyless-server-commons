# src/helpers

## Contents

- `boards_helpers.ts`: board/provider utilities using cached settings and boards.
- `email_helpers.ts`: SendGrid email helpers and attachment builders.
- `firebase_helpers.ts`: Firebase Admin initialization, Firestore queries, snapshots, storage helpers, and auditing.
- `global_helpers.ts`: env bootstrap, JSON responses, URL config, trimming, misc utilities.
- `index.ts`: helper barrel exports.
- `location_helpers.ts`: geo distance and maps URL helpers.
- `login_helpers.ts`: lookup helpers for users and mobile app users.
- `notification_helpers.ts`: SMS and push notification helpers.
- `phone_number_helpers.ts`: phone parsing, validation, and SIM provider resolution.
- `start.ts`: Express server bootstrap and initialization.
- `tasks_helpers.ts`: task execution, caching, and persistence helpers.
- `time_helpers.ts`: time formatting and conversions.
- `redis/`: Redis initialization, keys, and snapshot integration.

## Context

Helpers are stateless utilities and service functions. They use managers for cache, logging, and translations, and rely on shared types for consistent signatures.
