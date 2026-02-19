function Button({ variant = "primary", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 ease-in-out-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-primary-500",
    ghost:
      "bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/70 hover:scale-[1.02]",
    subtle:
      "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:scale-[1.02]",
    danger:
      "bg-red-500 text-white shadow-soft hover:bg-red-600 hover:scale-[1.02] active:scale-[0.98]",
  };

  const variantClasses = variants[variant] || variants.primary;

  return (
    <button className={`${base} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;

