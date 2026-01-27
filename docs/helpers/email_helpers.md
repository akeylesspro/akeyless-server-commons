# src/helpers/email_helpers.ts

## Purpose

Email helpers using SendGrid, plus attachment creation utilities.

## Dependencies

- `@sendgrid/mail`
- `fs` and `path` for file attachments
- Firebase helpers: `add_audit_record`, `get_document_by_id`, `ignore_ssl_request`
- Types: `EmailData`, `EmailSettings`, `EmailAttachment`
- `logger` manager

## Attachment utilities

- `create_attachment_from_file(file_path, filename?, disposition?)`:
  - Reads file and builds base64 attachment.
- `create_attachment_from_buffer(buffer, filename, mime_type, disposition?)`:
  - Builds base64 attachment from buffer.
- `create_attachment_from_url(url, filename)`:
  - Downloads binary data and creates attachment.
- `get_mime_type(file_path)`:
  - Internal map of common extensions to MIME types.

## Email sending

- `send_email(email_data, options?)`:
  - Fetches email settings from Firestore (`nx-settings/emails`).
  - Resolves recipients via explicit `to` or `group_name`.
  - Merges default `cc` with provided `cc`.
  - Builds SendGrid payload for HTML or text.
  - Sends email and writes an audit record.
  - Optional debug logging.

## Context

Provides a consistent email flow with settings stored in Firestore and attachments from file/buffer/URL.
