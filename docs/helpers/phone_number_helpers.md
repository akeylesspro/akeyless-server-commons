# src/helpers/phone_number_helpers.ts

## Purpose

Phone number normalization, validation, and SIM provider inference.

## Dependencies

- `SimProvider` enum from `src/types/enums`.
- `TObject` from `akeyless-types-commons`.

## Exports and behavior

- `is_long_phone_number(phone_number)`: checks international format (`+`).
- `is_israel_long_phone_number(phone_number)`: Israeli long format.
- `is_thailand_long_phone_number(phone_number)`: Thai long format.
- `is_international_phone_number(phone_number)`: long format but not Israeli.
- `is_iccid(number)`: ICCID check for numeric 19–22 digits starting with `89`.
- `convert_to_short_israel_phone(international_number)`: `+972` → `0`.
- `is_sim_provider_*`: helpers for partner/pelephone/celcom/monogoto.
- `get_sim_provider(phone_number)`: returns `SimProvider` based on prefix or ICCID.
- `long_short_phone_numbers(phone_number)`:
  - Normalizes to `short_phone_number`, `long_phone_number`, and `is_israeli`.
  - Handles Israeli local numbers and `+1`.

## Context

Used by notification and login helpers to normalize phone identifiers and decide SMS provider routing.
