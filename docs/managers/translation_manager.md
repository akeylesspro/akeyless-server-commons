# src/managers/translation_manager.ts

## Purpose

Singleton translation cache with helpers for generic translations, SMS, and email messages.

## Dependencies

- Types: `EntityOptions`, `LangOptions` from `src/types`
- `TObject` from `akeyless-types-commons`

## Exports and behavior

- `TranslationManager`:
  - `setTranslationData(data)`, `getTranslationData()`
  - `get_translation(scope, lang, entity, key)`:
    - Resolves `entity__key` in `data[scope][lang]` with fallback to key.
  - `get_sms(lang, entity, key)` and `get_email(lang, entity, key)`:
    - Returns translation or `"N/A"` on missing data.
- `translation_manager`: singleton instance.

## Context

Used by notification helpers to render localized messages.
