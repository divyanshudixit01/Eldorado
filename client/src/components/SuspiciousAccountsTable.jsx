import { useMemo, useState } from "react";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

const PAGE_SIZE = 8;

function SuspiciousAccountsTable({ accounts }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortKey, setSortKey] = useState("suspicion_score");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!accounts) return [];

    let data = [...accounts];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((a) =>
        (a.account_id || "").toLowerCase().includes(q),
      );
    }

    if (riskFilter !== "all") {
      data = data.filter((a) => {
        const score = a.suspicion_score ?? 0;
        if (riskFilter === "high") return score >= 80;
        if (riskFilter === "medium") return score >= 60 && score < 80;
        return score < 60;
      });
    }

    data.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "account_id") {
        return dir * String(a.account_id).localeCompare(String(b.account_id));
      }
      return dir * ((a[sortKey] || 0) - (b[sortKey] || 0));
    });

    return data;
  }, [accounts, search, riskFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <Card
      title="Suspicious Accounts"
      subtitle="Filtered high-risk accounts based on graph patterns"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-full border border-slate-200 bg-white/80 px-3 text-xs font-medium text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
          >
            <option value="all">All risk levels</option>
            <option value="high">High risk (≥ 80)</option>
            <option value="medium">Medium risk (60–79)</option>
            <option value="low">Low risk (&lt; 60)</option>
          </select>
          <input
            type="search"
            placeholder="Search account ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 w-40 rounded-full border border-slate-200 bg-white/80 px-3 text-xs text-slate-600 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-56"
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-xs sm:text-sm dark:divide-slate-800">
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur dark:bg-slate-900/90">
            <tr>
              {[
                ["account_id", "Account ID"],
                ["suspicion_score", "Score"],
                ["risk", "Risk"],
                ["patterns", "Detected Patterns"],
                ["ring_id", "Ring"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  onClick={
                    key === "risk" || key === "patterns"
                      ? undefined
                      : () => handleSort(key === "risk" ? "suspicion_score" : key)
                  }
                  className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                    key !== "risk" && key !== "patterns"
                      ? "cursor-pointer select-none"
                      : ""
                  }`}
                >
                  {label}
                  {key !== "risk" && key !== "patterns" && sortKey === key && (
                    <span className="ml-1 text-[10px]">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageData.map((account) => {
              const score = account.suspicion_score ?? 0;
              return (
                <tr
                  key={account.account_id}
                  className="bg-white hover:bg-slate-50 transition-colors dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900 dark:text-slate-50 font-mono text-[11px] sm:text-xs">
                    {account.account_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    <span
                      className={`font-semibold ${
                        score >= 80
                          ? "text-red-600 dark:text-red-400"
                          : score >= 60
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {score.toFixed(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {score >= 70 ? (
                      <Badge variant="danger" className="tracking-[0.16em] uppercase">
                        Fraud
                      </Badge>
                    ) : (
                      <Badge
                        variant="success"
                        className="tracking-[0.16em] uppercase"
                      >
                        Normal
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex flex-wrap gap-1">
                      {account.detected_patterns?.map((pattern) => (
                        <Badge key={pattern} variant="subtle">
                          {pattern}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    {account.ring_id || "-"}
                  </td>
                </tr>
              );
            })}

            {pageData.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-xs text-slate-400"
                >
                  Upload a CSV to see suspicious accounts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <p>
            Showing{" "}
            <span className="font-semibold">
              {(page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            –{" "}
            <span className="font-semibold">
              {Math.min(page * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold">{filtered.length}</span> accounts
          </p>
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-1 py-0.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 rounded-full px-2 text-xs font-medium disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 text-xs font-semibold">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 rounded-full px-2 text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default SuspiciousAccountsTable;

