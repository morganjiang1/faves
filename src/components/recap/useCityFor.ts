// The city a plan or group belongs to. Usually that is the city you are in (useCity); when
// it is another one (you switched cities, or a friend's invite is for their city), that
// city's bundled data is loaded on its own, with the same loading and error states.
import { useEffect, useState } from "react";
import { cachedCity, loadCity } from "@/data/cities";
import type { City } from "@/data/types";
import { useCity } from "@/state/city";

export interface CityFor { city: City | null; status: "loading" | "ready" | "error"; error: string | null; retry: () => void }

export function useCityFor(slug: string | null | undefined): CityFor {
  const current = useCity();
  const other = Boolean(slug) && current.city?.slug !== slug && !(current.status === "loading" && !current.city);
  const [state, setState] = useState<{ city: City | null; status: CityFor["status"]; error: string | null }>(() => {
    const hit = slug ? cachedCity(slug) : undefined;
    return hit ? { city: hit, status: "ready", error: null } : { city: null, status: "loading", error: null };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!other || !slug) return;
    let live = true;
    const hit = cachedCity(slug);
    if (hit) { setState({ city: hit, status: "ready", error: null }); return; }
    setState({ city: null, status: "loading", error: null });
    loadCity(slug)
      .then((c) => { if (live) setState({ city: c, status: "ready", error: null }); })
      .catch((e: unknown) => { if (live) setState({ city: null, status: "error", error: e instanceof Error ? e.message : "Couldn't load this city." }); });
    return () => { live = false; };
  }, [other, slug, attempt]);

  if (!slug || !other) return current;
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
