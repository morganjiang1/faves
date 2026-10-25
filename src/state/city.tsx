// The current city: loaded lazily when you pick it, with loading and error states.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cachedCity, loadCity } from "@/data/cities";
import type { City } from "@/data/types";
import { useStore } from "./store";

interface CityState { city: City | null; status: "loading" | "ready" | "error"; error: string | null; retry: () => void }

const Ctx = createContext<CityState>({ city: null, status: "loading", error: null, retry: () => {} });

export function CityProvider({ children }: { children: ReactNode }) {
  const slug = useStore((s) => s.profile.city);
  const [city, setCity] = useState<City | null>(() => cachedCity(slug) ?? null);
  const [status, setStatus] = useState<CityState["status"]>(city ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    const hit = cachedCity(slug);
    if (hit) { setCity(hit); setStatus("ready"); return; }
    setStatus("loading");
    setError(null);
    loadCity(slug)
      .then((c) => { if (live) { setCity(c); setStatus("ready"); } })
      .catch((e: unknown) => { if (live) { setStatus("error"); setError(e instanceof Error ? e.message : "Couldn't load this city."); } });
    return () => { live = false; };
  }, [slug, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const value = { city: city && city.slug === slug ? city : status === "ready" ? city : null, status, error, retry };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCity = () => useContext(Ctx);

// Any city by its slug (a group chat may plan in a city other than the one you have open).
export function useCityBySlug(slug: string | null | undefined): City | null {
  const current = useCity().city;
  const [city, setCity] = useState<City | null>(() => (slug ? cachedCity(slug) ?? null : null));
  useEffect(() => {
    if (!slug) return;
    let live = true;
    const hit = cachedCity(slug);
    if (hit) { setCity(hit); return; }
    loadCity(slug).then((c) => { if (live) setCity(c); }).catch(() => {});
    return () => { live = false; };
  }, [slug]);
  if (slug && current?.slug === slug) return current;
  return city;
}
