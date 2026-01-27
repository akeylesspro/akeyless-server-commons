# src/types/enums/global.ts

## Purpose

Defines shared enumerations and service name type definitions used across the Akeyless platform. These enums provide type-safe constants for SIM providers and service identification.

## Exports

### `SimProvider` Enum

Enumeration of supported SIM card providers in Israel. Used by phone number helpers to identify the carrier associated with a phone number.

**Values:**
- `partner` - Partner Communications (formerly Orange)
- `pelephone` - Pelephone Communications
- `celcom` - Celcom (formerly Golan Telecom)
- `monogoto` - Monogoto (virtual operator)
- `unknown` - Unknown or unrecognized provider

**Usage:**
```typescript
import { SimProvider } from 'akeyless-server-commons/types';

const provider = SimProvider.partner;
if (provider === SimProvider.partner) {
  // Handle Partner provider
}
```

**Context:** Used by `phone_number_helpers` to detect and work with different SIM providers for SMS routing and carrier-specific operations.

### `NxServiceName` Type

Union type representing all available service names in the Akeyless microservices architecture. Used for service identification and routing.

**Type Definition:**
```typescript
type NxServiceName = "bi" | "call_center" | "dashboard" | "devices" | "installer" | "ox_server" | "toolbox" | "end_users" | "notifications";
```

**Service Names:**
- `"bi"` - Business Intelligence service
- `"call_center"` - Call center management service
- `"dashboard"` - Dashboard service
- `"devices"` - Device management service
- `"installer"` - Installer service
- `"ox_server"` - OX server service
- `"toolbox"` - Toolbox utility service
- `"end_users"` - End users management service
- `"notifications"` - Notifications service

**Usage:**
```typescript
import { NxServiceName } from 'akeyless-server-commons/types';

const serviceName: NxServiceName = "devices";
const serviceUrl = getServiceUrl(serviceName);
```

**Context:** Used by `global_helpers` to resolve service URLs and for inter-service communication.

### `NxServiceNameMap` Type

Record type that maps service names to their corresponding URLs. Provides type-safe service URL lookups.

**Type Definition:**
```typescript
type NxServiceNameMap = Record<NxServiceName, string>;
```

**Structure:**
```typescript
{
  bi: string;
  call_center: string;
  dashboard: string;
  devices: string;
  installer: string;
  ox_server: string;
  toolbox: string;
  end_users: string;
  notifications: string;
}
```

**Usage:**
```typescript
import { NxServiceNameMap } from 'akeyless-server-commons/types';

const serviceMap: NxServiceNameMap = {
  bi: "https://bi.akeyless.com",
  call_center: "https://call-center.akeyless.com",
  dashboard: "https://dashboard.akeyless.com",
  // ... other services
};

const biUrl = serviceMap.bi; // Type-safe access
```

**Context:** Used by `global_helpers` to provide type-safe service URL resolution based on service names.

## Type Safety Benefits

These types provide:

1. **Compile-time Safety** - TypeScript will catch invalid service names or provider values at compile time
2. **IntelliSense Support** - IDEs can autocomplete valid enum values and service names
3. **Refactoring Safety** - Renaming services or providers is safer with type checking
4. **Documentation** - Types serve as inline documentation of available options

## Related Types

- Used by `phone_number_helpers` for SIM provider detection
- Used by `global_helpers` for service URL resolution
- Referenced in service configuration and routing logic
