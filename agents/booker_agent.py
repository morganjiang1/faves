"""Faves Booker: books the day. Online reservations become links; walk-in spots need nothing;
places that only take phone bookings get a Cartesia voice call, but only after a person in
the group confirms, and the voice always says it is an AI assistant booking for the group."""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
import os

import httpx
from uagents import Agent, Context, Protocol

from common import MAILBOX, CARTESIA_API_KEY, NAMES, PORTS, BookReply, BookRequest, FavesAPI, seed_for

api = FavesAPI()
booker = Agent(name=NAMES["booker"], seed=seed_for("booker"), port=PORTS["booker"], mailbox=MAILBOX,
               description="Books a group day: reservation links, and an AI voice call (with a person's OK) for places without online booking.")
proto = Protocol(name="FavesBooker", version="1.0.0")
DEMO_NUMBER = os.getenv("FAVES_CALL_NUMBER")  # for the demo, a teammate plays the restaurant


async def place_call(stop: dict, day: str, party: int, confirmed_by: dict) -> dict:
    """Start the reservation call through the Faves server (a Cartesia managed agent that says
    it's an AI). The server dials the demo phone unless FAVES_CALL_REAL=1."""
    if not CARTESIA_API_KEY:
        return {"status": "not-set-up", "message": f"Voice calls aren't set up yet. Call {stop.get('name')} at {stop.get('phone')}."}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{api.base}/api/call", json={"placeName": stop.get("name"), "phone": stop.get("phone"), "day": day, "time": stop.get("time"), "partySize": party, "confirmedBy": confirmed_by})
        data = r.json()
        if r.status_code >= 400:
            return {"status": "error", "message": data.get("error", "The call didn't start.")}
        return {"status": "calling", **data}


@proto.on_message(BookRequest, replies=BookReply)
async def on_book(ctx: Context, sender: str, msg: BookRequest):
    try:
        res = await api.book(msg.plan_id)
        call = None
        if msg.call_stop and msg.confirmed:
            stop = next((b for b in res["bookings"] if b["n"] == msg.call_stop), None)
            who = {"id": sender, "name": msg.booker_name or "the group"}
            call = await place_call(stop, res.get("day", ""), int(res.get("groupSize") or 2), who) if stop else {"status": "no-stop"}
        await ctx.send(sender, BookReply(ok=True, bookings=res["bookings"], fee=res.get("fee"), call=call))
    except Exception as e:
        await ctx.send(sender, BookReply(ok=False, error=str(e)))


booker.include(proto, publish_manifest=True)

if __name__ == "__main__":
    booker.run()
