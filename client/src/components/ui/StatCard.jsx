import Badge from "./Badge";

function StatCard({ label, value, delta, trend = "up", tone = "neutral" }) {
  const toneColor =
    tone === "danger"
      ? "text-danger-600"
      : tone === "success"
        ? "text-success-500"
        : "text-slate-900 dark:text-slate-50";

  const arrow = trend === "down" ? "▼" : "▲";
  const deltaTone =
    trend === "down" ? "text-danger-600" : "text-success-600 dark:text-success-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className={`text-2xl font-semibold tracking-tight ${toneColor}`}>
          {value}
        </p>
        {delta != null && (
          <Badge className={`${deltaTone} bg-transparent border-0 px-0`}>
            <span className="mr-1 text-[10px]">{arrow}</span>
            <span className="text-[11px]">{delta}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

export default StatCard;

