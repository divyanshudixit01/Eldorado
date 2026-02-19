const featureCards = [
  {
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 dark:text-red-400">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    ),
    title: "Detect circular fund routing patterns and identify money muling rings through advanced graph analysis.",
    label: "Cycle Detection",
  },
  {
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 dark:text-orange-400">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    ),
    title: "Identify fan-in and fan-out patterns where multiple accounts aggregate or disperse funds suspiciously.",
    label: "Smurfing Detection",
  },
  {
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
    ),
    title: "Analyze layered shell networks and detect intermediate accounts with suspicious transaction patterns.",
    label: "Network Analysis",
  },
];

const actionButtons = [
  { label: "View Analytics", icon: "analytics", onClick: null },
  { label: "Export Results", icon: "export", onClick: null },
  { label: "Transaction Explorer", icon: "search", onClick: null },
];

function NixtioDashboard({ user, onNavigateToUpload }) {
  const userName = user?.name?.split(" ")[0] || "Analyst";

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting Section */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Welcome {userName}, Detect Money Muling Patterns
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Upload transaction CSV files to identify fraud rings, suspicious accounts, and money laundering patterns through advanced graph analytics.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <div className="absolute -right-1 -bottom-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-md ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600">
              Upload CSV to start analysis 🔍
            </div>
          </div>
        </div>
      </div>

      {/* Upload CSV - Quick action */}
      {onNavigateToUpload && (
        <button
          type="button"
          onClick={onNavigateToUpload}
          className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600 dark:text-indigo-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">Upload Transaction CSV</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload CSV file with transaction data to detect money muling rings and suspicious account patterns</p>
          </div>
        </button>
      )}

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((card, i) => (
          <div
            key={i}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-card-hover hover:border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center">
              {card.icon}
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {card.title}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          CSV must include: transaction_id, sender_id, receiver_id, amount, timestamp (YYYY-MM-DD HH:MM:SS)
        </span>
      </div>

      {/* Input / Action Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Search account ID, ring ID, or filter results..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-slate-100 dark:placeholder-slate-500"
          />
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actionButtons.map((btn, i) => (
            <button
              key={i}
              type="button"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {btn.icon === "search" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
              {btn.icon === "analytics" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              )}
              {btn.icon === "export" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <span className="text-lg">⋯</span>
          </button>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
          </svg>
          Powered by Fraud Detection Engine v2.0
        </p>
      </div>
    </div>
  );
}

export default NixtioDashboard;
