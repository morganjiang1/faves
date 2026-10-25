"""The whole Faves Agent flow in one conversation, the way ASI:One would have it, run locally:
ask -> fair group plan with travel times -> swap a stop -> book (and pay the fee) -> group chat link.

    python test_flow.py               (needs the Faves server: npm run chat-server)
    python test_flow.py --real-clock  (the same conversation against today's real date and time)

By default the clock is pinned (FAVES_NOW) to Saturday, Oct 24 2026 at 10 PM in San Francisco,
the moment a run once planned "a Saturday" for 10:15 PM that night, so the run is the same on
any day at any hour. Every reply is checked for what it should say, not for one word:
- the plan is a day with several stops, on a Saturday, starting after "now";
- "swap the hot pot for ramen" changed the hot pot stop (and says which stop), to ramen;
- "book it" answers with every stop's booking in a chat message (short link labels, never a
  raw URL), then a Payment Protocol request, which this test user pays;
- "make a group chat" answers with the invite link.
"""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
import asyncio
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from zoneinfo import ZoneInfo

PINNED = "2026-10-24T22:00:00-07:00"
REAL = "--real-clock" in sys.argv
os.environ["FAVES_AGENTS_LOCAL"] = "1"  # before the agents are made
# Empty (not unset) for the real clock, so a FAVES_NOW in .env can't pin it again.
os.environ["FAVES_NOW"] = "" if REAL else (os.environ.get("FAVES_NOW") or PINNED)

from uagents import Agent, Bureau, Context, Protocol  # noqa: E402
from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, TextContent  # noqa: E402
from uagents_core.contrib.protocols.payment import (  # noqa: E402
    CancelPayment,
    CommitPayment,
    CompletePayment,
    RequestPayment,
    payment_protocol_spec,
)

from booker_agent import booker  # noqa: E402
from butler import butler  # noqa: E402
from planner_agent import planner  # noqa: E402
from scout_agent import scout  # noqa: E402

SF = ZoneInfo("America/Los_Angeles")
NOW = (datetime.fromisoformat(os.environ["FAVES_NOW"]) if os.environ["FAVES_NOW"] else datetime.now(timezone.utc)).astimezone(SF)
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
DAY_LINE = re.compile(r"\*\*(\w+), (\w{3}) (\d{1,2}) · (\d{1,2}:\d{2} [AP]M) to (\d{1,2}:\d{2} [AP]M)")
STOP_LINE = re.compile(r"^(\d+)\. \*\*(\d{1,2}:\d{2} [AP]M) (.+?)\*\*(?: \(([^)]*)\))?", re.M)
SWAP_LINE = re.compile(r"Swapped stop (\d+), \*\*(.+?)\*\*(?: \(([^)]*)\))?, for \*\*(.+?)\*\*(?: \(([^)]*)\))?\.")

state: dict = {"i": 0, "failures": [], "stops": [], "hot": None, "request": None, "completed": False, "thanks": False, "done": False}


def fail(msg: str) -> None:
    print(f"!!! {msg}", flush=True)
    state["failures"].append(msg)


def stops_of(text: str) -> list[tuple[int, str, str]]:
    return [(int(n), name, about or "") for n, _, name, about in STOP_LINE.findall(text)]


def check_plan(text: str) -> None:
    m = DAY_LINE.search(text)
    if not m:
        return fail("the plan has no day line")
    weekday, mon, day, start = m.group(1), m.group(2), int(m.group(3)), m.group(4)
    if weekday != "Saturday":
        fail(f"asked for a Saturday, got {weekday}")
    year = NOW.year + (1 if MONTHS.index(mon) + 1 < NOW.month - 6 else 0)
    t = datetime.strptime(start, "%I:%M %p")
    starts = datetime(year, MONTHS.index(mon) + 1, day, t.hour, t.minute, tzinfo=SF)
    if starts <= NOW:
        fail(f"the plan starts in the past: {starts:%a %b %d %I:%M %p}, now is {NOW:%a %b %d %I:%M %p}")
    else:
        print(f"    (starts {starts:%a %b %d %I:%M %p}, {starts - NOW} after now)", flush=True)
    stops = stops_of(text)
    if len(stops) < 2:
        fail(f"expected a day with several stops, got {len(stops)}")
    hot = [s for s in stops if "hot pot" in f"{s[1]} {s[2]}".lower()]
    if not hot:
        fail("asked for hot pot, but no stop is hot pot")
    state["stops"], state["hot"] = stops, (hot[0] if hot else None)


def check_swap(text: str) -> None:
    m = SWAP_LINE.search(text)
    if not m:
        return fail("the swap reply doesn't say which stop changed")
    n, before, to, to_kind = int(m.group(1)), m.group(2), m.group(4), m.group(5) or ""
    if state["hot"] and (n, before) != state["hot"][:2]:
        fail(f"'swap the hot pot' changed stop {n} ({before}), not the hot pot stop {state['hot'][0]} ({state['hot'][1]})")
    if "ramen" not in f"{to} {to_kind}".lower():
        fail(f"asked for ramen, got {to} ({to_kind})")
    stops = stops_of(text)
    if not any(s[0] == n and s[1] == to for s in stops):
        fail(f"the new plan doesn't list {to} at stop {n}")
    state["stops"] = stops or state["stops"]


