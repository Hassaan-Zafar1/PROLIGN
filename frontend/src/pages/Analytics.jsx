import React from 'react';
import { getCurrentUser, getDB } from '../utils/db';

const Analytics = () => {
  const user = getCurrentUser();

  if (!user) return <div className="p-8 text-center text-on-surface-variant">Please login to view analytics.</div>;

  const db = getDB();
  
  // Calculate some mock analytics based on DB state
  const totalBookings = db.bookings?.length || 0;
  const totalRevenue = db.bookings?.reduce((acc, b) => acc + (b.amount || 0), 0) || 0;
  const totalMentors = db.users.filter(u => u.role === 'mentor').length;
  const totalMentees = db.users.filter(u => u.role === 'mentee').length;

  const myBookings = db.bookings?.filter(b => b.menteeId === user.id || b.mentorId === user.id) || [];
  const myTotalSpent = myBookings.reduce((acc, b) => acc + (b.amount || 0), 0);

  const renderMenteeAnalytics = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2">school</span>
          <p className="text-3xl font-headline-md font-bold text-primary">{myBookings.length}</p>
          <p className="text-sm font-semibold text-on-surface-variant">Sessions Completed</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2">payments</span>
          <p className="text-3xl font-headline-md font-bold text-primary">${myTotalSpent}</p>
          <p className="text-sm font-semibold text-on-surface-variant">Total Investment</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2">trending_up</span>
          <p className="text-3xl font-headline-md font-bold text-primary">85%</p>
          <p className="text-sm font-semibold text-on-surface-variant">Goal Completion</p>
        </div>
      </div>
      
      <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-outline-variant/20 mt-8">
        <h3 className="font-headline-md text-xl font-bold mb-6 text-primary">Skill Progression</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
              <span>Technical Interviewing</span>
              <span className="text-secondary">Level 4/5</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-3">
              <div className="bg-secondary h-3 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
              <span>System Design</span>
              <span className="text-secondary">Level 2/5</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-3">
              <div className="bg-secondary h-3 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
              <span>Leadership Communication</span>
              <span className="text-secondary">Level 3/5</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-3">
              <div className="bg-secondary h-3 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMentorAnalytics = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl natural-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">+12% this month</span>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-headline-md font-bold">${myTotalSpent}</p>
            <p className="text-sm font-semibold opacity-90">Total Earnings</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col justify-between">
          <span className="material-symbols-outlined text-3xl text-secondary">groups</span>
          <div className="mt-4">
            <p className="text-3xl font-headline-md font-bold text-primary">{myBookings.length}</p>
            <p className="text-sm font-semibold text-on-surface-variant">Sessions Hosted</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col justify-between">
          <span className="material-symbols-outlined text-3xl text-secondary">star</span>
          <div className="mt-4">
            <p className="text-3xl font-headline-md font-bold text-primary">{user.rating || 4.9}</p>
            <p className="text-sm font-semibold text-on-surface-variant">Average Rating</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10 flex flex-col justify-between">
          <span className="material-symbols-outlined text-3xl text-secondary">schedule</span>
          <div className="mt-4">
            <p className="text-3xl font-headline-md font-bold text-primary">82%</p>
            <p className="text-sm font-semibold text-on-surface-variant">Slot Utilization</p>
          </div>
        </div>
      </div>
      
      {/* Mock Chart Area */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-outline-variant/20 mt-8">
        <h3 className="font-headline-md text-xl font-bold mb-6 text-primary">Revenue Overview</h3>
        <div className="h-64 flex items-end justify-between gap-2 border-b border-outline-variant/20 pb-4 relative">
          {/* Y Axis Labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-on-surface-variant font-bold h-[calc(100%-1rem)]">
            <span>$500</span>
            <span>$250</span>
            <span>$0</span>
          </div>
          
          <div className="flex-1 border-l border-outline-variant/20 ml-12 h-full flex items-end justify-between px-4">
            {/* Bars */}
            <div className="w-12 bg-surface-variant rounded-t-md h-[40%] group relative hover:bg-secondary transition-colors cursor-pointer">
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-on-surface text-surface text-xs py-1 px-2 rounded font-bold transition-opacity">$200</span>
            </div>
            <div className="w-12 bg-surface-variant rounded-t-md h-[65%] group relative hover:bg-secondary transition-colors cursor-pointer">
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-on-surface text-surface text-xs py-1 px-2 rounded font-bold transition-opacity">$325</span>
            </div>
            <div className="w-12 bg-surface-variant rounded-t-md h-[55%] group relative hover:bg-secondary transition-colors cursor-pointer">
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-on-surface text-surface text-xs py-1 px-2 rounded font-bold transition-opacity">$275</span>
            </div>
            <div className="w-12 bg-primary rounded-t-md h-[80%] group relative hover:bg-primary-container transition-colors cursor-pointer shadow-md">
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-on-surface text-surface text-xs py-1 px-2 rounded font-bold transition-opacity z-10">$400</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between px-4 ml-12 mt-2 text-xs font-bold text-on-surface-variant">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>This Week</span>
        </div>
      </div>
    </div>
  );

  const renderAdminAnalytics = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Platform GMV</p>
          <p className="text-3xl font-headline-md font-bold text-primary">${totalRevenue * 25}k</p>
          <p className="text-xs text-secondary mt-2 font-semibold">↑ 18% vs last month</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-3xl font-headline-md font-bold text-primary">{totalMentors + totalMentees}</p>
          <p className="text-xs text-secondary mt-2 font-semibold">↑ 5% vs last month</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Active Mentors</p>
          <p className="text-3xl font-headline-md font-bold text-primary">{totalMentors}</p>
          <p className="text-xs text-secondary mt-2 font-semibold">↑ 2% vs last month</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-secondary/10">
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Bookings</p>
          <p className="text-3xl font-headline-md font-bold text-primary">{totalBookings * 12}</p>
          <p className="text-xs text-secondary mt-2 font-semibold">↑ 24% vs last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-outline-variant/20">
          <h3 className="font-headline-md text-xl font-bold mb-6 text-primary">User Demographics</h3>
          <div className="flex items-center justify-center h-48 relative">
            {/* Mock Donut Chart */}
            <div className="w-32 h-32 rounded-full border-[16px] border-primary border-t-secondary border-r-secondary transform rotate-45"></div>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold text-on-surface">100%</span>
              <span className="text-xs text-on-surface-variant font-bold">Total Users</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full"></span>
              <span className="text-sm font-bold">Mentees (65%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-secondary rounded-full"></span>
              <span className="text-sm font-bold">Mentors (35%)</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl natural-shadow border border-outline-variant/20">
          <h3 className="font-headline-md text-xl font-bold mb-6 text-primary">Top Performing Domains</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
                <span>Software Engineering</span>
                <span>$45k</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
                <span>Product Management</span>
                <span>$32k</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
                <span>Data Science / AI</span>
                <span>$28k</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-tertiary h-2 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm font-bold text-on-surface">
                <span>UX/UI Design</span>
                <span>$18k</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div className="bg-outline text-on-surface h-2 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="font-headline-lg text-4xl font-bold text-primary">Analytics Overview</h1>
        <p className="text-on-surface-variant mt-2">
          {user.role === 'mentor' ? 'Track your mentorship impact and earnings.' : 
           user.role === 'mentee' ? 'Track your learning progress and session history.' :
           'Platform wide statistics and growth metrics.'}
        </p>
      </div>

      {user.role === 'mentee' && renderMenteeAnalytics()}
      {user.role === 'mentor' && renderMentorAnalytics()}
      {user.role === 'admin' && renderAdminAnalytics()}
    </div>
  );
};

export default Analytics;
