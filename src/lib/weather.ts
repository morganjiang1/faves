// Weather for the plan's day from Open-Meteo (free, no key). Used to warn about rain and
// offer the rain plan. Any failure just means no weather line.
export interface DayWeather { highF: number; lowF: number; rainHours: { hour: number; chance: number }[]; maxChance: number }

const cache = new Map<string, DayWeather | null>();

export async function weatherFor(lat: number, lng: number, dateISO: string): Promise<DayWeather | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)},${dateISO}`;
  if (cache.has(key)) return cache.get(key)!;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&hourly=precipitation_probability,temperature_2m&temperature_unit=fahrenheit&timezone=auto&start_date=${dateISO}&end_date=${dateISO}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    const temps: number[] = j?.hourly?.temperature_2m ?? [];
    const rain: number[] = j?.hourly?.precipitation_probability ?? [];
    if (!temps.length) throw new Error("no data");
    const out: DayWeather = {
      highF: Math.round(Math.max(...temps)),
      lowF: Math.round(Math.min(...temps)),
      rainHours: rain.map((chance, hour) => ({ hour, chance })).filter((x) => x.chance >= 40),
      maxChance: Math.max(0, ...rain),
    };
    cache.set(key, out);
    return out;
  } catch {
    cache.set(key, null);
    return null;
  }
}
