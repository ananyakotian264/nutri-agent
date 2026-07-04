"""
orchestrator.py — The ORCHESTRATION LAYER + the PLANNING/EXECUTING AGENT.

This file is the busiest one in the project, so here's the map:

  MCPToolBridge   -> holds the MCP CLIENT connection to mcp_server.py and
                      translates between "MCP tool schema" and "Groq tool
                      schema" so the two protocols never leak into each
                      other.

  Agent.run()     -> the actual agentic loop. This is the classic
                      "Reason + Act" (ReAct) pattern:

                          THOUGHT   the model decides what to do next
                          ACTION    it calls a tool (executed via MCP)
                          OBSERVATION  the tool's result is appended back
                                    into the conversation
                          ... repeat until the model is confident enough
                          to answer without another tool call ...
                          FINAL ANSWER

                      "Planning" here is implicit in the loop rather than a
                      separate upfront step: the model re-plans after every
                      observation, which is more robust than committing to a
                      rigid plan up front (e.g. if USDA has no match, it can
                      pivot to an estimate instead of getting stuck).

Everything above this file (main.py / the FastAPI routes) does not know
Groq or MCP exist — it just calls `orchestrator.handle_message(text)` and
gets a plain-English reply plus a trace. That's what makes this the
orchestration layer: it's the only place that coordinates the model gateway
and the tool layer together.
"""
import sys
import json
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from gateway import gateway

MAX_AGENT_STEPS = 6

SYSTEM_PROMPT = """You are the planning engine of a calorie & macro tracking agent.

You have tools to: look up real nutrition data (search_usda_food), do BMI/macro
math (calculate_bmi, calculate_daily_targets), read/write the user's food log
(log_meal, get_daily_summary), and read their saved profile (get_saved_profile).

When the user describes something they ate:
1. If they already gave exact numbers, skip lookup and just log_meal directly with
   source="manual".
2. Otherwise, try search_usda_food first. USDA is strong for single ingredients,
   weak for restaurant/composite dishes (e.g. "shawarma", "biryani", "burger meal").
   If the match is missing, irrelevant, or clearly not the dish asked about, DO NOT
   invent a fake tool result — instead, reason it out yourself using your own
   nutrition knowledge of typical restaurant portions, and log with source="estimated".
3. Always convert per-100g figures to the actual portion size before logging —
   state your portion assumption plainly in your final reply (e.g. "assuming a
   ~250g wrap").
4. After logging, call get_daily_summary and mention in plain words how today's
   totals compare to the user's saved targets (if a profile exists).
5. Keep your final reply short, warm, and concrete: what you logged, the numbers,
   and one line on progress toward today's targets. No markdown headers.

If the user is instead setting up or updating their profile (height/weight/age/
sex/activity/goal), call calculate_bmi and calculate_daily_targets, and report the
BMI, category, and the four daily targets clearly.
"""


class MCPToolBridge:
    """Owns the MCP CLIENT session and speaks both protocol dialects."""

    def __init__(self):
        self._stack = AsyncExitStack()
        self.session: ClientSession | None = None

    async def connect(self, server_script: str):
        params = StdioServerParameters(command=sys.executable, args=[server_script])
        read, write = await self._stack.enter_async_context(stdio_client(params))
        self.session = await self._stack.enter_async_context(ClientSession(read, write))
        await self.session.initialize()

    async def close(self):
        await self._stack.aclose()

    async def list_tools_for_groq(self) -> list:
        result = await self.session.list_tools()
        return [
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description,
                    "parameters": t.inputSchema,
                },
            }
            for t in result.tools
        ]

    async def call_tool(self, name: str, args: dict) -> dict:
        result = await self.session.call_tool(name, args)
        # FastMCP serializes tool return values as JSON text content blocks.
        for block in result.content:
            if hasattr(block, "text"):
                try:
                    return json.loads(block.text)
                except json.JSONDecodeError:
                    return {"raw": block.text}
        return {"raw": None}


class Agent:
    def __init__(self, bridge: MCPToolBridge):
        self.bridge = bridge

    async def run(self, user_message: str) -> dict:
        """Runs the plan -> act -> observe loop. Returns reply text + a step trace."""
        tools = await self.bridge.list_tools_for_groq()
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
        trace = []

        for step in range(MAX_AGENT_STEPS):
            msg = gateway.chat(messages, tools=tools)

            if not msg.tool_calls:
                trace.append({"type": "final_answer", "content": msg.content})
                return {"reply": msg.content, "trace": trace}

            # The model chose one or more tool calls this step — execute all of them.
            messages.append({"role": "assistant", "content": msg.content or "", "tool_calls": msg.tool_calls})
            for call in msg.tool_calls:
                args = json.loads(call.function.arguments or "{}")
                trace.append({"type": "plan", "tool": call.function.name, "args": args})

                observation = await self.bridge.call_tool(call.function.name, args)
                trace.append({"type": "observation", "tool": call.function.name, "result": observation})

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.id,
                        "content": json.dumps(observation),
                    }
                )

        trace.append({"type": "final_answer", "content": "Hit the step limit before finishing — try rephrasing."})
        return {"reply": "I got stuck reasoning about that — could you rephrase or give me exact numbers?", "trace": trace}
