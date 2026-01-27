# src/helpers

## Contents

This directory contains stateless utility functions and service integrations organized by domain. Each helper module provides focused functionality for specific use cases.

### Infrastructure & Bootstrap

- **`global_helpers.ts`** - Environment validation, JSON response formatting, service URL resolution, geocoding, data normalization utilities, and HTTP helpers. Provides foundational utilities used across the entire application.

- **`start.ts`** - Express server bootstrap with standardized middleware setup, logging, error handling, and optional Redis initialization. Provides `start_server` for basic setup and `basic_init` for complete initialization including snapshot loading.

- **`firebase_helpers.ts`** - Firebase Admin SDK initialization, comprehensive Firestore CRUD operations, real-time snapshot subscriptions, Firebase Storage helpers, authentication token verification, and audit logging. Central integration point for all Firebase operations.

### Data & Communication

- **`email_helpers.ts`** - SendGrid email sending with comprehensive attachment support (files, buffers, URLs), group-based recipient management, automatic audit logging, and MIME type detection. Supports HTML and plain text emails.

- **`notification_helpers.ts`** - Multi-provider SMS sending (Multisend, Twilio, Monogoto) with automatic provider selection, SMS group expansion, Firebase Cloud Messaging (FCM) push notifications, event-based notifications, and comprehensive audit logging.

- **`phone_number_helpers.ts`** - Phone number normalization, validation, format detection (Israeli, international, ICCID), SIM provider inference, and conversion between short/long formats. Used for SMS routing and user lookups.

### Domain-Specific

- **`login_helpers.ts`** - User lookup helpers for finding NX users and mobile app users by email, phone number, or UID. Supports flexible identifier resolution with automatic format detection.

- **`time_helpers.ts`** - Comprehensive time conversion and formatting utilities for Firebase timestamps, JavaScript Dates, strings, and numbers. Supports multiple input formats, timezone conversion, custom formatting, and time elapsed calculations.

- **`location_helpers.ts`** - Geospatial utilities for calculating distances between coordinates using Haversine formula and generating Google Maps URLs for location sharing.

- **`tasks_helpers.ts`** - Task execution orchestration with status tracking, result caching, and optional persistence to Firestore or Firebase Storage. Designed for scheduled/recurring backend tasks.

- **`boards_helpers.ts`** - Board provider resolution utilities for determining board makers (ERM, Jimi, Ruptela, Servision, Jimi IoT Hub) based on board types and cached settings. Used for routing device logic.

### Redis Integration

- **`redis/initialize.ts`** - Redis client initialization with dual-client architecture (commander for read/write, listener for Pub/Sub), connection management, retry logic, and automatic subscription setup.

- **`redis/keys.ts`** - Redis key and pattern utilities for building consistent key names, collection patterns, update channels, and key scanning operations using SCAN command.

- **`redis/snapshot.ts`** - Redis Pub/Sub snapshot integration with automatic fallback to Firebase snapshots. Provides same cache parsing interface as Firebase snapshots for seamless data source switching.

### Index

- **`index.ts`** - Barrel export file that re-exports all helper functions for convenient importing.

## Context

Helpers are stateless utility functions and service integrations. They:

- **Use Managers** - Access `cache_manager` for cached data, `logger` for logging, and `translation_manager` for translations
- **Rely on Types** - Use shared TypeScript types for consistent function signatures
- **Follow Patterns** - Consistent error handling, logging, and data access patterns
- **Support Snapshots** - Work with Firebase and Redis snapshot systems for real-time data

## Documentation

Each helper module has detailed documentation in `docs/helpers/` with:

- **Purpose** - What the module does and why it exists
- **Dependencies** - External libraries and internal dependencies
- **Function Documentation** - Detailed parameter descriptions, return types, behavior, examples
- **Context** - Common use cases and best practices

## Usage Patterns

### Importing Helpers

```typescript
// Import specific helpers
import { send_email, query_document } from 'akeyless-server-commons/helpers';

// Import from specific module
import { send_email } from 'akeyless-server-commons/helpers/email_helpers';
```

### Common Patterns

```typescript
// Environment validation
const env = init_env_variables(['mode', 'port']);

// JSON responses
res.json(json_ok({ data: 'success' }));
res.json(json_failed(new Error('Error')));

// Firebase operations
const user = await query_document('nx-users', 'email', '==', 'user@example.com');

// Email sending
await send_email({
  to: 'user@example.com',
  subject: 'Welcome',
  body_html: '<h1>Welcome!</h1>',
  entity_for_audit: 'user_registration'
});

// SMS sending
await send_sms('+972501234567', 'Your code is 1234', 'user_verification');

// Cache access
const settings = cache_manager.getObjectData('nx-settings');
```

## Best Practices

1. **Use Cached Data** - Access frequently used data from `cache_manager` (populated by snapshots)
2. **Handle Errors** - Use try-catch or optional helpers (`query_document_optional`) for non-critical operations
3. **Audit Logging** - Always provide `entity_for_audit` for operations that need tracking
4. **Type Safety** - Use TypeScript types from the package for consistent API shapes
5. **Consistent Responses** - Use `json_ok` and `json_failed` for all API responses
