# src/types/types/global.ts

## Purpose

Defines core type aliases for HTTP responses, Express middleware, route handlers, and application-level helper functions. These types provide consistent type definitions used throughout the Akeyless server commons package.

## Dependencies

- **Express Types:**
  - `Request`, `Response`, `Express`, `NextFunction` - Standard Express types
- **External Types:**
  - `NxUser` - NX user type from `akeyless-types-commons`
  - `TObject` - Generic object type from `akeyless-types-commons`

## Exports

### `JsonOK<T>` Type

Type alias for successful JSON response functions. Defines the shape of success response creators.

**Type Definition:**
```typescript
type JsonOK<T> = (data?: T) => { success: true; data: T | undefined };
```

**Parameters:**
- `data?: T` - Optional data payload to include in the response

**Returns:**
- Object with `success: true` and optional `data` property

**Usage:**
```typescript
import { JsonOK } from 'akeyless-server-commons/types';

const json_ok: JsonOK<{ id: string; name: string }> = (data) => ({
  success: true,
  data
});

// Usage
res.json(json_ok({ id: "123", name: "John" }));
// Returns: { success: true, data: { id: "123", name: "John" } }

res.json(json_ok());
// Returns: { success: true, data: undefined }
```

**Context:** Used by `global_helpers.json_ok()` function to create standardized success responses.

### `JsonFailed` Type

Type alias for failed JSON response functions. Defines the shape of error response creators.

**Type Definition:**
```typescript
type JsonFailed = (error?: any, msg?: string) => { success: false; error: any };
```

**Parameters:**
- `error?: any` - Optional error object, message, or value to include in the response
- `msg?: string` - Optional message string (may be used for additional context)

**Returns:**
- Object with `success: false` and `error` property containing the error

**Usage:**
```typescript
import { JsonFailed } from 'akeyless-server-commons/types';

const json_failed: JsonFailed = (error, msg) => ({
  success: false,
  error: error || msg || "An error occurred"
});

// Usage
res.json(json_failed("Invalid input"));
// Returns: { success: false, error: "Invalid input" }

res.json(json_failed(new Error("Something went wrong")));
// Returns: { success: false, error: Error object }
```

**Context:** Used by `global_helpers.json_failed()` function and various middlewares to create standardized error responses.

### `MainRouter` Type

Type alias for the main router function that registers routes on an Express application. Used by server bootstrap functions.

**Type Definition:**
```typescript
type MainRouter = (app: Express) => void;
```

**Parameters:**
- `app: Express` - Express application instance to register routes on

**Returns:**
- `void` - Function doesn't return a value

**Usage:**
```typescript
import { MainRouter } from 'akeyless-server-commons/types';
import express from 'express';

const mainRouter: MainRouter = (app: express.Express) => {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/users', (req, res) => {
    // Handle user creation
  });
};

// Used with server bootstrap
await basic_init(mainRouter, 'my-service', version);
```

**Context:** Used by `start.ts` bootstrap functions (`basic_init`, `start_server`) to accept route registration functions.

### `MW` Type

Type alias for Express middleware functions. Provides a consistent type for all middleware functions in the package.

**Type Definition:**
```typescript
type MW = (req: Request, res: Response, next: NextFunction) => void;
```

**Parameters:**
- `req: Request` - Express request object
- `res: Response` - Express response object
- `next: NextFunction` - Express next function to continue middleware chain

**Returns:**
- `void` - Middleware functions typically don't return values

**Usage:**
```typescript
import { MW } from 'akeyless-server-commons/types';

const myMiddleware: MW = (req, res, next) => {
  // Do something with req/res
  next(); // Continue to next middleware
};

app.use(myMiddleware);
```

**Context:** Used throughout all middleware files (`auth_mw.ts`, `global_mw.ts`, `trim_mw.ts`, etc.) to type middleware functions.

### `Service` Type

Type alias for async route handler/service functions. Used for route handlers that don't need the `next` function.

**Type Definition:**
```typescript
type Service = (req: Request, res: Response) => void;
```

**Parameters:**
- `req: Request` - Express request object
- `res: Response` - Express response object

**Returns:**
- `void` - Service functions typically send responses directly

