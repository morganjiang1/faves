"""Shared bits for the Faves agents: settings, seeds, the Faves API client and the messages
the agents send each other.

Settings come from faves/.env (never committed):
  FAVES_API_URL        the Faves server (npm run chat-server), default http://localhost:8787
  ASI_ONE_API_KEY      ASI:One LLM for understanding requests (optional; rules work without it)
  AGENTVERSE_API_KEY   registers the agents on Agentverse so ASI:One can find them
  APIFY_TOKEN          live scouting through Apify Actors (optional)
  CARTESIA_API_KEY     the booking call voice (optional)
"""
from __future__ import annotations

import json
import os
import secrets
from pathlib import Path
from typing import Any, Optional

import httpx
from dotenv import load_dotenv
from uagents import Model

# Python from python.org on a Mac ships without root certificates; use certifi's.
try:
    import certifi

    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
except ImportError:
    pass

HERE = Path(__file__).resolve().parent
load_dotenv(HERE.parent / ".env")
load_dotenv(HERE / ".env")

FAVES_API_URL = os.getenv("FAVES_API_URL", "http://localhost:8787").rstrip("/")
ASI_ONE_API_KEY = os.getenv("ASI_ONE_API_KEY") or None
AGENTVERSE_API_KEY = os.getenv("AGENTVERSE_API_KEY") or None
APIFY_TOKEN = os.getenv("APIFY_TOKEN") or None
CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY") or None

# FAVES_AGENTS_LOCAL=1 keeps the agents off Agentverse (tests run them in one process).
MAILBOX = os.getenv("FAVES_AGENTS_LOCAL") != "1"

PORTS = {"butler": 8101, "planner": 8102, "scout": 8103, "booker": 8104}
NAMES = {"butler": "Faves Butler", "planner": "Faves Planner", "scout": "Faves Scout", "booker": "Faves Booker"}


def seed_for(role: str) -> str:
    """A stable secret seed per agent (env FAVES_SEED_<ROLE>, else made once in .seeds.json)."""
    env = os.getenv(f"FAVES_SEED_{role.upper()}")
    if env:
        return env
    path = HERE / ".seeds.json"
    seeds = json.loads(path.read_text()) if path.exists() else {}
    if role not in seeds:
        seeds[role] = f"faves-{role}-{secrets.token_hex(16)}"
        path.write_text(json.dumps(seeds, indent=2))
    return seeds[role]


def address_of(role: str) -> str:
    from uagents.crypto import Identity

    return Identity.from_seed(seed_for(role), 0).address


# ---- The Faves API (the app's own planner, run by the Faves server) ------------------------

class FavesAPI:
    def __init__(self, base: str = FAVES_API_URL):
        self.base = base

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{self.base}/api/{path}", json=body)
            data = r.json()
            if r.status_code >= 400:
                raise RuntimeError(data.get("error") or f"Faves API error {r.status_code}")
            return data

    async def plan(self, city: str, text: str, friends: list[dict[str, Any]]) -> dict[str, Any]:
        return await self._post("plan", {"city": city, "text": text, "friends": friends})

    async def swap(self, plan_id: str, stop: Any, want: str = "") -> dict[str, Any]:
        return await self._post("swap", {"planId": plan_id, "stop": stop, "want": want})

    async def book(self, plan_id: str) -> dict[str, Any]:
        return await self._post("book", {"planId": plan_id})

    async def group(self, plan_id: str, name: str = "") -> dict[str, Any]:
        return await self._post("group", {"planId": plan_id, "name": name})

    async def scout(self, city: str, query: str) -> dict[str, Any]:
        return await self._post("scout", {"city": city, "query": query})


# ---- Messages between the agents -----------------------------------------------------------

class PlanRequest(Model):
    city: str
    text: str
    friends: list[dict[str, Any]] = []


class PlanReply(Model):
    ok: bool
    plan: Optional[dict[str, Any]] = None
    error: Optional[str] = None


class SwapRequest(Model):
    plan_id: str
    stop: Optional[str] = None
    want: str = ""


class ScoutRequest(Model):
    city: str
    query: str


class ScoutReply(Model):
    ok: bool
    spots: list[dict[str, Any]] = []
    source: str = "faves"
    error: Optional[str] = None


class BookRequest(Model):
    plan_id: str
    call_stop: Optional[int] = None  # a stop to phone (only after a person confirms)
    confirmed: bool = False


class BookReply(Model):
    ok: bool
    bookings: list[dict[str, Any]] = []
    fee: Optional[dict[str, Any]] = None
    call: Optional[dict[str, Any]] = None
    error: Optional[str] = None
