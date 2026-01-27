# src/helpers/notification_helpers.ts

## Purpose

SMS and push notification helpers for sending messages to users via multiple SMS providers (Multisend, Twilio, Monogoto) and Firebase Cloud Messaging (FCM). Includes intelligent provider selection, SMS group expansion, event-based push notifications, and comprehensive audit logging.

## Dependencies

- `axios` - HTTP client for SMS provider APIs
- `FormData` - Form data encoding for Multisend API
- `Twilio` - Twilio SDK for international SMS
- Firebase `messaging` - FCM push notification service
- `cache_manager` - Accesses cached collections and settings
- `logger` - Logging utility
- `translation_manager` - Translation lookup for push notifications
- Firebase helpers:
  - `add_document` - Persists SMS records
  - `add_audit_record` - Audit logging
  - `get_nx_settings` - Retrieves SMS provider settings
- Phone utilities from `phone_number_helpers`:
  - `is_iccid` - ICCID number detection
  - `is_international_phone_number` - International format detection
  - `is_israel_long_phone_number` - Israeli format detection
  - `is_thailand_long_phone_number` - Thai format detection
- Types from `akeyless-types-commons`:
  - `EventFromDevice` - Device event structure
  - `TObject` - Generic object type
- `uuid` - Unique ID generation for SMS tracking
- `Timestamp` - Firestore timestamp

## SMS Provider Selection

The system automatically selects SMS provider based on recipient number:

1. **ICCID Numbers** (19-22 digits starting with `89`) → **Monogoto**
   - Used for device-to-device SMS via SIM cards
   - Requires authentication with Monogoto API

2. **International Numbers** (not Israeli, not Thai) → **Twilio**
   - Used for international SMS delivery
   - Requires Twilio account credentials

3. **Israeli/Thai Numbers** → **Multisend**
   - Default provider for local Israeli numbers
   - Supports both local and international formats

## SMS Functions

### `send_sms(recepient: string, text: string, entity_for_audit: string, details?: TObject<any>): Promise<void>`

Sends SMS to recipient(s) with automatic provider selection and group expansion.

**Parameters:**
- `recepient` - Phone number or SMS group name from settings
- `text` - SMS message text
- `entity_for_audit` - Entity identifier for audit logging
- `details` - Optional additional details for logging

**Returns:** Promise resolving when all SMS messages are sent

**Behavior:**
1. **Group Expansion:**
   - Checks if `recepient` matches an SMS group in `nx-settings.sms_groups.values`
   - If group found, expands to all numbers in group
   - Otherwise, uses recipient as single number

2. **Deduplication:**
   - Removes duplicate phone numbers from recipient list

3. **Parallel Sending:**
   - Sends SMS to all recipients in parallel using `Promise.all`
   - Each send includes provider selection logic

4. **Provider Selection (per recipient):**
   - If ICCID → uses `send_iccid_sms` (Monogoto)
   - If international (not Israeli, not Thai) → uses `send_international_sms` (Twilio)
   - Otherwise → uses `send_local_sms` (Multisend)

5. **Audit Logging:**
   - Writes audit record for each successful send
   - Includes recipient, message, and provider used

**Throws:** Error message if any SMS send fails

**Error Handling:**
- Errors are logged with entity context
- Throws error message: `"{entity_for_audit}, send_sms failed: {error}"`

**Example:**
```typescript
// Single recipient
await send_sms('+972501234567', 'Your code is 1234', 'user_verification');

// SMS group
await send_sms('admins', 'System alert', 'system_notification', { alert_type: 'critical' });
```

### `send_local_sms(recepient: string, text: string, details?: TObject<any>): Promise<"multisend">` (Internal)

Sends SMS via Multisend API for Israeli/local numbers.

**Parameters:**
- `recepient` - Phone number
- `text` - SMS message
- `details` - Optional details

**Returns:** Promise resolving to `"multisend"` provider name