def check_book(text: str) -> None:
    if "booked" not in text:
        fail("no booking reply")
    for n, name, _ in state["stops"]:
        line = next((ln for ln in text.splitlines() if f"**{name}**" in ln), None)
        if not line:
            fail(f"the booking doesn't mention stop {n}, {name}")
        elif not ("](http" in line or "call them at" in line or "just show up" in line):
            fail(f"the booking doesn't say how to book {name}: {line}")
    bare = re.sub(r"\]\(https?://[^\s)]+\)", "]", text)
    if "http" in bare:
        fail("the booking pastes a raw URL instead of a short link label")
    if "booking fee" not in text:
        fail("the booking doesn't mention the booking fee")


def check_group(text: str) -> None:
    if "/join/" not in text or "faves://join/" not in text:
        fail("no group chat invite link")


STEPS = [
    ("plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each", check_plan),
    ("swap the hot pot for ramen", check_swap),
    ("book it", check_book),
    ("make a group chat", check_group),
]
user = Agent(name="test user", seed="faves test user " + os.urandom(4).hex(), port=8199)
pay = Protocol(spec=payment_protocol_spec, role="buyer")


def finish_if_done() -> None:
    if state["done"] or state["i"] < len(STEPS) or not (state["completed"] and state["thanks"]):
        return
    state["done"] = True
    end(0 if not state["failures"] else 1)


def end(code: int) -> None:
    if code:
        print("\nFAILED:\n- " + "\n- ".join(state["failures"] or ["timed out"]), flush=True)
    else:
        print(f"\nALL STEPS PASSED ({'real clock' if REAL else 'clock pinned to ' + PINNED})", flush=True)
    sys.stdout.flush()
    os._exit(code)


async def say(ctx: Context):
    text = STEPS[state["i"]][0]
    print(f"\n>>> {text}", flush=True)
    await ctx.send(butler.address, ChatMessage(timestamp=datetime.now(timezone.utc), msg_id=uuid4(), content=[TextContent(text=text)]))


async def watchdog():
    await asyncio.sleep(150)
    if not state["done"]:
        fail(f"timed out at step {state['i'] + 1} (payment completed: {state['completed']}, thanks: {state['thanks']})")
        end(1)


@user.on_event("startup")
async def start(ctx: Context):
    print(f"(now = {NOW:%a %b %d %Y %I:%M %p} in San Francisco, {'real clock' if REAL else 'pinned'})", flush=True)
    asyncio.create_task(watchdog())
    await asyncio.sleep(2)
    await say(ctx)


@user.on_message(ChatMessage)
async def got(ctx: Context, sender: str, msg: ChatMessage):
    text = msg.text()
    print(text, flush=True)
    if "booking fee came through" in text:
        state["thanks"] = True
        return finish_if_done()
    if state["i"] >= len(STEPS):
        return fail(f"an extra message nobody asked for: {text[:80]}")
    STEPS[state["i"]][1](text)
    state["i"] += 1
    if state["i"] < len(STEPS):
        await say(ctx)
    else:
        finish_if_done()


@user.on_message(ChatAcknowledgement)
async def ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


@pay.on_message(RequestPayment)
async def on_request(ctx: Context, sender: str, msg: RequestPayment):
    funds = msg.accepted_funds[0] if msg.accepted_funds else None
    print(f"    (payment request: {funds.amount if funds else '?'} {funds.currency if funds else '?'}, {msg.description})", flush=True)
    if not funds or funds.amount != "0.5" or funds.currency != "FET":
        fail(f"unexpected payment request: {msg}")
    if state["i"] != 3:
        fail("the payment request didn't come right after the booking details")
    state["request"] = msg
    # Pay it, the way ASI:One's wallet would.
    await ctx.send(sender, CommitPayment(funds=funds, recipient=msg.recipient, transaction_id=f"test-{uuid4().hex[:12]}", reference=msg.reference, description=msg.description))


@pay.on_message(CompletePayment)
async def on_complete(ctx: Context, sender: str, msg: CompletePayment):
    print(f"    (payment complete: {msg.transaction_id})", flush=True)
    state["completed"] = True
    finish_if_done()


@pay.on_message(CancelPayment)
async def on_cancel(ctx: Context, sender: str, msg: CancelPayment):
    fail(f"the payment was cancelled: {msg.reason}")


user.include(pay)


def check_formatting() -> None:
    """The Faves Agent's wording on cases a live plan may not hit: a reservation link shows as a short
    label, and a swap that can't find the named stop says what it changed instead."""
    from butler import booking_text, swap_line

    url = "https://www.google.com/maps/reserve/v/dine/c/nqP8Fyd4GUQ?source=pa&opi=79508299&hl=en-US&" + "x" * 400
    text = booking_text({"bookings": [{"name": "Dragon Beaux", "time": "6:00 PM", "how": "online", "url": url}], "fee": {"amount": "0.5", "currency": "FET"}}, True)
    assert f"[Reserve on Google]({url})" in text, text
    assert "http" not in re.sub(r"\]\(https?://[^\s)]+\)", "]", text), text
    line = swap_line({"stop": 2, "from": "Ferry Building", "fromKind": "Market", "to": "Marufuku Ramen", "toKind": "Ramen restaurant", "asked": "karaoke", "matched": False})
    assert line.startswith('I couldn\'t find "karaoke" in the plan, so I swapped stop 2, **Ferry Building**'), line
    assert swap_line({"stop": 3, "from": "Nan hot pot SF", "to": "HINODEYA Ramen", "matched": True}) == "Swapped stop 3, **Nan hot pot SF**, for **HINODEYA Ramen**."
    print("(formatting checks passed)", flush=True)


if __name__ == "__main__":
    check_formatting()
    # Local only: the agents talk inside this process, nothing is registered.
    bureau = Bureau(agents=[butler, planner, scout, booker, user], port=8190)
    bureau.run()
