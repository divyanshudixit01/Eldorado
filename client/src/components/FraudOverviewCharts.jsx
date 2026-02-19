import Card from "./ui/Card";
import Badge from "./ui/Badge";

function simpleRange(from, to, steps) {
  if (steps <= 1) return [to];
  const step = (to - from) / (steps - 1);
  return Array.from({ length: steps }, (_, i) => from + step * i);
}

function LineChart({ points }) {
  const width = 260;
  const height = 80;
  if (!points || points.length === 0) {
    points = [0, 0, 0, 0, 0];
  }
  const max = Math.max(...points, 1);
  const stepX = width / (points.length - 1 || 1);

  const path = points
    .map((v, i) => {
      const x = i * stepX;
      const y = height - (v / max) * (height - 10) - 5;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-20 w-full text-primary-500"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(129,140,248,0.6)" />
          <stop offset="100%" stopColor="rgba(129,140,248,0)" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points={points
          .map((v, i) => {
            const x = i * stepX;
            const y = height - (v / max) * (height - 10) - 5;
            return `${x},${y}`;
          })
          .join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PieChart({ fraud, normal }) {
  const total = fraud + normal || 1;
  const fraudAngle = (fraud / total) * 360;
  const radius = 32;

  const isLargeArc = fraudAngle > 180 ? 1 : 0;
  const radians = (fraudAngle * Math.PI) / 180;
  const x = 50 + radius * Math.cos(radians);
  const y = 50 + radius * Math.sin(radians);

  const pathData = `M50,50 L${50 + radius},50 A${radius},${radius} 0 ${isLargeArc} 1 ${x},${y} Z`;

  return (
    <svg
      viewBox="0 0 100 100"
      className="h-20 w-20 text-red-500"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        className="fill-emerald-400/70 dark:fill-emerald-500/80"
      />
      <path
        d={pathData}
        className="fill-red-500/80 dark:fill-red-400/90"
      />
    </svg>
  );
}

function BarChart({ accounts }) {
  const top = (accounts || []).slice(0, 5);
  const max = Math.max(...top.map((a) => a.suspicion_score || 0), 1);
  return (
    <div className="space-y-2">
      {top.map((acc) => (
        <div key={acc.account_id} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-slate-500 dark:text-slate-400">
              {acc.account_id}
            </span>
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {acc.suspicion_score.toFixed(1)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
              style={{
                width: `${(Math.min(acc.suspicion_score, 100) / max) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
      {top.length === 0 && (
        <p className="text-xs text-slate-400">Upload data to see risk bars.</p>
      )}
    </div>
  );
}

function FraudOverviewCharts({ summary, suspiciousAccounts }) {
  const totalAccounts = summary?.total_accounts_analyzed || 0;
  const fraudCount = summary?.suspicious_accounts_flagged || 0;
  const normalCount = Math.max(totalAccounts - fraudCount, 0);

  const fraudPercentage = totalAccounts
    ? (fraudCount / totalAccounts) * 100
    : 0;

  const linePoints = simpleRange(0, fraudCount || 1, 6).map((v) =>
    Math.round(v),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card
        title="Transaction Timeline"
        subtitle="Relative activity as accounts are analyzed"
      >
        <LineChart points={linePoints} />
      </Card>

      <Card
        title="Fraud vs Normal"
        subtitle="Share of flagged accounts in current run"
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <PieChart fraud={fraudCount} normal={normalCount} />
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-slate-500 dark:text-slate-400">
                Fraud / High Risk
              </span>
              <Badge variant="danger">
                {fraudPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-slate-500 dark:text-slate-400">
                Likely Normal
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Top Suspicious Accounts"
        subtitle="Sorted by risk score"
        className="flex flex-col justify-between"
      >
        <BarChart accounts={suspiciousAccounts || []} />
      </Card>
    </div>
  );
}

export default FraudOverviewCharts;