**Behavior:**
- Retrieves Multisend credentials from `nx-settings.sms_provider.multisend`
- Creates FormData with: user, password, from, recipient, message
- Generates unique message ID using UUID
- Sets `international: "1"` flag if recipient is international format
- Sends POST request to Multisend API
- Validates response (status 200 and `success: true`)
- Persists SMS record via `keep_outgoing_sms`
- Logs success

**Throws:** Error if API request fails or response indicates failure

### `send_international_sms(recepient: string, text: string, details?: TObject<any>): Promise<"twilio">` (Internal)

Sends SMS via Twilio API for international numbers.

**Parameters:**
- Same as `send_local_sms`

**Returns:** Promise resolving to `"twilio"` provider name

**Behavior:**
- Retrieves Twilio credentials from `nx-settings.sms_provider.twilio`
- Creates Twilio client with account SID and token
- Sends message using messaging service SID
- Validates response (checks for `errorMessage`)
- Persists SMS record via `keep_outgoing_sms`
- Logs success

**Throws:** Error if Twilio API call fails

### `send_iccid_sms(recepient: string, text: string, details?: TObject<any>): Promise<"monogoto">` (Internal)

Sends SMS via Monogoto API for ICCID numbers (device SIM cards).

**Parameters:**
- Same as `send_local_sms`

**Returns:** Promise resolving to `"monogoto"` provider name

**Behavior:**
1. Authenticates with Monogoto API (`login_to_monogoto`)
2. Retrieves Monogoto credentials from settings
3. Sends SMS to device using ICCID: `ThingId_ICCID_{recepient}`
4. Includes authorization token and customer API key
5. Validates response (status 200)
6. Persists SMS record via `keep_outgoing_sms`
7. Logs success

**Throws:** Error if authentication or SMS send fails

### `login_to_monogoto(): Promise<any>` (Internal)

Authenticates with Monogoto API and returns token.

**Returns:** Promise resolving to authentication response with `token` and `CustomerId`

**Throws:** Error if authentication fails

### `keep_outgoing_sms(recepient: string, content: string, service: string, external_id: string, details?: TObject<any>): Promise<void>` (Internal)

Persists outbound SMS record to Firestore.

**Parameters:**
- `recepient` - Recipient phone number
- `content` - SMS message content
- `service` - Provider name (`"multisend"`, `"twilio"`, or `"monogoto"`)
- `external_id` - External provider message ID
- `details` - Optional additional details

**Behavior:**
- Creates document in `nx-sms-out` collection
- Includes: `external_id`, `content`, `recipient`, `service`, `timestamp`, `status: "new"`, `details`
- Uses Firestore `Timestamp.now()` for timestamp

## Push Notifications

### `push_event_to_mobile_users(event: EventFromDevice): Promise<void>`

Sends push notifications to mobile app users for device events.

**Parameters:**
- `event` - Event object with:
  - `car_number` - Vehicle identifier
  - `event_id` - Event type ID
  - `event_name` - Event name (used for translation lookup)
  - `source` - Event source (`"erm"`, `"erm2"`, or other)

**Returns:** Promise resolving when all notifications are sent

**Behavior:**
1. **Cache Validation:**
   - Reads cached collections: `units`, `usersUnits`, `mobile_users_app_pro`, `app_pro_extra_pushes`
   - Throws error if any cache is empty

2. **Main Driver Resolution:**
   - Finds unit by `car_number`
   - Finds mobile user by matching `unit.userPhone` with `mobile_users_app_pro.short_phone_number`

3. **Secondary Drivers Resolution:**
   - Finds all `usersUnits` entries for the vehicle
   - Matches `usersUnits.phone` with `mobile_users_app_pro.long_phone_number`

4. **Extra Drivers Resolution:**
   - Finds `app_pro_extra_pushes` entries for the vehicle
   - Matches `uid` values with `mobile_users_app_pro.uid`

