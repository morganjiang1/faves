// Sunrise and sunset from latitude, longitude and date (NOAA solar calculator equations),
// so view stops can be timed to golden hour with no weather API.

const rad = Math.PI / 180;

function julianDay(y: number, m: number, d: number): number {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

// Minutes from UTC midnight of the sun's rise (rising=true) or set on that date.
function sunEventUtc(jd: number, lat: number, lng: number, rising: boolean): number | null {
  const t = (jd - 2451545) / 36525;
  const L0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = Math.sin(M * rad) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * t) + Math.sin(3 * M * rad) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * t;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * rad);
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * rad);
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad)) / rad;
  const y = Math.tan((eps / 2) * rad) ** 2;
  const eqTime = 4 / rad * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad));
  const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl * rad))) - Math.tan(lat * rad) * Math.tan(decl * rad);
  if (cosH > 1 || cosH < -1) return null; // polar day or night
  const H = Math.acos(cosH) / rad;
  return 720 - 4 * (lng + (rising ? H : -H)) - eqTime;
}

export interface SunTimes { sunrise: number; sunset: number } // local wall-clock minutes

// `wallDate` is the city's local date (its UTC fields hold the local calendar date).
export function sunTimes(lat: number, lng: number, wallDate: Date, offsetHours: number): SunTimes | null {
  const jd = julianDay(wallDate.getUTCFullYear(), wallDate.getUTCMonth() + 1, wallDate.getUTCDate());
  const rise = sunEventUtc(jd, lat, lng, true);
  const set = sunEventUtc(jd, lat, lng, false);
  if (rise == null || set == null) return null;
  return { sunrise: Math.round(rise + offsetHours * 60), sunset: Math.round(set + offsetHours * 60) };
}
