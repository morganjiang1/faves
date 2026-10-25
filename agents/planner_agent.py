"""Faves Planner: builds the day with Faves' own planner (Locals Score from Google, Yelp,
Reddit and TikTok; opening hours; sunset; travel legs) and the meet-in-the-middle rule: the
first stop is the fairest one for everyone's starting point."""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
from uagents import Agent, Context, Protocol

from common import MAILBOX, NAMES, PORTS, FavesAPI, PlanReply, PlanRequest, SwapRequest, seed_for

api = FavesAPI()
planner = Agent(name=NAMES["planner"], seed=seed_for("planner"), port=PORTS["planner"], mailbox=MAILBOX,
                description="Plans a fair group day in 10 US cities: stops picked by the Faves Locals Score, the first stop fair to everyone's starting point.")
proto = Protocol(name="FavesPlanner", version="1.0.0")


@proto.on_message(PlanRequest, replies=PlanReply)
async def on_plan(ctx: Context, sender: str, msg: PlanRequest):
    try:
        plan = await api.plan(msg.city, msg.text, msg.friends)
        await ctx.send(sender, PlanReply(ok=True, plan=plan))
    except Exception as e:  # the Faves Agent falls back to the API itself
        await ctx.send(sender, PlanReply(ok=False, error=str(e)))


@proto.on_message(SwapRequest, replies=PlanReply)
async def on_swap(ctx: Context, sender: str, msg: SwapRequest):
    try:
        stop = int(msg.stop) if msg.stop and msg.stop.isdigit() else msg.stop
        plan = await api.swap(msg.plan_id, stop, msg.want)
        await ctx.send(sender, PlanReply(ok=True, plan=plan))
    except Exception as e:
        await ctx.send(sender, PlanReply(ok=False, error=str(e)))


planner.include(proto, publish_manifest=True)

if __name__ == "__main__":
    planner.run()
