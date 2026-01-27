# src/helpers/notification_helpers.ts

## Purpose

SMS and push-notification helpers for devices and mobile users.

## Dependencies

- `axios`, `FormData` for SMS providers.
- `Twilio` for international SMS.
- Firebase `messaging` for FCM.
- `cache_manager`, `logger`, `translation_manager`.
- Firebase helpers: `add_document`, `add_audit_record`, `get_nx_settings`.
- Phone utilities from `phone_number_helpers`.
- Types from `akeyless-types-commons`.

## SMS flow

- Provider selection:
  - ICCID numbers → Monogoto API.
  - International numbers → Twilio.
  - Otherwise → Multisend.
- `send_sms(recepient, text, entity_for_audit, details?)`:
  - Expands SMS groups from `nx-settings`.
  - Sends messages in parallel.
  - Writes audit records for each send.
- `keep_outgoing_sms(...)` persists outbound SMS to `nx-sms-out`.

## Push notifications

- `push_event_to_mobile_users(event)`:
  - Reads cached collections (`units`, `usersUnits`, `mobile_users_app_pro`, `app_pro_extra_pushes`).
  - Resolves main driver, secondary drivers, and extra drivers.
  - Respects disabled events per user.
  - Uses translations to build title/body.
  - Sends FCM messages via `send_fcm_message`.
- `send_fcm_message(title, body, tokens, custom_sound?)`:
  - Deduplicates tokens.
  - Sends multicast FCM with Android/APNS payload.
  - Logs success/failure summary.

## Context

Coordinates notifications using cached settings, translations, and Firebase messaging.
