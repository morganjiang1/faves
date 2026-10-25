"""Run all four Faves agents in one process: python run.py
(the Faves server must be running: npm run chat-server in faves/)."""
import certs  # noqa: F401  (first: TLS roots for Agentverse)
from uagents import Bureau

from booker_agent import booker
from butler import butler
from common import address_of
from planner_agent import planner
from scout_agent import scout

if __name__ == "__main__":
    for name, a in [("butler", butler), ("planner", planner), ("scout", scout), ("booker", booker)]:
        assert a.address == address_of(name)
        print(f"{a.name}: {a.address}")
    bureau = Bureau(agents=[butler, planner, scout, booker], port=8100)
    bureau.run()
