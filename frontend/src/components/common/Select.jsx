import { memo } from 'react';

const Select = ({ label, field, options, span = '', value, onChange, disabled, ...props }) => {
  const { name: _name, ...rest } = props;

  return (
    <label className={`space-y-1.5 ${span}`}>
      {label && <span className="text-xs font-semibold text-on-surface-variant">{label}</span>}
      <select
        value={value ?? ''}
        onChange={onChange}
        name={field || _name}
        className={`h-12 w-full rounded-xl border border-outline-variant/25 bg-surface px-4 text-sm text-on-surface outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
        {...rest}
      >
        {options.map((o) => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default memo(Select);