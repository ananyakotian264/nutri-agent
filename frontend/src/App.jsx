import { useEffect, useState } from "react";
import { api } from "./api";
import ProfileSetup from "./components/ProfileSetup";
import NutritionLabel from "./components/NutritionLabel";
import FoodLogger from "./components/FoodLogger";
import AgentReceipt from "./components/AgentReceipt";
import MealHistory from "./components/MealHistory";

export default function App() {
  // --- Authentication State ---
  const [userId, setUserId] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");

  // --- App State ---
  const [profile, setProfile] = useState(null);
  const [totals, setTotals] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  const [meals, setMeals] = useState([]);
  const [trace, setTrace] = useState([]);
  const [reply, setReply] = useState(null);

  // --- Fetch Data (Only runs after login) ---
  useEffect(() => {
    if (!userId) return; // Wait until authenticated

    // Fetch user-specific data
    api.getProfile(userId).then(setProfile).catch(() => {});
    api.getSummary(userId)
      .then((s) => {
        setTotals(s.totals);
        setMeals(s.meals);
      })
      .catch(() => {});
  }, [userId]);

  function handleResult(result) {
    setTotals(result.totals);
    setMeals(result.meals);
    setTrace(result.trace || []);
    setReply(result.reply);
  }

  // --- Authentication Handler ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = isLogin ? "/login" : "/signup";

    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      setUserId(data.user_id);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // =========================================================================
  // RENDER: Auth Screen (If not logged in)
  // =========================================================================
  if (!userId) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
        <div className="w-full max-w-md border-[3px] border-ink bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <header className="mb-6 text-center">
            <h1 className="font-display text-3xl mb-2">Nutri-Agent</h1>
            <p className="font-mono text-sm text-ink/70">
              {isLogin ? "Log back in to your tracker" : "Create a new tracker account"}
            </p>
          </header>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block font-label text-sm font-bold mb-1">Username</label>
              <input 
                type="text" 
                required
                className="w-full border-2 border-ink px-3 py-2 outline-none focus:bg-ink/5 font-mono"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block font-label text-sm font-bold mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full border-2 border-ink px-3 py-2 outline-none focus:bg-ink/5 font-mono"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>

            {authError && (
              <div className="bg-red-100 border-2 border-red-500 text-red-700 px-3 py-2 text-sm font-mono">
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-ink text-paper font-display text-lg py-3 hover:bg-ink/80 transition-colors"
            >
              {isLogin ? "Log In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setAuthError(""); }}
              className="font-mono text-sm underline decoration-2 underline-offset-4 hover:text-ink/70"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Main Dashboard (If logged in)
  // =========================================================================
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-[3px] border-ink px-6 py-4 flex items-baseline justify-between">
        <h1 className="font-display text-2xl">Nutri-Agent</h1>
        <div className="flex items-center gap-4">
          <p className="font-mono text-xs text-ink/50">groq + usda + mcp</p>
          {/* Simple logout button */}
          <button onClick={() => setUserId(null)} className="text-xs font-bold border-2 border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors">
            LOGOUT
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-8">
        <section>
          {/* Passed userId down so the component can include it in the POST request */}
          <ProfileSetup userId={userId} profile={profile} onSaved={setProfile} />
          <NutritionLabel totals={totals} targets={profile} />
        </section>

        <section className="space-y-4">
          {/* Passed userId down so FoodLogger can send it to the backend */}
          <FoodLogger userId={userId} onResult={handleResult} />

          {reply && (
            <p className="font-label text-base bg-white/70 border-2 border-ink px-3 py-2">{reply}</p>
          )}

          <AgentReceipt trace={trace} />

          <div className="border-[3px] border-ink bg-paper p-4">
            <h3 className="font-display text-lg mb-2">Today's log</h3>
            <MealHistory meals={meals} />
          </div>
        </section>
      </main>
    </div>
  );
}