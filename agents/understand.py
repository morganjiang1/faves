"""What did the person ask for? ASI:One reads the message when ASI_ONE_API_KEY is set; plain
rules read it otherwise (and whenever the model is unreachable)."""
from __future__ import annotations

import json
import re
from typing import Any

from common import ASI_ONE_API_KEY

CITIES = {
    "san-francisco": ["san francisco", "sf", "the city", "bay area"],
    "new-york": ["new york", "nyc", "manhattan", "brooklyn"],
    "los-angeles": ["los angeles", " la ", "l.a."],
    "chicago": ["chicago"], "seattle": ["seattle"], "boston": ["boston"], "austin": ["austin"],
    "miami": ["miami"], "washington-dc": ["washington", " dc", "d.c."], "san-diego": ["san diego"],
}
INTENTS = {"plan", "swap", "book", "group", "scout", "help"}
MODES = {"walk": "walk", "walking": "walk", "transit": "transit", "bus": "transit", "bart": "transit", "muni": "transit", "train": "transit", "car": "drive", "drive": "drive", "driving": "drive", "bike": "bike", "biking": "bike"}

SYSTEM = """You turn a message to the Faves Agent (a group hangout planner) into JSON. Reply with JSON only:
{"intent": "plan"|"swap"|"book"|"group"|"scout"|"help" ("book" also when they ask you to call a place: you share its number, you never phone anyone),
 "city": city name or null,
 "request": the plan request in plain words (what, when, budget), e.g. "saturday 1pm to 7pm, pickleball then hot pot, under $40 each",
 "friends": [{"name": str, "from": neighborhood or town or null, "mode": "walk"|"transit"|"drive"|"bike"|null}],
 "stop": which stop to swap (a number or a name) or null,
 "want": what to swap it for or null,
 "query": what to scout for (e.g. "gundam store near japantown") or null}
For "me and 3 friends, we live in the Mission, the Richmond and Oakland": friends = You (Mission), Friend 2 (Richmond), Friend 3 (Oakland), Friend 4 (no place)."""


def _llm(text: str, has_plan: bool) -> dict[str, Any] | None:
    if not ASI_ONE_API_KEY:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=ASI_ONE_API_KEY, base_url="https://api.asi1.ai/v1", timeout=20)
        r = client.chat.completions.create(
            model="asi1-mini",
            messages=[{"role": "system", "content": SYSTEM}, {"role": "user", "content": f"(a plan already exists: {has_plan})\n{text}"}],
            temperature=0,
        )
        raw = r.choices[0].message.content or ""
        m = re.search(r"\{.*\}", raw, re.S)
        return json.loads(m.group(0)) if m else None
    except Exception:
        return None


def _city(t: str) -> str | None:
    low = f" {t.lower()} "
    for slug, names in CITIES.items():
        if any(n in low for n in names):
            return slug
    return None


def _friends(t: str) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    # Named: "Maya lives in the Mission", "Jay is in Oakland (drives)".
    for m in re.finditer(r"\b([A-Z][a-z]+)\s+(?:lives|is|'s|stays)\s+(?:in|near|by)\s+((?:the\s+)?[A-Za-z][A-Za-z ]+?)(?=,|\.|;| and |\(|$)", t):
        name, place = m.group(1), m.group(2).strip()
        if name.lower() in {"it", "this", "that", "there", "he", "she"}:
            continue
        tail = re.split(r",| and ", t[m.end(): m.end() + 30])[0].lower()
        mode = next((v for k, v in MODES.items() if re.search(rf"\b{k}", tail)), None)
        out.append({"name": name, "from": place, "mode": mode})
    if out:
        return out
    # Positional: "we live in the Mission, the Richmond and Oakland".
    m = re.search(r"(?:we|they)\s+(?:live|are|stay|are coming from|start)\s+(?:in|from)\s+(.+?)(?:[.;]|,?\s+(?:and\s+)?(?:we|they)\s|,?\s+(?:like|love|want|into)\b|$)", t, re.I)
    if m:
        places = [p.strip() for p in re.split(r",\s*|\s+and\s+", m.group(1)) if p.strip()]
        n = _group_size(t) or len(places)
        for i in range(max(n, len(places))):
            out.append({"name": "You" if i == 0 else f"Friend {i + 1}", "from": places[i] if i < len(places) else None, "mode": None})
    return out


def _group_size(t: str) -> int | None:
    m = re.search(r"me and (\d+|two|three|four|five|six) (?:friends|others|people)", t, re.I)
    if not m:
        return None
    w = m.group(1).lower()
    n = int(w) if w.isdigit() else {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6}[w]
    return n + 1


def rules(text: str, has_plan: bool) -> dict[str, Any]:
    t = text.strip()
    low = t.lower()
    # A card button comes back as JSON.
    try:
        sel = json.loads(t)
        if isinstance(sel, dict) and sel.get("action"):
            return {"intent": sel["action"], "stop": sel.get("stop"), "want": sel.get("want"), "friends": [], "city": None, "request": "", "query": None}
    except (ValueError, TypeError):
        pass
    intent = "plan"
    stop = want = query = None
    if has_plan and re.search(r"\b(swap|instead|replace|switch|change)\b", low):
        intent = "swap"
        m = re.search(r"(?:swap|replace|switch|change)\s+(?:out\s+)?(?:the\s+)?(?:stop\s+)?(.+?)(?:\s+(?:for|with|to)\s+(.+))?$", low)
        if m:
            stop, want = m.group(1).strip(" ."), (m.group(2) or "").strip(" .")
    elif has_plan and re.search(r"\b(book|reserve|reservation|call|phone)\b", low):
        # Asked to call a place: the booking details, with its number for someone to call.
        intent = "book"
    elif has_plan and re.search(r"\b(group|chat|invite|link|share)\b", low):
        intent = "group"
    elif re.search(r"^(find|any|is there|where can|scout)\b", low):
        intent, query = "scout", t
    elif re.search(r"^(hi|hello|hey|help|what can you do)\b", low) and len(low) < 40:
        intent = "help"
    return {"intent": intent, "city": _city(t), "request": t, "friends": _friends(t), "stop": stop, "want": want, "query": query}


def understand(text: str, has_plan: bool) -> dict[str, Any]:
    base = rules(text, has_plan)
    if base["intent"] in {"swap", "book", "group"} and text.strip().startswith("{"):
        return base  # a card button: no need to ask the model
    got = _llm(text, has_plan)
    if not got:
        return base
    merged = {**base, **{k: v for k, v in got.items() if v not in (None, "", [])}}
    merged["friends"] = got.get("friends") or base["friends"]
    if merged.get("intent") not in INTENTS:
        merged["intent"] = base["intent"]
    if merged.get("intent") == "plan" and not merged.get("request"):
        merged["request"] = text
    return merged
