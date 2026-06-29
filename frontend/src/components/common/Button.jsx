const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-md hover:shadow-lg',
  secondary: 'border border-outline-variant/20 bg-surface-container-high text-on-surface hover:bg-surface-variant',
  ghost: 'text-on-surface-variant hover:bg-surface-container',
  error: 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container shadow-md',
  accent: 'bg-secondary text-on-secondary hover:bg-secondary-container shadow-md',
  outline: 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-3.5 text-lg',
};

const Button = ({ variant = 'primary', size = 'md', icon, children, loading, disabled, className = '', ...props }) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    {...props}
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ) : icon ? (
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    ) : null}
    {children}
  </button>
);

export default Button;
