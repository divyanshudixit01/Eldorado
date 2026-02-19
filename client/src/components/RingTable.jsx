import Card from "./ui/Card";
import Badge from "./ui/Badge";

function RingTable({ fraudRings }) {
  if (!fraudRings || fraudRings.length === 0) {
    return (
      <Card
        title="Fraud Rings"
        subtitle="Graph cycles and layered shells that qualify as muling rings."
      >
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          No fraud rings detected in the current dataset. Upload a CSV with
          multi-hop transactions to see ring structures.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Fraud Ring Summary Table"
      subtitle="All detected money muling rings with pattern types, member counts, and risk scores."
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-xs sm:text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/40">
            <tr>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Ring ID
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pattern
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Pattern Type
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Member Count
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Risk Score
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Member Account IDs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {fraudRings.map((ring, index) => (
              <tr
                key={ring.ring_id || index}
                className="bg-white/80 hover:bg-primary-50/60 dark:bg-slate-900/60 dark:hover:bg-slate-900 transition-colors"
              >
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900 dark:text-slate-50 font-mono text-xs">
                  {ring.ring_id}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Badge variant="subtle" className="text-xs">
                    {ring.pattern_type || "unknown"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {ring.member_accounts?.length || 0}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={`text-xs font-semibold ${
                      ring.risk_score >= 80
                        ? "text-red-600 dark:text-red-400"
                        : ring.risk_score >= 60
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {typeof ring.risk_score === "number" ? ring.risk_score.toFixed(1) : "0.0"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <div
                    className="max-h-20 max-w-2xl overflow-y-auto break-words font-mono"
                    title={ring.member_accounts?.join(", ") || "N/A"}
                  >
                    {ring.member_accounts?.join(", ") || "N/A"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default RingTable;

