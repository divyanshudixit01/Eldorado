import { useEffect, useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

function useAnimatedNumber(value, duration = 300) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

function MetricCard({ label, value, color, suffix = "", hint }) {
  const animated = useAnimatedNumber(value);

  return (
    <div
      className={`glass-card flex flex-col justify-between rounded-3xl border border-slate-100/70 px-4 py-3 shadow-soft dark:border-slate-800`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p
          className={`text-2xl font-semibold tracking-tight ${
            color || "text-slate-900 dark:text-slate-50"
          }`}
        >
          {suffix
            ? `${animated.toFixed(1)}${suffix}`
            : Math.round(animated).toLocaleString()}
        </p>
        {hint && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryPanel({
  summary,
  fraudPercentage = 0,
  highRiskAccounts = 0,
  onDownload,
}) {
  if (!summary) {
    return (
      <Card
        title="Analysis Summary"
        subtitle="Upload a CSV to see graph-derived risk metrics."
        className="h-full"
        actions={
          onDownload && (
            <Button variant="primary" onClick={onDownload} className="gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Download JSON Output
            </Button>
          )
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-2xl bg-slate-100/60 p-3 dark:bg-slate-900/40 animate-pulse"
            >
              <div className="h-2 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const totalAccounts = summary.total_accounts_analyzed || 0;
  const suspicious = summary.suspicious_accounts_flagged || 0;

  return (
    <Card
      title="Analysis Summary"
      subtitle="Snapshot of the current CSV run, based on graph analytics."
      className="h-full"
      actions={
        onDownload && (
          <Button variant="primary" onClick={onDownload} className="gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Download JSON Output
          </Button>
        )
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="subtle">
          {totalAccounts.toLocaleString()} accounts processed
        </Badge>
        <Badge variant={fraudPercentage >= 10 ? "danger" : "warning"}>
          {fraudPercentage.toFixed(1)}% flagged as high risk
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total Accounts Analyzed"
          value={totalAccounts}
          color="text-primary-600 dark:text-primary-400"
        />
        <MetricCard
          label="Suspicious Accounts"
          value={suspicious}
          color="text-red-600 dark:text-red-400"
          hint="Based on pattern & confidence thresholds"
        />
        <MetricCard
          label="Fraud Rings Detected"
          value={summary.fraud_rings_detected || 0}
          color="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="High-Risk Accounts"
          value={highRiskAccounts}
          color="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <p>
            Processing time:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {summary.processing_time_seconds?.toFixed(2) || "0.00"}s
            </span>
          </p>
          <p className="mt-0.5">
            Engine: depth-limited DFS, fan-in/out, layered shells, lifecycle &
            amount analysis.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default SummaryPanel;

