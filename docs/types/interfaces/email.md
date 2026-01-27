# src/types/interfaces/email.ts

## Purpose

Defines TypeScript interfaces for email-related data structures used by the SendGrid email helpers. These interfaces provide type safety for email composition, attachments, and configuration settings stored in Firestore.

## Exports

### `EmailData` Interface

Main interface for email composition data passed to the `send_email` helper function.

**Interface Definition:**
```typescript
interface EmailData {
    subject: string;                                    // Email subject line (required)
    entity_for_audit: string;                          // Entity identifier for audit logging (required)
    to?: string | string[];                            // Recipient email address(es) (optional)
    from?: string | { email: string; name?: string };  // Sender email/name (optional, uses default if not provided)
    group_name?: string;                                // Email group name from settings (optional)
    cc?: string | string[];                            // CC recipient(s) (optional)
    body_plain_text?: string;                           // Plain text email body (optional)
    body_html?: string;                                 // HTML email body (optional)
    attachments?: EmailAttachment[];                    // Array of email attachments (optional)
}
```

**Properties:**

- **`subject: string`** (Required)
  - The email subject line
  - Must be provided for all emails

- **`entity_for_audit: string`** (Required)
  - Identifier for the entity/action that triggered this email
  - Used for audit logging in the `nx-audit` collection
  - Examples: `"user_registration"`, `"password_reset"`, `"order_confirmation"`

- **`to?: string | string[]`** (Optional)
  - Recipient email address(es)
  - Can be a single email string or array of email strings
  - If not provided, uses recipients from `group_name` if specified
  - Examples: `"user@example.com"` or `["user1@example.com", "user2@example.com"]`

- **`from?: string | { email: string; name?: string }`** (Optional)
  - Sender email address and optional display name
  - Can be a simple string (email only) or object with email and name
  - If not provided, uses default from `EmailSettings`
  - Examples: `"sender@example.com"` or `{ email: "sender@example.com", name: "Support Team" }`

- **`group_name?: string`** (Optional)
  - Name of an email group defined in `EmailSettings.groups`
  - If provided, uses the group's `to` and `cc` recipients
  - Overrides individual `to` and `cc` fields if group is found

- **`cc?: string | string[]`** (Optional)
  - CC (carbon copy) recipient(s)
  - Can be a single email string or array of email strings
  - Combined with group CC if `group_name` is specified

- **`body_plain_text?: string`** (Optional)
  - Plain text version of the email body
  - Used for email clients that don't support HTML
  - At least one of `body_plain_text` or `body_html` should be provided

- **`body_html?: string`** (Optional)
  - HTML version of the email body
  - Supports rich formatting and styling
  - At least one of `body_plain_text` or `body_html` should be provided

- **`attachments?: EmailAttachment[]`** (Optional)
  - Array of email attachments
  - Each attachment follows the `EmailAttachment` interface

**Usage:**
```typescript
import { EmailData } from 'akeyless-server-commons/types';

const emailData: EmailData = {
  subject: "Welcome to Our Service",
  entity_for_audit: "user_registration",
  to: "user@example.com",
  from: { email: "noreply@example.com", name: "Support Team" },
  body_html: "<h1>Welcome!</h1><p>Thank you for joining.</p>",
  body_plain_text: "Welcome! Thank you for joining.",
  attachments: [
    {
      content: "base64EncodedContent",
      filename: "welcome.pdf",
      type: "application/pdf"
    }
  ]
};
```

### `EmailAttachment` Interface

Interface for email attachment data. Attachments are sent as base64-encoded content.

**Interface Definition:**
```typescript
interface EmailAttachment {
    content: string;                                    // Base64-encoded file content (required)
    filename: string;                                   // Attachment filename (required)
    type?: string;                                      // MIME type (optional, e.g., "application/pdf")
    disposition?: "attachment" | "inline";            // Content disposition (optional)
    content_id?: string;                               // Content ID for inline attachments (optional)
}
```

**Properties:**

- **`content: string`** (Required)
  - Base64-encoded file content
  - Must be valid base64 string
  - Example: `"JVBERi0xLjQKJeLjz9MKMy..."`

- **`filename: string`** (Required)
  - The filename for the attachment as it will appear to the recipient
  - Should include file extension
  - Example: `"invoice.pdf"`, `"report.xlsx"`, `"image.png"`

