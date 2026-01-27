# src/helpers/tasks_helpers.ts

## Purpose

Task execution orchestration with status tracking, result caching, and optional persistence to Firestore or Firebase Storage. Designed for scheduled/recurring backend tasks that need to track execution status, cache results, and optionally persist large datasets.

## Dependencies

- `cache_manager` - In-memory cache for task results
- `logger` - Logging utility
- Firebase helpers:
  - `set_document` - Updates task status in Firestore
  - `get_document_by_id_optional` - Retrieves task data
- Firebase Admin `storage` - File storage for large datasets
- Types from `akeyless-types-commons`:
  - `TObject` - Generic object type
- `performance` - Performance timing API

## Enums and Types

### `TaskName` Enum

Predefined task names for type safety:

```typescript
enum TaskName {
  send_reset_sms = "send_reset_sms",
  collect_devices_health = "collect_devices_health",
  collect_charge_locations = "collect_charge_locations",
  collect_charge_cdrs = "collect_charge_cdrs"
}
```

### `TaskStatus` Enum

Task execution status values:

```typescript
enum TaskStatus {
  running = "running",
  completed = "completed",
  failed = "failed",
  suspeneded = "suspeneded"  // Note: typo in original (suspended)
}
```

### `TaskSaveOptions` Type

Where to save task results:

```typescript
type TaskSaveOptions = "storage" | "db" | "none";
```

- `"storage"` - Save to Firebase Storage (for large datasets)
- `"db"` - Save to Firestore document (for small datasets)
- `"none"` - Don't save data, only cache

## Task Execution

### `execute_task<T = any>(source: string, task_name: TaskName, task: () => Promise<T>, options?: ExecuteTaskOptions): Promise<void>`

Executes a task function with status tracking and result persistence.

**Parameters:**
- `source` - Source identifier (e.g., service name, scheduler name)
- `task_name` - Task name from `TaskName` enum
- `task` - Async function that performs the actual work
- `options` - Optional configuration:
  - `save_in` - Where to save results: `"storage"` | `"db"` | `"none"` (default: saves to cache and DB)
  - `debug_logs` - Enable debug logging (default: `true`)

**Returns:** Promise resolving when task completes (or fails)

**Behavior:**
1. **Initial Status:**
   - Writes task document to `nx-tasks` collection with:
     - `source` - Source identifier
     - `status: TaskStatus.running`
     - `started: new Date()`
     - `timestamp: new Date()`
     - `error: ""`
   - Uses `merge: false` to overwrite previous status

2. **Task Execution:**
   - Logs task start (if `debug_logs` is true)
   - Records start time using `performance.now()`
   - Executes task function
   - Records execution duration

3. **Success Handling:**
   - Updates task document with:
     - `status: TaskStatus.completed`
     - `completed: new Date()`
     - `timestamp: new Date()`
   - **Data Saving (based on `save_in`):**
     - `"none"`: Sets `data: "no data to save"`
     - `"storage"`: 
       - Saves data to cache
       - Uploads to Firebase Storage via `keep_task_data_in_storage`
       - Sets `data` to signed URL
     - `"db"` or undefined:
       - Saves data to cache
       - Sets `data` to actual data object
   - Logs completion with duration (if `debug_logs` is true)

4. **Error Handling:**
   - Catches exceptions
   - Normalizes error (extracts message from Error instances)
   - Updates task document with:
     - `status: TaskStatus.failed`
     - `completed: new Date()`
     - `timestamp: new Date()`
     - `error` - Error message
   - Logs error

**Example:**
```typescript
// Save to Firestore
await execute_task(
  'scheduler',
  TaskName.collect_devices_health,
  async () => {
    const devices = await fetchDevices();
    return devices.map(d => ({ id: d.id, health: d.health }));
  },
  { save_in: 'db', debug_logs: true }
);

// Save to Storage (for large datasets)
await execute_task(
  'scheduler',
  TaskName.collect_charge_cdrs,
  async () => {
    return await fetchLargeDataset(); // Returns large array
  },
  { save_in: 'storage' }
);

// Cache only (no persistence)
await execute_task(
  'scheduler',
  TaskName.send_reset_sms,
  async () => {
    await sendSMS();
    return { sent: true };
  },
  { save_in: 'none' }
);
```

## Task Data Retrieval

### `get_task_data<T = any>(task_name: TaskName): Promise<T>`

Retrieves task result data with caching and fallback logic.

**Parameters:**
- `task_name` - Task name from `TaskName` enum

**Returns:** Promise resolving to task data (array or object)

**Behavior:**
1. **Cache Check:**
   - Checks `cache_manager` for array data
   - Checks `cache_manager` for object data
   - Returns cached data if found

