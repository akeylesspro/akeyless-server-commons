# src/helpers/global_helpers.ts

## Purpose

General-purpose server utilities for environment validation, JSON response formatting, service URL resolution, geocoding, type guards, data normalization, and HTTP request helpers. These are foundational utilities used across the entire application.

## Dependencies

- `fs.readFileSync` - File system operations for reading package.json
- `axios` - HTTP client for API requests
- `https` - HTTPS module for SSL configuration
- `cache_manager` - Accesses cached settings for geocoding API keys
- `logger` - Logging utility
- Types:
  - `JsonOK`, `JsonFailed` from `src/types`
  - `NxServiceNameMap` from `src/types`
  - `Geo`, `LanguageOptions`, `TObject` from `akeyless-types-commons`

## Environment Validation

### `init_env_variables(required_vars: string[] = []): TObject<string>`

Validates required environment variables and returns all environment variables as a typed object.

**Parameters:**
- `required_vars` - Array of required environment variable names

**Returns:** Object mapping all environment variable names to their string values

**Behavior:**
- Validates each required variable exists in `process.env`
- Logs error and exits process (exit code 1) if any required variable is missing
- Returns object containing all environment variables (not just required ones)

**Throws:** Process exits with code 1 if required variable missing

**Example:**
```typescript
// Validates and loads all env vars
const env = init_env_variables(['mode', 'port', 'project_id']);

// Access variables
const mode = env.mode;
const port = env.port;
```

## JSON Response Helpers

### `json_ok(data: TObject<any> | TObject<any>[]): JsonOK`

Creates a standardized success JSON response.

**Parameters:**
- `data` - Data to return (object or array)

**Returns:** Object with `{ success: true, data }` structure

**Example:**
```typescript
res.json(json_ok({ user: 'John', id: '123' }));
// Returns: { success: true, data: { user: 'John', id: '123' } }

res.json(json_ok([{ id: '1' }, { id: '2' }]));
// Returns: { success: true, data: [{ id: '1' }, { id: '2' }] }
```

### `json_failed(error: any, msg?: string): JsonFailed`

Creates a standardized error JSON response.

**Parameters:**
- `error` - Error object, Error instance, or error message string
- `msg` - Optional additional error message

**Returns:** Object with `{ success: false, error, msg }` structure

**Behavior:**
- Extracts error message from Error instances
- Falls back to error string or default message if error is not an Error
- Default error message: `"general error: something happened "`

**Example:**
```typescript
res.json(json_failed(new Error('User not found'), 'Failed to fetch user'));
// Returns: { success: false, error: 'User not found', msg: 'Failed to fetch user' }

res.json(json_failed('Database connection failed'));
// Returns: { success: false, error: 'Database connection failed', msg: undefined }
```

### `parse_error(error: any): { name?: string, message?: string } | any`

Normalizes error objects to a consistent format.

**Parameters:**
- `error` - Error instance or any value

**Returns:** 
- If Error instance: `{ name: error.name, message: error.message }`
- Otherwise: returns error as-is

**Example:**
```typescript
const normalized = parse_error(new Error('Something went wrong'));
// Returns: { name: 'Error', message: 'Something went wrong' }

const normalized = parse_error('String error');
// Returns: 'String error'
```

## Utility Functions

### `get_version(packageJsonPath: string): string`

Reads and extracts version from package.json file.

**Parameters:**
- `packageJsonPath` - Path to package.json file

**Returns:** Version string from package.json

**Throws:** JSON parse errors if package.json is invalid

**Example:**
```typescript
const version = get_version('./package.json');
// Returns: '1.0.168'
```

### `sleep(ms: number = 2500): Promise<void>`

Creates a promise-based delay (sleep function).

**Parameters:**
- `ms` - Milliseconds to wait (default: `2500`)

**Returns:** Promise that resolves after specified delay

**Example:**
```typescript
await sleep(1000); // Wait 1 second
await sleep(); // Wait 2.5 seconds (default)
```

## Service URL Resolution

### `get_nx_service_urls(env_name: string = "mode"): NxServiceNameMap`

Resolves base URLs for all NX microservices based on environment.

**Parameters:**
- `env_name` - Environment variable name to check (default: `"mode"`)

**Returns:** Object mapping service names to base URLs

**Service URLs by Environment:**

**Local:**
- `bi`: `http://localhost:9002/api/bi`
- `call_center`: `http://localhost:9003/api/call-center`
- `dashboard`: `http://localhost`
- `devices`: `http://localhost:9001/api/devices`
- `end_users`: `http://10.100.102.9:9011/api/end-users`
- `notifications`: `http://localhost:9006/api/notifications`
- `installer`: `http://localhost`
- `ox_server`: `http://localhost`
- `toolbox`: `http://localhost`

**Production:**
- `bi`: `https://nx-api.info/api/bi`
- `call_center`: `https://nx-api.info/api/call-center`
- `dashboard`: `https://akeyless-dashboard.online`
- `devices`: `https://nx-api.info/api/devices`
- `end_users`: `https://nx-api.info/api/end-users`
- `notifications`: `https://nx-api.info/api/notifications`
- `installer`: `https://installerapp.online`
- `ox_server`: `https://akeyless-online.info`
- `toolbox`: `https://akeyless-toolbox.online`

**QA:**
- `bi`: `https://nx-api.xyz/api/bi`
- `call_center`: `https://nx-api.xyz/api/call-center`
- `dashboard`: `https://akeyless-dashboard.xyz`
- `devices`: `https://nx-api.xyz/api/devices`
- `end_users`: `https://nx-api.xyz/api/end-users`
- `notifications`: `https://nx-api.xyz/api/notifications`
- `installer`: `https://installerapp.xyz`
- `ox_server`: `https://akeyless-online.xyz`
- `toolbox`: `https://akeyless-toolbox.xyz`

