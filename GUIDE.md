# Nutri-Agent — Step-by-Step Build Guide

A calorie/macro tracker where a real **agent** (not just an API call) decides
whether to trust a database lookup or estimate a food's nutrition itself,
logs it, and reports your progress against BMI-based daily targets.

This guide assumes zero prior agentic-AI experience and explains *why* each
piece exists, not just how to run it.

---

## 0. What you're actually building (read this first)

| Concept you asked for | Where it lives in this project |
|---|---|
| **MCP Server** | `backend/mcp_server.py` — exposes 6 tools (USDA search, BMI math, macro targets, log meal, get summary, get profile) |
| **MCP Client** | `orchestrator.MCPToolBridge` — speaks the MCP protocol to the server |
| **MCP Host** | `backend/main.py` — the FastAPI app; owns the client connection, serves the frontend |
| **AI Model Gateway** | `backend/gateway.py` — the *only* file that calls Groq. Everything else talks to `gateway.chat()`, never to Groq directly |
| **Orchestration layer** | `backend/orchestrator.py` — coordinates the gateway + the MCP tools together |
| **Agentic AI / Planning & executing agent** | `Agent.run()` in `orchestrator.py` — a **ReAct loop**: the model thinks, calls a tool, observes the result, and re-plans, repeating until it's confident enough to answer |

Why split it this way? Because in a real agentic system, **the model never
touches your data directly.** It can only act through tools, and every tool
call is visible and auditable (you'll literally see it in the UI's "agent
trace" receipt). That separation — model reasons, tools act, gateway
mediates, host coordinates — *is* the architecture that "agentic AI" refers
to. It's not one clever prompt; it's plumbing with a loop in the middle.

**Request flow for "I ate a chicken shawarma":**

1. Frontend → `POST /log-food` → **Host** (`main.py`)
2. Host hands the message to the **Agent**
3. Agent asks the **Gateway** (Groq) "what should I do?", passing the list of
   tools available from the **MCP Client**
4. Model replies: *call `search_usda_food("chicken shawarma")`*
5. Agent executes that via the **MCP Client → MCP Server**
6. Server hits the **USDA API**, returns a (likely weak) match
7. Agent feeds that observation back to the model
8. Model decides USDA's match is a raw ingredient, not the dish — it
   estimates the real dish itself, then calls `log_meal(...)`
9. Agent calls `get_daily_summary`, gets today's totals
10. Model writes a one-line human reply; Host returns reply + totals + the
    full step-by-step trace to the frontend

---

## 1. Prerequisites

- **Python 3.11+** and **Node.js 18+** installed
- A **Groq API key** — free at https://console.groq.com/keys
- A **USDA FoodData Central API key** — free at https://fdc.nal.usda.gov/api-key-signup
  (the demo key works but is rate-limited; get your own)

---

## 2. Project layout

```
nutri-agent/
├── backend/
│   ├── mcp_server.py     # MCP SERVER — tools
│   ├── gateway.py        # AI MODEL GATEWAY — Groq wrapper
│   ├── orchestrator.py   # ORCHESTRATION LAYER + AGENT loop
│   ├── db.py             # SQLite persistence
│   ├── main.py           # MCP HOST — FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/   # ProfileSetup, NutritionLabel, FoodLogger, AgentReceipt, MealHistory
    │   ├── App.jsx
    │   ├── api.js
    │   └── main.jsx
    └── package.json
```

---

## 3. Stage 1 — Backend environment

```bash
cd nutri-agent/backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**What just happened:** you created an isolated Python environment and
installed `fastapi` (the web server), `mcp` (the official Model Context
Protocol SDK — this gives you `FastMCP` for the server and `ClientSession`
for the client), `groq` (the SDK for the model gateway), and `httpx` (for
calling the USDA REST API).

## 4. Stage 2 — API keys

```bash
cp .env.example .env
```

Open `.env` and paste in your real keys:

```
GROQ_API_KEY=gsk_your_real_key
USDA_API_KEY=your_real_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Keys are read via `python-dotenv` in `gateway.py` and `mcp_server.py` — never
hardcode them in source, and never commit `.env` (only `.env.example` should
go in git).

## 5. Stage 3 — Sanity-check the MCP server alone

Before wiring anything else up, confirm the server's tools work in
isolation using the MCP SDK's inspector:

```bash
npx @modelcontextprotocol/inspector python mcp_server.py
```

This opens a local web UI where you can call `calculate_bmi` or
`search_usda_food` by hand and see raw JSON back — a fast way to catch bugs
in the tool layer before the agent ever sees them. Try `calculate_bmi` with
`weight_kg: 70, height_cm: 175` and confirm you get a sane BMI back.

## 6. Stage 4 — Run the backend (Host + Client + Gateway + Server, together)

```bash
uvicorn main:app --reload --port 8000
```

**What happens on startup:** `main.py`'s `lifespan` function spawns
`mcp_server.py` as a subprocess and opens an MCP client session to it over
stdio — that connection stays alive for as long as the API server runs,
rather than reconnecting per-request. Visit http://localhost:8000/docs to
see the auto-generated API explorer (FastAPI gives you this for free).

## 7. Stage 5 — Frontend

In a **new terminal**:

```bash
cd nutri-agent/frontend
npm install
npm run dev
```

Open http://localhost:5173.

## 8. Stage 6 — Use it

1. Fill in your height, weight, age, sex, activity level, and goal → **Save
   & calculate targets**. This hits `/profile`, which calls
   `calculate_bmi` and `calculate_daily_targets` directly on the MCP client
   (no LLM involved — it's pure math, so there's nothing to "reason" about).
2. Type something like `chicken shawarma wrap and a can of coke` into the
   logger and hit **Log it**. Watch the **agent trace** receipt print out
   live: PLAN → search_usda_food, OBSERVE → weak/no match, then the model
   estimating and logging.
3. Try something the USDA database *does* have well, like `100g grilled
   chicken breast` — notice the trace this time grounds itself in a real
   USDA match instead of estimating.
4. If you already know the macros (a menu lists them, say), click **Enter
   them yourself** — this skips the agent entirely and writes straight to
   the log, because there's no ambiguity for the model to resolve.

---

## 9. Where to go next (natural extensions)

- **Model gateway fallback**: in `gateway.py`, add a second model (e.g. a
  smaller/faster Groq model) and retry logic if the first call errors —
  that's the real value a gateway adds beyond "just call the SDK."
- **Multi-step planning UI**: right now the agent trace is read-only; you
  could let the user interrupt/correct a step (e.g. "no, that portion was
  smaller") mid-loop.
- **More tools**: a `search_recipes` tool, a `get_weekly_trend` tool, or a
  water-intake tracker — each is just another `@mcp.tool()` function; you
  don't touch the agent loop at all to add one.
- **Swap the transport**: MCP also supports SSE/HTTP transport instead of
  stdio, which matters once the server and host run on different machines.

---

## 10. Troubleshooting

- **`GROQ_API_KEY is missing`** — you forgot to `cp .env.example .env` and
  fill it in, or you're running `uvicorn` from the wrong directory (must be
  `backend/`, since `.env` is loaded relative to it).
- **CORS errors in the browser console** — confirm the frontend is on port
  `5173` (`main.py`'s CORS config only allows that origin) and the backend
  is on `8000`.
- **USDA search always returns "No matches"** — the free tier rate-limits
  aggressively; wait a minute, or double check the key in `.env`.
- **Agent loops forever / hits step limit** — check `backend` logs (stderr)
  for the raw tool arguments the model sent; it usually means a tool's
  docstring wasn't clear enough about the expected argument shape.
