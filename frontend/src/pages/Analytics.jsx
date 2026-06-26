import { useMemo, useState } from 'react';
import { getCurrentUser, getDB, getSessions, getBookingsForUser, getReviewsForMentor, getUsersByRole } from '../utils/db';

const RANGE_OPTIONS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'year', label: 'This Year' },
];

const filterByRange = (items, range, dateField = 'createdAt') => {
  const now = new Date();
  const cutoff = new Date();
  if (range === '7d') cutoff.setDate(now.getDate() - 7);
  else if (range === '30d') cutoff.setDate(now.getDate() - 30);
  else if (range === '90d') cutoff.setDate(now.getDate() - 90);
  else return items;
  return items.filter((item) => {
    const d = new Date(item[dateField] || item.date || item.updatedAt);
    return d >= cutoff;
  });
};

const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useMemo(() => {
    const target = Number(value) || 0;
    const duration = 600;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
};

const KPICard = ({ icon, label, value, prefix, suffix, change, changeLabel, accent = 'primary' }) => {
  const isPositive = change >= 0;
  const accentMap = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    tertiary: 'bg-tertiary/10 text-tertiary',
    error: 'bg-error/10 text-error',
  };
  return (
    <div className="group rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </span>
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold ${isPositive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
            <span className="material-symbols-outlined text-[12px]">{isPositive ? 'trending_up' : 'trending_down'}</span>
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-on-surface">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
      {changeLabel && <p className="mt-1 text-[11px] text-on-surface-variant/70">{changeLabel}</p>}
    </div>
  );
};

const BarChart = ({ data, maxVal, labelKey, valueKey, color = 'bg-primary', height = 160 }) => {
  const max = maxVal || Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max((d[valueKey] / max) * 100, 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
              <span className="text-[10px] font-bold text-on-surface-variant opacity-0 group-hover/bar:opacity-100 transition-opacity">
                {d[valueKey]}
              </span>
              <div className="w-full rounded-t-lg transition-all duration-500 group-hover/bar:opacity-80"
                style={{ height: `${pct}%`, backgroundColor: typeof color === 'function' ? color(i, d) : undefined }}
              >
                {typeof color === 'string' && <div className={`h-full w-full rounded-t-lg ${color}`} />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-semibold text-on-surface-variant truncate">
            {d[labelKey]}
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ segments, size = 140, thickness = 16 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * circumference;
          const offset = accumulated;
          accumulated += pct;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={thickness}
              strokeDasharray={`${pct} ${circumference - pct}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs font-semibold text-on-surface">{seg.label}</span>
            <span className="text-xs text-on-surface-variant ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityFeed = ({ items }) => {
  const iconMap = {
    booking: { icon: 'event_available', accent: 'bg-primary/10 text-primary' },
    session: { icon: 'school', accent: 'bg-secondary/10 text-secondary' },
    payment: { icon: 'payments', accent: 'bg-tertiary/10 text-tertiary' },
    review: { icon: 'star', accent: 'bg-yellow-500/10 text-yellow-600' },
    registration: { icon: 'person_add', accent: 'bg-primary/10 text-primary' },
    cancellation: { icon: 'event_busy', accent: 'bg-error/10 text-error' },
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="material-symbols-outlined mb-3 text-4xl text-on-surface/15">inbox</span>
        <p className="text-sm font-semibold text-on-surface-variant">No recent activity</p>
        <p className="text-xs text-on-surface-variant/60 mt-1">Activity will appear here as events occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.slice(0, 8).map((item, i) => {
        const meta = iconMap[item.type] || iconMap.booking;
        return (
          <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.accent}`}>
              <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
              <p className="text-xs text-on-surface-variant truncate">{item.subtitle}</p>
            </div>
            <div className="text-right shrink-0">
              {item.amount && <p className="text-sm font-bold text-on-surface">${item.amount}</p>}
              <p className="text-[11px] text-on-surface-variant">{item.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SectionCard = ({ title, description, children, className = '' }) => (
  <div className={`rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden ${className}`}>
    {(title || description) && (
      <div className="border-b border-outline-variant/10 px-6 py-4">
        {title && <h3 className="text-base font-bold text-on-surface">{title}</h3>}
        {description && <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Analytics = ({ navigateTo }) => {
  const user = getCurrentUser();
  const [range, setRange] = useState('30d');

  if (!user) return <div className="p-8 text-center text-on-surface-variant">Please login to view analytics.</div>;

  const db = getDB();
  const sessions = getSessions();
  const allBookings = db.bookings || [];
  const allUsers = db.users || [];
  const mentors = allUsers.filter((u) => u.role === 'mentor');
  const mentees = allUsers.filter((u) => u.role === 'mentee');

  const myBookings = allBookings.filter((b) => b.menteeId === user.id || b.mentorId === user.id);
  const mySessions = sessions.filter((s) => s.menteeId === user.id || s.mentorId === user.id);
  const myReviews = user.role === 'mentor' ? getReviewsForMentor(user.id) : [];

  const filteredBookings = filterByRange(myBookings, range, 'createdAt');
  const filteredSessions = filterByRange(mySessions, range, 'createdAt');

  const recentActivity = useMemo(() => {
    const items = [];
    allBookings.slice(-20).forEach((b) => {
      const mentor = allUsers.find((u) => u.id === b.mentorId);
      const mentee = allUsers.find((u) => u.id === b.menteeId);
      if (String(b.status).toLowerCase() === 'completed') {
        items.push({ type: 'payment', title: 'Payment received', subtitle: `Session with ${mentee?.name || 'Mentee'}`, amount: b.amount, time: new Date(b.createdAt).toLocaleDateString() });
      } else if (['cancelled', 'canceled'].includes(String(b.status).toLowerCase())) {
        items.push({ type: 'cancellation', title: 'Session cancelled', subtitle: `${mentor?.name || 'Mentor'} & ${mentee?.name || 'Mentee'}`, time: new Date(b.createdAt).toLocaleDateString() });
      } else {
        items.push({ type: 'booking', title: 'New booking', subtitle: `${mentor?.name || 'Mentor'} with ${mentee?.name || 'Mentee'}`, amount: b.amount, time: new Date(b.createdAt).toLocaleDateString() });
      }
    });
    myReviews.slice(-5).forEach((r) => {
      items.push({ type: 'review', title: 'Review received', subtitle: `${r.menteeName || 'Mentee'} — ${r.score}/5`, time: new Date(r.createdAt).toLocaleDateString() });
    });
    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  }, [allBookings, myReviews, allUsers]);

  const monthlyData = useMemo(() => {
    const counts = new Array(12).fill(0);
    const revenue = new Array(12).fill(0);
    const src = user.role === 'admin' ? allBookings : myBookings;
    src.forEach((b) => {
      const m = new Date(b.createdAt).getMonth();
      counts[m]++;
      revenue[m] += b.amount || 0;
    });
    return monthShort.map((name, i) => ({ name, sessions: counts[i], revenue: Math.round(revenue[i]) }));
  }, [myBookings, allBookings, user.role]);

  const renderMenteeAnalytics = () => {
    const completed = filteredSessions.filter((s) => String(s.status).toLowerCase() === 'completed').length;
    const totalSpent = filteredBookings.reduce((s, b) => s + (b.amount || 0), 0);
    const uniqueMentors = new Set(myBookings.map((b) => b.mentorId)).size;
    const avgRating = myReviews.length > 0 ? (myReviews.reduce((s, r) => s + (r.score || 0), 0) / myReviews.length).toFixed(1) : '—';

    const skillData = [
      { name: 'Technical Skills', level: 4, pct: 80 },
      { name: 'System Design', level: 2, pct: 40 },
      { name: 'Communication', level: 3, pct: 60 },
      { name: 'Leadership', level: 3, pct: 60 },
    ];

    return (
      <>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon="school" label="Sessions Completed" value={completed} change={12} changeLabel="vs last period" accent="primary" />
          <KPICard icon="payments" label="Total Investment" value={totalSpent} prefix="$" change={8} changeLabel="vs last period" accent="secondary" />
          <KPICard icon="groups" label="Mentors Connected" value={uniqueMentors} change={5} changeLabel="vs last period" accent="tertiary" />
          <KPICard icon="star" label="Average Rating Given" value={avgRating} change={0} changeLabel="of reviews" accent="primary" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Sessions per Month" description="Your learning activity over time">
            <BarChart data={monthlyData} labelKey="name" valueKey="sessions" color="bg-primary" height={140} />
          </SectionCard>
          <SectionCard title="Skill Progression" description="Track your growth across key areas">
            <div className="space-y-4">
              {skillData.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-on-surface">{skill.name}</span>
                    <span className="text-xs font-bold text-primary">Level {skill.level}/5</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-surface-variant overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${skill.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Investment Over Time" description="Monthly spending on mentorship">
          <BarChart data={monthlyData} labelKey="name" valueKey="revenue" color="bg-secondary" height={120} />
        </SectionCard>
      </>
    );
  };

  const renderMentorAnalytics = () => {
    const completed = filteredSessions.filter((s) => String(s.status).toLowerCase() === 'completed').length;
    const totalEarnings = filteredBookings.reduce((s, b) => s + (b.amount || 0), 0);
    const netEarnings = Math.round(totalEarnings * 0.8);
    const avgRating = user.rating || (myReviews.length > 0 ? (myReviews.reduce((s, r) => s + (r.score || 0), 0) / myReviews.length).toFixed(1) : '4.9');
    const uniqueMentees = new Set(myBookings.map((b) => b.menteeId)).size;
    const completionRate = myBookings.length > 0 ? Math.round((completed / myBookings.length) * 100) : 0;
    const totalHours = completed * 1;

    const categoryData = useMemo(() => {
      const cats = {};
      myBookings.forEach((b) => {
        const cat = b.sessionType || 'Mentorship Session';
        cats[cat] = (cats[cat] || 0) + 1;
      });
      return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [myBookings]);

    const donutSegments = categoryData.map((c, i) => ({
      label: c.name,
      value: c.value,
      color: ['#5C6BC0', '#26A69A', '#FFA726', '#EF5350', '#78909C'][i % 5],
    }));

    return (
      <>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon="account_balance_wallet" label="Total Earnings" value={netEarnings} prefix="$" change={18} changeLabel="vs last period" accent="primary" />
          <KPICard icon="school" label="Sessions Completed" value={completed} change={12} changeLabel="vs last period" accent="secondary" />
          <KPICard icon="groups" label="Active Mentees" value={uniqueMentees} change={8} changeLabel="vs last period" accent="tertiary" />
          <KPICard icon="star" label="Average Rating" value={avgRating} change={2} changeLabel="vs last period" accent="primary" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon="timer" label="Hours Mentored" value={totalHours} change={15} changeLabel="vs last period" accent="secondary" />
          <KPICard icon="check_circle" label="Completion Rate" value={completionRate} suffix="%" change={3} changeLabel="vs last period" accent="primary" />
          <KPICard icon="payments" label="Avg Session Value" value={completed > 0 ? Math.round(totalEarnings / completed) : 0} prefix="$" change={5} changeLabel="vs last period" accent="tertiary" />
          <KPICard icon="trending_up" label="Revenue Growth" value={18} suffix="%" change={18} changeLabel="vs last period" accent="secondary" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Revenue Trend" description="Monthly earnings over time">
            <BarChart data={monthlyData} labelKey="name" valueKey="revenue" color="bg-primary" height={160} />
          </SectionCard>
          <SectionCard title="Session Activity" description="Sessions per month">
            <BarChart data={monthlyData} labelKey="name" valueKey="sessions" color="bg-secondary" height={160} />
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Session Categories" description="Distribution of session types">
            {donutSegments.length > 0 ? (
              <DonutChart segments={donutSegments} />
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined mb-2 text-3xl text-on-surface/15">pie_chart</span>
                <p className="text-sm text-on-surface-variant">No session data yet</p>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Recent Activity" description="Latest platform events">
            <ActivityFeed items={recentActivity} />
          </SectionCard>
        </div>
      </>
    );
  };

  const renderAdminAnalytics = () => {
    const totalRevenue = allBookings.reduce((s, b) => s + (b.amount || 0), 0);
    const platformFee = Math.round(totalRevenue * 0.2);
    const netRevenue = totalRevenue - platformFee;
    const approvedMentors = mentors.filter((m) => m.status === 'approved').length;
    const pendingMentors = mentors.filter((m) => m.status === 'pending').length;
    const completionRate = allBookings.length > 0 ? Math.round((allBookings.filter((b) => String(b.status).toLowerCase() === 'completed').length / allBookings.length) * 100) : 0;

    const userGrowth = useMemo(() => {
      const counts = new Array(12).fill(0);
      allUsers.forEach((u) => {
        if (u.createdAt) { const m = new Date(u.createdAt).getMonth(); counts[m]++; }
      });
      return monthShort.map((name, i) => ({ name, users: counts[i] }));
    }, [allUsers]);

    const donutSegments = [
      { label: 'Mentees', value: mentees.length, color: '#5C6BC0' },
      { label: 'Mentors', value: mentors.length, color: '#26A69A' },
      { label: 'Admins', value: allUsers.filter((u) => u.role === 'admin').length, color: '#FFA726' },
    ];

    const topDomains = useMemo(() => {
      const domains = {};
      mentors.forEach((m) => {
        const d = m.industry || m.title || 'General';
        domains[d] = (domains[d] || 0) + 1;
      });
      return Object.entries(domains).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [mentors]);

    return (
      <>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon="payments" label="Total Revenue" value={totalRevenue} prefix="$" change={24} changeLabel="vs last period" accent="primary" />
          <KPICard icon="account_balance" label="Platform Fees" value={platformFee} prefix="$" change={24} changeLabel="20% commission" accent="secondary" />
          <KPICard icon="groups" label="Total Users" value={allUsers.length} change={12} changeLabel="vs last period" accent="tertiary" />
          <KPICard icon="event_available" label="Total Bookings" value={allBookings.length} change={18} changeLabel="vs last period" accent="primary" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard icon="verified" label="Approved Mentors" value={approvedMentors} change={8} changeLabel="vs last period" accent="secondary" />
          <KPICard icon="pending" label="Pending Approvals" value={pendingMentors} change={0} changeLabel="awaiting review" accent="tertiary" />
          <KPICard icon="check_circle" label="Completion Rate" value={completionRate} suffix="%" change={3} changeLabel="vs last period" accent="primary" />
          <KPICard icon="trending_up" label="Net Revenue" value={netRevenue} prefix="$" change={20} changeLabel="after platform fees" accent="secondary" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Revenue Trend" description="Monthly revenue over time">
            <BarChart data={monthlyData} labelKey="name" valueKey="revenue" color="bg-primary" height={160} />
          </SectionCard>
          <SectionCard title="User Growth" description="New user registrations per month">
            <BarChart data={userGrowth} labelKey="name" valueKey="users" color="bg-secondary" height={160} />
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="User Distribution" description="Platform demographics">
            <DonutChart segments={donutSegments} />
          </SectionCard>
          <SectionCard title="Top Domains" description="Most popular mentorship areas">
            <div className="space-y-4">
              {topDomains.map((d, i) => {
                const maxCount = topDomains[0]?.count || 1;
                const pct = Math.round((d.count / maxCount) * 100);
                return (
                  <div key={d.name}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold text-on-surface">{d.name}</span>
                      <span className="text-xs font-bold text-on-surface-variant">{d.count} mentors</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-variant overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {topDomains.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="material-symbols-outlined mb-2 text-3xl text-on-surface/15">domain</span>
                  <p className="text-sm text-on-surface-variant">No domain data yet</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Recent Activity" description="Platform-wide events">
          <ActivityFeed items={recentActivity} />
        </SectionCard>
      </>
    );
  };

  const title = user.role === 'mentor' ? 'Mentor Analytics' : user.role === 'mentee' ? 'Learning Analytics' : 'Platform Analytics';
  const desc = user.role === 'mentor' ? 'Track your mentorship impact and earnings.' : user.role === 'mentee' ? 'Track your learning progress and session history.' : 'Platform-wide statistics and growth metrics.';

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{desc}</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setRange(opt.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                range === opt.id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {user.role === 'mentee' && renderMenteeAnalytics()}
      {user.role === 'mentor' && renderMentorAnalytics()}
      {user.role === 'admin' && renderAdminAnalytics()}
    </div>
  );
};

export default Analytics;
