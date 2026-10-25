"""Register the four Faves agents on Agentverse as mailbox agents, so ASI:One can find and
talk to them while run.py runs on this computer.
    AGENTVERSE_API_KEY=... .venv/bin/python register.py
(The same thing can be done by hand: start run.py, open each agent's inspector link and click
Connect > Mailbox.)"""
import certs  # noqa: F401
import sys
from pathlib import Path

from uagents_core.identity import Identity
from uagents_core.utils.registration import AgentverseConnectRequest, AgentverseRegistrationRequest, register_in_agentverse

from common import AGENTVERSE_API_KEY, NAMES, seed_for

HERE = Path(__file__).resolve().parent
MAILBOX_ENDPOINT = "https://agentverse.ai/v1/submit"


def main() -> int:
    if not AGENTVERSE_API_KEY:
        print("Set AGENTVERSE_API_KEY in faves/.env first (agentverse.ai > Profile > API Keys).")
        return 1
    from booker_agent import booker, proto as booker_proto
    from butler import butler, chat, pay
    from planner_agent import planner, proto as planner_proto
    from scout_agent import proto as scout_proto, scout

    readme = (HERE / "README.md").read_text()
    jobs = [
        ("butler", butler, [chat, pay], ["plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each",
                                         "date night in the Mission for two, dinner and a view",
                                         "find a Gundam store near Japantown"]),
        ("planner", planner, [planner_proto], []),
        ("scout", scout, [scout_proto], []),
        ("booker", booker, [booker_proto], []),
    ]
    ok_all = True
    for role, agent, protos, prompts in jobs:
        ok = register_in_agentverse(
            AgentverseConnectRequest(user_token=AGENTVERSE_API_KEY, agent_type="mailbox"),
            Identity.from_seed(seed_for(role), 0),
            AgentverseRegistrationRequest(
                name=NAMES[role],
                endpoint=MAILBOX_ENDPOINT,
                protocols=[p.digest for p in protos],
                description=agent._description or NAMES[role],  # noqa: SLF001
                readme=readme,
                starter_prompts=prompts or None,
                active=True,
            ),
        )
        print(f"{NAMES[role]} ({agent.address}): {'registered' if ok else 'FAILED'}")
        ok_all &= ok
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
