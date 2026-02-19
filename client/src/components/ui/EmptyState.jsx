function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="mb-3 h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-400 shadow-subtle dark:border-slate-700 dark:bg-slate-900">
        <div className="flex h-full w-full items-center justify-center text-lg">
          •
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;

