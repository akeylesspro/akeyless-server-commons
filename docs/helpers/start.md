# src/helpers/start.ts

## Purpose

Express server bootstrap with standardized middleware setup, logging, error handling, and optional Redis initialization. Provides two initialization functions: `start_server` for basic server setup and `basic_init` for complete initialization including snapshot loading.

## Dependencies

- `express` - Express.js web framework
- `cors` - CORS middleware for cross-origin requests
- `logger` - Logging manager
- `init_env_variables` - Environment validation helper
- `init_snapshots` - Firebase/Redis snapshot initialization
- Middlewares:
  - `error_handler` - Global error handling middleware
  - `request_logger` - Request logging middleware
  - `trim_body_middleware` - Request body trimming middleware
- `init_redis` - Redis client initialization

## Exports and behavior

### `start_server(main_router: MainRouter, project_name: string, version: string, options?: AppOptions): Promise<Express>`

Initializes and starts an Express server with common middleware and optional Redis initialization.

**Parameters:**
- `main_router` - Function that receives Express app and sets up routes: `(app: Express) => void`
- `project_name` - Name of the project/service (for logging)
- `version` - Version string (typically from package.json)
- `options` - Optional configuration:
  - `port` - Server port number (defaults to `process.env.port` or environment variable)
  - `log_requests` - Request logging configuration (see `LogRequests` type)
  - `initialize_redis` - Whether to initialize Redis (default: `true`)

**Returns:** Promise resolving to the running Express app instance

**Behavior:**
1. Creates Express app instance
2. Validates `mode` environment variable (required)
3. Sets port from options or environment variable
4. Applies middleware in order:
   - `cors()` - Enables CORS for all routes
   - `express.json({ limit: "10mb" })` - JSON body parser with 10MB limit
   - `express.urlencoded({ limit: "10mb", extended: true })` - URL-encoded body parser
   - `trim_body_middleware()` - Trims string values in request body
   - `request_logger(log_requests)` - Logs requests based on configuration
5. Applies main router (user-defined routes)
6. Applies global error handler (must be last)
7. Starts server listening on specified port
8. Logs server startup information
9. Optionally initializes Redis (if `initialize_redis` is true)
10. Resolves with Express app instance

**Error Handling:**
- Redis initialization errors are logged as warnings but don't block server startup
- Server continues even if Redis is unavailable

**Example:**
```typescript
const mainRouter = (app: Express) => {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  app.post('/api/users', async (req, res) => {
    // Route handler
  });
};

const app = await start_server(
  mainRouter,
  'my-service',
  '1.0.0',
  {
    port: 3000,
    log_requests: { url: true, body: true },
    initialize_redis: true
  }
);
```

### `basic_init(main_router: MainRouter, project_name: string, version: string, options?: AppOptions): Promise<Express>`

Complete server initialization including snapshots. This is the recommended entry point for most services.

**Parameters:**
- Same as `start_server`
- Additional `options`:
  - `init_snapshot_options` - Snapshot initialization options (see `InitSnapshotsOptions`)

**Returns:** Promise resolving to the running Express app instance

**Behavior:**
1. Calls `start_server` to initialize Express and start listening
2. Calls `init_snapshots` to load Firebase/Redis snapshots
3. Exits process with code 1 on any error

**Error Handling:**
- Any error during initialization causes process exit (code 1)
- Errors are logged before exit

**Example:**
```typescript
const app = await basic_init(
  mainRouter,
  'my-service',
  '1.0.0',
  {
    port: 3000,
    log_requests: { url: true },
    init_snapshot_options: {
      subscription_type: 'firebase',
      debug: { on_first_time: 'documents' }
    },
    initialize_redis: true
  }
);
```

## Middleware Order

The middleware is applied in this specific order:

1. **CORS** - Must be first to handle preflight requests
2. **Body Parsers** - Parse request bodies before other middleware
3. **Trim Middleware** - Clean user input early
4. **Request Logger** - Log requests after parsing
5. **Main Router** - User-defined routes
6. **Error Handler** - Must be last to catch all errors

## Request Logging Configuration

The `log_requests` option accepts an object with:

```typescript
interface LogRequests {
  url?: boolean;      // Log request URL
  body?: boolean;     // Log request body
  headers?: boolean;  // Log request headers
  query?: boolean;    // Log query parameters
}
```

## Context

This module provides the standard bootstrapping pattern for all Akeyless microservices:

- **Consistent Setup** - All services use the same middleware stack
- **Environment Validation** - Ensures required environment variables are present
- **Request Logging** - Configurable logging for debugging and monitoring
- **Error Handling** - Global error handler catches unhandled errors
- **Redis Integration** - Optional Redis initialization for caching
- **Snapshot Loading** - `basic_init` ensures caches are populated before serving requests

**Best Practices:**
- Use `basic_init` for most services (includes snapshot loading)
- Use `start_server` only if you need manual control over snapshot timing
- Always provide `project_name` and `version` for logging
- Configure `log_requests` appropriately for your environment (more verbose in dev, less in prod)
- Set `initialize_redis: false` only if Redis is not available or not needed

**Common Patterns:**
```typescript
// Full initialization with snapshots
await basic_init(router, 'service-name', version, {
  init_snapshot_options: { subscription_type: 'firebase' }
});

// Basic server without snapshots (manual snapshot loading)
const app = await start_server(router, 'service-name', version);
await init_snapshots({ subscription_type: 'redis' });
```
