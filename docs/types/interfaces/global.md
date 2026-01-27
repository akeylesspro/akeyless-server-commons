# src/types/interfaces/global.ts

## Purpose

Defines TypeScript interfaces for request validation middleware configuration and application initialization options. These interfaces provide type safety for middleware parameters and server bootstrap configuration.

## Dependencies

- **Types:**
  - `InitSnapshotsOptions` - Imported from `../types` for snapshot initialization options

## Exports

### `MandatoryObject` Interface

Interface defining validation rules for a single request parameter. Used by the `mandatory` and `optional` middleware factories to specify validation requirements.

**Interface Definition:**
```typescript
interface MandatoryObject {
    key: string;                                                    // Parameter name to validate (required)
    type: "string" | "number" | "boolean" | "object" | "array";    // Expected parameter type (required)
    length?: number;                                                // Minimum length for strings/arrays (optional)
    required_keys?: string[];                                       // Required keys for object types (optional)
    array_types?: ("string" | "number" | "boolean" | "object")[];  // Allowed types for array elements (optional)
}
```

**Properties:**

- **`key: string`** (Required)
  - The name of the parameter to validate
  - Must match the key in `req.body` or `req.headers`
  - Example: `"email"`, `"authorization"`, `"user"`

- **`type: "string" | "number" | "boolean" | "object" | "array"`** (Required)
  - The expected data type of the parameter
  - Used for type checking validation
  - Example: `"string"` for email addresses, `"number"` for age, `"array"` for tags

- **`length?: number`** (Optional)
  - Minimum length constraint
  - For strings: minimum character length
  - For arrays: minimum number of elements
  - Example: `length: 5` means string must be at least 5 characters or array must have at least 5 items

- **`required_keys?: string[]`** (Optional)
  - Array of required keys for object-type parameters
  - Only applicable when `type === "object"`
  - Validates that all specified keys exist in the object
  - Example: `required_keys: ["name", "email"]` ensures object has both `name` and `email` properties

- **`array_types?: ("string" | "number" | "boolean" | "object")[]`** (Optional)
  - Allowed types for array elements
  - Only applicable when `type === "array"`
  - Validates that all array elements match one of the specified types
  - Example: `array_types: ["string"]` ensures all array elements are strings

**Usage:**
```typescript
import { MandatoryObject } from 'akeyless-server-commons/types';

// Simple string validation
const emailRule: MandatoryObject = {
  key: "email",
  type: "string",
  length: 5
};

// Array validation with element types
const tagsRule: MandatoryObject = {
  key: "tags",
  type: "array",
  length: 1,
  array_types: ["string"]
};

// Object validation with required keys
const userRule: MandatoryObject = {
  key: "user",
  type: "object",
  required_keys: ["name", "email", "age"]
};
```

**Context:** Used by `global_mw.mandatory()` and `global_mw.optional()` middleware factories to define validation rules.

### `MandatoryParams` Interface

Interface containing optional arrays of validation rules for request body and headers. Used as the parameter type for `mandatory` and `optional` middleware factories.

**Interface Definition:**
```typescript
interface MandatoryParams {
    body?: MandatoryObject[];      // Validation rules for request body parameters (optional)
    headers?: MandatoryObject[];   // Validation rules for request header parameters (optional)
}
```

**Properties:**

- **`body?: MandatoryObject[]`** (Optional)
  - Array of validation rules for request body parameters
  - Each rule defines validation for a single body parameter
  - Validates against `req.body`
  - Example: `[{ key: "email", type: "string" }, { key: "age", type: "number" }]`

- **`headers?: MandatoryObject[]`** (Optional)
  - Array of validation rules for request header parameters
  - Each rule defines validation for a single header parameter
  - Validates against `req.headers`
  - Example: `[{ key: "authorization", type: "string" }]`

**Usage:**
```typescript
import { MandatoryParams } from 'akeyless-server-commons/types';

const validationRules: MandatoryParams = {
  body: [
    { key: "email", type: "string", length: 5 },
    { key: "age", type: "number" },
    { key: "tags", type: "array", array_types: ["string"] }
  ],
  headers: [
    { key: "authorization", type: "string" }
  ]
};

// Used with middleware
app.post('/api/users', mandatory(validationRules), handler);
```

