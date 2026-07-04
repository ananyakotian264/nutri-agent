const sourceColor = { usda: "bg-basil", estimated: "bg-turmeric", manual: "bg-ink/70" };

export default function MealHistory({ meals }) {
  if (!meals || meals.length === 0) {
    return <p className="text-sm text-ink/50 font-mono">No meals logged today yet.</p>;
  }

  return (
    <div className="divide-y divide-rule">
      {meals.map((m) => (
        <div key={m.id} className="py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 ${sourceColor[m.source] || "bg-ink/50"}`} />
            <span>{m.food_name}</span>
          </div>
          <span className="font-mono text-ink/70">
            {Math.round(m.calories)} kcal · {Math.round(m.protein_g)}g P
          </span>
        </div>
      ))}
    </div>
  );
}