5. **Event Filtering:**
   - Checks `mobile_user.disabled_events[car_number][source]` array
   - Skips notification if event ID is in disabled list
   - Normalizes source: `"erm"` or `"erm2"` → `"erm"`

6. **Translation:**
   - Gets user language (`heb`, `en`, or `ru`)
   - Maps to translation language code (`he`, `en`, `ru`)
   - Looks up title from `push_notifications` translations
   - Looks up body from `events_from_device` translations using `event_name`

7. **Notification Sending:**
   - Calls `send_fcm_message` for each user
   - Uses user's FCM token

**Throws:** Error if cached data is missing

**Example:**
```typescript
await push_event_to_mobile_users({
  car_number: '12345',
  event_id: 'speed_limit',
  event_name: 'speed_limit_exceeded',
  source: 'erm'
});
```

### `send_fcm_message(title: string, body: string, fcm_tokens: string[], custom_sound?: string): Promise<{success: boolean, response: string, success_count?: number, failure_count?: number}>`

Sends Firebase Cloud Messaging (FCM) push notifications to multiple devices.

**Parameters:**
- `title` - Notification title
- `body` - Notification body text
- `fcm_tokens` - Array of FCM registration tokens
- `custom_sound` - Optional custom sound file name (without extension)

**Returns:** Promise resolving to result object:
- `success` - `true` if all messages sent successfully
- `response` - JSON string of FCM responses or error message
- `success_count` - Number of successful sends (if available)
- `failure_count` - Number of failed sends (if available)

**Behavior:**
1. **Deduplication:**
   - Removes duplicate FCM tokens using `Set`

2. **Validation:**
   - Returns early with error if no tokens provided

3. **Message Construction:**
   - Creates `MulticastMessage` with:
     - `tokens` - Array of FCM tokens
     - `notification` - Title and body
     - `android` - Android-specific config:
       - `ttl: 3600000` (1 hour)
       - `priority: "high"`
       - Custom sound and channel ID
     - `apns` - iOS-specific config:
       - Custom sound (`.wav` extension added)
       - Alert with title and body

4. **Sending:**
   - Uses Firebase `messaging.sendEachForMulticast`
   - Handles partial success (some tokens succeed, some fail)

5. **Logging:**
   - Logs success/failure summary
   - Includes response details for debugging

**Error Handling:**
- Catches exceptions and returns error result
- Never throws errors (returns error object instead)

**Example:**
```typescript
const result = await send_fcm_message(
  'New Message',
  'You have a notification',
  ['token1', 'token2'],
  'notification_sound'
);

if (result.success) {
  console.log(`Sent to ${result.success_count} devices`);
}
```

## SMS Settings Structure

SMS provider settings are stored in `nx-settings.sms_provider`:

```typescript
{
  multisend: {
    user: string;
    password: string;
    from: string;
  };
  twilio: {
    account_sid: string;
    token: string;
    messaging_service_sid: string;
  };
  monogoto: {
    user: string;
    password: string;
    from: string;
  };
  sms_groups: {
    values: {
      [groupName: string]: string[]; // Array of phone numbers
    };
  };
}
```

## Context

This module provides comprehensive notification capabilities:

- **Multi-Provider SMS** - Automatic provider selection based on recipient
- **SMS Groups** - Send to multiple recipients via group names
- **Event-Based Push** - Automatic push notifications for device events
- **User Filtering** - Respects user preferences for disabled events
- **Multi-Language** - Supports Hebrew, English, and Russian
- **Audit Trail** - All SMS sends logged for compliance
- **Parallel Processing** - Efficient batch sending

**Best Practices:**
- Use SMS groups for common recipient lists
- Always provide `entity_for_audit` for tracking
- Handle FCM token failures gracefully (tokens can expire)
- Use translations for push notifications (don't hardcode text)
- Check user disabled events before sending push notifications

**Common Use Cases:**
- User verification codes
- Password reset links
- System alerts and notifications
- Device event notifications (speed, geofence, etc.)
- Marketing messages (via SMS groups)