**Context:** Used as parameter type for `mandatory()` and `optional()` middleware functions in `global_mw.ts`.

### `LogRequests` Interface

Interface defining boolean flags for conditional request logging. Used by the `request_logger` middleware factory to configure which parts of the request should be logged.

**Interface Definition:**
```typescript
interface LogRequests {
    url?: boolean;      // Log request method and URL (optional)
    headers?: boolean;  // Log request headers (optional)
    query?: boolean;    // Log query parameters (optional)
    body?: boolean;     // Log request body for POST/PUT/PATCH (optional)
}
```

**Properties:**

- **`url?: boolean`** (Optional)
  - If `true`, logs the HTTP method and request URL
  - Format: `"GET /api/users"` or `"POST /api/orders"`
  - Default: `false` (not logged)

- **`headers?: boolean`** (Optional)
  - If `true`, logs all request headers
  - Useful for debugging authentication and custom headers
  - Default: `false` (not logged)

- **`query?: boolean`** (Optional)
  - If `true`, logs query string parameters
  - Format: `"Query: { page: '1', limit: '10' }"`
  - Default: `false` (not logged)

- **`body?: boolean`** (Optional)
  - If `true`, logs request body for POST, PUT, and PATCH requests
  - GET requests are not logged (no body)
  - Format: `"Body: { email: 'user@example.com' }"`
  - Default: `false` (not logged)

**Usage:**
```typescript
import { LogRequests } from 'akeyless-server-commons/types';

// Log everything
const logAll: LogRequests = {
  url: true,
  headers: true,
  query: true,
  body: true
};

// Log only URLs in production
const logMinimal: LogRequests = {
  url: true
};

// Used with middleware
app.use(request_logger(logAll));
```

**Context:** Used by `global_mw.request_logger()` middleware factory and `AppOptions.log_requests` configuration.

### `AppOptions` Interface

Interface defining options for server initialization and application configuration. Used by server bootstrap functions like `basic_init` and `start_server`.

**Interface Definition:**
```typescript
interface AppOptions {
    port?: number;                          // Server port number (optional)
    log_requests?: LogRequests;             // Request logging configuration (optional)
    init_snapshot_options?: InitSnapshotsOptions;  // Snapshot initialization options (optional)
    initialize_redis?: boolean;             // Whether to initialize Redis connection (optional)
}
```

**Properties:**

- **`port?: number`** (Optional)
  - The port number on which the Express server should listen
  - If not provided, uses default port from environment variables or defaults
  - Example: `3000`, `8080`, `5000`

- **`log_requests?: LogRequests`** (Optional)
  - Configuration for request logging middleware
  - If provided, enables `request_logger` middleware with specified flags
  - If not provided, request logging is disabled
  - See `LogRequests` interface for details

- **`init_snapshot_options?: InitSnapshotsOptions`** (Optional)
  - Options for initializing Firebase/Redis snapshots
  - Controls snapshot subscription type (Firebase or Redis)
  - Includes debug configuration for snapshot operations
  - See `InitSnapshotsOptions` type for details

- **`initialize_redis?: boolean`** (Optional)
  - Whether to initialize Redis connection on server startup
  - If `true`, establishes Redis commander and listener connections
  - If `false` or not provided, Redis is not initialized
  - Default: `false`

**Usage:**
```typescript
import { AppOptions } from 'akeyless-server-commons/types';

const options: AppOptions = {
  port: 3000,
  log_requests: {
    url: true,
    body: true
  },
  init_snapshot_options: {
    subscription_type: "firebase",
    debug: {
      on_first_time: "length"
    }
  },
  initialize_redis: true
};

// Used with server bootstrap
await basic_init(mainRouter, 'my-service', version, options);
```

**Context:** Used by server initialization helpers in `start.ts` to configure Express server, middleware, and external service connections.

## Related Middlewares and Helpers

- `MandatoryObject` and `MandatoryParams` are used by `global_mw.mandatory()` and `global_mw.optional()`
- `LogRequests` is used by `global_mw.request_logger()` and `AppOptions`
- `AppOptions` is used by server bootstrap functions in `start.ts`
