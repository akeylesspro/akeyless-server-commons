# src/helpers/time_helpers.ts

## Purpose

Comprehensive time conversion and formatting utilities for Firebase timestamps, JavaScript Dates, strings, and numbers. Supports multiple input formats, timezone conversion, custom formatting, and provides both modern flexible functions and legacy compatibility functions.

## Dependencies

- `moment` - Date manipulation and formatting library
- `moment-timezone` - Timezone support for moment
- Firebase `Timestamp` - Firestore timestamp type
- `firebase_timestamp` type from `akeyless-types-commons` - Legacy timestamp format

## Sorting and Comparison

### `sort_by_timestamp(a: Timestamp, b: Timestamp, reverse: boolean = false): number`

Comparator function for sorting Firebase Timestamps.

**Parameters:**
- `a` - First timestamp
- `b` - Second timestamp
- `reverse` - If `true`, sorts descending (default: `false` - ascending)

**Returns:** Number for Array.sort():
- Negative if `a < b` (ascending) or `a > b` (descending)
- Positive if `a > b` (ascending) or `a < b` (descending)
- Zero if equal

**Behavior:**
- Converts timestamps to milliseconds using `any_datetime_to_millis`
- Compares millisecond values

**Example:**
```typescript
const timestamps = [timestamp1, timestamp2, timestamp3];
timestamps.sort((a, b) => sort_by_timestamp(a, b)); // Ascending
timestamps.sort((a, b) => sort_by_timestamp(a, b, true)); // Descending
```

## Time Elapsed Calculation

### `calculate_time_passed(datetime: Date): TimePassedByDate`

Calculates elapsed time from a given date to now.

**Parameters:**
- `datetime` - Past date to calculate from

**Returns:** Object with elapsed time information:
- `seconds_passed` - Total seconds elapsed
- `minutes_passed` - Total minutes elapsed
- `hours_passed` - Total hours elapsed
- `days_passed` - Total days elapsed
- `time_passed_formatted_short` - Short format: `"D:HH:MM:SS"`
- `time_passed_formatted_long` - Long format: `"X d X h X min X sec"`

**Behavior:**
- Calculates difference from `datetime` to current time
- Uses `Math.max(0, ...)` to prevent negative values
- Formats with zero-padding for short format
- Includes only relevant units in long format

**Format Examples:**
- Short: `"1:02:30:45"` (1 day, 2 hours, 30 minutes, 45 seconds)
- Long: `"1 d 2 h 30 min 45 sec"`

**Example:**
```typescript
const pastDate = new Date('2024-01-01T10:00:00Z');
const elapsed = calculate_time_passed(pastDate);
// Returns: {
//   seconds_passed: 2592000,
//   minutes_passed: 43200,
//   hours_passed: 720,
//   days_passed: 30,
//   time_passed_formatted_short: "30:00:00:00",
//   time_passed_formatted_long: "30 d 0 h 0 min 0 sec"
// }
```

## Flexible Time Conversion

### `any_datetime_to_string(firebaseTimestamp: Timestamp | Date | string | firebase_timestamp | number, options?: TimeToStringOptions): string`

Converts any datetime format to a formatted string.

**Parameters:**
- `firebaseTimestamp` - Datetime in any supported format:
  - `Timestamp` - Firebase Firestore Timestamp
  - `Date` - JavaScript Date object
  - `string` - Date string (parsed with `fromFormat`)
  - `number` - Unix timestamp in milliseconds
  - `firebase_timestamp` - Legacy format `{ _seconds, _nanoseconds }`
- `options` - Optional configuration:
  - `format` - Output format string (default: `"DD/MM/YYYY HH:mm:ss"`)
  - `fromFormat` - Input format for string parsing (default: `"DD/MM/YYYY HH:mm:ss"`)
  - `tz` - Timezone string (e.g., `"Asia/Jerusalem"`, `"America/New_York"`)
  - `defaultReturnedValue` - Value to return if conversion fails (default: `"-"`)
  - `debug` - Enable debug logging (default: `false`)

**Returns:** Formatted date string or `defaultReturnedValue` if conversion fails

**Supported Input Formats:**
1. **Firebase Timestamp:**
   - Converts using `toDate()`

2. **JavaScript Date:**
   - Uses directly

3. **String/Number:**
   - Parses using moment with `fromFormat`
   - Validates with `moment.isValid()`
   - Returns default if invalid

4. **Legacy Firebase Format (`{ _seconds, _nanoseconds }`):**
   - Converts to Date: `new Date(seconds * 1000 + nanoseconds / 1000000)`

5. **Alternative Format (`{ seconds, nanoseconds }`):**
   - Similar to legacy format but different property names

**Timezone Handling:**
- If `tz` provided: Uses `moment.tz()` for timezone conversion
- Otherwise: Uses `moment.utc()` for UTC conversion

**Format String Examples:**
- `"DD/MM/YYYY HH:mm:ss"` - `"27/01/2024 14:30:45"`
- `"YYYY-MM-DD"` - `"2024-01-27"`
- `"MMM DD, YYYY"` - `"Jan 27, 2024"`
- `"HH:mm"` - `"14:30"`

