# src/managers/logger_manager.ts

## Purpose

Singleton logger manager providing timestamped logging with intelligent formatting, Axios-aware error handling, and table formatting for structured data. All logs include Israel timezone timestamps for consistent time tracking.

## Dependencies

- `moment-timezone` - Timezone-aware date formatting
- `axios` - For detecting Axios errors
- `parse_error` helper - Safe error serialization
- `lodash.isObject` - Object type checking
- `TObject` from `akeyless-types-commons` - Generic object type

## Architecture

### Singleton Pattern

The `LoggerManager` uses singleton pattern to ensure consistent logging behavior across the application. All logs share the same formatting and timestamp source.

### Timestamp Format

All logs include timestamps in `Asia/Jerusalem` timezone:
- Format: `DD/MM/YYYY HH:mm:ss.SS`
- Example: `27/01/2024 14:30:45.12`
- Includes milliseconds for precise timing

## Exports and behavior

### `LoggerManager` Class

Singleton class for logging operations.

#### `getInstance(): LoggerManager`

Returns the singleton instance.

**Returns:** `LoggerManager` instance

#### `log(msg: string, data?: TObject<any> | any[]): void`

Logs an informational message with optional data.

**Parameters:**
- `msg` - Log message string
- `data` - Optional data to log (object, array, or primitive)

**Behavior:**
1. **Table Formatting (Automatic):**
   - Detects if data is suitable for table display
   - Conditions for table format:
     - Not running in Kubernetes (`!process.env.KUBERNETES_SERVICE_HOST`)
     - Data is an array with more than 1 item
     - All items are objects (not arrays)
     - All object values are primitives (`string`, `number`, `boolean`, or `null`)
     - At least one object has more than 1 property
   - If conditions met → uses `console.table()` for formatted table
   - Otherwise → uses standard `console.log()` with JSON stringification

2. **Standard Formatting:**
   - Timestamp prefix: `"{timestamp} - {msg}"`
   - Data suffix: `": {JSON.stringify(data)}"` or empty if no data
   - Objects and arrays are JSON stringified
   - Primitives are logged as-is

**Example:**
```typescript
// Simple message
logger.log('Server started');
// Output: 27/01/2024 14:30:45.12 - Server started

// With object data
logger.log('User created', { id: '123', name: 'John' });
// Output: 27/01/2024 14:30:45.12 - User created : {"id":"123","name":"John"}

// Table format (array of objects)
logger.log('Users loaded', [
  { id: '1', name: 'John', age: 30 },
  { id: '2', name: 'Jane', age: 25 }
]);
// Output: Table format in console
```

#### `error(msg: string, data?: any): void`

Logs an error message with special handling for Axios errors.

**Parameters:**
- `msg` - Error message string
- `data` - Optional error data (Error, AxiosError, or any)

**Behavior:**
1. **Axios Error Detection:**
   - Checks if data is Axios error using `axios.isAxiosError()`
   - If Axios error:
     - Checks if response data exists
     - Logs: `"{timestamp} - {msg}, axios error: {error.message}, data: {JSON.stringify(error)}"`
     - Or: `"{timestamp} - {msg}, axios error: {error.message}"` (if no response data)

2. **Standard Error:**
   - Uses `parse_error()` to safely serialize error
   - Logs: `"{timestamp} - {msg} : {JSON.stringify(parsed_error)}"`
   - Handles Error instances, strings, and other types

**Example:**
```typescript
// Standard error
logger.error('Operation failed', new Error('Something went wrong'));
// Output: 27/01/2024 14:30:45.12 - Operation failed : {"name":"Error","message":"Something went wrong"}

// Axios error
try {
  await axios.get('/api/data');
} catch (error) {
  logger.error('API request failed', error);
  // Output: 27/01/2024 14:30:45.12 - API request failed, axios error: Request failed, data: {...}
}

// String error
logger.error('Validation failed', 'Invalid input');
// Output: 27/01/2024 14:30:45.12 - Validation failed : "Invalid input"
```

#### `warn(msg: string, data?: any): void`

Logs a warning message.

**Parameters:**
- `msg` - Warning message string
- `data` - Optional data to log

**Behavior:**
- Uses `console.warn()` for output
- Timestamp prefix: `"{timestamp} - {msg}"`
- Data suffix: `": {JSON.stringify(data)}"` or empty if no data
- JSON stringifies objects/arrays

**Example:**
```typescript
logger.warn('Deprecated API used', { endpoint: '/old-api' });
// Output: 27/01/2024 14:30:45.12 - Deprecated API used : {"endpoint":"/old-api"}
```

### `logger: LoggerManager`

Exported singleton instance for direct use.

**Usage:**
```typescript
import { logger } from 'akeyless-server-commons/managers';

logger.log('Info message', { data: 'value' });
logger.error('Error occurred', error);
logger.warn('Warning message');
```

## Internal Methods

### `get_date(): string` (Private)

Generates formatted timestamp string.

**Returns:** Timestamp in format `"DD/MM/YYYY HH:mm:ss.SS"` (Israel timezone)

**Behavior:**
- Uses `moment-timezone` with `Asia/Jerusalem` timezone
- Includes milliseconds (`.SS`)

## Logging Best Practices

### Message Formatting
- Use descriptive messages
- Include context in message
- Use consistent message patterns

### Data Logging
- Log relevant data for debugging
- Avoid logging sensitive information (passwords, tokens)
- Use structured data (objects) when possible

### Error Logging
- Always log errors with context
- Include error objects (not just messages)
- Use appropriate log level (error vs warn)

### Performance
- Logging is synchronous (may impact performance)
- Avoid logging in tight loops
- Consider log level filtering in production

## Context

The logger provides consistent logging across the application:

- **Timestamped Logs** - All logs include Israel timezone timestamps
- **Intelligent Formatting** - Automatic table formatting for structured data
- **Error Handling** - Special handling for Axios errors
- **Safe Serialization** - Handles errors and objects safely
- **Singleton Pattern** - Consistent behavior across application

**Common Use Cases:**
- Request logging
- Error tracking
- Debug information
- Performance monitoring
- Audit trails

**Environment Considerations:**
- Table formatting disabled in Kubernetes (console.table not suitable)
- Timestamps always in Israel timezone (consistent across environments)
- JSON stringification for structured data (easy to parse)

**Integration:**
- Used by all helpers for logging
- Used by middlewares for request/error logging
- Used by managers for operation logging
- Can be extended with log aggregation services
