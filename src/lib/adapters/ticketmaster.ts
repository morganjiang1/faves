// Events near a spot on the plan's day from the Ticketmaster Discovery API, used only when
// EXPO_PUBLIC_TICKETMASTER_KEY is set.
const KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY;

export interface LiveEvent { id: string; name: string; venue: string; time: string | null; url: string }

export async function eventsNear(lat: number, lng: number, dateISO: string): Promise<LiveEvent[]> {
  if (!KEY) return [];
  try {
    const q = new URLSearchParams({
      apikey: KEY, latlong: `${lat},${lng}`, radius: "3", unit: "miles", size: "5", sort: "date,asc",
      startDateTime: `${dateISO}T00:00:00Z`, endDateTime: `${dateISO}T23:59:59Z`,
    });
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${q}`);
    if (!res.ok) return [];
    const list = (await res.json())?._embedded?.events ?? [];
    return list.map((e: { id: string; name: string; url: string; dates?: { start?: { localTime?: string } }; _embedded?: { venues?: { name?: string }[] } }) => ({
      id: e.id, name: e.name, url: e.url, time: e.dates?.start?.localTime ?? null, venue: e._embedded?.venues?.[0]?.name ?? "",
    }));
  } catch {
    return [];
  }
}
