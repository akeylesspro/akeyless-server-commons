# src/managers

## Contents

This directory contains singleton managers that provide shared state and cross-cutting utilities used by helpers and middlewares. All managers use the singleton pattern to ensure consistent behavior across the application.

- **`index.ts`** - Barrel export file that re-exports all manager modules for convenient importing

- **`cache_manager.ts`** - Singleton in-memory cache manager for storing arrays and objects by key. Provides fast access to frequently accessed data that is populated by Firebase snapshots or Redis subscriptions. Data persists for the lifetime of the server process.

- **`logger_manager.ts`** - Singleton logger manager providing timestamped logging with intelligent formatting, Axios-aware error handling, and table formatting for structured data. All logs include Israel timezone timestamps (`Asia/Jerusalem`) in format `DD/MM/YYYY HH:mm:ss.SS`.

- **`translation_manager.ts`** - Singleton translation manager providing cached translation lookups for UI messages, SMS messages, and email content. Supports multiple languages and scopes with fallback to key names when translations are missing. Translations are stored in nested object structure keyed by scope, language, and entity/key.

## Context

Managers provide shared state and cross-cutting utilities used by <a href="../helpers/index.html">helpers</a> and <a href="../middlewares/index.html">middlewares</a>. All managers use the singleton pattern to ensure:

- **Consistent Behavior** - Single shared instance across the entire application
- **Memory Efficiency** - Single cache instance, single logger instance, single translation cache
- **Thread Safety** - Safe access in Node.js single-threaded event loop

## Usage Patterns

### Cache Manager

```typescript
import { cache_manager } from 'akeyless-server-commons/managers';

// Store array data
cache_manager.setArrayData('users', [{ id: '1', name: 'John' }]);

// Retrieve array data
const users = cache_manager.getArrayData('users'); // Returns [] if not found

// Store object data
cache_manager.setObjectData('nx-settings', { emails: { ... } });

// Retrieve object data
const settings = cache_manager.getObjectData('nx-settings', {}); // Returns {} if not found
```

### Logger Manager

```typescript
import { logger } from 'akeyless-server-commons/managers';

// Info logging
logger.log('Operation completed', { userId: '123' });

// Error logging (handles Axios errors specially)
logger.error('Operation failed', error);

// Warning logging
logger.warn('Deprecated API used', { endpoint: '/old-api' });
```

### Translation Manager

```typescript
import { translation_manager } from 'akeyless-server-commons/managers';

// Generic translation lookup
const title = translation_manager.get_translation(
  'push_notifications',
  'he',
  'event_from_device',
  'title'
);

// SMS translation
const smsCode = translation_manager.get_sms(
  LangOptions.he,
  EntityOptions.user_verification,
  'code'
);

// Email translation
const emailSubject = translation_manager.get_email(
  LangOptions.en,
  EntityOptions.welcome,
  'subject'
);
```

## Best Practices

1. **Cache Manager:**
   - Use array cache for collections accessed sequentially
   - Use object cache for collections accessed by ID
   - Always provide default values for object access
   - Don't mutate cached arrays/objects directly (create copies)

2. **Logger Manager:**
   - Use descriptive messages
   - Include relevant data for debugging
   - Avoid logging sensitive information
   - Use appropriate log level (log/error/warn)

3. **Translation Manager:**
   - Use consistent entity and key naming
   - Provide translations for all supported languages
   - Handle missing translations gracefully
   - Cache is updated automatically by snapshots
