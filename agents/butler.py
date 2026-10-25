"""Faves Agent: plans a fair hangout for a group of friends, in a chat.

Speaks the Agent Chat Protocol (so it works in ASI:One) and coordinates three agents:
Faves Planner (the day, fair to everyone's starting point), Faves Scout (niche asks, live
Apify runs) and Faves Booker (reservation links, walk-ins, numbers to call). The whole flow
works in one conversation: ask -> a fair plan with each friend's travel time -> swap a stop ->
book -> a Faves group chat invite link. It charges a small booking fee through the Payment Protocol.
If an agent doesn't answer, the Faves Agent calls the Faves API itself, so the chat never stalls.
"""
from __future__ import annotations

import certs  # noqa: F401  (first: TLS roots for Agentverse)

import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    MetadataContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)
from uagents_core.contrib.protocols.payment import (
    CommitPayment,
    CompletePayment,
    Funds,
    RejectPayment,
    RequestPayment,
    payment_protocol_spec,
)

from common import MAILBOX, NAMES, PORTS, BookReply, BookRequest, FavesAPI, PlanReply, PlanRequest, ScoutReply, ScoutRequest, SwapRequest, address_of, seed_for
from understand import understand

api = FavesAPI()
butler = Agent(
    name=NAMES["butler"],
    seed=seed_for("butler"),
    port=PORTS["butler"],
    mailbox=MAILBOX,
    readme_path="README.md",
    description="Plans a hangout for you and your friends that's fair for everyone: tell it who's coming, where each of you lives and what you like.",
)
chat = Protocol(spec=chat_protocol_spec)
pay = Protocol(spec=payment_protocol_spec, role="seller")

TRY = (
    "Try: **plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, "
    "we like pickleball and hot pot, under $40 each**\n\n"
    "Then say **swap the hot pot for ramen**, **book it** or **make a group chat**."
)
HELP = "Hi, I'm the Faves Agent. I plan days out that are fair for everyone.\n\n" + TRY


def chat_text(text: str, card: dict[str, Any] | None = None, end: bool = False) -> ChatMessage:
    content: list[Any] = [TextContent(text=text)]
    if card:
        content.append(MetadataContent(metadata={
            "card_protocol_version": "1",
            "requires_card_interaction": "true",
            "card_kind": "detail",
            "card_payload": json.dumps(card),
        }))
    if end:
        content.append(EndSessionContent())
    return ChatMessage(timestamp=datetime.now(timezone.utc), msg_id=uuid4(), content=content)


def swap_line(c: dict[str, Any]) -> str:
    """Which stop changed, by name, and what it changed to (the plan below has the details)."""
    what = f"**{c['from']}** for **{c['to']}**."
    if c.get("matched") is False and c.get("asked"):
        return f"Couldn't find \"{c['asked']}\", so I swapped {what}"
    return f"Swapped {what}"


def plan_text(p: dict[str, Any], changed: dict[str, Any] | None = None) -> str:
    lines = []
    if changed:
        lines.append(swap_line(changed) + "\n")
    lines.append(f"### {p['title']}")
    lines.append(f"**{p['day']} · {p['start']} to {p['end']} · about ${p['costPerPerson']} each**")
    if p.get("travel") and p.get("fairLine"):
        # Fair for everyone: each person's trip to the first stop, in minutes.
        trips = ", ".join(f"{t['name']} {t['minutes']}" for t in p["travel"])
        lines.append(f"{p['fairLine'][0].upper()}{p['fairLine'][1:]} ({trips} min).")
    if p.get("unplacedFriends"):
        who = p["unplacedFriends"]
        lines.append(f"_Where {'does' if len(who) == 1 else 'do'} {', '.join(who)} start? I'll keep it fair for them too._")
    lines.append("")
    for s in p["stops"]:
        score = f" · Locals Score {s['localsScore']}" if s.get("localsScore") is not None else ""
        about = ", ".join(x for x in [s.get("kind") or "", s.get("hood") or ""] if x)
        hood = f" ({about})" if about else ""
        lines.append(f"{s['n']}. **{s['time']} {s['name']}**{hood}{score} · {s['cost']}")
    lines.append("\nSay **swap stop 2 for something cheaper**, **book it** or **make a group chat**.")
    return "\n".join(lines)


