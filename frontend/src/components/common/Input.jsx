const Input = ({ label, field, error, success, span, ...props }) => {
  return (
    <label className={`space-y-1.5 ${span || ''}`}>
      {label && <span className="text-xs font-semibold text-on-surface-variant">{label}</span>}
      <div className="relative">
        <input
          {...props}
          name={field || props.name}
          aria-invalid={!!error}
          className={`h-12 w-full rounded-xl border bg-surface px-4 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/20 ${error ? 'border-error focus:border-error' : success ? 'border-success focus:border-success' : 'border-outline-variant/25 focus:border-secondary'} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {success && !error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-success text-lg">check_circle</span>
        )}
      </div>
      {error && <p className="text-xs text-error font-medium mt-1" role="alert">{error}</p>}
    </label>
  );
};

export default Input;