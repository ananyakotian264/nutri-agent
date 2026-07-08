# 🥗 Nutri-Agent: AI-Powered Personalized Nutrition Tracker

<p align="center">

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq-F55036?style=for-the-badge)
![MCP](https://img.shields.io/badge/AI-Agent-MCP-orange?style=for-the-badge)

</p>

<p align="center">
An AI-powered nutrition tracking application that understands natural language, estimates calories & macros, and provides personalized health recommendations.
</p>

---

# 📖 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)

---

# 📌 Overview

Nutri-Agent is an AI-powered full-stack nutrition tracking application that makes calorie counting effortless.

Instead of manually searching food databases, users simply describe what they ate in natural language.

Example:

> "I had two boiled eggs, a mango lassi, and one paneer wrap."

The AI Agent automatically:

- 🥚 Identifies foods
- 🔥 Estimates calories
- 💪 Calculates protein
- 🍚 Calculates carbohydrates
- 🧈 Calculates fats
- 📊 Updates the daily dashboard
- 🎯 Tracks progress toward personalized nutrition goals

The application also calculates BMI, daily calorie requirements, macro targets, and provides personalized recommendations based on the user's profile.

---

# 🎯 Problem Statement

Traditional calorie tracking apps suffer from several limitations:

- Searching through thousands of food items
- Manual quantity estimation
- Time-consuming logging
- Generic calorie recommendations
- Lack of personalized coaching
- Poor user engagement

Nutri-Agent solves these issues using AI and modern web technologies.

---

# ✨ Features

## 👤 User Authentication

- Register/Login
- Password hashing using bcrypt
- Secure authentication
- Multi-user support

---

## 🧠 AI Food Logging

Simply type:

```text
Breakfast:
2 boiled eggs
1 banana
1 glass milk
```

or

```text
I had chicken biryani and a coke.
```

The AI automatically extracts:

- Calories
- Protein
- Carbs
- Fat
- Fiber

No database searching required.

---

## 🎯 Personalized Nutrition Goals

Based on:

- Age
- Gender
- Height
- Weight
- Activity Level
- Fitness Goal

The application calculates:

- BMI
- BMR
- TDEE
- Daily Calories
- Protein Target
- Carb Target
- Fat Target
- Fiber Target

---

## 📊 Dashboard

Users can monitor:

- Daily Calories
- Protein Intake
- Carbohydrates
- Fat
- Fiber
- BMI
- Water Intake *(optional)*
- Daily Streak
- Progress Rings
- Progress Bars

---

## 📈 Progress Tracking

- Daily nutrition history
- Meal logs
- Streak counter
- Goal completion percentage

---

## 🤖 AI Agent

Powered using:

- Groq LLM
- MCP (Model Context Protocol)

The AI agent can:

- Estimate calories
- Understand natural language
- Access backend tools
- Calculate BMI
- Calculate macros
- Store meals automatically

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- CSS
- Axios
- React Router

---

## Backend

- FastAPI
- Python
- SQLite
- SQLAlchemy
- Passlib
- bcrypt

---

## AI

- Groq API
- MCP (Model Context Protocol)
- Python AI Tools

---

## Database

SQLite

Tables include:

- Users
- Profiles
- Meals
- Daily Nutrition

---

# 🏗 Architecture

```
                User
                  │
                  ▼
        React + Vite Frontend
                  │
          Axios API Requests
                  │
                  ▼
             FastAPI Backend
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
 SQLite DB    Authentication   AI Agent
                                  │
                                  ▼
                          Groq + MCP Tools
                                  │
                                  ▼
                     Calories & Macro Estimation
```

---

# 📂 Project Structure

```
Nutri-Agent/
│
├── backend/
│   ├── database.py
│   ├── auth.py
│   ├── models.py
│   ├── schemas.py
│   ├── ai_agent.py
│   ├── nutrition.py
│   ├── routes/
│   ├── requirements.txt
│   └── main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── main.jsx
│   └── package.json
│
├── screenshots/
│
├── README.md
│
└── .gitignore
```

---

# ⚙ How It Works

## Step 1

User creates an account.

↓

## Step 2

Profile details are collected:

- Height
- Weight
- Age
- Gender
- Activity Level
- Goal

↓

## Step 3

Backend calculates:

- BMI
- BMR
- TDEE
- Macro Targets

↓

## Step 4

User types meals naturally.

Example:

```
Lunch:

2 rotis
Dal
Paneer sabzi
Curd
```

↓

## Step 5

The AI Agent:

- Identifies foods
- Estimates nutrition
- Calculates calories
- Calls backend tools
- Saves data

↓

## Step 6

Dashboard updates instantly.

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/nutri-agent.git
cd nutri-agent
```

---

## 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Activate virtual environment

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Start backend

```bash
python main.py
```

or

```bash
uvicorn main:app --reload
```

Backend will run on:

```
http://127.0.0.1:8000
```

---

## 3. Frontend Setup

Open another terminal

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

```env
GROQ_API_KEY=your_groq_api_key

SECRET_KEY=your_secret_key

ALGORITHM=HS256

DATABASE_URL=sqlite:///nutrition.db
```

---

# 📡 API Endpoints

## Authentication

| Method | Endpoint | Description |
|----------|----------|-------------|
| POST | /register | Register User |
| POST | /login | Login User |

---

## Profile

| Method | Endpoint |
|----------|----------|
| GET | /profile |
| POST | /profile |

---

## Meals

| Method | Endpoint |
|----------|----------|
| POST | /meal |
| GET | /meal/history |

---

## Dashboard

| Method | Endpoint |
|----------|----------|
| GET | /dashboard |

---

## AI

| Method | Endpoint |
|----------|----------|
| POST | /ai/log-food |

---

# 🎯 Example AI Inputs

### Example 1

```
2 eggs
1 toast
coffee
```

Output

```
Calories : 330 kcal

Protein : 20 g

Carbs : 24 g

Fat : 15 g
```

---

### Example 2

```
Chicken Biryani
Coke
```

Output

```
Calories : 950 kcal

Protein : 35 g

Carbs : 110 g

Fat : 40 g
```

---

### Example 3

```
1 Paneer Wrap
Mango Lassi
```

Output

```
Calories : 720 kcal

Protein : 28 g

Carbs : 65 g

Fat : 32 g
```

---

# 🌟 Highlights

- ✅ AI-powered food recognition
- ✅ Natural language understanding
- ✅ Personalized calorie targets
- ✅ BMI calculator
- ✅ Macro calculator
- ✅ Secure authentication
- ✅ Multi-user support
- ✅ FastAPI backend
- ✅ React frontend
- ✅ SQLite database
- ✅ MCP integration
- ✅ Groq LLM
- ✅ Responsive UI
- ✅ Neo-Brutalist Design

---

# 🔮 Future Improvements

- 📷 Food image recognition
- 🎙 Voice meal logging
- 📱 Mobile application
- ⌚ Smartwatch integration
- 🥗 Weekly meal planner
- 🛒 Grocery recommendations
- 🤖 AI Nutrition Coach
- 🍎 Barcode Scanner
- 📈 Weekly Reports
- 🌙 Dark Mode
- ☁ Cloud Database (PostgreSQL)
- 🧠 RAG for nutrition knowledge
- 🏋 Fitness tracker integration

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push the branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Ananya P Kotian**

Computer Engineering Student | AI & Full-Stack Developer

If you found this project useful, don't forget to ⭐ the repository!
