# src/helpers/location_helpers.ts

## Purpose

Geospatial utility functions for calculating distances between geographic coordinates and generating Google Maps URLs. Uses the Haversine formula for accurate distance calculations on Earth's surface.

## Dependencies

- `Geo` type from `akeyless-types-commons` - Geographic coordinate interface with `lat` and `lng` properties

## Exports and behavior

### `get_distance_in_meters_between_geo_points(location1: Geo, location2: Geo): number`

Calculates the great-circle distance between two geographic points using the Haversine formula.

**Parameters:**
- `location1` - First location with `lat` (latitude) and `lng` (longitude) properties
- `location2` - Second location with `lat` and `lng` properties

**Returns:** Distance in meters (number)

**Algorithm:**
- Uses Haversine formula for calculating distances on a sphere
- Assumes Earth's radius of 6,371,000 meters (6,371 km)
- Converts degrees to radians for trigonometric calculations
- Formula accounts for Earth's curvature for accurate results

**Accuracy:**
- Accurate for distances up to a few hundred kilometers
- For very long distances, consider using more sophisticated methods
- Assumes perfect sphere (Earth is slightly ellipsoidal)

**Example:**
```typescript
const location1 = { lat: 31.7683, lng: 35.2137 }; // Jerusalem
const location2 = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv

const distance = get_distance_in_meters_between_geo_points(location1, location2);
// Returns: approximately 57000 (57 km)
```

### `get_location_url(location: Geo): string`

Generates a Google Maps URL for viewing a location.

**Parameters:**
- `location` - Location with `lat` and `lng` properties

**Returns:** Google Maps URL string

**URL Format:** `https://www.google.com/maps?q={lat},{lng}`

**Behavior:**
- Creates a Google Maps link that opens the location when clicked
- Uses Google Maps query parameter format
- Coordinates are included as comma-separated values

**Example:**
```typescript
const location = { lat: 31.7683, lng: 35.2137 };
const url = get_location_url(location);
// Returns: 'https://www.google.com/maps?q=31.7683,35.2137'
```

## Context

These helpers are used for:

- **Distance Calculations** - Determining proximity between vehicles, users, or locations
- **Location Sharing** - Generating shareable map links for locations
- **Geofencing** - Checking if locations are within certain distances
- **Route Planning** - Calculating distances for route optimization

**Use Cases:**
- Vehicle tracking and proximity alerts
- Finding nearest service locations
- Calculating delivery distances
- Location-based notifications
- Map link generation for UI components

**Limitations:**
- Haversine formula assumes Earth is a perfect sphere
- For very precise calculations over long distances, consider using more accurate methods
- Does not account for elevation differences
- Does not calculate actual travel distance (as the crow flies)

**Best Practices:**
- Use for distances up to ~1000 km for best accuracy
- For UI display, consider formatting meters to kilometers for readability
- Cache distance calculations when possible for performance
- Use `get_location_url` for generating shareable location links in emails/SMS
