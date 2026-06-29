const Input = ({ label, field, type = 'text', placeholder = '', span = '', value, onChange, error, disabled, ...props }) => (
  <label className={`space-y-1.5 ${span}`}>
    {label && <span className="text-xs font-semibold text-on-surface-variant">{label}</span>}
    <div className="relative">
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        className={`h-12 w-full rounded-xl border bg-surface px-4 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/20 ${error ? 'border-error focus:border-error' : 'border-outline-variant/25 focus:border-secondary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-error font-medium mt-1">{error}</p>}
  </label>
);

export default Input;
