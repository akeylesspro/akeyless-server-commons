# src/middlewares/error_handling.ts

## Purpose

Provides error handling utilities for Express applications, including an async error wrapper and a global error handler middleware. Ensures that asynchronous errors in route handlers are properly caught and handled by Express's error handling system.

## Dependencies

- **Managers:**
  - `logger` - Logging manager for error tracking and stack trace logging
- **Types:**
  - `Service` - Type definition for async route handler functions
- **Express Types:**
  - `Request`, `Response`, `NextFunction` - Standard Express types

## Exports

### `async_error_handler(service: Service)`

A higher-order function that wraps async route handlers to automatically catch and forward Promise rejections to Express's error handling middleware.

**Parameters:**
- `service: Service` - An async function that takes `(req: Request, res: Response)` and returns a Promise

**Returns:**
- Express middleware function `(req: Request, res: Response, next: NextFunction) => void`

**Behavior:**
- Wraps the provided service function in a Promise.resolve() call
- If the service resolves successfully, the middleware chain continues normally
- If the service rejects (throws an error or returns a rejected Promise), the error is caught and passed to Express's error handling middleware via `next(error)`
- This allows async route handlers to throw errors naturally without needing try-catch blocks, as Express will route them to the global error handler

**Usage:**
```typescript
// Without wrapper (errors might not be caught)
app.get('/route', async (req, res) => {
  const data = await someAsyncOperation(); // Error here might not be handled
  res.json(data);
});

// With wrapper (errors are properly caught)
app.get('/route', async_error_handler(async (req, res) => {
  const data = await someAsyncOperation(); // Error here is caught and forwarded
  res.json(data);
}));
```

**Implementation Details:**
- Uses `Promise.resolve(service(req, res))` to ensure the service result is always a Promise
- Calls `.catch(next)` to forward any rejection to Express error handling

### `error_handler(err: Error, req: Request, res: Response, next: NextFunction)`

Global Express error handler middleware that catches all errors in the middleware chain and returns a standardized error response.

**Parameters:**
- `err: Error` - The error object that was thrown or passed via `next(error)`
- `req: Request` - Express request object
- `res: Response` - Express response object
- `next: NextFunction` - Express next function (not used, but required by Express error handler signature)

**Behavior:**
- Logs the error stack trace using `logger.error("Global Error Handler:", err.stack)`
- Returns an HTTP 500 (Internal Server Error) status code
- Sends a JSON response with standardized error format:
  ```typescript
  {
    status: "error",
    message: err.message || "Internal Server Error"
  }
  ```
- If the error object doesn't have a `message` property, defaults to "Internal Server Error"

**Usage:**
```typescript
// Register as the last middleware (after all routes)
app.use(error_handler);

// Errors from any middleware or route will be caught here
app.get('/route', async_error_handler(async (req, res) => {
  throw new Error('Something went wrong'); // Caught by error_handler
}));
```

**Error Response Format:**
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Internal Implementation

### `async_error_handler` Function

```typescript
const async_error_handler = (service: Service) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(service(req, res)).catch(next);
    };
};
```

This implementation:
1. Returns a middleware function that Express can use
2. Calls the service function with req and res
3. Wraps the result in `Promise.resolve()` to ensure it's a Promise
4. Catches any rejection and passes it to `next()` for Express error handling

## Context

These error handling utilities are essential for:

1. **Async Route Safety** - `async_error_handler` ensures that async/await errors in route handlers don't crash the server and are properly handled
2. **Centralized Error Handling** - `error_handler` provides a single point for error logging and response formatting
3. **Server Bootstrap** - Used by the server initialization code to standardize error handling across all routes
4. **Consistent Error Responses** - All errors return the same JSON format, making it easier for clients to handle errors

## Integration Pattern

The typical pattern for using these utilities:

```typescript
import { async_error_handler, error_handler } from './middlewares/error_handling';

// Wrap async routes
app.get('/api/data', async_error_handler(async (req, res) => {
  const data = await fetchData();
  res.json({ success: true, data });
}));

// Register global error handler last
app.use(error_handler);
```

## Best Practices

1. **Always use `async_error_handler`** for async route handlers to ensure errors are caught
2. **Register `error_handler` last** in the middleware chain, after all routes
3. **Use descriptive error messages** so they're useful in logs and client responses
4. **Don't call `next()` after sending a response** - the error handler will handle it

## Error Flow

1. Route handler throws error or returns rejected Promise
2. `async_error_handler` catches the error and calls `next(error)`
3. Express routes the error to error handling middleware
4. `error_handler` logs the error and sends standardized response
5. Client receives 500 status with error message
