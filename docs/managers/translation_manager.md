# src/managers/translation_manager.ts

## Purpose

Singleton translation manager providing cached translation lookups for UI messages, SMS messages, and email content. Supports multiple languages and scopes with fallback to key names when translations are missing.

## Dependencies

- Types from `src/types`:
  - `EntityOptions` - Entity type enumeration
  - `LangOptions` - Language enumeration
- `TObject` from `akeyless-types-commons` - Generic object type

## Architecture

### Singleton Pattern

The `TranslationManager` uses singleton pattern to ensure a single shared translation cache across the application.

### Data Structure

Translations are stored in a nested object structure:

```typescript
{
  [scope: string]: {
    [lang: string]: {
      [key: string]: string; // Translation value
    };
  };
}
```

**Example Structure:**
```typescript
{
  "push_notifications": {
    "he": {
      "title__event_from_device": "אירוע מהמכשיר",
      "body__speed_limit": "חרגת ממגבלת המהירות"
    },
    "en": {
      "title__event_from_device": "Event from Device",
      "body__speed_limit": "Speed limit exceeded"
    }
  },
  "sms": {
    "he": {
      "user_verification__code": "קוד האימות שלך הוא: {code}",
      "password_reset__link": "קישור לאיפוס סיסמה: {link}"
    }
  },
  "email": {
    "en": {
      "welcome__subject": "Welcome to our service!",
      "welcome__body": "Thank you for joining us."
    }
  }
}
```

### Key Format

Translation keys use double underscore (`__`) separator:
- Format: `{entity}__{key}`
- Example: `"user_verification__code"`
- If entity is empty, key is used as-is: `"key"` (no separator)

## Exports and behavior

### `TranslationManager` Class

Singleton class for translation management.

#### `getInstance(): TranslationManager`

Returns the singleton instance.

**Returns:** `TranslationManager` instance

#### `setTranslationData(data: TObject<any>): void`

Sets the translation data cache.

**Parameters:**
- `data` - Translation data object (replaces entire cache)

**Behavior:**
- Replaces all existing translation data
- Typically called during snapshot initialization
- Used by Firebase snapshot parsers

**Example:**
```typescript
translation_manager.setTranslationData({
  push_notifications: {
    he: { "title__event": "כותרת" },
    en: { "title__event": "Title" }
  }
});
```

#### `getTranslationData(): TObject<any>`

Retrieves the entire translation data cache.

**Returns:** Current translation data object

**Use Cases:**
- Debugging
- Cache inspection
- Manual translation lookups

#### `get_translation(scope: string, lang: string, entity: string, key: string): string`

Retrieves a translation from the cache.

**Parameters:**
- `scope` - Translation scope (e.g., `"push_notifications"`, `"ui"`)
- `lang` - Language code (e.g., `"he"`, `"en"`, `"ru"`)
- `entity` - Entity identifier (e.g., `"event_from_device"`, `"user_verification"`)
- `key` - Translation key (e.g., `"title"`, `"body"`)

**Returns:** Translation string or key if not found

**Behavior:**
1. Constructs lookup key: `{entity}{entity ? "__" : ""}{key}`
2. Looks up: `data[scope][lang][lookupKey]`
3. Returns translation if found
4. Returns lookup key as fallback if not found

**Key Construction:**
- If entity is empty: `"key"`
- If entity exists: `"entity__key"`

**Example:**
```typescript
// With entity
const title = translation_manager.get_translation(
  'push_notifications',
  'he',
  'event_from_device',
  'title'
);
// Looks up: data['push_notifications']['he']['event_from_device__title']
// Returns: "אירוע מהמכשיר" or "event_from_device__title" if not found

// Without entity
const message = translation_manager.get_translation(
  'ui',
  'en',
  '',
  'loading'
);
// Looks up: data['ui']['en']['loading']
// Returns: "Loading..." or "loading" if not found
```

#### `get_sms(lang: LangOptions, entity: EntityOptions, key: string): string`

Retrieves an SMS translation.

**Parameters:**
- `lang` - Language option (`LangOptions` enum)
- `entity` - Entity option (`EntityOptions` enum)
- `key` - Translation key

**Returns:** Translation string or `"N/A"` if not found

**Behavior:**
1. Constructs lookup key: `"{entity}__{key}"`
2. Looks up: `data["sms"][lang][lookupKey]`
3. Returns translation if found
4. Returns `"N/A"` if lookup fails (try-catch)

**Error Handling:**
- Wrapped in try-catch
- Returns `"N/A"` on any error (missing scope, lang, or key)

**Example:**
```typescript
const smsCode = translation_manager.get_sms(
  LangOptions.he,
  EntityOptions.user_verification,
  'code'
);
// Looks up: data['sms']['he']['user_verification__code']
// Returns: "קוד האימות שלך הוא: {code}" or "N/A"
```

#### `get_email(lang: LangOptions, entity: EntityOptions, key: string): string`

Retrieves an email translation.

**Parameters:**
- Same as `get_sms`

**Returns:** Translation string or `"N/A"` if not found

**Behavior:**
- Same as `get_sms` but looks up in `data["email"]` scope

**Example:**
```typescript
const emailSubject = translation_manager.get_email(
  LangOptions.en,
  EntityOptions.welcome,
  'subject'
);
// Looks up: data['email']['en']['welcome__subject']
// Returns: "Welcome to our service!" or "N/A"
```

### `translation_manager: TranslationManager`

Exported singleton instance for direct use.

**Usage:**
```typescript
import { translation_manager } from 'akeyless-server-commons/managers';

const translation = translation_manager.get_translation(
  'push_notifications',
  'he',
  'event_from_device',
  'title'
);
```

## Translation Population

Translations are populated by:

1. **Firebase Snapshot** - `nx-translations` collection loaded on startup
2. **Snapshot Parsers** - `parse_add_update_translations` updates cache
3. **Manual Updates** - `setTranslationData()` can be called directly

**Typical Flow:**
1. Server starts → Firebase snapshot loads `nx-translations`
2. Snapshot parser → Calls `setTranslationData()`
3. Application → Uses `get_translation()` for lookups
4. Updates → Snapshot updates cache automatically

## Language Codes

Common language codes:
- `"he"` - Hebrew
- `"en"` - English
- `"ru"` - Russian

**Note:** Language codes may vary based on translation data structure.

## Context

The translation manager provides:

- **Multi-language Support** - Supports multiple languages
- **Scoped Translations** - Organizes translations by scope
- **Fallback Handling** - Returns key if translation missing
- **Cached Access** - Fast in-memory lookups
- **Type Safety** - Uses enums for language and entity types

**Common Use Cases:**
- Push notification messages
- SMS message templates
- Email subject/body content
- UI text and labels
- Error messages

**Best Practices:**
- Use consistent entity and key naming
- Provide translations for all supported languages
- Use descriptive keys (fallback behavior)
- Cache is updated automatically by snapshots
- Handle `"N/A"` returns gracefully

**Translation Key Naming:**
- Use snake_case for entities: `user_verification`
- Use descriptive keys: `title`, `body`, `subject`
- Separate words with underscores: `event_from_device`
- Keep keys consistent across languages

**Error Handling:**
- `get_translation`: Returns key as fallback (safe)
- `get_sms`/`get_email`: Returns `"N/A"` on error (safe)
- Always handle missing translations gracefully
- Log missing translations for monitoring