- **`type?: string`** (Optional)
  - MIME type of the attachment
  - Helps email clients handle the file correctly
  - Examples: `"application/pdf"`, `"image/png"`, `"application/vnd.ms-excel"`
  - If not provided, email client may infer from filename extension

- **`disposition?: "attachment" | "inline"`** (Optional)
  - Content disposition type
  - `"attachment"` - File is downloaded as attachment (default behavior)
  - `"inline"` - File is displayed inline in the email body (requires `content_id`)
  - Defaults to `"attachment"` if not specified

- **`content_id?: string`** (Optional)
  - Content ID for inline attachments
  - Used when `disposition` is `"inline"`
  - Referenced in HTML body as `<img src="cid:content_id">`
  - Example: `"<img123>"` or `"logo-image"`

**Usage:**
```typescript
import { EmailAttachment } from 'akeyless-server-commons/types';
import fs from 'fs';

const fileContent = fs.readFileSync('invoice.pdf');
const base64Content = fileContent.toString('base64');

const attachment: EmailAttachment = {
  content: base64Content,
  filename: "invoice.pdf",
  type: "application/pdf",
  disposition: "attachment"
};

// For inline images
const inlineImage: EmailAttachment = {
  content: base64ImageContent,
  filename: "logo.png",
  type: "image/png",
  disposition: "inline",
  content_id: "logo-image"
};
```

### `EmailSettings` Interface

Interface for email configuration settings stored in Firestore. Defines default sender, default CC recipients, and email groups.

**Interface Definition:**
```typescript
interface EmailSettings {
    default_from: {                                     // Default sender configuration (required)
        email: string;                                  // Default sender email address
        name?: string;                                  // Default sender display name (optional)
    };
    default_cc: string[];                               // Default CC recipients for all emails (required)
    groups: Record<string, {                            // Email groups configuration (required)
        cc?: string[];                                  // Group-specific CC recipients (optional)
        to: string[];                                   // Group recipients (required)
    }>;
    sendgrid_api_key: string;                           // SendGrid API key for authentication (required)
}
```

**Properties:**

- **`default_from: { email: string; name?: string }`** (Required)
  - Default sender configuration used when `EmailData.from` is not provided
  - `email` - Default sender email address (required)
  - `name` - Default sender display name (optional)
  - Example: `{ email: "noreply@example.com", name: "Akeyless Support" }`

- **`default_cc: string[]`** (Required)
  - Array of email addresses to CC on all emails
  - Applied to every email sent unless overridden
  - Can be empty array `[]` if no default CC is needed
  - Example: `["admin@example.com", "logs@example.com"]`

- **`groups: Record<string, { cc?: string[]; to: string[] }>`** (Required)
  - Object mapping group names to recipient lists
  - Keys are group names (used in `EmailData.group_name`)
  - Values contain:
    - `to: string[]` - Primary recipients for the group (required)
    - `cc?: string[]` - CC recipients for the group (optional)
  - Example:
    ```typescript
    {
      "support": {
        to: ["support1@example.com", "support2@example.com"],
        cc: ["manager@example.com"]
      },
      "notifications": {
        to: ["notifications@example.com"]
      }
    }
    ```

- **`sendgrid_api_key: string`** (Required)
  - SendGrid API key for authenticating email sending requests
  - Stored securely in Firestore settings
  - Used by email helpers to authenticate with SendGrid API

**Usage:**
```typescript
import { EmailSettings } from 'akeyless-server-commons/types';

// Example Firestore document structure
const emailSettings: EmailSettings = {
  default_from: {
    email: "noreply@akeyless.com",
    name: "Akeyless Platform"
  },
  default_cc: ["audit@akeyless.com"],
  groups: {
    support: {
      to: ["support@akeyless.com"],
      cc: ["support-manager@akeyless.com"]
    },
    alerts: {
      to: ["alerts@akeyless.com", "oncall@akeyless.com"]
    }
  },
  sendgrid_api_key: "SG.xxxxxxxxxxxxx"
};
```

**Context:** This interface represents the structure of the email settings document stored in Firestore (typically in `nx-settings` collection). The email helpers read this configuration to determine default senders, CC recipients, and group recipients.

## Related Helpers

- Used by `email_helpers.send_email()` function
- Settings are typically stored in Firestore `nx-settings` collection
- Attachments are processed and sent via SendGrid API
