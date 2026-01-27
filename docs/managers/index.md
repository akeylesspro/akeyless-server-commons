# src/managers/index.ts

## Purpose

Barrel export file that re-exports all manager modules for convenient importing. Provides a single entry point for accessing cache, logger, and translation managers.

## Exports

- **`cache_manager`** - Singleton in-memory cache manager for storing arrays and objects by key. Provides fast access to frequently accessed data populated by Firebase snapshots or Redis subscriptions.

- **`translation_manager`** - Singleton translation manager providing cached translation lookups for UI messages, SMS messages, and email content. Supports multiple languages and scopes with fallback to key names when translations are missing.

- **`logger`** - Singleton logger manager providing timestamped logging with intelligent formatting, Axios-aware error handling, and table formatting for structured data. All logs include Israel timezone timestamps.

## Usage

```typescript
// Import all managers
import { cache_manager, logger, translation_manager } from 'akeyless-server-commons/managers';

// Or import specific managers
import { cache_manager } from 'akeyless-server-commons/managers/cache_manager';
import { logger } from 'akeyless-server-commons/managers/logger_manager';
import { translation_manager } from 'akeyless-server-commons/managers/translation_manager';
```

## Context

This barrel export provides convenient access to all singleton managers. All managers use the singleton pattern to ensure consistent behavior across the application:

- **Cache Manager** - Centralized in-memory cache for arrays and objects
- **Logger Manager** - Consistent logging with timestamp formatting
- **Translation Manager** - Multi-language translation lookups