def plan_card(p: dict[str, Any]) -> dict[str, Any]:
    rows = [{"label": s["time"], "value": f"{s['name']} · {s['cost']}"} for s in p["stops"]]
    if p.get("fairLine"):
        rows.append({"label": "Fair", "value": p["fairLine"]})
    hero = next((s.get("image") for s in p["stops"] if s.get("image")), None)
    card: dict[str, Any] = {
        "title": p["title"],
        "summary_rows": rows,
        "ctas": [
            {"label": "Book it", "primary": True, "selection": {"action": "book", "planId": p["planId"]}},
            {"label": "Make a group chat", "selection": {"action": "group", "planId": p["planId"]}},
            {"label": f"Swap {p['stops'][0]['name']}", "selection": {"action": "swap", "stop": 1, "planId": p["planId"]}},
        ],
    }
    if hero:
        card["hero_image"] = hero
    return card


async def ask(ctx: Context, role: str, msg, reply_type, timeout: int = 25):
    """Ask one of the Faves agents; None when it doesn't answer in time."""
    try:
        reply, status = await ctx.send_and_receive(address_of(role), msg, response_type=reply_type, timeout=timeout)
        return reply if isinstance(reply, reply_type) else None
    except Exception as e:
        ctx.logger.warning(f"{role} didn't answer: {e}")
        return None


def session(ctx: Context, sender: str) -> dict[str, Any]:
    raw = ctx.storage.get(f"s:{sender}")
    return json.loads(raw) if isinstance(raw, str) else (raw or {})


def save(ctx: Context, sender: str, **fields: Any) -> None:
    """Merge fields into the stored session (read fresh, so a payment that lands while a reply
    is being worked out isn't overwritten)."""
    s = session(ctx, sender)
    s.update(fields)
    ctx.storage.set(f"s:{sender}", json.dumps(s))


def reserve_label(url: str) -> str:
    """A short label for a reservation link (the same words as src/lib/linktext.ts)."""
    u = url.lower()
    if "/maps/reserve" in u or "reserve.google." in u:
        return "Reserve on Google"
    for host, label in (("opentable.", "Book on OpenTable"), ("resy.com", "Book on Resy"), ("exploretock.com", "Book on Tock"), ("yelp.", "Book on Yelp")):
        if host in u:
            return label
    return "Book a table"


def booking_text(res: dict[str, Any], fee_due: bool) -> str:
    """One line per stop: a short reservation link, the number to call for phone-only places
    (you call; the agent never phones anyone), or walk in."""
    lines = ["Here's how to book it:"]
    for b in res["bookings"]:
        if b["how"] == "online":
            url = b["url"].replace("(", "%28").replace(")", "%29").replace(" ", "%20")  # can't end the link early
            lines.append(f"- {b['time']} **{b['name']}**: [{b.get('label') or reserve_label(b['url'])}]({url})")
        elif b["how"] == "phone":
            lines.append(f"- {b['time']} **{b['name']}**: call {b['phone']}")
        else:
            lines.append(f"- {b['time']} **{b['name']}**: walk in")
    fee = res.get("fee")
    if fee and fee_due:
        lines.append(f"\nThe booking fee is {fee['amount']} {fee['currency']} for the day. The payment request is next.")
    lines.append("\nSay **make a group chat** to bring your friends in.")
    return "\n".join(lines)


