const statusStyles = {
  confirmed:    'bg-primary-container text-on-primary-container',
  pending:      'bg-tertiary/10 text-tertiary',
  cancelled:    'bg-error-container text-on-error-container',
  completed:    'bg-secondary-container text-on-secondary-container',
  active:       'bg-secondary text-on-secondary',
  deactivated:  'bg-surface-variant text-on-surface-variant',
  approved:     'bg-secondary-container text-on-secondary-container',
  rejected:     'bg-error-container text-on-error-container',
  // Mentor experience levels
  junior:       'bg-secondary/10 text-secondary border border-secondary/20',
  intermediate: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
  senior:       'bg-primary/10 text-primary border border-primary/20',
};

const Badge = ({ variant = 'pending', children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[variant] || 'bg-surface-variant text-on-surface-variant'} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
