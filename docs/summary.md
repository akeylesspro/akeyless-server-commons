# akeyless-server-commons - Project Summary

## Overview

`akeyless-server-commons` is a comprehensive Node.js/TypeScript server utilities package that provides shared functionality for Akeyless microservices. It offers a standardized set of helpers, managers, middlewares, and types that ensure consistency across all server-side applications.

**Version:** 1.0.168  
**Repository:** [GitHub](https://github.com/akeylesspro/akeyless-server-commons)

## What This Package Contains

### 📦 Package Structure

The package exports four main modules:

- **`./helpers`** - Utility functions and service integrations
- **`./managers`** - Singleton managers for shared state
- **`./middlewares`** - Express middleware for common server needs
- **`./types`** - Shared TypeScript types, interfaces, and enums

## Core Components

### 🔧 Helpers (`./helpers`)

Stateless utility functions organized by domain:

#### Infrastructure & Bootstrap
- **`global_helpers`** - Environment validation, JSON responses, service URLs, geocoding, trimming utilities
- **`start`** - Express server bootstrap with middleware setup, Redis initialization, snapshot loading
- **`firebase_helpers`** - Firebase Admin SDK integration, Firestore CRUD operations, real-time snapshots, storage, audit logging

#### Data & Communication
- **`email_helpers`** - SendGrid email sending with attachment support
- **`notification_helpers`** - SMS (Multisend/Twilio/Monogoto) and FCM push notifications
- **`phone_number_helpers`** - Phone number normalization, validation, SIM provider detection

#### Domain-Specific
- **`login_helpers`** - User lookup by email/phone/UID
- **`time_helpers`** - Timestamp conversion and formatting utilities
- **`location_helpers`** - Geospatial distance calculations and Google Maps URLs
- **`tasks_helpers`** - Task execution orchestration with caching and persistence
- **`boards_helpers`** - Board provider resolution utilities

#### Redis Integration
- **`redis/initialize`** - Redis client setup (commander/listener pattern)
- **`redis/keys`** - Key pattern utilities and SCAN operations
- **`redis/snapshot`** - Redis-backed cache hydration with Firebase fallback

### 🎯 Managers (`./managers`)

Singleton instances providing shared state:

- **`cache_manager`** - In-memory cache for arrays and objects (used across helpers)
- **`logger_manager`** - Timestamped logging with Axios-aware error handling, table formatting
- **`translation_manager`** - Translation cache and lookup for UI/SMS/email messages

### 🛡️ Middlewares (`./middlewares`)

Express middleware for request handling:

- **`global_mw`** - Request validation (`mandatory`, `optional`), request logging
- **`auth_mw`** - Authentication middleware (`verify_user_auth`, `nx_user_login`, `client_login`)
- **`error_handling`** - Async error wrapper and global error handler
- **`trim_mw`** - Request body string trimming middleware

### 📝 Types (`./types`)

Shared TypeScript definitions:

- **`types/global`** - Core types (MW, Service, Route, JsonOK, JsonFailed, etc.)
- **`types/firebase_types`** - Firestore query and snapshot type definitions
- **`interfaces/global`** - Middleware and app option interfaces
- **`interfaces/email`** - Email data models (EmailData, EmailSettings, EmailAttachment)
- **`enums/global`** - Enums (SimProvider, NxServiceName, NxServiceNameMap)

## What This Package Does

### Primary Functions

1. **Server Bootstrap** - Standardized Express server initialization with common middleware
2. **Firebase Integration** - Complete Firestore/Storage/Auth/Messaging integration
3. **Caching System** - In-memory cache with Redis and Firebase snapshot support
4. **Communication** - Email (SendGrid) and SMS/Push notification services
5. **Request Handling** - Validation, authentication, logging, error handling middleware
6. **Data Utilities** - Phone normalization, time formatting, geocoding, task orchestration

### Key Features

- ✅ **Environment Validation** - Validates required environment variables on startup
- ✅ **Real-time Data Sync** - Firebase snapshots and Redis Pub/Sub for live cache updates
- ✅ **Multi-provider SMS** - Automatic routing (Multisend/Twilio/Monogoto) based on phone number
- ✅ **Audit Logging** - Built-in audit trail for emails, SMS, and operations
- ✅ **Translation Support** - Multi-language support for notifications and UI
- ✅ **Type Safety** - Comprehensive TypeScript types for all APIs

## How to Use

### Installation

```bash
npm install akeyless-server-commons
```

### Basic Usage

#### Import Modules

```typescript
// ESM
import { helpers, managers, middlewares, types } from 'akeyless-server-commons';

// CJS
const { helpers, managers, middlewares, types } = require('akeyless-server-commons');

// Or import specific modules
import { helpers } from 'akeyless-server-commons/helpers';
import { managers } from 'akeyless-server-commons/managers';
import { middlewares } from 'akeyless-server-commons/middlewares';
import { types } from 'akeyless-server-commons/types';
```

#### Server Bootstrap Example

```typescript
import express from 'express';
import { helpers } from 'akeyless-server-commons/helpers';
import { version } from '../package.json';

const mainRouter = (app: express.Express) => {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
};

// Start server with snapshots and Redis
await helpers.basic_init(mainRouter, 'my-service', version, {
  port: 3000,
  log_requests: { url: true, body: true },
  init_snapshot_options: { subscription_type: 'firebase' },
  initialize_redis: true
});
```

#### Using Helpers

```typescript
import { helpers } from 'akeyless-server-commons/helpers';
import { managers } from 'akeyless-server-commons/managers';

// Environment validation
const env = helpers.init_env_variables(['mode', 'port', 'project_id']);

// JSON responses
res.json(helpers.json_ok({ data: 'success' }));
res.json(helpers.json_failed(new Error('Something went wrong')));

// Firebase operations
const user = await helpers.query_document('nx-users', 'email', '==', 'user@example.com');
await helpers.add_document('nx-users', { name: 'John', email: 'john@example.com' });

// Email sending
await helpers.send_email({
  to: 'user@example.com',
  subject: 'Welcome',
  body_html: '<h1>Welcome!</h1>',
  entity_for_audit: 'user_registration'
});

// SMS sending
await helpers.send_sms('+972501234567', 'Your code is 1234', 'user_verification');

// Cache access
const settings = managers.cache_manager.getObjectData('nx-settings');
managers.logger.log('Operation completed', { userId: '123' });
```

#### Using Middlewares

```typescript
import { middlewares } from 'akeyless-server-commons/middlewares';

// Request validation
app.post('/api/users',
  middlewares.mandatory({
    body: [
      { key: 'email', type: 'string', length: 5 },
      { key: 'name', type: 'string' }
    ]
  }),
  middlewares.nx_user_login,
  async (req, res) => {
    // req.body.user is available here
    res.json(helpers.json_ok({ user: req.body.user }));
  }
);

// Auth protection
app.get('/api/protected',
  middlewares.verify_user_auth,
  (req, res) => {
    // req.body.firebase_user is available
    res.json(helpers.json_ok({ user: req.body.firebase_user }));
  }
);
```

#### Using Managers

```typescript
import { managers } from 'akeyless-server-commons/managers';

// Cache operations
managers.cache_manager.setObjectData('my-key', { data: 'value' });
const data = managers.cache_manager.getObjectData('my-key');
managers.cache_manager.setArrayData('my-list', [1, 2, 3]);
const list = managers.cache_manager.getArrayData('my-list');

// Logging
managers.logger.log('Info message', { additional: 'data' });
managers.logger.error('Error occurred', error);
managers.logger.warn('Warning message');

// Translations
const translation = managers.translation_manager.get_translation(
  'push_notifications',
  'he',
  'title',
  'event_from_device'
);
```

## Environment Variables

### Required Variables

The package requires various environment variables depending on usage:

#### Firebase (Required for Firebase helpers)
- `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, `client_id`, `auth_uri`, `token_uri`, `auth_provider_x509_cert_url`, `client_x509_cert_url`, `universe_domain`

#### Server Bootstrap
- `mode` - Environment mode (`prod`, `qa`, `local`)
- `port` - Server port (optional, can be passed to `start_server`)

#### Redis (Optional)
- `redis_ip` - Redis server IP address

#### Google Services (For geocoding)
- Configured in `nx-settings` collection: `google.geocode_api_key`

#### Email (SendGrid)
- Configured in `nx-settings` collection: `emails.sendgrid_api_key`

#### SMS Providers
- Configured in `nx-settings` collection:
  - `sms_provider.multisend` (user, password, from)
  - `sms_provider.twilio` (account_sid, token, messaging_service_sid)
  - `sms_provider.monogoto` (user, password, from)

## Project Architecture

### Module Dependencies

```
┌─────────────┐
│  Helpers   │───┐
└─────────────┘   │
                 ├──► Managers (cache, logger, translation)
┌─────────────┐  │
│ Middlewares │──┘
└─────────────┘
       │
       └──► Helpers (for JSON responses, auth, trimming)

All modules ────► Types (for consistent API shapes)
```

### Data Flow

1. **Server Startup** → `start.ts` initializes Express, Redis, Firebase snapshots
2. **Snapshot Loading** → Firebase/Redis snapshots populate `cache_manager`
3. **Request Handling** → Middlewares validate/auth/log → Route handlers use helpers
4. **Operations** → Helpers use managers for cache/logging/translations
5. **Audit Trail** → Operations write to `nx-audit` collection

## Common Use Cases

### 1. Starting a New Microservice

```typescript
import { helpers } from 'akeyless-server-commons/helpers';
import { version } from './package.json';

const router = (app: express.Express) => {
  // Define your routes
};

await helpers.basic_init(router, 'my-service', version);
```

### 2. Querying Firebase Data

```typescript
import { helpers } from 'akeyless-server-commons/helpers';

// Get single document
const user = await helpers.query_document('nx-users', 'email', '==', 'user@example.com');

// Get multiple documents
const users = await helpers.query_documents('nx-users', 'status', '==', 'active');

// Get by ID
const doc = await helpers.get_document_by_id('nx-users', 'user-id-123');
```

### 3. Sending Notifications

```typescript
import { helpers } from 'akeyless-server-commons/helpers';

// Send SMS
await helpers.send_sms('+972501234567', 'Your verification code: 1234', 'user_verification');

// Send push notification
await helpers.send_fcm_message(
  'New Message',
  'You have a new notification',
  ['fcm-token-1', 'fcm-token-2']
);

// Send email
await helpers.send_email({
  to: 'user@example.com',
  subject: 'Welcome',
  body_html: '<h1>Welcome to our service!</h1>',
  entity_for_audit: 'user_registration'
});
```

### 4. Using Cache

```typescript
import { managers } from 'akeyless-server-commons/managers';

// Cache is populated by Firebase snapshots on startup
const settings = managers.cache_manager.getObjectData('nx-settings');
const users = managers.cache_manager.getArrayData('users');
```

### 5. Request Validation

```typescript
import { middlewares } from 'akeyless-server-commons/middlewares';

app.post('/api/data',
  middlewares.mandatory({
    body: [
      { key: 'name', type: 'string', length: 3 },
      { key: 'age', type: 'number' },
      { key: 'tags', type: 'array', array_types: ['string'] }
    ]
  }),
  (req, res) => {
    // req.body is validated here
  }
);
```

## Build & Deploy

### Build

```bash
npm run build        # Build both CJS and ESM
npm run build:cjs    # Build CommonJS only
npm run build:esm     # Build ESM only
```

### Deploy

```bash
npm run deploy       # Build, version patch, publish
npm run deployTest   # Build, version prerelease, publish with 'test' tag
```

## Documentation Structure

This documentation is organized as follows:

- **`docs/README.html`** - Project overview and cross-module relationships
- **`docs/summary.html`** - This comprehensive summary (HTML version)
- **`docs/helpers/`** - Detailed documentation for each helper module
- **`docs/managers/`** - Documentation for cache, logger, and translation managers
- **`docs/middlewares/`** - Middleware documentation
- **`docs/types/`** - Type definitions documentation

Each folder contains:
- `README.html` - Overview of the folder contents
- Individual `.html` and `.md` files for each module

## Key Design Patterns

1. **Singleton Managers** - Shared state via singleton pattern (cache, logger, translations)
2. **Snapshot Pattern** - Real-time data sync via Firebase snapshots or Redis Pub/Sub
3. **Helper Functions** - Stateless utility functions organized by domain
4. **Middleware Chain** - Express middleware for cross-cutting concerns
5. **Type Safety** - Comprehensive TypeScript types for all public APIs

## Best Practices

1. **Always validate environment variables** using `init_env_variables()` on startup
2. **Use cache_manager** for frequently accessed data (populated by snapshots)
3. **Use logger** for all logging (provides consistent timestamp formatting)
4. **Use json_ok/json_failed** for consistent API responses
5. **Use middlewares** for request validation and authentication
6. **Use types** from the package for consistent API shapes

## Support & Contribution

- **Repository:** [GitHub](https://github.com/akeylesspro/akeyless-server-commons)
- **Issues:** Report issues on GitHub
- **Version:** Check `package.json` for current version

## Related Packages

- **`akeyless-types-commons`** - Shared TypeScript types used by this package

---

For detailed documentation on specific modules, see the [full documentation index](README.html).
