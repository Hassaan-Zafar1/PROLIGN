import Button from './Button';

const EmptyState = ({ icon = 'inbox', title, description, actionLabel, onAction, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-surface-variant/30 flex items-center justify-center mb-5">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">{icon}</span>
    </div>
    {title && <h3 className="text-lg font-bold text-on-surface mb-1.5">{title}</h3>}
    {description && <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-5">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="primary" size="md" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

export default EmptyState;
