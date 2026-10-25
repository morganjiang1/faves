"""Faves Scout: finds spots for niche asks ("a Gundam store near Japantown"). Looks in Faves'
data first; when that has nothing and APIFY_TOKEN is set, runs our Faves Local Spots Actor
(actors/faves-local-spots) on Apify live: OpenStreetMap places ranked by what locals say on the
city's subreddit, with a Locals Score. Returns what it found as fresh finds."""
import os
import certs  # noqa: F401  (first: TLS roots for Agentverse)
import httpx
from uagents import Agent, Context, Protocol

from common import MAILBOX, APIFY_TOKEN, NAMES, PORTS, FavesAPI, ScoutReply, ScoutRequest, seed_for

api = FavesAPI()
scout = Agent(name=NAMES["scout"], seed=seed_for("scout"), port=PORTS["scout"], mailbox=MAILBOX,
              description="Scouts niche spots (a Gundam store, a quiet rooftop) from Faves data and live Apify runs.")
proto = Protocol(name="FavesScout", version="1.0.0")
# actors/faves-local-spots, pushed with `apify push`: "<your Apify username>~faves-local-spots".
ACTOR = os.environ.get("APIFY_ACTOR", "faves~faves-local-spots").replace("/", "~")


async def live(city: str, query: str) -> list[dict]:
    if not APIFY_TOKEN:
        return []
    url = f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items"
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(url, params={"token": APIFY_TOKEN, "maxTotalChargeUsd": "0.5"}, json={"city": city, "vibe": query, "maxResults": 5, "redditThreads": 4})
        r.raise_for_status()
        return [{**s, "source": "apify", "fresh": True} for s in r.json()][:5]


@proto.on_message(ScoutRequest, replies=ScoutReply)
async def on_scout(ctx: Context, sender: str, msg: ScoutRequest):
    try:
        found = (await api.scout(msg.city, msg.query)).get("spots", [])
        if found:
            await ctx.send(sender, ScoutReply(ok=True, spots=found, source="faves"))
            return
        fresh = await live(msg.city, msg.query)
        await ctx.send(sender, ScoutReply(ok=True, spots=fresh, source="apify" if fresh else "none"))
    except Exception as e:
        await ctx.send(sender, ScoutReply(ok=False, error=str(e)))


scout.include(proto, publish_manifest=True)

if __name__ == "__main__":
    scout.run()
