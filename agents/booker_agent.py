"""Faves Booker: books the day. Online reservations become links; walk-in spots need nothing;
places that only take phone bookings come with their number, so someone in the group can call."""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
from uagents import Agent, Context, Protocol

from common import MAILBOX, NAMES, PORTS, BookReply, BookRequest, FavesAPI, seed_for

api = FavesAPI()
booker = Agent(name=NAMES["booker"], seed=seed_for("booker"), port=PORTS["booker"], mailbox=MAILBOX,
               description="Books a group day: reservation links, walk-in notes, and the number to call for places that only book by phone.")
proto = Protocol(name="FavesBooker", version="1.0.0")


@proto.on_message(BookRequest, replies=BookReply)
async def on_book(ctx: Context, sender: str, msg: BookRequest):
    try:
        res = await api.book(msg.plan_id)
        await ctx.send(sender, BookReply(ok=True, bookings=res["bookings"], fee=res.get("fee")))
    except Exception as e:
        await ctx.send(sender, BookReply(ok=False, error=str(e)))


booker.include(proto, publish_manifest=True)

if __name__ == "__main__":
    booker.run()
