const Toggle = ({ label, detail, checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`flex w-full items-center justify-between gap-4 rounded-xl bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className="flex-1">
      <span className="block text-sm font-semibold text-on-surface">{label}</span>
      {detail && <span className="mt-0.5 block text-xs text-on-surface-variant">{detail}</span>}
    </span>
    <span
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-secondary' : 'bg-outline-variant'}`}
      aria-hidden="true"
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </span>
  </button>
);

export default Toggle;
