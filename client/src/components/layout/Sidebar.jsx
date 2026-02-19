const navItems = [
  { key: "dashboard", label: "New chat", icon: "plus" },
  { key: "search", label: "Search", icon: "search" },
  { key: "attach", label: "Attach", icon: "attach" },
  { key: "collab", label: "Collaborate", icon: "collab" },
  { key: "history", label: "History", icon: "history" },
];

const icons = {
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  attach: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  collab: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

function Sidebar({ active = "dashboard", onNavigate, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r border-slate-200/60 bg-white/80 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate && onNavigate(item.key)}
              title={item.label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {icons[item.icon]}
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white dark:bg-slate-100 dark:text-slate-900">
          N
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
