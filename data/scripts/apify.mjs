// Minimal Apify client: start an Actor run, wait for it, download its dataset.
const API = "https://api.apify.com/v2";

function token() {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("Set APIFY_TOKEN in your environment.");
  return t;
}

export async function startRun(actor, input, { maxChargeUsd, timeoutSecs = 3600 } = {}) {
  const params = new URLSearchParams({ token: token(), timeout: String(timeoutSecs) });
  if (maxChargeUsd) params.set("maxTotalChargeUsd", String(maxChargeUsd));
  const res = await fetch(`${API}/acts/${actor.replace("/", "~")}/runs?${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`${actor} did not start: ${res.status} ${await res.text()}`);
  return (await res.json()).data;
}

export async function waitForRun(runId, { pollMs = 15000 } = {}) {
  for (;;) {
    const res = await fetch(`${API}/actor-runs/${runId}?token=${token()}`);
    if (res.ok) {
      const run = (await res.json()).data;
      if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(run.status)) return run;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

export async function downloadDataset(datasetId) {
  const items = [];
  const limit = 1000;
  for (let offset = 0; ; offset += limit) {
    const params = new URLSearchParams({ token: token(), clean: "true", format: "json", limit: String(limit), offset: String(offset) });
    const res = await fetch(`${API}/datasets/${datasetId}/items?${params}`);
    if (!res.ok) throw new Error(`dataset ${datasetId}: ${res.status}`);
    const page = await res.json();
    items.push(...page);
    if (page.length < limit) return items;
  }
}
