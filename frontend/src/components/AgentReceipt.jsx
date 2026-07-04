function stepLine(step, i) {
  const style = { animationDelay: `${i * 90}ms` };

  if (step.type === "plan") {
    return (
      <div key={i} className="receipt-line" style={style}>
        <span className="text-turmeric">PLAN</span> → call <strong>{step.tool}</strong>
        <div className="text-ink/50 truncate">{JSON.stringify(step.args)}</div>
      </div>
    );
  }
  if (step.type === "observation") {
    const preview = JSON.stringify(step.result);
    return (
      <div key={i} className="receipt-line" style={style}>
        <span className="text-basil">OBSERVE</span> ← {step.tool}
        <div className="text-ink/50 truncate">{preview.length > 90 ? preview.slice(0, 90) + "…" : preview}</div>
      </div>
    );
  }
  return (
    <div key={i} className="receipt-line" style={style}>
      <span className="text-chili">DONE</span> reasoning complete
    </div>
  );
}

export default function AgentReceipt({ trace }) {
  if (!trace || trace.length === 0) return null;

  return (
    <div className="max-w-sm">
      <div className="receipt-edge" />
      <div className="bg-white/60 border-x border-dashed border-ink/30 px-4 py-3 font-mono text-xs space-y-2">
        <div className="text-center text-ink/50 tracking-widest mb-2">AGENT TRACE</div>
        {trace.map(stepLine)}
      </div>
      <div className="receipt-edge rotate-180" />
    </div>
  );
}
