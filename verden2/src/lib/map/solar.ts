/**
 * Solar position math (NOAA approximation) used for sun & shade routing.
 * Pure functions, no dependencies, safe on both client and server.
 */

const RAD = Math.PI / 180;

export type SunPosition = {
  /** Degrees above the horizon. Negative means the sun is down. */
  altitude: number;
  /** Degrees clockwise from north. */
  azimuth: number;
};

export function sunPosition(date: Date, lat: number, lng: number): SunPosition {
  const dayMs = 1000 * 60 * 60 * 24;
  const j1970 = 2440588;
  const j2000 = 2451545;
  const julian = date.valueOf() / dayMs - 0.5 + j1970;
  const d = julian - j2000;

  const meanAnomaly = RAD * (357.5291 + 0.98560028 * d);
  const eclipticLong =
    meanAnomaly +
    RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly)) +
    RAD * 102.9372 +
    Math.PI;
  const obliquity = RAD * 23.4397;

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLong));
  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLong),
    Math.cos(eclipticLong),
  );
  const siderealTime = RAD * (280.16 + 360.9856235 * d) - RAD * -lng;
  const hourAngle = siderealTime - rightAscension;
  const phi = RAD * lat;

  const altitude = Math.asin(
    Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi),
  );

  return {
    altitude: altitude / RAD,
    azimuth: (((azimuth / RAD + 180) % 360) + 360) % 360,
  };
}

/** Bearing in degrees from a to b. */
export function bearing(a: [number, number], b: [number, number]) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const y = Math.sin((lng2 - lng1) * RAD) * Math.cos(lat2 * RAD);
  const x =
    Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
    Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lng2 - lng1) * RAD);
  return (((Math.atan2(y, x) / RAD) % 360) + 360) % 360;
}

/**
 * Estimate how shaded a segment is.
 *
 * A street running perpendicular to the sun's azimuth with tall surroundings is
 * shaded; a street pointing at a low sun is exposed. `buildingDensity` is a
 * 0..1 value derived from Mapbox building data along the segment.
 */
export function shadeScore(
  segmentBearing: number,
  sun: SunPosition,
  buildingDensity: number,
): number {
  if (sun.altitude <= 0) return 1; // night: everything is "shade"
  const delta = Math.abs(((segmentBearing - sun.azimuth + 540) % 360) - 180);
  // 90deg from the sun = maximum shadow cast across the street.
  const geometry = Math.sin((delta * Math.PI) / 180);
  const lowSunBonus = Math.max(0, 1 - sun.altitude / 70);
  return Math.min(1, buildingDensity * (0.45 + 0.55 * geometry) * (0.6 + 0.4 * lowSunBonus) * 1.6);
}