async def handle(ctx: Context, sender: str, text: str) -> list[Any]:
    """The replies to one message, in order: always a chat message first, then anything else
    (a payment request after the booking details)."""
    s = session(ctx, sender)
    plan = s.get("plan")
    it = understand(text, has_plan=bool(plan))
    intent = it.get("intent", "plan")

    if intent == "help" and not plan:
        return [chat_text(HELP)]

    if intent == "scout":
        city = it.get("city") or s.get("city") or "san-francisco"
        r = await ask(ctx, "scout", ScoutRequest(city=city, query=it.get("query") or text), ScoutReply)
        spots = r.spots if r and r.ok else (await api.scout(city, it.get("query") or text)).get("spots", [])
        if not spots:
            return [chat_text("I couldn't find that yet. Try other words, or ask me to plan a day.")]
        tag = " (fresh from a live scout)" if r and r.source == "apify" else ""
        def spot(x: dict[str, Any]) -> str:
            bits = [f"**{x['name']}**"]
            if x.get("hood"):
                bits.append(x["hood"])
            if x.get("localsScore"):
                bits.append(f"Locals Score {x['localsScore']}")
            if x.get("hiddenGem"):
                bits.append("hidden gem")
            if x.get("fresh"):
                bits.append("fresh find")
            return "- " + " · ".join(bits)
        lines = [f"Here's what I found{tag}:"] + [spot(x) for x in spots]
        return [chat_text("\n".join(lines) + "\n\nWant a day planned around one?")]

    if intent in {"swap", "book", "group"} and not plan:
        return [chat_text("Let's plan the day first.\n\n" + TRY)]

    if intent == "swap":
        # The stop they named ("the hot pot"); the Planner finds it, or says it fell back.
        stop = str(it.get("stop") or "").strip()
        r = await ask(ctx, "planner", SwapRequest(plan_id=plan["planId"], stop=stop, want=it.get("want") or ""), PlanReply)
        if r and r.ok:
            new = r.plan
        else:
            new = await api.swap(plan["planId"], int(stop) if stop.isdigit() else stop, it.get("want") or "")
        save(ctx, sender, plan=new)
        return [chat_text(plan_text(new, new.get("changed")), plan_card(new))]

    if intent == "book":
        r = await ask(ctx, "booker", BookRequest(plan_id=plan["planId"]), BookReply)
        res = r.model_dump() if r and r.ok else await api.book(plan["planId"])
        fee = res.get("fee")
        fee_due = bool(fee) and not session(ctx, sender).get("paid")
        save(ctx, sender, booked=True)
        # The booking details first, as a chat message anyone can read; the fee follows as a
        # Payment Protocol request (ASI:One shows it as a pay card).
        out: list[Any] = [chat_text(booking_text(res, fee_due))]
        if fee_due:
            out.append(RequestPayment(
                accepted_funds=[Funds(amount=fee["amount"], currency=fee["currency"], payment_method="fet_direct")],
                recipient=str(butler.wallet.address()),
                deadline_seconds=600,
                reference=plan["planId"],
                description="Faves booking fee for the group's day",
            ))
        return out

    if intent == "group":
        g = await api.group(plan["planId"], s.get("groupName") or "")
        save(ctx, sender, group=g)
        return [chat_text(
            f"Your group chat **{g['name']}** is ready, with the plan pinned.\n\n"
            f"- Invite link: {g['web']}\n- In the app: {g['app']} (code **{g['code']}**)\n\n"
            "Send the link so everyone can tap In."
        )]

    # A new plan (or a re-plan with new details).
    city = it.get("city") or s.get("city") or "san-francisco"
    friends = it.get("friends") or s.get("friends") or []
    request = it.get("request") or text
    r = await ask(ctx, "planner", PlanRequest(city=city, text=request, friends=friends), PlanReply)
    new = r.plan if r and r.ok else await api.plan(city, request, friends)
    save(ctx, sender, plan=new, city=city, friends=friends, booked=False)
    return [chat_text(plan_text(new), plan_card(new))]


@chat.on_message(ChatMessage)
async def on_chat(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.now(timezone.utc), acknowledged_msg_id=msg.msg_id))
    for item in msg.content:
        if isinstance(item, StartSessionContent):
            ctx.logger.info(f"session started with {sender}")
        elif isinstance(item, EndSessionContent):
            ctx.storage.set(f"s:{sender}", json.dumps({}))
    text = msg.text().strip()
    if not text:
        return
    try:
        replies = await handle(ctx, sender, text)
    except Exception:
        ctx.logger.exception("couldn't handle a message")
        replies = [chat_text("Sorry, that didn't work. Try again in a moment.")]
    for reply in replies:
        await ctx.send(sender, reply)


@chat.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


@pay.on_message(CommitPayment)
async def on_commit(ctx: Context, sender: str, msg: CommitPayment):
    # A real deployment checks the transfer on the ledger before completing.
    save(ctx, sender, paid=msg.transaction_id)
    await ctx.send(sender, CompletePayment(transaction_id=msg.transaction_id))
    await ctx.send(sender, chat_text("Thanks, the booking fee came through. Your day is set."))


@pay.on_message(RejectPayment)
async def on_reject(ctx: Context, sender: str, msg: RejectPayment):
    await ctx.send(sender, chat_text("No problem. The links still work, and the group chat is free."))


butler.include(chat, publish_manifest=True)
butler.include(pay, publish_manifest=True)

if __name__ == "__main__":
    butler.run()
