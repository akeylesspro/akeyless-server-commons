# src/helpers/boards_helpers.ts

## Purpose

Board-provider utilities for resolving board makers (providers) based on board types and cached settings. These helpers enable services to determine which board provider (ERM, Jimi, Ruptela, Servision, or Jimi IoT Hub) should handle a specific board type or vehicle.

## Dependencies

- `cache_manager` - Accesses cached `settings` and `boards` collections
- Types from `akeyless-types-commons`:
  - `Board` - Board data structure with `imei` and `type` properties
  - `Car` - Vehicle data structure with `carId` and `peripherals` array
  - `TObject` - Generic object type

## Exports and behavior

### `extract_board_types_from_settings(settings: TObject<any>): BoardProviderWithBoardTypes[]`

Extracts board type configurations from settings object and organizes them by provider.

**Parameters:**
- `settings` - Settings object containing board type arrays for each provider

**Returns:** Array of objects with `board_provider` and `board_types` properties

**Behavior:**
- Extracts board types from: `erm_board_types`, `jimi_board_types`, `jimi_iothub_board_types`, `ruptela_board_types`, `servision_board_types`
- Each entry contains `values` array with board type strings
- Returns structured array mapping each provider to its board types

**Example:**
```typescript
const settings = {
  erm_board_types: { values: ['type1', 'type2'] },
  jimi_board_types: { values: ['type3'] },
  // ...
};
const providers = extract_board_types_from_settings(settings);
// Returns: [
//   { board_provider: 'erm', board_types: ['type1', 'type2'] },
//   { board_provider: 'jimi', board_types: ['type3'] },
//   ...
// ]
```

### `get_board_maker_by_board_type(type: string): BoardMakerResult`

Determines the board provider (maker) based on a board type string.

**Parameters:**
- `type` - Board type string to look up

**Returns:** `"erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub"`

**Behavior:**
- Reads `settings` from cache manager
- Checks each provider's board types array for a match
- Returns the matching provider name
- Throws error if no match found

**Throws:** `Error` with message "failed to get board maker from DB, type: {type}" if type not found

**Example:**
```typescript
const provider = get_board_maker_by_board_type('jimi_v2');
// Returns: 'jimi'
```

### `get_board_maker_by_car(car: Car): BoardMakerResult`

Determines the board provider for a vehicle by looking up its board via IMEI.

**Parameters:**
- `car` - Car object with `carId` and `peripherals` array

**Returns:** `"erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub"`

**Behavior:**
1. Extracts IMEI from `car.peripherals[0].mac`
2. Throws if IMEI not found
3. Looks up board in cached `boards` array by matching `imei`
4. Throws if board not found or boards cache is empty
5. Determines provider by checking board `type` against settings
6. Returns matching provider or throws error

**Throws:**
- `Error` if IMEI not found: "IMEI not found for car number: {carId}"
- `Error` if boards cache empty: "Boards are not in cache"
- `Error` if board not found: "Board not found for imei: {imei}"
- `Error` if provider not found: "failed to get board maker for board type: {type}"

**Example:**
```typescript
const car = {
  carId: '12345',
  peripherals: [{ mac: '123456789012345' }]
};
const provider = get_board_maker_by_car(car);
// Returns: 'erm' (or other provider based on board type)
```

## Type Definitions

### `BoardProviderWithBoardTypes`

```typescript
interface BoardProviderWithBoardTypes {
    board_provider: "erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub";
    board_types: string[];
}
```

### `BoardMakerResult`

```typescript
type BoardMakerResult = "erm" | "jimi" | "ruptela" | "servision" | "jimi_iothub";
```

## Context

Used by services that need to route device logic based on board vendor. Common use cases:
- Determining which API to call for a specific vehicle's board
- Routing commands to the correct provider service
- Validating board compatibility with provider-specific features
- Filtering or grouping vehicles by board provider

**Note:** These functions rely on cached data (`settings` and `boards`), which should be populated via Firebase snapshots or Redis subscriptions during server initialization.