**Usage:**
```typescript
import { Service } from 'akeyless-server-commons/types';

const myService: Service = async (req, res) => {
  const data = await fetchData();
  res.json({ success: true, data });
};

// Used with async_error_handler
app.get('/api/data', async_error_handler(myService));
```

**Context:** Used by `error_handling.async_error_handler()` to wrap async route handlers and ensure errors are properly caught.

### `Route` Type

Type alias for route handler functions with optional `next` parameter. More flexible than `Service` as it allows access to `next` if needed.

**Type Definition:**
```typescript
type Route = (req: Request, res: Response, next?: NextFunction) => Response;
```

**Parameters:**
- `req: Request` - Express request object
- `res: Response` - Express response object
- `next?: NextFunction` - Optional Express next function

**Returns:**
- `Response` - Express response object (typically returned for chaining)

**Usage:**
```typescript
import { Route } from 'akeyless-server-commons/types';

const myRoute: Route = (req, res, next) => {
  if (someCondition) {
    return res.status(400).json({ error: "Bad request" });
  }
  return res.json({ success: true });
};
```

**Context:** Used in route definitions where handlers might need access to `next` for conditional logic.

### `AddAuditRecord` Type

Type alias for audit logging function signature. Defines the shape of functions that add records to the audit log.

**Type Definition:**
```typescript
type AddAuditRecord = (action: string, entity: string, details: TObject<any>, user?: NxUser) => Promise<void>;
```

**Parameters:**
- `action: string` - The action being audited (e.g., "create_user", "send_email")
- `entity: string` - The entity type being acted upon (e.g., "user", "email")
- `details: TObject<any>` - Additional details object to log
- `user?: NxUser` - Optional user who performed the action

**Returns:**
- `Promise<void>` - Async function that completes when audit record is written

**Usage:**
```typescript
import { AddAuditRecord } from 'akeyless-server-commons/types';

const addAuditRecord: AddAuditRecord = async (action, entity, details, user) => {
  await firestore.collection('nx-audit').add({
    action,
    entity,
    details,
    user: user?.id,
    timestamp: new Date()
  });
};

// Usage
await addAuditRecord(
  "send_email",
  "email",
  { to: "user@example.com", subject: "Welcome" },
  currentUser
);
```

**Context:** Used by Firebase helpers and other modules to log audit trails of important operations.

### `LangOptions` Type

Union type representing allowed language codes for translations and localization.

**Type Definition:**
```typescript
type LangOptions = "he" | "en" | "ru" | (string & {});
```

**Values:**
- `"he"` - Hebrew
- `"en"` - English
- `"ru"` - Russian
- `(string & {})` - Allows any string (for extensibility)

**Usage:**
```typescript
import { LangOptions } from 'akeyless-server-commons/types';

const lang: LangOptions = "he";
const translation = translation_manager.get_translation("messages", lang, "key", "default");
```

**Context:** Used by `translation_manager` and notification helpers to specify language for translations and localized messages.

### `EntityOptions` Type

Union type representing allowed entity names for audit logging and other entity-specific operations.

**Type Definition:**
```typescript
type EntityOptions = "nx_devices" | (string & {});
```

**Values:**
- `"nx_devices"` - NX devices entity (primary entity)
- `(string & {})` - Allows any string (for extensibility)

**Usage:**
```typescript
import { EntityOptions } from 'akeyless-server-commons/types';

const entity: EntityOptions = "nx_devices";
await addAuditRecord("update", entity, { deviceId: "123" });
```

**Context:** Used for type safety when specifying entity types in audit logging and entity-specific operations.

## Type Safety Benefits

These type aliases provide:

1. **Consistency** - Standardized types across all modules
2. **IntelliSense** - Better IDE autocomplete and type checking
3. **Documentation** - Types serve as inline documentation
4. **Refactoring Safety** - TypeScript catches breaking changes
5. **API Contracts** - Clear contracts for function signatures

## Related Modules

- `JsonOK` and `JsonFailed` are used by `global_helpers`
- `MW` is used by all middleware files
- `Service` is used by `error_handling`
- `MainRouter` is used by `start.ts`
- `AddAuditRecord` is used by Firebase helpers and audit logging
- `LangOptions` and `EntityOptions` are used by translation and audit systems
