import { useState } from "react";
import { api } from "../api";

const defaults = { height_cm: 170, weight_kg: 70, age: 25, sex: "male", activity_level: "light", goal: "maintain" };

export default function ProfileSetup({ profile, onSaved }) {
  const [form, setForm] = useState(profile || defaults);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!profile);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await api.saveProfile({
        ...form,
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        age: Number(form.age),
      });
      onSaved(saved);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm underline text-basil font-label mb-2"
      >
        Edit profile & targets
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="border-[3px] border-ink bg-paper p-4 mb-4">
      <h3 className="font-display text-lg mb-3">Your profile</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          Height (cm)
          <input type="number" className="border-2 border-ink px-2 py-1" value={form.height_cm}
            onChange={(e) => setForm({ ...form, height_cm: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1">
          Weight (kg)
          <input type="number" className="border-2 border-ink px-2 py-1" value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1">
          Age
          <input type="number" className="border-2 border-ink px-2 py-1" value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })} required />
        </label>
        <label className="flex flex-col gap-1">
          Sex
          <select className="border-2 border-ink px-2 py-1" value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Activity level
          <select className="border-2 border-ink px-2 py-1" value={form.activity_level}
            onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>
            <option value="sedentary">Sedentary (desk job)</option>
            <option value="light">Light (1-3x/wk exercise)</option>
            <option value="moderate">Moderate (3-5x/wk)</option>
            <option value="active">Active (6-7x/wk)</option>
            <option value="very_active">Very active (physical job)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Goal
          <select className="border-2 border-ink px-2 py-1" value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}>
            <option value="lose">Lose fat</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain muscle</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={saving}
        className="mt-3 bg-ink text-paper px-4 py-2 font-label font-semibold tracking-wide disabled:opacity-50">
        {saving ? "Calculating…" : "Save & calculate targets"}
      </button>
    </form>
  );
}
