function Row({ label, amount, unit, target, accent, bold }) {
  const pct = target ? Math.min(Math.round((amount / target) * 100), 999) : null;
  const barWidth = target ? Math.min((amount / target) * 100, 100) : 0;

  return (
    <div className="py-2 border-b border-rule">
      <div className="flex items-baseline justify-between">
        <span className={bold ? "font-bold text-lg" : "text-base"}>{label}</span>
        <span className="font-mono text-sm">
          {Math.round(amount)}
          {unit}
          {target ? <span className="text-ink/50"> / {Math.round(target)}{unit}</span> : null}
        </span>
      </div>
      {target && (
        <div className="mt-1 h-2 w-full bg-rule/60 rounded-none overflow-hidden">
          <div
            className="dv-bar h-full"
            style={{ width: `${barWidth}%`, backgroundColor: accent }}
          />
        </div>
      )}
      {pct !== null && (
        <div className="text-right text-xs font-mono text-ink/60 mt-0.5">{pct}% of daily target</div>
      )}
    </div>
  );
}

export default function NutritionLabel({ totals, targets }) {
  const calTarget = targets?.calorie_target;
  const proteinTarget = targets?.protein_target_g;
  const carbTarget = targets?.carb_target_g;
  const fiberTarget = targets?.fiber_target_g;
  const fatTarget = targets?.fat_target_g;

  return (
    <div className="border-[3px] border-ink bg-paper p-4 max-w-sm">
      <h2 className="font-display text-2xl leading-none">Nutrition Facts</h2>
      <p className="text-sm text-ink/60 -mt-0.5">Today's progress</p>
      <div className="h-2 bg-ink my-2" />

      <div className="flex items-baseline justify-between py-1">
        <span className="font-bold text-xl">Calories</span>
        <span className="font-display text-3xl">
          {Math.round(totals?.calories || 0)}
          {calTarget ? <span className="font-label text-base text-ink/50"> / {Math.round(calTarget)}</span> : null}
        </span>
      </div>
      <div className="h-1.5 bg-ink mb-2" />

      <Row label="Protein" amount={totals?.protein_g || 0} unit="g" target={proteinTarget} accent="#E08E1D" bold />
      <Row label="Carbohydrate" amount={totals?.carbs_g || 0} unit="g" target={carbTarget} accent="#3E6B4F" bold />
      <Row label="Dietary Fiber" amount={totals?.fiber_g || 0} unit="g" target={fiberTarget} accent="#3E6B4F" />
      <Row label="Fat" amount={totals?.fat_g || 0} unit="g" target={fatTarget} accent="#C4432B" />

      <p className="text-xs text-ink/60 mt-3 pt-2 border-t border-rule">
        {targets?.bmi ? (
          <>
            * Your BMI is <strong>{targets.bmi}</strong> ({targets.bmi_category}). Targets above are personalized to
            your profile and goal — not a fixed % of a generic 2,000 calorie diet.
          </>
        ) : (
          "Set up your profile to personalize these targets to your body and goal."
        )}
      </p>
    </div>
  );
}
