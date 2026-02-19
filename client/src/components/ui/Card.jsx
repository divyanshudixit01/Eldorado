function Card({ title, subtitle, children, className = "", actions }) {
  return (
    <section className={`glass-card p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

export default Card;

