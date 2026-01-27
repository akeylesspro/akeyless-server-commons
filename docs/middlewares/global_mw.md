# src/middlewares/global_mw.ts

## Purpose

Provides comprehensive request validation middleware for Express applications, including mandatory and optional parameter validation, and configurable request logging. Ensures that incoming requests meet specified requirements before reaching route handlers.

## Dependencies

- **Helpers:**
  - `json_failed` - Creates standardized error response objects for validation failures
- **Types:**
  - `MandatoryObject` - Interface defining validation rules for a single parameter
  - `MandatoryParams` - Interface containing optional arrays of body and header validation rules
  - `LogRequests` - Interface defining flags for which request parts to log
  - `MW` - Express middleware type definition
  - `Route` - Route handler type definition
  - `Service` - Service handler type definition
- **Managers:**
  - `logger` - Logging manager for request logging
- **Express Types:**
  - `Request`, `Response`, `NextFunction`, `RequestHandler` - Standard Express types

## Exports

### `mandatory({ body, headers }: MandatoryParams): MW`

Middleware factory that creates Express middleware to enforce mandatory parameter validation. All specified parameters must be present and pass validation rules.

**Parameters:**
- `body?: MandatoryObject[]` - Array of validation rules for request body parameters
- `headers?: MandatoryObject[]` - Array of validation rules for request header parameters

**Returns:** Express middleware function `MW`

**Behavior:**
- Validates all specified body parameters against their rules
- Validates all specified header parameters against their rules
- If any validation fails, responds immediately with `json_failed` error and does not call `next()`
- If all validations pass, calls `next()` to continue to the next middleware/route handler
- Uses `validateParameter` internally with `is_mandatory = true`

**Validation Rules Applied:**
- Parameter must exist (undefined values fail)
- Type checking (string, number, boolean, object, array)
- Minimum length for strings and arrays
- Array element type validation
- Required keys for object types
- Non-empty values for required object keys

**Usage:**
```typescript
app.post('/api/users',
  mandatory({
    body: [
      { key: 'email', type: 'string', length: 5 },
      { key: 'age', type: 'number' },
      { key: 'tags', type: 'array', array_types: ['string'], length: 1 }
    ],
    headers: [
      { key: 'authorization', type: 'string' }
    ]
  }),
  (req, res) => {
    // All parameters validated and available here
  }
);
```

**Error Response:**
Returns `json_failed` with descriptive error messages like:
- `"missing mandatory parameter: email"`
- `"parameter email must be of type: string"`
- `"parameter email must be string and must have minimum length of: 5"`
- `"parameter tags must be array and must have minimum length of: 1"`
- `"item at index 0 in parameter tags must be of type: string"`
- `"parameter user is missing required keys: name, email"`

### `optional({ body, headers }: MandatoryParams): MW`

Middleware factory that creates Express middleware to validate optional parameters. Only validates parameters that are present; missing parameters are allowed.

**Parameters:**
- `body?: MandatoryObject[]` - Array of validation rules for request body parameters
- `headers?: MandatoryObject[]` - Array of validation rules for request header parameters

**Returns:** Express middleware function `MW`

**Behavior:**
- Only validates parameters that exist in the request
- If a parameter is undefined, validation is skipped (unlike `mandatory`)
- If a parameter exists but fails validation, responds with `json_failed` error
- Uses the same validation rules as `mandatory` but with `is_mandatory = false`
- If all validations pass (or parameters are missing), calls `next()`

**Usage:**
```typescript
app.post('/api/users',
  optional({
    body: [
      { key: 'phone', type: 'string', length: 10 }, // Optional, but if present must be valid
      { key: 'metadata', type: 'object', required_keys: ['source'] }
    ]
  }),
  (req, res) => {
    // phone and metadata are optional, but if present they're validated
  }
);
```

### `request_logger(log_requests: LogRequests): RequestHandler`

Middleware factory that creates Express middleware for conditional request logging.

**Parameters:**
- `log_requests: LogRequests` - Configuration object with boolean flags:
  - `url?: boolean` - Log the request method and URL
  - `headers?: boolean` - Log request headers
  - `query?: boolean` - Log query parameters
  - `body?: boolean` - Log request body (only for POST, PUT, PATCH methods)

**Returns:** Express RequestHandler middleware