**Example:**
```typescript
// Firebase Timestamp
const timestamp = Timestamp.now();
any_datetime_to_string(timestamp);
// Returns: "27/01/2024 14:30:45"

// Custom format
any_datetime_to_string(timestamp, { format: 'YYYY-MM-DD' });
// Returns: "2024-01-27"

// With timezone
any_datetime_to_string(timestamp, { 
  format: 'DD/MM/YYYY HH:mm:ss',
  tz: 'Asia/Jerusalem'
});
// Returns: "27/01/2024 16:30:45" (UTC+2)

// String input
any_datetime_to_string('2024-01-27', { 
  fromFormat: 'YYYY-MM-DD',
  format: 'DD/MM/YYYY'
});
// Returns: "27/01/2024 00:00:00"

// Invalid input
any_datetime_to_string('invalid', { defaultReturnedValue: 'N/A' });
// Returns: "N/A"
```

### `any_datetime_to_millis(firebaseTimestamp: Timestamp | Date | string | number | firebase_timestamp, options?: TimeToMillisOptions): number`

Converts any datetime format to milliseconds since Unix epoch.

**Parameters:**
- `firebaseTimestamp` - Same as `any_datetime_to_string`
- `options` - Optional configuration:
  - `fromFormat` - Input format for string parsing
  - `tz` - Timezone for string parsing
  - `defaultReturnedValue` - Value to return if conversion fails (default: `0`)
  - `debug` - Enable debug logging

**Returns:** Milliseconds since Unix epoch or `defaultReturnedValue` if conversion fails

**Behavior:**
- Similar conversion logic to `any_datetime_to_string`
- Returns numeric milliseconds instead of formatted string
- Uses `Timestamp.toMillis()` for Firebase Timestamps
- Uses `Date.getTime()` for Date objects
- Uses `moment.valueOf()` for string/number inputs

**Example:**
```typescript
const timestamp = Timestamp.now();
const millis = any_datetime_to_millis(timestamp);
// Returns: 1706365845000

const date = new Date('2024-01-27');
const millis = any_datetime_to_millis(date);
// Returns: 1706313600000

// Invalid input
const millis = any_datetime_to_millis('invalid', { defaultReturnedValue: -1 });
// Returns: -1
```

## Legacy Functions

### `timestamp_to_string(firebaseTimestamp: firebase_timestamp, format: string = "DD-MM-YYYY HH:mm:ss"): string`

Legacy function for converting Firebase timestamp to string (kept for backward compatibility).

**Parameters:**
- `firebaseTimestamp` - Legacy format `{ _seconds, _nanoseconds }`
- `format` - Output format (default: `"DD-MM-YYYY HH:mm:ss"`)

**Returns:** Formatted date string

**Behavior:**
- Creates Firebase `Timestamp` from legacy format
- Converts to Date and formats with moment UTC

**Example:**
```typescript
const legacy = { _seconds: 1706365845, _nanoseconds: 0 };
timestamp_to_string(legacy, 'DD/MM/YYYY');
// Returns: "27/01/2024"
```

### `timestamp_to_millis(firebaseTimestamp: firebase_timestamp): number`

Legacy function for converting Firebase timestamp to milliseconds.

**Parameters:**
- `firebaseTimestamp` - Legacy format `{ _seconds, _nanoseconds }`

**Returns:** Milliseconds since Unix epoch

**Example:**
```typescript
const legacy = { _seconds: 1706365845, _nanoseconds: 0 };
timestamp_to_millis(legacy);
// Returns: 1706365845000
```

## Type Definitions

### `TimePassedByDate`

```typescript
interface TimePassedByDate {
  seconds_passed: number;
  minutes_passed: number;
  hours_passed: number;
  days_passed: number;
  time_passed_formatted_short: string;
  time_passed_formatted_long: string;
}
```

### `TimeToStringOptions`

```typescript
interface TimeToStringOptions {
  format?: string;
  fromFormat?: string;
  tz?: string;
  defaultReturnedValue?: string;
  debug?: boolean;
}
```

### `TimeToMillisOptions`

```typescript
interface TimeToMillisOptions extends Omit<TimeToStringOptions, "defaultReturnedValue" | "format"> {
  defaultReturnedValue?: number;
}
```

## Context

These helpers provide comprehensive datetime handling:

- **Format Flexibility** - Accepts multiple input formats (Firebase, Date, string, number)
- **Timezone Support** - Convert between timezones using moment-timezone
- **Custom Formatting** - Use moment format strings for display
- **Error Handling** - Graceful fallbacks for invalid inputs
- **Legacy Support** - Maintains compatibility with old timestamp formats

**Common Use Cases:**
- Displaying timestamps in UI (various formats)
- Sorting records by date
- Calculating time differences
- Converting between timezones
- Parsing date strings from APIs

**Best Practices:**
- Use `any_datetime_to_string` for display formatting
- Use `any_datetime_to_millis` for comparisons and calculations
- Always provide `defaultReturnedValue` for error cases
- Use timezone conversion for user-facing dates
- Use `sort_by_timestamp` for consistent sorting

**Moment Format Reference:**
- `YYYY` - 4-digit year
- `MM` - 2-digit month (01-12)
- `DD` - 2-digit day (01-31)
- `HH` - 2-digit hour (00-23)
- `mm` - 2-digit minute (00-59)
- `ss` - 2-digit second (00-59)
- `MMM` - Short month name (Jan, Feb, etc.)
- `MMMM` - Full month name (January, February, etc.)

**Timezone Examples:**
- `"Asia/Jerusalem"` - Israel Standard Time (UTC+2/+3)
- `"America/New_York"` - Eastern Time (UTC-5/-4)
- `"Europe/London"` - GMT/BST (UTC+0/+1)
- `"Asia/Tokyo"` - Japan Standard Time (UTC+9)