**Behavior:**
- Reads environment variable (default: `process.env.mode`)
- Maps values:
  - `"production"` or `"prod"` → `prod` URLs
  - `"qa"` → `qa` URLs
  - Otherwise → `local` URLs
- Throws error if environment variable is missing

**Throws:** `Error` if environment variable is missing

**Example:**
```typescript
const urls = get_nx_service_urls('mode');
const devicesUrl = urls.devices; // 'https://nx-api.info/api/devices' (prod)
```

## Geocoding

### `get_address_by_geo({ lat, lng }: Geo, currentLanguage: LanguageOptions): Promise<string>`

Reverse geocodes coordinates to a formatted address using Google Geocoding API.

**Parameters:**
- `lat` - Latitude (-90 to 90)
- `lng` - Longitude (-180 to 180)
- `currentLanguage` - Language preference (`LanguageOptions.He` or `LanguageOptions.En`)

**Returns:** Promise resolving to formatted address string (truncated to 35 characters) or empty string

**Behavior:**
1. Validates coordinates are within valid ranges
2. Maps language:
   - `LanguageOptions.He` → `"iw"` (Hebrew)
   - Otherwise → `"en"` (English)
3. Retrieves Google Geocoding API key from cached `nx-settings.google.geocode_api_key`
4. Calls Google Geocoding API with coordinates and language
5. Extracts `formatted_address` from first result
6. Truncates to 35 characters
7. Returns empty string on error or if no results

**Throws:** `Error("missing env google api key")` if API key not found in settings

**Error Handling:** Returns empty string on API errors (logged but not thrown)

**Example:**
```typescript
const address = await get_address_by_geo(
  { lat: 31.7683, lng: 35.2137 },
  LanguageOptions.He
);
// Returns: 'ירושלים, ישראל' (truncated to 35 chars)
```

## Type Guards and Utilities

### `validate_and_cast<T>(variable: any, condition: Boolean): variable is T`

TypeScript type guard helper for runtime type validation.

**Parameters:**
- `variable` - Value to validate
- `condition` - Boolean condition to check

**Returns:** Type predicate (TypeScript type guard)

**Example:**
```typescript
const value: unknown = getSomeValue();
if (validate_and_cast<User>(value, typeof value === 'object' && 'id' in value)) {
  // TypeScript now knows value is User
  console.log(value.id);
}
```

### `get_or_default<T>(value: T | undefined, default_value: T | (() => T)): T`

Returns value if defined, otherwise returns default (supports lazy evaluation).

**Parameters:**
- `value` - Value to check
- `default_value` - Default value or function returning default

**Returns:** Value if defined, otherwise default value

**Behavior:**
- If `value !== undefined`, returns `value`
- If `default_value` is a function, calls it and returns result
- Otherwise returns `default_value` directly

**Example:**
```typescript
const name = get_or_default(user.name, 'Anonymous');
const count = get_or_default(cache.count, () => expensiveCalculation());
```

## Data Normalization

### `trim_strings<T>(input: any): any`

Recursively trims all string values in objects and arrays.

**Parameters:**
- `input` - Value to trim (string, array, object, or primitive)

**Returns:** Trimmed value with same structure

**Behavior:**
- Strings: Returns trimmed string
- Arrays: Recursively trims each element
- Objects: Recursively trims all properties
- Preserves special types: `Date`, `RegExp`, `Map`, `Set` (returns as-is)
- Primitives: Returns as-is

**Example:**
```typescript
const trimmed = trim_strings({
  name: '  John  ',
  tags: ['  tag1  ', '  tag2  '],
  nested: { value: '  value  ' }
});
// Returns: { name: 'John', tags: ['tag1', 'tag2'], nested: { value: 'value' } }
```

### `remove_nulls_and_undefined(obj: Record<string, any>): Record<string, any>`

Removes properties with `null` or `undefined` values from an object.

**Parameters:**
- `obj` - Object to clean

**Returns:** New object without null/undefined properties

**Example:**
```typescript
const cleaned = remove_nulls_and_undefined({
  name: 'John',
  age: null,
  email: undefined,
  active: true
});
// Returns: { name: 'John', active: true }
```

## HTTP Helpers

### `ignore_ssl_request(config: AxiosRequestConfig): Promise<AxiosResponse>`

Makes an HTTP request with optional SSL verification bypass for QA environment.

**Parameters:**
- `config` - Axios request configuration

**Returns:** Promise resolving to Axios response

**Behavior:**
- Checks `mode` environment variable
- If `mode === "qa"`, disables SSL certificate verification
- Otherwise, uses default SSL verification
- Makes request using `axios`

**Security Note:** SSL verification is disabled only in QA environment for testing purposes

**Example:**
```typescript
const response = await ignore_ssl_request({
  method: 'GET',
  url: 'https://internal-api.example.com/data',
  headers: { 'Authorization': 'Bearer token' }
});
```

## Context

These utilities provide foundational functionality used throughout the application:

- **Environment Management** - Centralized env var validation and access
- **API Responses** - Consistent JSON response format across all endpoints
- **Service Communication** - Environment-aware service URL resolution
- **Data Normalization** - String trimming and null removal for clean data
- **Geocoding** - Address lookup from coordinates
- **Type Safety** - TypeScript type guards and utilities

**Best Practices:**
- Always use `init_env_variables()` at application startup
- Use `json_ok()` and `json_failed()` for all API responses
- Use `trim_strings()` on user input before processing
- Use `get_nx_service_urls()` for inter-service communication
- Use `ignore_ssl_request()` only when necessary (QA environment)
