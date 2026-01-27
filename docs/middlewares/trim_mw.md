# src/middlewares/trim_mw.ts

## Purpose

Provides a middleware function that automatically trims whitespace from all string values in request bodies. This ensures consistent data handling by removing leading and trailing whitespace from user input before it reaches route handlers.

## Dependencies

- **Helpers:**
  - `trim_strings` - Recursively trims all string values in an object
- **Types:**
  - `MW` - Express middleware type definition

## Exports

### `trim_body_middleware(): MW`

Middleware factory that returns an Express middleware function to trim all string values in the request body.

**Returns:** Express middleware function `MW`

**Behavior:**
- Checks if `req.body` exists and is an object
- If `req.body` is an object, recursively processes it using `trim_strings` helper to trim all string values
- Replaces `req.body` with the trimmed version
- Calls `next()` to continue to the next middleware/route handler
- If `req.body` is not an object or doesn't exist, still calls `next()` (no error thrown)

**Implementation:**
```typescript
export const trim_body_middleware = (): MW => (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = trim_strings(req.body);
    }
    return next();
};
```

**Usage:**
```typescript
// Apply globally to all routes
app.use(trim_body_middleware());

// Or apply to specific routes
app.post('/api/users', trim_body_middleware(), (req, res) => {
  // req.body.email and all other string fields are trimmed
  const email = req.body.email; // "  user@example.com  " becomes "user@example.com"
});
```

**What Gets Trimmed:**
- All string values at any nesting level in the request body
- Nested objects: `{ user: { name: "  John  " } }` → `{ user: { name: "John" } }`
- Arrays of strings: `{ tags: ["  tag1  ", "  tag2  "] }` → `{ tags: ["tag1", "tag2"] }`
- Arrays of objects: `{ items: [{ name: "  Item  " }] }` → `{ items: [{ name: "Item" }] }`

**What Doesn't Get Modified:**
- Non-string values (numbers, booleans, null, undefined)
- Non-object request bodies (strings, numbers, etc.)
- Missing request bodies

## Context

This middleware is used in server bootstrap to normalize input payloads before they reach route handlers. It helps:

1. **Data Consistency** - Ensures all string inputs are trimmed, preventing issues with leading/trailing whitespace
2. **Database Integrity** - Prevents storing strings with unwanted whitespace in the database
3. **User Experience** - Handles cases where users accidentally include spaces when copying/pasting or typing
4. **Validation** - Works well with validation middlewares like `mandatory` - trimmed values are validated after trimming
5. **Normalization** - Standardizes input data format across all endpoints

## Common Use Cases

### User Registration

```typescript
app.post('/api/register',
  trim_body_middleware(),
  mandatory({
    body: [
      { key: 'email', type: 'string' },
      { key: 'name', type: 'string' }
    ]
  }),
  async (req, res) => {
    // Email and name are already trimmed
    // "  user@example.com  " → "user@example.com"
  }
);
```

### Search Endpoints

```typescript
app.get('/api/search',
  trim_body_middleware(), // Trims query parameters if parsed into body
  (req, res) => {
    // Search terms are trimmed, preventing whitespace-only searches
  }
);
```

## Integration Notes

- **Order Matters** - Typically applied early in the middleware chain, before validation
- **Works with Body Parsers** - Requires Express body parser middleware (like `express.json()`) to be applied first
- **Non-Destructive** - Only modifies string values, leaves other data types unchanged
- **Recursive** - Handles deeply nested objects and arrays automatically
- **Safe** - Doesn't throw errors if body is missing or not an object

## Best Practices

1. **Apply Early** - Use `trim_body_middleware()` before validation middlewares so trimmed values are validated
2. **Global Application** - Consider applying globally if all endpoints should trim input
3. **Combine with Validation** - Use with `mandatory` or `optional` middlewares for complete input sanitization
4. **Be Aware of Edge Cases** - Empty strings become empty strings (not null), whitespace-only strings become empty strings

## Example Transformation

**Input:**
```json
{
  "email": "  user@example.com  ",
  "name": "  John Doe  ",
  "age": 30,
  "tags": ["  tag1  ", "  tag2  "],
  "metadata": {
    "source": "  web  ",
    "active": true
  }
}
```

**After `trim_body_middleware()`:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "tags": ["tag1", "tag2"],
  "metadata": {
    "source": "web",
    "active": true
  }
}
```
