// Courts and viewpoints from OpenStreetMap: free, and richer than review sites for
// sport, surface, lights and access. Uses Nominatim for the city's bounding box and
// the public Overpass API for the features (both ask for a descriptive User-Agent).
const UA = "Faves/0.1 (hackathon project; github.com/morganjiang1/faves)";

export async function cityBox(query) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: "json", limit: "1" })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const [hit] = await res.json();
  if (!hit) throw new Error(`No OpenStreetMap match for ${query}`);
  const [south, north, west, east] = hit.boundingbox.map(Number);
  return { south, west, north, east };
}

export async function courtsAndViews(box) {
  const b = `${box.south},${box.west},${box.north},${box.east}`;
  const query = `[out:json][timeout:180];
(
  nwr["leisure"="pitch"]["sport"~"tennis|basketball|pickleball"](${b});
  nwr["tourism"="viewpoint"](${b});
);
out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error(`Overpass: ${res.status}`);
  return (await res.json()).elements;
}
