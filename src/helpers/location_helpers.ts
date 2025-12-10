import { Geo } from "akeyless-types-commons";

export const get_distance_in_meters_between_geo_points = (location1: Geo, location2: Geo): number => {
    const toRadians = (angle: number) => angle * (Math.PI / 180);
    const R = 6371e3;
    const φ1 = toRadians(location1.lat);
    const φ2 = toRadians(location2.lat);
    const Δφ = toRadians(location2.lat - location1.lat);
    const Δλ = toRadians(location2.lng - location1.lng);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // distance in meters
    return R * c;
};

export const get_location_url = (location: Geo) => {
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
};