**Behavior:**
- Logs request information based on the provided flags
- Always logs the method and URL if `url` flag is true: `"GET /api/users"`
- Logs headers if `headers` flag is true: `"Headers: { authorization: '...' }"`
- Logs query parameters if `query` flag is true: `"Query: { page: '1' }"`
- Logs body only for POST, PUT, PATCH methods if `body` flag is true: `"Body: { email: '...' }"`
- Uses `logger.log()` for all logging
- Always calls `next()` to continue the middleware chain

**Usage:**
```typescript
app.use(request_logger({
  url: true,
  headers: true,
  body: true,
  query: true
}));
```

## Internal Implementation

### `validateParameter(data: any, parameter: MandatoryObject, is_mandatory: boolean)`

Internal validation function that performs comprehensive parameter validation.

**Validation Steps:**

1. **Existence Check:**
   - If parameter is undefined and `is_mandatory` is true, throws error: `"missing mandatory parameter: {key}"`
   - If parameter is undefined and `is_mandatory` is false, returns early (skip validation)

2. **Type Validation:**
   - For arrays: Checks if value is actually an array, throws: `"parameter {key} must be of type: Array"`
   - For non-arrays: Checks `typeof` matches expected type, throws: `"parameter {key} must be of type: {type}"`

3. **Length Validation:**
   - For strings: If `parameter.length` is specified, validates minimum length, throws: `"parameter {key} must be string and must have minimum length of: {length}"`
   - For arrays: If `parameter.length` is specified, validates minimum array length, throws: `"parameter {key} must be array and must have minimum length of: {length}"`

4. **Array Element Type Validation:**
   - If `parameter.array_types` is specified, validates each array element's type
   - Throws: `"item at index {index} in parameter {key} must be of type: {types}"`

5. **Object Required Keys Validation:**
   - If `parameter.type === "object"` and `parameter.required_keys` is specified:
     - Checks that all required keys exist in the object
     - Throws: `"parameter {key} is missing required keys: {missingKeys}"`
     - Validates that required keys have non-empty values (for strings and arrays)
     - Throws: `"parameter {key} in {parentKey} must have some length"`

**Error Handling:**
- All validation errors are thrown as strings
- The middleware catches these errors and wraps them in `json_failed` responses

## Validation Rule Types

### `MandatoryObject` Structure

```typescript
{
  key: string;                    // Parameter name to validate
  type: "string" | "number" | "boolean" | "object" | "array";
  length?: number;                // Minimum length for strings/arrays
  required_keys?: string[];       // Required keys for object types
  array_types?: ("string" | "number" | "boolean" | "object")[]; // Allowed types for array elements
}
```

## Context

These middlewares are used throughout the application to:

1. **Input Validation** - Ensure request data meets API requirements before processing
2. **Type Safety** - Validate data types at runtime before they reach route handlers
3. **Error Prevention** - Catch invalid data early and return clear error messages
4. **Request Logging** - Provide configurable logging for debugging and monitoring
5. **API Consistency** - Standardize validation and error responses across all endpoints

## Common Use Cases

### Validating User Registration

```typescript
app.post('/api/register',
  mandatory({
    body: [
      { key: 'email', type: 'string', length: 5 },
      { key: 'password', type: 'string', length: 8 },
      { key: 'name', type: 'string', length: 2 }
    ]
  }),
  async (req, res) => {
    // All fields validated
  }
);
```

### Validating Nested Objects

```typescript
app.post('/api/order',
  mandatory({
    body: [
      { key: 'items', type: 'array', length: 1, array_types: ['object'] },
      { 
        key: 'shipping', 
        type: 'object', 
        required_keys: ['address', 'city', 'zip'] 
      }
    ]
  }),
  async (req, res) => {
    // items array and shipping object validated
  }
);
```

### Conditional Logging

```typescript
// Log everything in development
if (process.env.NODE_ENV === 'development') {
  app.use(request_logger({ url: true, headers: true, body: true, query: true }));
}

// Log only URLs in production
else {
  app.use(request_logger({ url: true }));
}
```

## Best Practices

1. **Use `mandatory` for required fields** - Don't rely on route handlers to check for required fields
2. **Use `optional` for optional fields** - Validate optional fields if they're provided
3. **Be specific with validation rules** - Use length constraints and type checks to catch errors early
4. **Use `request_logger` judiciously** - Don't log sensitive data in production
5. **Combine with auth middlewares** - Use validation before authentication to fail fast
6. **Provide clear error messages** - The validation errors are returned to clients, so they should be descriptive
