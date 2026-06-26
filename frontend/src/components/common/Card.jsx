const Card = ({ title, description, icon, children, className = '' }) => (
  <div className={`rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden ${className}`}>
    {(title || icon) && (
      <div className="flex items-center gap-4 border-b border-outline-variant/10 px-6 py-5">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
          </span>
        )}
        <div className="flex-1 min-w-0">
          {title && <span className="block text-base font-bold text-on-surface">{title}</span>}
          {description && <span className="block text-xs text-on-surface-variant mt-0.5">{description}</span>}
        </div>
      </div>
    )}
    <div className="px-6 py-6">{children}</div>
  </div>
);

export default Card;
