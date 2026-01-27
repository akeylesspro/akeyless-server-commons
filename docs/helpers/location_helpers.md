# src/helpers/location_helpers.ts

## Purpose

Geospatial helpers for distance calculation and Google Maps URLs.

## Dependencies

- `Geo` type from `akeyless-types-commons`.

## Exports and behavior

- `get_distance_in_meters_between_geo_points(location1, location2)`:
  - Haversine formula to compute meters between two points.
- `get_location_url(location)`:
  - Returns a Google Maps link for the coordinates.

## Context

Used by services needing distance or location sharing utilities.
