const statusStyles = {
  confirmed: 'bg-primary text-on-primary',
  pending: 'bg-tertiary/15 text-tertiary',
  cancelled: 'bg-error-container text-on-error-container',
  completed: 'bg-secondary-container text-on-secondary-container',
  active: 'bg-secondary text-on-secondary',
  deactivated: 'bg-surface-variant text-on-surface-variant',
};

const Badge = ({ variant = 'pending', children, className = '' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[variant] || 'bg-surface-variant text-on-surface-variant'} ${className}`}>
    {children}
  </span>
);

export default Badge;
