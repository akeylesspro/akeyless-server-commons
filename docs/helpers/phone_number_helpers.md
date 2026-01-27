# src/helpers/phone_number_helpers.ts

## Purpose

Phone number normalization, validation, format detection, and SIM provider inference. Provides utilities for working with Israeli phone numbers, international formats, ICCID numbers, and determining SIM card providers based on phone number prefixes.

## Dependencies

- `SimProvider` enum from `src/types/enums` - Provider enumeration
- `TObject` from `akeyless-types-commons` - Generic object type

## Format Detection Functions

### `is_long_phone_number(phone_number: string): boolean`

Checks if phone number is in international format (starts with `+`).

**Parameters:**
- `phone_number` - Phone number string

**Returns:** `true` if number starts with `+`, `false` otherwise

**Example:**
```typescript
is_long_phone_number('+972501234567'); // true
is_long_phone_number('0501234567');    // false
```

### `is_israel_long_phone_number(phone_number: string): boolean`

Checks if phone number is Israeli international format.

**Parameters:**
- `phone_number` - Phone number string

**Returns:** `true` if number starts with `+9725` or `+972 5`

**Behavior:**
- Supports both formats: `+9725XXXXXXXXX` and `+972 5XXXXXXXXX` (with space)

**Example:**
```typescript
is_israel_long_phone_number('+972501234567'); // true
is_israel_long_phone_number('+972 501234567'); // true
is_israel_long_phone_number('+1234567890');    // false
```

### `is_thailand_long_phone_number(phone_number: string): boolean`

Checks if phone number is Thai international format.

**Parameters:**
- `phone_number` - Phone number string

**Returns:** `true` if number starts with `+66`

**Example:**
```typescript
is_thailand_long_phone_number('+66123456789'); // true
is_thailand_long_phone_number('+972501234567'); // false
```

### `is_international_phone_number(phone_number: string): boolean`

Checks if phone number is international format but not Israeli.

**Parameters:**
- `phone_number` - Phone number string

**Returns:** `true` if number is long format (`+`) but not Israeli

**Behavior:**
- Returns `true` for international numbers excluding Israeli numbers
- Used for determining when to use Twilio for SMS

**Example:**
```typescript
is_international_phone_number('+1234567890');  // true
is_international_phone_number('+972501234567'); // false (Israeli)
is_international_phone_number('0501234567');    // false (not long format)
```

### `is_iccid(number: string): boolean`

Validates if a string is a valid ICCID (Integrated Circuit Card Identifier) number.

**Parameters:**
- `number` - String to validate

**Returns:** `true` if valid ICCID, `false` otherwise

**Validation Rules:**
- Length must be between 19 and 22 characters
- Must contain only digits (`/^\d+$/`)
- Must start with `89`

**ICCID Format:**
- ICCID is the unique identifier for SIM cards
- Format: `89` + country code + issuer identifier + account number + check digit
- Used for device-to-device SMS via Monogoto

**Example:**
```typescript
is_iccid('8912345678901234567890'); // true (valid ICCID)
is_iccid('1234567890123456789');    // false (doesn't start with 89)
is_iccid('89123');                  // false (too short)
```

## Conversion Functions

### `convert_to_short_israel_phone(international_number: string): string`

Converts Israeli international phone number to local format.

**Parameters:**
- `international_number` - Phone number in format `+972XXXXXXXXX`

**Returns:** Phone number in format `0XXXXXXXXX`

**Behavior:**
- Replaces `+972` with `0`
- Simple string replacement (no validation)

**Example:**
```typescript
convert_to_short_israel_phone('+972501234567'); // '0501234567'
```

## SIM Provider Detection

### `is_sim_provider_partner(phone_number: string): boolean`

Checks if phone number belongs to Partner (Israeli carrier).

**Parameters:**
- `phone_number` - Phone number in any format

**Returns:** `true` if number starts with `054` (after normalization)

**Behavior:**
- Normalizes phone number first using `long_short_phone_numbers`
- Checks `short_phone_number` prefix

**Example:**
```typescript
is_sim_provider_partner('0541234567');     // true
is_sim_provider_partner('+972541234567'); // true
is_sim_provider_partner('0501234567');    // false
```

### `is_sim_provider_pelephone(phone_number: string): boolean`

Checks if phone number belongs to Pelephone (Israeli carrier).

**Parameters:**
- Same as `is_sim_provider_partner`

**Returns:** `true` if number starts with `050`

**Example:**
```typescript
is_sim_provider_pelephone('0501234567');     // true
is_sim_provider_pelephone('+972501234567'); // true
```

### `is_sim_provider_celcom(phone_number: string): boolean`

Checks if phone number belongs to Celcom (Israeli carrier).

**Parameters:**
- Same as `is_sim_provider_partner`

**Returns:** `true` if number starts with `052`

**Example:**
```typescript
is_sim_provider_celcom('0521234567');     // true
is_sim_provider_celcom('+972521234567'); // true
```

