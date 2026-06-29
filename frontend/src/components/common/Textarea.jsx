const Textarea = ({ label, field, placeholder = '', rows = 3, span = '', value, onChange, error, disabled, ...props }) => (
  <label className={`space-y-1.5 ${span}`}>
    {label && <span className="text-xs font-semibold text-on-surface-variant">{label}</span>}
    <textarea
      rows={rows}
      value={value || ''}
      onChange={onChange}
      className={`w-full resize-none rounded-xl border bg-surface px-4 py-3 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/20 ${error ? 'border-error focus:border-error' : 'border-outline-variant/25 focus:border-secondary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
    {error && <p className="text-xs text-error font-medium mt-1">{error}</p>}
  </label>
);

export default Textarea;
