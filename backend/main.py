import sys
import asyncio
import uvicorn
from functools import wraps

# 1. Force Proactor and strictly patch the Windows pipe closure bug
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    # Suppress the noisy WinError 10054 ConnectionResetError
    from asyncio.proactor_events import _ProactorBasePipeTransport
    
    def silence_connection_reset(func):
        def wrapper(self, exc=None):
            try:
                return func(self, exc)
            except (ConnectionResetError, BrokenPipeError):
                pass
        return wrapper
        
    _ProactorBasePipeTransport._call_connection_lost = silence_connection_reset(_ProactorBasePipeTransport._call_connection_lost)

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext

import db
from orchestrator import Agent, MCPToolBridge

# ---------------------------------------------------------------------------
# Setup & Lifespan
# ---------------------------------------------------------------------------
bridge = MCPToolBridge()
agent: Agent | None = None
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    server_script = str(Path(__file__).parent / "mcp_server.py")
    await bridge.connect(server_script)
    global agent
    agent = Agent(bridge)
    yield
    await bridge.close()


app = FastAPI(title="Nutri-Agent API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://nutri-agent.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class UserAuth(BaseModel):
    username: str
    password: str

class ProfileIn(BaseModel):
    user_id: int
    height_cm: float
    weight_kg: float
    age: int
    sex: str
    activity_level: str
    goal: str

class ChatIn(BaseModel):
    user_id: int
    message: str

class ManualLogIn(BaseModel):
    user_id: int
    food_name: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


# ---------------------------------------------------------------------------
# Auth Routes
# ---------------------------------------------------------------------------
@app.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserAuth):
    hashed_pw = pwd_context.hash(user.password)
    user_id = db.create_user(user.username, hashed_pw)
    
    if not user_id:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    return {"message": "User created successfully!", "user_id": user_id}


@app.post("/login")
async def login(user: UserAuth):
    db_user = db.get_user_by_username(user.username)
    
    if not db_user or not pwd_context.verify(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    return {"message": "Login successful", "user_id": db_user["id"]}


# ---------------------------------------------------------------------------
# Core Routes (Hardened & Multi-user compatible)
# ---------------------------------------------------------------------------
@app.post("/profile")
async def set_profile(body: ProfileIn):
    try:
        # Shield MCP calls from client-side disconnect cancellations
        bmi_result = await asyncio.shield(
            bridge.call_tool("calculate_bmi", {"weight_kg": body.weight_kg, "height_cm": body.height_cm})
        )
        # Exclude user_id when passing to the target calculator
        target_payload = body.model_dump(exclude={"user_id"})
        targets = await asyncio.shield(
            bridge.call_tool("calculate_daily_targets", target_payload)
        )

        record = {**target_payload, "bmi": bmi_result["bmi"], "bmi_category": bmi_result["category"], **targets}
        db.save_profile(body.user_id, record)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCP Bridge Error: {str(e)}")


@app.get("/profile")
async def read_profile(user_id: int):
    profile = db.get_profile(user_id)
    if not profile:
        raise HTTPException(404, "No profile saved for this user yet.")
    return profile


@app.post("/log-food")
async def log_food(body: ChatIn):
    if not agent:
        raise HTTPException(status_code=503, detail="Agent loop is initializing or unavailable.")
    try:
        # Pass user context in the message so the agent knows who is asking
        # Note: You may need to update your mcp_server.py tools to accept user_id!
        contextual_message = f"[User ID: {body.user_id}] {body.message}"
        
        result = await asyncio.shield(agent.run(contextual_message))
        totals, meals = db.get_daily_totals(body.user_id)
        return {"reply": result["reply"], "trace": result["trace"], "totals": totals, "meals": meals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent Execution Failure: {str(e)}")


@app.post("/log-manual")
async def log_manual(body: ManualLogIn):
    db.insert_meal(
        body.user_id, body.food_name, body.calories, body.protein_g, body.carbs_g, body.fat_g, body.fiber_g,
        source="manual",
    )
    totals, meals = db.get_daily_totals(body.user_id)
    return {"totals": totals, "meals": meals}


@app.get("/summary")
async def summary(user_id: int):
    totals, meals = db.get_daily_totals(user_id)
    profile = db.get_profile(user_id)
    return {"totals": totals, "meals": meals, "targets": profile}


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