### `is_sim_provider_monogoto(phone_number: string): boolean`

Checks if identifier is a Monogoto ICCID number.

**Parameters:**
- `phone_number` - Phone number or ICCID

**Returns:** `true` if valid ICCID (uses `is_iccid`)

**Example:**
```typescript
is_sim_provider_monogoto('8912345678901234567890'); // true
is_sim_provider_monogoto('0501234567');             // false
```

### `get_sim_provider(phone_number: string): SimProvider`

Determines SIM provider based on phone number prefix or ICCID.

**Parameters:**
- `phone_number` - Phone number in any format

**Returns:** `SimProvider` enum value:
- `SimProvider.partner` - Partner carrier
- `SimProvider.pelephone` - Pelephone carrier
- `SimProvider.celcom` - Celcom carrier
- `SimProvider.monogoto` - Monogoto (ICCID)
- `SimProvider.unknown` - Unknown provider

**Behavior:**
- Checks providers in order: Partner → Pelephone → Celcom → Monogoto
- Returns first match or `unknown` if no match

**Example:**
```typescript
get_sim_provider('0541234567'); // SimProvider.partner
get_sim_provider('0501234567'); // SimProvider.pelephone
get_sim_provider('8912345678901234567890'); // SimProvider.monogoto
get_sim_provider('+1234567890'); // SimProvider.unknown
```

## Phone Number Normalization

### `long_short_phone_numbers(phone_number: string): {short_phone_number: string, long_phone_number: string, is_israeli: boolean}`

Normalizes phone number to both short and long formats.

**Parameters:**
- `phone_number` - Phone number in any format

**Returns:** Object with:
- `short_phone_number` - Local format number
- `long_phone_number` - International format number
- `is_israeli` - Whether number is Israeli

**Behavior:**
1. **Empty String:**
   - Returns all fields as empty string, `is_israeli: true`

2. **ICCID Numbers:**
   - Returns ICCID as both short and long (no conversion)
   - `is_israeli: false`

3. **Israeli Local Format (`05XXXXXXXXX`):**
   - `short_phone_number`: `05XXXXXXXXX` (as-is)
   - `long_phone_number`: `+9725XXXXXXXXX` (replaces `05` with `+9725`)
   - `is_israeli: true`

4. **Israeli International Format (`+9725XXXXXXXXX`):**
   - `long_phone_number`: `+9725XXXXXXXXX` (as-is)
   - `short_phone_number`: `05XXXXXXXXX` (replaces `+9725` with `05`)
   - `is_israeli: true`

5. **US Format (`+1XXXXXXXXXX`):**
   - `long_phone_number`: `+1XXXXXXXXXX` (as-is)
   - `short_phone_number`: `XXXXXXXXXX` (removes `+1`)
   - `is_israeli: false`

6. **Other Formats:**
   - Returns number as-is for both formats
   - `is_israeli: false`

**Example:**
```typescript
// Israeli local
long_short_phone_numbers('0501234567');
// Returns: {
//   short_phone_number: '0501234567',
//   long_phone_number: '+972501234567',
//   is_israeli: true
// }

// Israeli international
long_short_phone_numbers('+972501234567');
// Returns: {
//   short_phone_number: '0501234567',
//   long_phone_number: '+972501234567',
//   is_israeli: true
// }

// US number
long_short_phone_numbers('+1234567890');
// Returns: {
//   short_phone_number: '234567890',
//   long_phone_number: '+1234567890',
//   is_israeli: false
// }

// ICCID
long_short_phone_numbers('8912345678901234567890');
// Returns: {
//   short_phone_number: '8912345678901234567890',
//   long_phone_number: '8912345678901234567890',
//   is_israeli: false
// }
```

## Context

These helpers are used throughout the application for:

- **SMS Provider Routing** - Determining which SMS provider to use based on number format
- **Phone Number Normalization** - Converting between formats for storage and display
- **User Lookup** - Finding users by phone number in various formats
- **SIM Provider Detection** - Identifying carrier for device management
- **Data Validation** - Validating phone number formats before processing

**Common Use Cases:**
- Normalizing user input phone numbers
- Routing SMS messages to correct provider
- Finding users by phone (handles multiple formats)
- Device SIM card management
- Phone number display formatting

**Best Practices:**
- Always normalize phone numbers before storage
- Use `long_short_phone_numbers` to get both formats
- Check `is_israeli` flag for country-specific logic
- Use `is_iccid` to detect device SIM cards
- Use `get_sim_provider` for carrier-specific operations

**Israeli Phone Number Formats:**
- Local: `05X-XXXXXXX` or `05XXXXXXXXX`
- International: `+972-5X-XXXXXXX` or `+9725XXXXXXXXX`
- Common prefixes:
  - `050` - Pelephone
  - `052` - Celcom
  - `054` - Partner
  - `055` - Hot Mobile
  - `058` - Golan Telecom
