"""
db.py — Persistence layer.

A tiny SQLite wrapper. Three tables:
  users   -> stores user credentials (username, password_hash)
  profile -> single-row per user with body stats + computed targets
  meals   -> every logged meal, timestamped and tied to a specific user

This file has nothing agentic about it on purpose. Storage is a plain,
boring utility that tools call into — it should not know about the LLM,
Groq, or MCP at all. Keeping it dumb is what makes the rest of the system
testable.
"""

import sqlite3
from datetime import date, datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "nutri_agent.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign key constraints in SQLite to link tables safely
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_conn()
    
    # 1. Users Table
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
        """
    )
    
    # 2. Profile Table (Linked to users.id)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS profile (
            user_id INTEGER PRIMARY KEY,
            height_cm REAL,
            weight_kg REAL,
            age INTEGER,
            sex TEXT,
            activity_level TEXT,
            goal TEXT,
            bmi REAL,
            bmi_category TEXT,
            calorie_target REAL,
            protein_target_g REAL,
            carb_target_g REAL,
            fiber_target_g REAL,
            fat_target_g REAL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
        """
    )
    
    # 3. Meals Table (Linked to users.id)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            logged_at TEXT NOT NULL,
            food_name TEXT NOT NULL,
            calories REAL NOT NULL,
            protein_g REAL NOT NULL,
            carbs_g REAL NOT NULL,
            fat_g REAL NOT NULL,
            fiber_g REAL NOT NULL,
            source TEXT NOT NULL DEFAULT 'manual',
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
        """
    )
    conn.commit()
    conn.close()


# --- Authentication Methods ---

def create_user(username: str, password_hash: str):
    conn = get_conn()
    try:
        cur = conn.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, password_hash)
        )
        conn.commit()
        user_id = cur.lastrowid
    except sqlite3.IntegrityError:
        user_id = None # Returns None if username already exists
    finally:
        conn.close()
    return user_id


def get_user_by_username(username: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None


# --- Profile Methods ---

def save_profile(user_id: int, data: dict):
    conn = get_conn()
    fields = (
        "height_cm", "weight_kg", "age", "sex", "activity_level", "goal",
        "bmi", "bmi_category", "calorie_target", "protein_target_g",
        "carb_target_g", "fiber_target_g", "fat_target_g",
    )
    values = [data.get(f) for f in fields]
    values.insert(0, user_id) # Put user_id at the start of the list
    
    conn.execute(
        f"""
        INSERT INTO profile (user_id, {", ".join(fields)})
        VALUES (?, {", ".join(["?"] * len(fields))})
        ON CONFLICT(user_id) DO UPDATE SET
        {", ".join(f"{f}=excluded.{f}" for f in fields)}
        """,
        values,
    )
    conn.commit()
    conn.close()


def get_profile(user_id: int):
    conn = get_conn()
    row = conn.execute("SELECT * FROM profile WHERE user_id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


# --- Meal Methods ---

def insert_meal(user_id: int, food_name: str, calories: float, protein_g: float, carbs_g: float, fat_g: float, fiber_g: float, source: str = "manual"):
    conn = get_conn()
    cur = conn.execute(
        """
        INSERT INTO meals (user_id, logged_at, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, datetime.now().isoformat(), food_name, calories, protein_g, carbs_g, fat_g, fiber_g, source),
    )
    conn.commit()
    meal_id = cur.lastrowid
    conn.close()
    return meal_id


def get_meals_for_date(user_id: int, target_date: str | None = None):
    target_date = target_date or date.today().isoformat()
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM meals WHERE user_id = ? AND logged_at LIKE ? ORDER BY logged_at ASC",
        (user_id, f"{target_date}%"),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_daily_totals(user_id: int, target_date: str | None = None):
    meals = get_meals_for_date(user_id, target_date)
    totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0, "fiber_g": 0.0}
    for m in meals:
        for k in totals:
            totals[k] += m[k]
    return totals, meals