import { useState } from "react";
import { api } from "../api";

const emptyManual = { food_name: "", calories: "", protein_g: "", carbs_g: "", fat_g: "", fiber_g: "" };

export default function FoodLogger({ onResult }) {
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(emptyManual);
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submitAgent(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.logFood(message);
      onResult(result);
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitManual(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        food_name: manual.food_name,
        calories: Number(manual.calories) || 0,
        protein_g: Number(manual.protein_g) || 0,
        carbs_g: Number(manual.carbs_g) || 0,
        fat_g: Number(manual.fat_g) || 0,
        fiber_g: Number(manual.fiber_g) || 0,
      };
      const result = await api.logManual(payload);
      onResult({ ...result, reply: `Logged ${payload.food_name} exactly as entered.`, trace: [] });
      setManual(emptyManual);
      setShowManual(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-[3px] border-ink bg-paper p-4">
      <h3 className="font-display text-lg mb-1">Log something</h3>
      <p className="text-sm text-ink/60 mb-3">
        Describe what you ate — the agent will look it up or estimate it. Know the exact numbers?{" "}
        <button type="button" onClick={() => setShowManual((s) => !s)} className="underline text-basil">
          {showManual ? "Use the agent instead" : "Enter them yourself"}
        </button>
      </p>

      {!showManual ? (
        <form onSubmit={submitAgent} className="flex gap-2">
          <input
            className="flex-1 border-2 border-ink bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-turmeric"
            placeholder="e.g. chicken shawarma wrap and a small coke"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-paper px-4 py-2 font-label font-semibold tracking-wide disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Log it"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitManual} className="grid grid-cols-2 gap-2 text-sm">
          <input
            className="col-span-2 border-2 border-ink bg-white px-2 py-1"
            placeholder="Food name"
            value={manual.food_name}
            onChange={(e) => setManual({ ...manual, food_name: e.target.value })}
            required
          />
          {["calories", "protein_g", "carbs_g", "fat_g", "fiber_g"].map((field) => (
            <input
              key={field}
              type="number"
              step="0.1"
              className="border-2 border-ink bg-white px-2 py-1 font-mono"
              placeholder={field.replace("_g", " (g)")}
              value={manual[field]}
              onChange={(e) => setManual({ ...manual, [field]: e.target.value })}
            />
          ))}
          <button
            type="submit"
            disabled={loading}
            className="col-span-2 bg-basil text-paper px-4 py-2 font-label font-semibold tracking-wide disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save exact entry"}
          </button>
        </form>
      )}

      {error && <p className="text-chili text-sm mt-2">{error}</p>}
    </div>
  );
}
