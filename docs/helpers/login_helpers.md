# src/helpers/login_helpers.ts

## Purpose

User lookup helpers for finding NX users and mobile app users by various identifiers (email, phone number, UID). Supports flexible identifier resolution with automatic format detection and normalization.

## Dependencies

- `query_document_optional` from `firebase_helpers` - Non-throwing Firestore query helper
- `logger` manager - Imported but not currently used
- Types from `akeyless-types-commons`:
  - `NxUser` - NX user data structure
  - `MobileAppUser` - Mobile app user data structure

## Exports and behavior

### `convert_to_short_phone_number(phone_number: string): string`

Converts an Israeli international phone number format to local format.

**Parameters:**
- `phone_number` - Phone number in format `+972XXXXXXXXX`

**Returns:** Phone number in format `0XXXXXXXXX`

**Behavior:**
- Splits on `"+972"` and takes the second part
- Prepends `"0"` to create local format
- Example: `"+972501234567"` → `"0501234567"`

**Note:** This is a simple conversion and doesn't validate phone number format

**Example:**
```typescript
const short = convert_to_short_phone_number('+972501234567');
// Returns: '0501234567'
```

### `get_user_by_identifier(identifier: string, ignore_log: boolean = false): Promise<NxUser | null>`

Finds an NX user by email or phone number with automatic format detection.

**Parameters:**
- `identifier` - Email address or phone number
- `ignore_log` - Whether to suppress error logging (default: `false`)

**Returns:** Promise resolving to `NxUser` object or `null` if not found

**Behavior:**
1. **Email Detection:**
   - Checks if identifier contains `"@"` and `"."`
   - If email format detected, queries `nx-users` collection by `email` field
   - Returns user or `null`

2. **Phone Number Detection:**
   - If not email format, treats as phone number
   - Converts identifier to short format using `convert_to_short_phone_number`
   - Queries `nx-users` collection by `phone_number` field
   - Uses Firestore `in` operator to match both:
     - Short format (e.g., `"0501234567"`)
     - Original format (e.g., `"+972501234567"`)
   - Returns user or `null`

**Error Handling:**
- Never throws errors (uses `query_document_optional`)
- Returns `null` if user not found
- Logs errors unless `ignore_log` is `true`

**Example:**
```typescript
// Find by email
const user1 = await get_user_by_identifier('user@example.com');
// Queries: nx-users where email == 'user@example.com'

// Find by phone (long format)
const user2 = await get_user_by_identifier('+972501234567');
// Queries: nx-users where phone_number in ['0501234567', '+972501234567']

// Find by phone (short format)
const user3 = await get_user_by_identifier('0501234567');
// Queries: nx-users where phone_number in ['0501234567', '0501234567']
```

### `get_mobile_app_user_by_uid(uid: string, ignore_log: boolean = false): Promise<MobileAppUser | null>`

Finds a mobile app user by Firebase UID.

**Parameters:**
- `uid` - Firebase user UID
- `ignore_log` - Whether to suppress error logging (default: `false`)

**Returns:** Promise resolving to `MobileAppUser` object or `null` if not found

**Behavior:**
- Queries `mobile_users_app_pro` collection by `uid` field
- Uses `query_document_optional` (never throws)
- Returns user or `null`

**Error Handling:**
- Never throws errors
- Returns `null` if user not found
- Logs errors unless `ignore_log` is `true`

**Example:**
```typescript
const mobileUser = await get_mobile_app_user_by_uid('firebase-uid-123');
if (mobileUser) {
  console.log(`Found user: ${mobileUser.short_phone_number}`);
}
```

## Context

These helpers are used for:

- **Authentication** - Finding users during login/registration flows
- **User Lookup** - Resolving user identities from various identifiers
- **Phone/Email Resolution** - Converting between different identifier formats
- **Mobile App Integration** - Finding mobile app users by Firebase UID

**Common Use Cases:**
- Login endpoints that accept email or phone
- User verification flows
- Finding users from authentication tokens
- Phone number normalization for lookups

**Best Practices:**
- Use `get_user_by_identifier` for flexible identifier resolution
- Use `get_mobile_app_user_by_uid` specifically for Firebase Auth UIDs
- Handle `null` returns appropriately (user not found)
- Use `ignore_log: true` for non-critical lookups to reduce log noise
- Consider caching user lookups when appropriate

**Phone Number Handling:**
- The helpers handle both Israeli long format (`+972`) and short format (`0`)
- Phone queries use `in` operator to match both formats
- For other countries, consider extending the conversion logic

**Error Handling Philosophy:**
- These helpers use non-throwing queries (`query_document_optional`)
- Return `null` instead of throwing errors
- Allows callers to handle "not found" cases gracefully
- Reduces try-catch boilerplate in calling code
