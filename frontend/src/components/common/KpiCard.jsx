const accentMap = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  tertiary: 'bg-tertiary/10 text-tertiary',
  error: 'bg-error/10 text-error',
};

const KpiCard = ({ icon, label, value, subtitle, change, accent = 'primary', children }) => {
  const isPositive = change >= 0;
  return (
    <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent] || accentMap.primary}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </span>
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${isPositive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
            <span className="material-symbols-outlined text-[12px]">{isPositive ? 'trending_up' : 'trending_down'}</span>
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      {value !== undefined && <p className="text-2xl font-bold text-on-surface">{value}</p>}
      {label && <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>}
      {subtitle && <p className="mt-1 text-[11px] text-on-surface-variant/70">{subtitle}</p>}
      {children}
    </div>
  );
};

export default KpiCard;
