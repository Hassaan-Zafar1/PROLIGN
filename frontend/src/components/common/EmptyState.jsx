import Button from './Button';

const EmptyState = ({ icon = 'inbox', title, description, actionLabel, onAction, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">{icon}</span>
    {title && <h3 className="text-lg font-bold text-on-surface mb-1">{title}</h3>}
    {description && <p className="text-sm text-on-surface-variant max-w-sm mb-4">{description}</p>}
    {actionLabel && onAction && (
      <Button variant="primary" size="md" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

export default EmptyState;
