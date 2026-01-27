# src/helpers/email_helpers.ts

## Purpose

Email sending functionality using SendGrid API, with comprehensive attachment support from files, buffers, or URLs. Includes automatic audit logging and group-based recipient management.

## Dependencies

- `@sendgrid/mail` - SendGrid email API client
- `fs` and `path` - File system operations for reading files
- Firebase helpers:
  - `add_audit_record` - Logs email operations to audit trail
  - `get_document_by_id` - Fetches email settings from Firestore
  - `ignore_ssl_request` - HTTP request helper for downloading attachments
- Types: `EmailData`, `EmailSettings`, `EmailAttachment` from `src/types/interfaces/email`
- `logger` manager - Error and debug logging

## Attachment Creation Utilities

### `create_attachment_from_file(file_path: string, filename?: string, disposition: "attachment" | "inline" = "attachment"): Promise<EmailAttachment>`

Creates an email attachment from a local file path.

**Parameters:**
- `file_path` - Full path to the file to attach
- `filename` - Optional custom filename (defaults to basename of file_path)
- `disposition` - `"attachment"` (download) or `"inline"` (display in email body), defaults to `"attachment"`

**Returns:** Promise resolving to `EmailAttachment` object with base64 content

**Behavior:**
- Reads file synchronously using `fs.readFileSync`
- Converts content to base64
- Detects MIME type from file extension
- Returns attachment object ready for SendGrid

**Throws:** Re-throws file read errors with context

**Example:**
```typescript
const attachment = await create_attachment_from_file(
  '/path/to/invoice.pdf',
  'invoice_2024.pdf',
  'attachment'
);
```

### `create_attachment_from_buffer(buffer: Buffer | Uint8Array, filename: string, mime_type: string, disposition: "attachment" | "inline" = "attachment"): EmailAttachment`

Creates an email attachment from an in-memory buffer.

**Parameters:**
- `buffer` - Buffer or Uint8Array containing file data
- `filename` - Filename for the attachment
- `mime_type` - MIME type string (e.g., "application/pdf", "image/png")
- `disposition` - `"attachment"` or `"inline"`, defaults to `"attachment"`

**Returns:** `EmailAttachment` object with base64 content

**Behavior:**
- Converts buffer to base64 string
- No file I/O required, suitable for dynamically generated content

**Example:**
```typescript
const pdfBuffer = generatePDFBuffer();
const attachment = create_attachment_from_buffer(
  pdfBuffer,
  'report.pdf',
  'application/pdf'
);
```

### `create_attachment_from_url(url: string, filename: string): Promise<EmailAttachment>`

Downloads a file from a URL and creates an email attachment.

**Parameters:**
- `url` - HTTP/HTTPS URL to download from
- `filename` - Filename for the attachment

**Returns:** Promise resolving to `EmailAttachment` object

**Behavior:**
- Uses `ignore_ssl_request` helper (supports SSL verification bypass in QA mode)
- Downloads binary data with 20-second timeout
- Detects content type from response headers (defaults to "application/pdf")
- Converts to base64 and returns attachment object

**Throws:** Re-throws download errors with context

**Example:**
```typescript
const attachment = await create_attachment_from_url(
  'https://example.com/document.pdf',
  'downloaded_doc.pdf'
);
```

### `get_mime_type(file_path: string): string` (Internal)

Maps file extensions to MIME types.

**Supported Extensions:**
- Documents: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.csv`, `.json`, `.xml`
- Archives: `.zip`, `.rar`, `.7z`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`
- Media: `.mp3`, `.mp4`, `.avi`, `.mov`

**Returns:** MIME type string or `"application/octet-stream"` for unknown extensions

## Email Sending

### `send_email(email_data: EmailData, options?: { debug?: boolean }): Promise<void>`

Sends an email via SendGrid with support for groups, attachments, and audit logging.

**Parameters:**
- `email_data` - `EmailData` object containing:
  - `to` - String or array of recipient email addresses (optional if `group_name` provided)
  - `cc` - String or array of CC addresses (optional)
  - `group_name` - Name of email group from settings (optional if `to` provided)
  - `from` - Sender email (optional, uses `default_from` from settings)
  - `subject` - Email subject line
  - `body_html` - HTML email body (optional if `body_plain_text` provided)
  - `body_plain_text` - Plain text email body (optional if `body_html` provided)
  - `attachments` - Array of `EmailAttachment` objects (optional)
  - `entity_for_audit` - Entity identifier for audit logging
- `options` - Optional configuration:
  - `debug` - Enable debug logging (default: `false`)

**Behavior:**
1. Fetches email settings from Firestore (`nx-settings/emails` document)
2. Validates that either `to` or `group_name` is provided
3. Validates that either `body_html` or `body_plain_text` is provided
4. If `group_name` provided:
   - Validates group exists in settings
   - Merges group recipients with explicit `to` addresses
   - Merges group CC addresses
5. Merges default CC addresses from settings
6. Sets SendGrid API key from settings
7. Builds SendGrid message payload (HTML or text based on available body)
8. Sends email via SendGrid API
9. Validates response status code (expects 202)
10. Writes audit record to `nx-audit` collection
11. Optionally logs success/failure details

**Throws:**
- `"must supply a 'group_name' or 'to' value"` - Missing recipients
- `"must supply a 'body_plain_text' or 'html' value"` - Missing body content
- `"must supply a valid 'group_name'"` - Invalid group name
- SendGrid API errors (status code != 202)

**Error Handling:**
- Logs errors but does not throw (allows graceful failure)
- Optionally logs email payload on error if debug enabled

**Example:**
```typescript
await send_email({
  to: 'user@example.com',
  subject: 'Welcome',
  body_html: '<h1>Welcome to our service!</h1>',
  entity_for_audit: 'user_registration'
}, { debug: true });

// Using group
await send_email({
  group_name: 'admins',
  subject: 'System Alert',
  body_html: '<p>System status update</p>',
  entity_for_audit: 'system_notification',
  attachments: [attachment]
});
```

## Email Settings Structure

Email settings are stored in Firestore at `nx-settings/emails` with the following structure:

```typescript
interface EmailSettings {
  sendgrid_api_key: string;
  default_from: string;
  default_cc: string[];
  groups: {
    [groupName: string]: {
      to: string[];
      cc?: string[];
    };
  };
}
```

## Context

Provides a consistent email flow with:
- **Centralized Configuration** - Settings stored in Firestore, easy to update without code changes
- **Group Management** - Predefined recipient groups for common use cases
- **Attachment Support** - Multiple ways to attach files (local, buffer, URL)
- **Audit Trail** - All emails logged to `nx-audit` collection for compliance
- **Error Resilience** - Graceful error handling with optional debug logging

Common use cases:
- User registration emails
- Password reset emails
- System notifications
- Report generation and distribution
- Invoice and document delivery