2. **Firestore Fallback:**
   - Retrieves task document from `nx-tasks` collection
   - Checks `data` field:
     - If string starting with `"http"` → treats as Storage URL
     - If object → uses directly
     - Otherwise → returns empty array

3. **Storage Fallback:**
   - If `data` is Storage URL, downloads file via `get_task_data_from_storage`
   - Parses JSON content
   - Caches result
   - Returns data

4. **Caching:**
   - Caches all retrieved data for future access
   - Uses appropriate cache method (array or object) based on data type

**Returns:** Empty array `[]` if no data found

**Example:**
```typescript
// Get cached or stored task data
const healthData = await get_task_data(TaskName.collect_devices_health);
// Returns: Array of device health objects or []

// Use the data
if (healthData.length > 0) {
  const unhealthy = healthData.filter(d => d.health === 'unhealthy');
}
```

## Storage Helpers

### `get_task_data_from_storage<T = any>(task_name: TaskName): Promise<T | null>`

Downloads and parses task data from Firebase Storage.

**Parameters:**
- `task_name` - Task name from `TaskName` enum

**Returns:** Promise resolving to parsed data or `null` if file doesn't exist

**Behavior:**
- Constructs file path: `tasks_data/{task_name}.json`
- Downloads file from Firebase Storage bucket
- Parses JSON content
- Returns parsed data

**Error Handling:**
- Returns `null` if file doesn't exist or download fails
- Logs errors

**Example:**
```typescript
const data = await get_task_data_from_storage(TaskName.collect_charge_cdrs);
if (data) {
  console.log(`Loaded ${data.length} records`);
}
```

### `keep_task_data_in_storage(task_name: TaskName, data: any[] | TObject<any>): Promise<string>`

Uploads task data to Firebase Storage and returns signed URL.

**Parameters:**
- `task_name` - Task name from `TaskName` enum
- `data` - Data to save (array or object)

**Returns:** Promise resolving to signed URL (valid for 7 days)

**Behavior:**
- Validates data is object or array (throws if not)
- Constructs file path: `tasks_data/{task_name}.json`
- Stringifies data as JSON
- Uploads to Firebase Storage with content type `application/json`
- Generates signed URL (7-day expiration)
- Returns signed URL

**Throws:** Error if data is not object/array or upload fails

**Example:**
```typescript
const url = await keep_task_data_in_storage(
  TaskName.collect_devices_health,
  [{ id: '1', health: 'good' }, { id: '2', health: 'bad' }]
);
// Returns: 'https://storage.googleapis.com/.../tasks_data/collect_devices_health.json?...'
```

## Internal Helpers

### `save_task_data_in_cache(task_name: TaskName, data: any[] | TObject<any>): void` (Internal)

Saves task data to cache manager.

**Parameters:**
- `task_name` - Task name
- `data` - Data to cache (array or object)

**Behavior:**
- Uses `cache_manager.setArrayData` for arrays
- Uses `cache_manager.setObjectData` for objects

## Task Document Structure

Tasks are stored in Firestore `nx-tasks` collection with structure:

```typescript
{
  source: string;              // Source identifier
  status: TaskStatus;          // Current status
  started: Date;               // Start timestamp
  completed?: Date;            // Completion timestamp
  timestamp: Date;             // Last update timestamp
  error?: string;              // Error message (if failed)
  data?: any;                  // Task result data or Storage URL
}
```

## Context

This module provides a complete task execution framework:

- **Status Tracking** - Monitor task execution in real-time
- **Result Caching** - Fast access to task results via cache
- **Flexible Persistence** - Choose storage location based on data size
- **Error Handling** - Comprehensive error tracking and logging
- **Performance Monitoring** - Execution time tracking

**Common Use Cases:**
- Scheduled data collection tasks
- Periodic health checks
- Batch processing jobs
- Report generation
- Data synchronization tasks

**Best Practices:**
- Use `TaskName` enum for type safety
- Use `"storage"` for large datasets (>1MB)
- Use `"db"` for small datasets (<100KB)
- Use `"none"` for tasks that don't produce data
- Check task status before executing (avoid concurrent runs)
- Use `get_task_data` to access cached results efficiently

**Task Lifecycle:**
1. Task starts → Status: `running`
2. Task executes → May take minutes/hours
3. Task completes → Status: `completed`, data saved
4. Task fails → Status: `failed`, error logged
5. Results accessed → Via `get_task_data` (cached or fetched)

**Storage Considerations:**
- Firebase Storage: Best for large datasets, 7-day URL expiration
- Firestore: Best for small datasets, immediate access
- Cache: Fastest access, lost on server restart
