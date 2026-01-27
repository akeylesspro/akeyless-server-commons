# src/middlewares/auth_mw.ts

## Purpose

Authentication middleware for Firebase users, NX users, and API clients. Provides three middleware functions that verify authentication tokens and attach authenticated user/client data to the request object for use in route handlers.

## Dependencies

- **Helpers:**
  - `verify_token` - Verifies Firebase authentication tokens from Authorization header
  - `json_failed` - Creates standardized error response objects
  - `query_document_optional` - Queries Firestore for optional document retrieval
  - `get_user_by_identifier` - Retrieves NX user by phone number or email
- **Managers:**
  - `logger` - Logging manager for error tracking
- **Types:**
  - `MW` - Express middleware type definition
- **External Types:**
  - `NxUser` - NX user type from `akeyless-types-commons`
  - `Client` - API client type from `akeyless-types-commons`

## Exports

### `verify_user_auth: MW`

Firebase user authentication middleware that validates bearer tokens from the Authorization header.

**Behavior:**
- Extracts the `Authorization` header from the request
- Verifies the Firebase authentication token using `verify_token`
- On success: Attaches the decoded Firebase user object to `req.body.firebase_user` and calls `next()`
- On failure: Logs the error using `logger.error`, responds with HTTP 403 status and a JSON error response using `json_failed`

**Usage:**
```typescript
app.get('/protected-route', verify_user_auth, (req, res) => {
  // req.body.firebase_user is available here
  const user = req.body.firebase_user;
});
```

**Error Handling:**
- Catches any errors during token verification
- Returns 403 Forbidden status with error details in JSON format

### `nx_user_login: MW`

NX user login middleware that validates Firebase tokens and resolves the corresponding NX user from the database.

**Behavior:**
- Extracts the `Authorization` header from the request
- Verifies the Firebase authentication token to get user data
- Validates that the token contains either a `phone_number` or `email` field
- Queries the NX users collection using `get_user_by_identifier` with the phone number or email
- Constructs a `full_name` field by concatenating `first_name` and `last_name` (trimmed)
- On success: Attaches the NX user object with `full_name` to `req.body.user` as `NxUser` type and calls `next()`
- On failure: Responds with HTTP 403 status and a JSON error response

**Validation:**
- Ensures token contains at least one identifier (phone_number or email)
- Verifies that a matching NX user exists in the database
- Throws descriptive error messages if validation fails

**Usage:**
```typescript
app.post('/api/user-data', nx_user_login, (req, res) => {
  // req.body.user is available here with full_name property
  const nxUser = req.body.user;
});
```

**Error Handling:**
- Returns 403 Forbidden if token is invalid, missing identifiers, or user not found
- Error messages include specific details about what failed

### `client_login: MW`

API client authentication middleware that validates API tokens against the `nx-clients` collection.

**Behavior:**
- Extracts the `Authorization` header from the request
- Validates that the token exists (throws error if missing)
- Queries the `nx-clients` collection using `query_document_optional` with field `api_token` matching the provided token
- On success: Attaches the client document to `req.body.client` as `Client` type and calls `next()`
- On failure: Responds with HTTP 403 status and a JSON error response

**Validation:**
- Ensures Authorization header is present
- Verifies that a client exists with the provided API token
- Throws descriptive error messages if validation fails

**Usage:**
```typescript
app.post('/api/client-endpoint', client_login, (req, res) => {
  // req.body.client is available here
  const client = req.body.client;
});
```

**Error Handling:**
- Returns 403 Forbidden if token is missing or no matching client is found
- Error messages include the token value for debugging (in error message)

## Request Object Modifications

All three middlewares modify `req.body` to attach authentication data:

- `verify_user_auth` → `req.body.firebase_user` (Firebase decoded user)
- `nx_user_login` → `req.body.user` (NX user with full_name)
- `client_login` → `req.body.client` (API client document)

## Context

These middlewares are used throughout the application to:
- Protect endpoints that require authentication
- Attach authenticated user/client data to requests for use in route handlers
- Standardize authentication error responses (all return 403 with JSON error format)
- Provide different authentication levels (Firebase user, NX user, or API client)

## Error Response Format

All middlewares use `json_failed` to return consistent error responses:
```typescript
{
  success: false,
  error: <error message or error object>
}
```

## Integration Notes

- These middlewares are typically used in Express route chains before the final route handler
- They can be combined with other middlewares like `mandatory` for header validation
- The attached user/client objects are available in all subsequent middleware and route handlers
