# src/helpers/boards_helpers.ts

## Purpose

Board-provider utilities for resolving board makers based on board types and cached settings.

## Dependencies

- `cache_manager`
- Types from `akeyless-types-commons` (`Board`, `Car`)

## Exports and behavior

- `extract_board_types_from_settings(settings)`:
  - Returns a list of providers with their board types.
- `get_board_maker_by_board_type(type)`:
  - Uses cached `settings` to resolve provider by board type.
- `get_board_maker_by_car(car)`:
  - Resolves board by IMEI from cached `boards`.
  - Determines provider by board type.

## Context

Used by services that need to route device logic based on board vendor.
