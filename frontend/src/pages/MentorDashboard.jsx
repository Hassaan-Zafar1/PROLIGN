import React, { useState, useEffect } from 'react';
import { getCurrentUser, logout, getSessions, updateUserProfile } from '../utils/db';
import ProfileSettings from '../components/ProfileSettings';

const MentorDashboard = ({ navigateTo }) => {
  const [user, setUser] = useState(getCurrentUser());
  const [activeView, setActiveView] = useState('dashboard');
  
  const [sessions, setSessions] = useState([]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'New Session Request', message: 'Sarah Jenkins requested a session for tomorrow.', read: false },
    { id: 'n2', title: 'Billing Processed', message: 'Your latest payout of $450 was transferred to your bank.', read: false }
  ]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', title: '', industry: '', bio: '', avatar: '' });

  const refreshData = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Get real sessions from DB and filter for this mentor
    // If none exist, we'll use some mock ones for demonstration
    const dbSessions = getSessions().filter(s => s.mentorId === currentUser?.id);
    
    if (dbSessions.length > 0) {
      setSessions(dbSessions);
    } else {
      setSessions([
        { id: 'ms1', menteeName: 'Sarah Jenkins', menteeAvatar: 'https://i.pravatar.cc/150?u=sarah', dateTime: 'Today', time: '04:00 PM - 05:00 PM', topic: 'System Design Interview', status: 'Confirmed' },
        { id: 'ms2', menteeName: 'Alex Johnson', menteeAvatar: 'https://i.pravatar.cc/150?u=alex', dateTime: 'Tomorrow', time: '10:00 AM - 11:00 AM', topic: 'Product Strategy', status: 'Pending' }
      ]);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({ 
        name: user.name || '', 
        title: user.title || '', 
        industry: user.industry || '', 
        bio: user.bio || '', 
        avatar: user.avatar || '' 
      });
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateUserProfile(user.id, profileForm);
    setIsEditingProfile(false);
    refreshData();
  };

  const markNotificationRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadNotifs = notifications.filter(n => !n.read);

  // Real data calculations
  const upcomingSessions = sessions.filter(s => s.status === 'Confirmed' || s.status === 'Pending');
  const pastSessionsCount = 24 + sessions.filter(s => s.status === 'Completed').length; // Base mock + real
  const hourlyRate = user?.hourlyRate || 150;
  
  // Mocking past earnings for analytics
  const totalGrossEarnings = (pastSessionsCount * hourlyRate);
  const platformFee = totalGrossEarnings * 0.20;
  const netEarnings = totalGrossEarnings - platformFee;

  const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'sessions', icon: 'event_available', label: 'My Sessions' },
    { id: 'earnings', icon: 'payments', label: 'Earnings' },
    { id: 'analytics', icon: 'bar_chart', label: 'Analytics' },
    { id: 'profile', icon: 'person', label: 'My Profile' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  const renderSidebar = () => (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary dark:bg-primary-container text-on-primary flex flex-col py-6 shadow-lg z-50">
      <div className="px-6 mb-8 cursor-pointer" onClick={() => setActiveView('dashboard')}>
        <h1 className="font-headline-md text-2xl font-bold text-on-primary flex items-center gap-2">
          <span className="material-symbols-outlined">school</span>
          MentorBridge
        </h1>
        <p className="font-label-sm text-sm font-semibold opacity-70 mt-1">Mentor Portal</p>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto px-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-all font-label-sm text-sm font-semibold cursor-pointer ${
              activeView === item.id 
                ? 'bg-secondary-container text-on-secondary-container scale-95' 
                : 'text-primary-fixed-dim hover:text-on-primary hover:bg-primary-fixed-variant/20'
            }`}
          >
            <span className="material-symbols-outlined mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="px-6 mt-auto pt-6 border-t border-on-primary/10">
        <div className="mt-4 space-y-1">
          <button className="w-full text-left flex items-center px-2 py-2 text-primary-fixed-dim text-sm hover:text-on-primary transition-colors font-label-sm cursor-pointer">
            <span className="material-symbols-outlined mr-2 scale-75">help</span>
            Help Center
          </button>
          <button onClick={handleLogout} className="w-full text-left flex items-center px-2 py-2 text-primary-fixed-dim text-sm hover:text-on-primary transition-colors font-label-sm cursor-pointer">
            <span className="material-symbols-outlined mr-2 scale-75">logout</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );

  const renderDashboard = () => (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-primary p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm mb-8">
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-on-primary/10 px-4 py-1.5 rounded-full border border-on-primary/10">
            <span className="material-symbols-outlined text-[16px] text-primary-fixed">school</span>
            <span className="font-label-sm text-sm font-semibold text-primary-fixed">Mentor Level: Expert</span>
          </div>
          <h2 className="font-headline-lg text-3xl font-bold text-on-primary">Welcome back, {user?.name?.split(' ')[0] || 'Mentor'}!</h2>
          <p className="text-on-primary/80 max-w-md">
            You have {upcomingSessions.length} upcoming sessions. Your recent mentees have rated you {user?.rating?.toFixed(1) || '5.0'} stars!
          </p>
        </div>
        <div className="hidden lg:block relative z-10">
          <div className="w-48 h-48 bg-on-primary/5 rounded-full flex items-center justify-center p-4">
            <div className="w-full h-full bg-on-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-fixed text-6xl fill-icon">dashboard</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 natural-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-sm">Net Earnings</span>
            <span className="material-symbols-outlined text-secondary">payments</span>
          </div>
          <h3 className="font-headline-xl text-3xl font-bold text-primary">${netEarnings.toLocaleString()}</h3>
          <p className="text-sm text-secondary mt-2 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +15% this month</p>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 natural-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-sm">Total Sessions</span>
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
          <h3 className="font-headline-xl text-3xl font-bold text-primary">{pastSessionsCount}</h3>
          <p className="text-sm text-secondary mt-2 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +3 this week</p>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/10 natural-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant font-label-sm">Average Rating</span>
            <span className="material-symbols-outlined text-secondary">star</span>
          </div>
          <h3 className="font-headline-xl text-3xl font-bold text-primary">{user?.rating?.toFixed(1) || '4.9'}</h3>
          <p className="text-sm text-secondary mt-2 flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">trending_flat</span> Consistent</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="font-headline-md text-2xl font-bold text-primary">Your Next Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <div className="bg-surface-container-low p-8 text-center rounded-2xl border border-outline-variant/10 text-on-surface-variant">
            No upcoming sessions scheduled.
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 natural-shadow">
            <table className="w-full text-left">
              <thead className="bg-surface-container border-b border-outline-variant/10">
                <tr>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Mentee</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Date & Time</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant">Topic</th>
                  <th className="px-6 py-4 font-label-sm text-sm font-semibold text-on-surface-variant text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {upcomingSessions.map(session => (
                  <tr key={session.id} className="hover:bg-surface-container-highest/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={session.menteeAvatar || `https://ui-avatars.com/api/?name=${session.menteeName || 'Mentee'}`} className="w-8 h-8 rounded-full object-cover" alt="Mentee" />
                        <span className="font-label-sm text-sm font-semibold text-on-surface">{session.menteeName || 'Mentee'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-on-surface text-sm font-bold">{session.dateTime}</div>
                      <div className="text-xs text-on-surface-variant">{session.time}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-on-surface-variant">{session.type || session.topic}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {session.status === 'Confirmed' ? (
                        <button onClick={() => navigateTo('video-interview', { sessionId: session.id })} className="bg-primary text-on-primary px-5 py-2 rounded-lg font-label-sm text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer">Start Session</button>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderAnalytics = () => (
    <section className="space-y-6">
      <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Performance Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Previous Month</p>
          <p className="text-2xl font-bold text-primary">12 Sessions</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">This Week</p>
          <p className="text-2xl font-bold text-primary">3 Sessions</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Today</p>
          <p className="text-2xl font-bold text-primary">1 Session</p>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 text-center">
          <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">Year to Date</p>
          <p className="text-2xl font-bold text-primary">48 Sessions</p>
        </div>
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10 relative overflow-hidden">
        <h4 className="font-bold text-on-surface mb-6">Session Volume Trends</h4>
        <div className="relative h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#202a10" stopOpacity="0.15"></stop>
                <stop offset="100%" stopColor="#202a10" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <line stroke="#45483f" strokeOpacity="0.1" x1="0" x2="800" y1="50" y2="50"></line>
            <line stroke="#45483f" strokeOpacity="0.1" x1="0" x2="800" y1="100" y2="100"></line>
            <line stroke="#45483f" strokeOpacity="0.1" x1="0" x2="800" y1="150" y2="150"></line>
            
            <path d="M0,150 L100,140 L200,160 L300,100 L400,120 L500,80 L600,90 L700,50 L800,60 V200 H0 Z" fill="url(#chartGradient2)"></path>
            <path d="M0,150 L100,140 L200,160 L300,100 L400,120 L500,80 L600,90 L700,50 L800,60" fill="none" stroke="#202a10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>
            
            <circle cx="700" cy="50" fill="#202a10" r="6"></circle>
          </svg>
          <div className="flex justify-between mt-4 text-xs font-label-sm font-semibold text-on-surface-variant">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
          </div>
        </div>
      </div>
    </section>
  );

  const renderEarnings = () => (
    <section className="space-y-6">
      <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Earnings & Deductions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-high p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-surface-variant uppercase mb-2">Gross Earnings</p>
          <h4 className="text-3xl font-bold text-on-surface">${totalGrossEarnings.toLocaleString()}</h4>
          <p className="text-xs text-on-surface-variant mt-2">Before system fees</p>
        </div>
        <div className="bg-error-container p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-error-container uppercase mb-2">System Deductions</p>
          <h4 className="text-3xl font-bold text-on-error-container">-${platformFee.toLocaleString()}</h4>
          <p className="text-xs text-on-error-container/80 mt-2">20% Platform Fee</p>
        </div>
        <div className="bg-primary-container p-6 rounded-xl natural-shadow">
          <p className="text-sm font-bold text-on-primary-container uppercase mb-2">Net Payout</p>
          <h4 className="text-3xl font-bold text-on-primary-container">${netEarnings.toLocaleString()}</h4>
          <p className="text-xs text-on-primary-container/80 mt-2">Available for withdrawal</p>
        </div>
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-on-surface text-lg">Recent Transactions</h4>
          <button className="text-secondary font-bold text-sm hover:underline cursor-pointer">Download CSV</button>
        </div>
        <table className="w-full text-left">
          <thead className="border-b border-outline-variant/20">
            <tr>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Date</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Description</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Amount</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Fee</th>
              <th className="pb-3 text-xs uppercase text-on-surface-variant">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            <tr>
              <td className="py-4 text-sm font-semibold">Today</td>
              <td className="py-4 text-sm">Session with Sarah Jenkins</td>
              <td className="py-4 text-sm text-primary font-bold">${hourlyRate}</td>
              <td className="py-4 text-sm text-error">-${(hourlyRate*0.2).toFixed(2)}</td>
              <td className="py-4 text-sm font-bold">${(hourlyRate*0.8).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-4 text-sm font-semibold">Last Week</td>
              <td className="py-4 text-sm">Session with Marcus H.</td>
              <td className="py-4 text-sm text-primary font-bold">${hourlyRate}</td>
              <td className="py-4 text-sm text-error">-${(hourlyRate*0.2).toFixed(2)}</td>
              <td className="py-4 text-sm font-bold">${(hourlyRate*0.8).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-headline-md text-2xl font-bold text-primary">My Profile</h3>
        {!isEditingProfile && (
          <button onClick={() => setIsEditingProfile(true)} className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-bold text-sm shadow-sm cursor-pointer">Edit Profile</button>
        )}
      </div>

      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
        {isEditingProfile ? (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex items-center gap-6 mb-6">
              <img src={profileForm.avatar || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-surface-variant" />
              <div className="flex-1">
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Avatar URL</label>
                <input type="text" value={profileForm.avatar} onChange={e => setProfileForm({...profileForm, avatar: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Full Name</label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase mb-2">Professional Title</label>
                <input type="text" value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase mb-2">Industry / Domain</label>
              <input type="text" value={profileForm.industry} onChange={e => setProfileForm({...profileForm, industry: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase mb-2">Biography</label>
              <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full p-3 bg-surface border border-outline-variant/30 rounded-lg text-sm h-32 resize-none" required />
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-outline-variant/10">
              <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2 font-bold text-on-surface-variant hover:bg-surface-variant rounded-lg cursor-pointer transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-sm cursor-pointer hover:opacity-90">Save Profile</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt="Profile" className="w-40 h-40 rounded-2xl object-cover shadow-sm" />
            <div className="space-y-4 flex-1">
              <div>
                <h4 className="text-3xl font-bold text-on-surface">{user?.name}</h4>
                <p className="text-lg text-secondary font-semibold">{user?.title}</p>
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold uppercase tracking-wider">{user?.industry}</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">{user?.bio}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="max-w-3xl mx-auto space-y-6">
      <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">Account Settings</h3>
      
      <div className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10 space-y-8">
        <div>
          <h4 className="font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/10 pb-2">Availability</h4>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
            <div>
              <div className="font-bold text-on-surface">Accepting New Mentees</div>
              <div className="text-xs text-on-surface-variant">Allow mentees to book new sessions with you.</div>
            </div>
            <div className="w-12 h-6 bg-secondary rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/10 pb-2">Billing & Payouts</h4>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg mb-4">
            <div>
              <div className="font-bold text-on-surface">Hourly Rate</div>
              <div className="text-xs text-on-surface-variant">Set your base rate per session.</div>
            </div>
            <div className="flex items-center">
              <span className="text-on-surface-variant mr-2">$</span>
              <input type="number" defaultValue={user?.hourlyRate || 150} className="w-20 p-2 bg-surface border border-outline-variant/30 rounded text-sm text-center font-bold text-primary" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
            <div>
              <div className="font-bold text-on-surface">Payout Method</div>
              <div className="text-xs text-on-surface-variant">Bank Account ending in •••• 4242</div>
            </div>
            <button className="text-secondary font-bold text-sm cursor-pointer hover:underline">Update</button>
          </div>
        </div>
      </div>
    </section>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return renderDashboard();
      case 'analytics': return renderAnalytics();
      case 'earnings': return renderEarnings();
      case 'profile': return renderProfile();
      case 'settings': return <ProfileSettings compact onSaved={refreshData} />;
      case 'sessions': return (
         <section className="bg-surface-container p-8 rounded-xl natural-shadow border border-outline-variant/10">
           <h3 className="font-headline-md text-2xl font-bold text-primary mb-6">All Sessions</h3>
           <table className="w-full text-left">
             <thead className="bg-surface-container-low border-b border-outline-variant/10">
               <tr>
                 <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Mentee</th>
                 <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Date & Time</th>
                 <th className="px-4 py-3 text-xs uppercase font-bold text-on-surface-variant">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-outline-variant/10">
               {sessions.map(s => (
                 <tr key={s.id}>
                   <td className="px-4 py-4 text-sm font-bold text-on-surface">{s.menteeName || 'Mentee'}</td>
                   <td className="px-4 py-4 text-sm">{s.dateTime} <span className="text-xs text-on-surface-variant ml-2">{s.time}</span></td>
                   <td className="px-4 py-4">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${s.status === 'Confirmed' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>{s.status}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </section>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="flex bg-surface min-h-screen font-body-md w-full">
      {renderSidebar()}
      
      <main className="ml-64 w-full p-8 bg-surface">
        <header className="flex justify-between items-center mb-12 relative">
          <div>
            <h2 className="font-headline-lg text-4xl font-bold text-on-surface capitalize">{activeView.replace('-', ' ')}</h2>
            <p className="text-on-surface-variant text-base mt-1">Manage your mentorship practice and impact.</p>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="bg-surface-container h-12 w-12 rounded-full flex items-center justify-center natural-shadow hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-error text-on-error rounded-full text-[10px] font-bold flex items-center justify-center">{unreadNotifs.length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl natural-shadow border border-outline-variant/10 z-50 overflow-hidden">
                  <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center">
                    <h4 className="font-bold text-on-surface">Notifications</h4>
                    <span className="text-xs text-secondary cursor-pointer hover:underline" onClick={() => notifications.forEach(n => markNotificationRead(n.id))}>Mark all read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-on-surface-variant">No notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-on-surface">{n.title}</span>
                            <div className="flex gap-2">
                              {!n.read && <button onClick={() => markNotificationRead(n.id)} className="text-[10px] text-secondary cursor-pointer hover:underline">Read</button>}
                              <button onClick={() => deleteNotification(n.id)} className="text-[10px] text-error cursor-pointer hover:underline">Delete</button>
                            </div>
                          </div>
                          <p className="text-xs text-on-surface-variant">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div onClick={() => setActiveView('profile')} className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full natural-shadow cursor-pointer hover:bg-surface-container-high transition-colors">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-variant border border-outline-variant/30">
                <img className="w-full h-full object-cover" src={user?.avatar || "https://i.pravatar.cc/150"} alt="Mentor" />
              </div>
              <span className="font-label-sm text-sm font-semibold text-on-surface">{user?.name}</span>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default MentorDashboard;
