"""The whole Butler flow in one conversation, the way ASI:One would have it, run locally:
ask -> fair group plan with travel times -> swap a stop -> book -> group chat link.
    python test_flow.py      (needs the Faves server: npm run chat-server)
"""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
import asyncio
import os

os.environ["FAVES_AGENTS_LOCAL"] = "1"  # before the agents are made
import sys
from datetime import datetime, timezone
from uuid import uuid4

from uagents import Agent, Bureau, Context
from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, TextContent

from booker_agent import booker
from butler import butler
from planner_agent import planner
from scout_agent import scout

STEPS = [
    ("plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each", ["min", "1."]),
    ("swap the hot pot for ramen", ["Swapped"]),
    ("book it", ["booked"]),
    ("make a group chat", ["/join/"]),
]
user = Agent(name="test user", seed="faves test user " + os.urandom(4).hex(), port=8199)
state = {"i": 0, "failed": False}


async def say(ctx: Context):
    text = STEPS[state["i"]][0]
    print(f"\n>>> {text}")
    await ctx.send(butler.address, ChatMessage(timestamp=datetime.now(timezone.utc), msg_id=uuid4(), content=[TextContent(text=text)]))


@user.on_event("startup")
async def start(ctx: Context):
    await asyncio.sleep(2)
    await say(ctx)


@user.on_message(ChatMessage)
async def got(ctx: Context, sender: str, msg: ChatMessage):
    text = msg.text()
    print(text)
    expect = STEPS[state["i"]][1]
    if not all(e.lower() in text.lower() for e in expect):
        print(f"!!! expected {expect}")
        state["failed"] = True
    state["i"] += 1
    if state["i"] < len(STEPS):
        await say(ctx)
    else:
        print("\nFAILED" if state["failed"] else "\nALL STEPS PASSED")
        os._exit(1 if state["failed"] else 0)


@user.on_message(ChatAcknowledgement)
async def ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


if __name__ == "__main__":
    # Local only: the agents talk inside this process, nothing is registered.
    bureau = Bureau(agents=[butler, planner, scout, booker, user], port=8190)
    bureau.run()
