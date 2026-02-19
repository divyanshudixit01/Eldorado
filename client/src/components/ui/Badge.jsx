function Badge({ variant = "default", children, className = "" }) {
  const variants = {
    default:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    success:
      "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-700/60 dark:text-emerald-200",
    danger:
      "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/40 dark:border-red-700/60 dark:text-red-200",
    warning:
      "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/40 dark:border-amber-700/60 dark:text-amber-200",
    subtle:
      "bg-slate-100/60 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
  };

  const variantClasses = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;

