import { useState, useMemo } from 'react';
import { getReviewsForMentor, getUserById, getCurrentUser, createBooking } from '../utils/db';
import { getMentorLevel, getMentorLevelStyle } from '../utils/mentorLevel';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const sessionTypes = [
  { value: 'Career Strategy Deep Dive (60 min)', icon: 'trending_up', desc: 'Map your career path and set actionable milestones.' },
  { value: 'Technical Portfolio Review (45 min)', icon: 'folder_open', desc: 'Get expert feedback on your projects and portfolio.' },
  { value: 'Leadership Coaching (60 min)', icon: 'groups', desc: 'Develop leadership skills and management strategies.' },
  { value: 'Mock Interview & Feedback (90 min)', icon: 'record_voice_over', desc: 'Practice interviews with real-time, constructive feedback.' },
];

const dateKey = (date) => date.toISOString().split('T')[0];

const MentorProfile = ({ navigateTo, params }) => {
  const mentorId = params?.mentorId || 'u1';
  const mentor = useMemo(() => getUserById(mentorId), [mentorId]);
  const reviews = useMemo(() => getReviewsForMentor(mentorId), [mentorId]);
  const user = getCurrentUser();
  const mentorLevelInfo = useMemo(() => getMentorLevel(mentor), [mentor]);

  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionType, setSessionType] = useState(sessionTypes[0].value);
  const [notes, setNotes] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const availableDates = useMemo(() => {
    if (!mentor?.availability) return [];
    const results = [];
    const today = new Date();
    for (let i = 1; i <= 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
      const match = mentor.availability.find(a => a.startsWith(dayName));
      if (match) results.push(d);
    }
    return results;
  }, [mentor]);

  const isDateAvailable = (date) => availableDates.some(d => d.toDateString() === date.toDateString());

  const availableTimes = useMemo(() => {
    if (!mentor?.availability) return [];
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDateObj.getDay()];
    return mentor.availability
      .filter(a => a.startsWith(dayName))
      .map(a => a.split(' ').slice(1).join(' ').trim());
  }, [selectedDateObj, mentor]);

  const calendarDays = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i));
    }
    return days;
  }, [visibleMonth]);

  const basePrice = mentor?.hourlyRate || 120;
  const fee = basePrice * 0.05;
  const total = basePrice + fee;

  const handleBook = () => {
    if (!user) { alert('Please login first to book a session.'); navigateTo('login'); return; }
    if (!selectedTime) { alert('Please select an available time slot.'); return; }
    setIsPaymentOpen(true);
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    if (!cardName || !cardNumber || !expiry || !cvv) { alert('Please fill in all payment details.'); return; }
    setIsProcessing(true);
    setTimeout(() => {
      const booking = createBooking({
        menteeId: user.id, mentorId: mentor.id, date: dateKey(selectedDateObj),
        time: selectedTime, sessionType, notes, amount: total,
      });
      setIsProcessing(false);
      setIsPaymentOpen(false);
      setConfirmedBooking({
        ...booking, mentorName: mentor.name, mentorAvatar: mentor.avatar,
        date: selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: selectedTime, sessionType, total,
      });
    }, 800);
  };

  if (!mentor) {
    return <div className="p-8 text-center text-on-surface-variant">Loading mentor profile...</div>;
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto">
      {/* Hero Profile Header */}
      <section className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-primary/10 via-surface to-secondary/10 border border-outline-variant/10 p-5 sm:p-6 md:p-8 lg:p-10 mb-6 lg:mb-8">
        <div className="absolute top-0 right-0 w-48 h-48 lg:w-64 lg:h-64 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-36 h-36 lg:w-48 lg:h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:gap-6 lg:gap-8 items-start">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-br from-secondary to-primary p-[3px]">
                <div className="w-full h-full rounded-xl lg:rounded-2xl bg-surface" />
              </div>
              <img
                alt={mentor.name}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-xl lg:rounded-2xl object-cover ring-4 ring-surface relative z-10"
                src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`}
              />
            </div>
          </div>

          {/* Mentor Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-primary truncate">{mentor.name}</h1>
            <p className="text-base sm:text-lg text-on-surface-variant mt-1">{mentor.title} at {mentor.company}</p>
            {(() => {
              const mlStyle = getMentorLevelStyle(mentorLevelInfo.level);
              return (
                <div className={`mt-2.5 mentor-level-badge mentor-level-${mentorLevelInfo.level} ${mlStyle.wrapper}`}>
                  {mlStyle.icon && <span className="material-symbols-outlined text-[12px]">{mlStyle.icon}</span>}
                  {mentorLevelInfo.label}
                </div>
              );
            })()}

            {/* Quick Stats Row */}
            <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 mt-3 sm:mt-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary fill-icon text-base lg:text-lg">star</span>
                <span className="font-bold text-sm lg:text-base">{mentor.rating}</span>
                <span className="text-on-surface-variant text-xs lg:text-sm">({mentor.reviews || 0})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-on-surface-variant text-base lg:text-lg">work</span>
                <span className="font-semibold text-xs lg:text-sm">{mentor.experience || 0}+ years</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-on-surface-variant text-base lg:text-lg">language</span>
                <span className="font-semibold text-xs lg:text-sm">English</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-on-surface-variant text-base lg:text-lg">schedule</span>
                <span className="font-semibold text-xs lg:text-sm">~2 hrs response</span>
              </div>
            </div>

            {/* Skills */}
            <div className="flex gap-2 flex-wrap mt-3 sm:mt-4">
              {mentor.skills?.map(skill => (
                <span key={skill} className="bg-secondary/10 text-secondary px-2.5 py-1 lg:px-3 lg:py-1 rounded-full text-[10px] lg:text-xs font-bold border border-secondary/20">{skill}</span>
              ))}
            </div>
          </div>

          {/* Price Card — Desktop */}
          <div className="hidden lg:block shrink-0 w-52 bg-surface rounded-xl p-5 border border-outline-variant/10 shadow-sm">
            <p className="text-3xl font-bold text-primary">${mentor.hourlyRate}</p>
            <p className="text-xs text-on-surface-variant mb-4">per session</p>
            <div className="space-y-2 text-sm border-t border-outline-variant/10 pt-3">
              <div className="flex justify-between"><span className="text-on-surface-variant">Sessions</span><span className="font-semibold">450+</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Response</span><span className="font-semibold">~2 hrs</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: 3-col on xl, 2-col on lg, 1-col below */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_340px] gap-6 lg:gap-8">
        {/* Left Content */}
        <div className="lg:col-span-2 xl:col-span-1 space-y-6 lg:space-y-8">
          {/* About */}
          <section className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 lg:px-8 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">badge</span>
                About
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              <p className="text-on-surface leading-relaxed text-sm sm:text-base">
                I bridge the gap between human behavior and digital architecture. With over {mentor.experience || 15} years of experience at the intersection of {mentor.industry?.toLowerCase() || 'technology'} and product development, I help mid-to-senior designers and product managers navigate the complexities of ethical design and high-stakes strategy.
              </p>
            </div>
          </section>

          {/* Quick Stats Section */}
          <section className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 lg:px-8 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">analytics</span>
                Statistics
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
                {[
                  { icon: 'check_circle', value: '450+', label: 'Sessions' },
                  { icon: 'work', value: `${mentor.experience || 15}+`, label: 'Experience' },
                  { icon: 'star', value: mentor.rating?.toFixed(1) || '4.9', label: 'Rating' },
                  { icon: 'groups', value: '120+', label: 'Students' },
                  { icon: 'speed', value: '~2h', label: 'Response' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface-variant/30 rounded-xl p-3 lg:p-4 border border-outline-variant/10 text-center hover:bg-surface-variant/50 transition-colors">
                    <span className="material-symbols-outlined text-secondary text-xl lg:text-2xl">{stat.icon}</span>
                    <p className="text-lg lg:text-xl font-bold text-primary mt-1">{stat.value}</p>
                    <p className="text-[10px] lg:text-xs text-on-surface-variant font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Platform Enrollment / Level details */}
          <section className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 lg:px-8 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">workspace_premium</span>
                Enrollment Details
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-variant/30 rounded-xl p-4 border border-outline-variant/10 hover:bg-surface-variant/50 transition-colors">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Registered Since</p>
                  <p className="text-base font-bold text-primary mt-1">{mentorLevelInfo.since || 'Experience Level Unavailable'}</p>
                </div>
                <div className="bg-surface-variant/30 rounded-xl p-4 border border-outline-variant/10 hover:bg-surface-variant/50 transition-colors">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Years on Platform</p>
                  <p className="text-base font-bold text-primary mt-1">{mentorLevelInfo.yearsDisplay || 'Experience Level Unavailable'}</p>
                </div>
                <div className="bg-surface-variant/30 rounded-xl p-4 border border-outline-variant/10 hover:bg-surface-variant/50 transition-colors">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Experience Level</p>
                  <p className="text-base font-bold text-primary mt-1">{mentorLevelInfo.label}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Experience & Education */}
          <section className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 lg:px-8 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">timeline</span>
                Experience
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-secondary/40 before:to-outline-variant/20">
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-secondary flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-on-primary"></div>
                  </div>
                  <h4 className="font-bold text-on-surface text-sm lg:text-base">{mentor.title}</h4>
                  <p className="text-xs lg:text-sm text-on-surface-variant">{mentor.company} · Present</p>
                </div>
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-outline-variant flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-surface"></div>
                  </div>
                  <h4 className="font-bold text-on-surface text-sm lg:text-base">Senior Engineer</h4>
                  <p className="text-xs lg:text-sm text-on-surface-variant">Leading Tech Co. · 2018 - 2022</p>
                </div>
              </div>
            </div>
            <div className="border-t border-outline-variant/10 px-5 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-primary/5 to-secondary/5">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">school</span>
                Education
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-surface-variant/30 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-secondary text-xl lg:text-2xl shrink-0">school</span>
                  <div>
                    <h4 className="font-bold text-on-surface text-xs lg:text-sm">PhD in Computer Science</h4>
                    <p className="text-[10px] lg:text-xs text-on-surface-variant">Stanford University · 2012 - 2016</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 lg:gap-4 p-3 lg:p-4 bg-surface-variant/30 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-secondary text-xl lg:text-2xl shrink-0">school</span>
                  <div>
                    <h4 className="font-bold text-on-surface text-xs lg:text-sm">B.Sc. in Software Engineering</h4>
                    <p className="text-[10px] lg:text-xs text-on-surface-variant">MIT · 2008 - 2012</p>
                  </div>
                </div>
              </div>
            </div>
          </section>



          {/* Reviews */}
          <section className="bg-surface rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 lg:px-8 py-4 border-b border-outline-variant/10">
              <h2 className="text-lg lg:text-xl font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">reviews</span>
                Reviews ({reviews.length})
              </h2>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">
              {/* Rating Summary */}
              <div className="flex items-center gap-4 sm:gap-6 mb-6 pb-5 border-b border-outline-variant/10">
                <div className="text-center">
                  <p className="text-3xl lg:text-4xl font-bold text-primary leading-tight">{mentor.rating?.toFixed(1) || '0.0'}</p>
                  <div className="flex justify-center text-secondary gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className="material-symbols-outlined fill-icon text-sm lg:text-lg">star</span>
                    ))}
                  </div>
                  <p className="text-[10px] lg:text-xs text-on-surface-variant mt-1">{reviews.length} reviews</p>
                </div>
              </div>

              {/* Review Cards — 2-col grid on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                {reviews.length > 0 ? reviews.map(review => (
                  <div key={review.id} className="bg-surface-variant/20 p-4 lg:p-5 rounded-xl border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-2.5 gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-xs lg:text-sm">
                          {(review.menteeName || 'M').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs lg:text-sm text-on-surface">{review.menteeName || 'Verified Mentee'}</p>
                          <p className="text-[10px] lg:text-xs text-on-surface-variant">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-secondary fill-icon text-xs lg:text-sm">star</span>
                        <span className="font-bold text-xs lg:text-sm text-on-surface">{review.score}.0</span>
                      </div>
                    </div>
                    <p className="text-on-surface-variant text-xs lg:text-sm leading-relaxed">&ldquo;{review.reviewText}&rdquo;</p>
                  </div>
                )) : (
                  <div className="col-span-full bg-surface-variant/20 p-6 lg:p-8 rounded-xl border border-dashed border-outline-variant/20 text-center text-on-surface-variant text-sm">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar — Booking Card */}
        <aside className="lg:col-span-3 xl:col-span-1 order-first lg:order-last">
          <div className="bg-surface rounded-2xl border border-outline-variant/10 shadow-sm xl:sticky xl:top-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-5 sm:px-6 py-4 border-b border-outline-variant/10">
              <h3 className="text-base lg:text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">calendar_month</span>
                Book a Session
              </h3>
            </div>
            <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5">
              {/* Calendar */}
              <div>
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Select Date</label>
                <div className="bg-surface-variant/20 rounded-xl p-2.5 lg:p-3 border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm lg:text-lg">chevron_left</span>
                    </button>
                    <span className="text-xs lg:text-sm font-bold text-on-surface">{monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</span>
                    <button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="flex h-7 w-7 lg:h-8 lg:w-8 items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm lg:text-lg">chevron_right</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] lg:text-xs font-bold text-on-surface-variant mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (<span key={d} className="py-0.5 lg:py-1">{d}</span>))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (<div key={`e-${i}`} />))}
                    {calendarDays.map(day => {
                      const isSelected = day.toDateString() === selectedDateObj.toDateString();
                      const isAvail = isDateAvailable(day);
                      const isPast = day < new Date(new Date().toDateString());
                      return (
                        <button
                          key={dateKey(day)}
                          onClick={() => !isPast && isAvail && setSelectedDateObj(day)}
                          disabled={isPast || !isAvail}
                          className={`h-7 lg:h-8 text-[10px] lg:text-xs rounded-full font-semibold transition-all ${
                            isSelected ? 'bg-primary text-on-primary shadow-sm' :
                            isAvail && !isPast ? 'text-on-surface hover:bg-secondary/10 cursor-pointer' :
                            'text-on-surface-variant/30 cursor-not-allowed'
                          }`}
                        >{day.getDate()}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">
                  {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </label>
                <div className="flex flex-wrap gap-1.5 lg:gap-2">
                  {availableTimes.length > 0 ? availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold border transition-all ${
                        selectedTime === time
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'border-outline-variant/10 bg-surface-variant/20 text-on-surface hover:border-secondary/30'
                      }`}
                    >{time}</button>
                  )) : (
                    <p className="text-[10px] lg:text-xs text-on-surface-variant py-2">No available slots for this date.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/10 bg-surface-variant/20 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30 resize-none"
                  rows={2}
                  placeholder="What would you like to discuss?"
                />
              </div>

              {/* Price Summary */}
              <div className="bg-surface-variant/20 rounded-xl p-3 lg:p-4 space-y-1.5 lg:space-y-2 text-xs lg:text-sm border border-outline-variant/10">
                <div className="flex justify-between"><span className="text-on-surface-variant">Session</span><span className="font-semibold text-on-surface">${basePrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">Platform fee</span><span className="font-semibold text-on-surface">${fee.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-outline-variant/20 pt-2"><span className="font-bold text-on-surface">Total</span><span className="font-bold text-primary text-base lg:text-lg">${total.toFixed(2)}</span></div>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBook}
                className="w-full h-11 lg:h-12 bg-gradient-to-r from-primary to-primary/90 text-on-primary font-bold rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                <span className="material-symbols-outlined text-base lg:text-lg">calendar_month</span>
                {selectedTime ? `Book for ${selectedTime}` : 'Select a Time Slot'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Book Button */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden p-4 bg-surface/95 backdrop-blur-sm border-t border-outline-variant/10 z-40">
        <button
          onClick={handleBook}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-on-primary font-bold rounded-xl hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">calendar_month</span>
          {selectedTime ? `Book for ${selectedTime}` : 'Book Session'}
        </button>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-surface p-6 sm:p-8 shadow-2xl border border-outline-variant/10 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">Secure Payment</p>
                <h3 className="mt-1 font-headline-md text-xl sm:text-2xl font-bold text-on-surface">Complete Payment</h3>
              </div>
              <button onClick={() => setIsPaymentOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-5 rounded-2xl bg-surface-variant/30 p-4 border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-surface-variant">Total</span>
                <span className="text-2xl sm:text-3xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">{mentor.name} · {selectedDateObj.toLocaleDateString()} at {selectedTime}</p>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cardholder Name</label>
                <input value={cardName} onChange={e => setCardName(e.target.value)} className="w-full rounded-xl border border-outline-variant/10 bg-surface-variant/20 px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30" placeholder="Full name on card" type="text" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Card Number</label>
                <input value={cardNumber} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 '); setCardNumber(formatted.slice(0, 19)); }} className="w-full rounded-xl border border-outline-variant/10 bg-surface-variant/20 px-4 py-3 font-mono text-sm tracking-wider text-on-surface outline-none focus:ring-2 focus:ring-secondary/30" placeholder="0000 0000 0000 0000" type="text" maxLength={19} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Expiry Date</label>
                  <input value={expiry} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length <= 2) setExpiry(raw); else setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`); }} className="w-full rounded-xl border border-outline-variant/10 bg-surface-variant/20 px-4 py-3 font-mono text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary/30" placeholder="MM/YY" type="text" maxLength={5} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">CVV</label>
                  <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full rounded-xl border border-outline-variant/10 bg-surface-variant/20 px-4 py-3 font-mono text-sm tracking-widest text-on-surface outline-none focus:ring-2 focus:ring-secondary/30" placeholder="***" type="password" maxLength={4} required />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary/5 p-3 text-xs font-semibold text-secondary border border-secondary/10">
                <span className="material-symbols-outlined text-lg">lock</span>
                Your payment is secured with end-to-end encryption.
              </div>
              <button type="submit" disabled={isProcessing} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-3.5 lg:py-4 font-bold text-on-primary shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed">
                {isProcessing ? (
                  <><span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" /> Processing...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">lock</span> Pay ${total.toFixed(2)}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-6 sm:p-8 shadow-2xl border border-outline-variant/10">
            <div className="mb-5 text-center">
              <span className="mx-auto flex h-14 w-14 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined fill-icon text-2xl lg:text-3xl">check_circle</span>
              </span>
              <h3 className="mt-3 lg:mt-4 text-xl lg:text-2xl font-bold text-on-surface">Booking Confirmed!</h3>
              <p className="mt-1 text-xs lg:text-sm text-on-surface-variant">Your session has been submitted for mentor approval.</p>
            </div>
            <div className="mb-5 space-y-2.5 rounded-2xl bg-surface-variant/20 p-4 lg:p-5 border border-outline-variant/10">
              <div className="flex items-center gap-3">
                <img alt={confirmedBooking.mentorName} className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl object-cover" src={confirmedBooking.mentorAvatar || `https://ui-avatars.com/api/?name=${confirmedBooking.mentorName}`} />
                <div><p className="font-bold text-sm lg:text-base text-on-surface">{confirmedBooking.mentorName}</p><p className="text-[10px] lg:text-xs text-on-surface-variant">Mentor</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 lg:gap-3 border-t border-outline-variant/10 pt-2.5 text-xs lg:text-sm">
                <div><p className="text-[10px] lg:text-xs font-semibold text-on-surface-variant">Session</p><p className="font-semibold text-on-surface">{confirmedBooking.sessionType.split('(')[0].trim()}</p></div>
                <div><p className="text-[10px] lg:text-xs font-semibold text-on-surface-variant">Date</p><p className="font-semibold text-on-surface">{confirmedBooking.date}</p></div>
                <div><p className="text-[10px] lg:text-xs font-semibold text-on-surface-variant">Time</p><p className="font-semibold text-on-surface">{confirmedBooking.time}</p></div>
                <div><p className="text-[10px] lg:text-xs font-semibold text-on-surface-variant">Total</p><p className="font-semibold text-primary">${Number(confirmedBooking.total).toFixed(2)}</p></div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button onClick={() => { setConfirmedBooking(null); navigateTo('dashboard'); }} className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-primary/90 py-3 lg:py-3.5 font-bold text-on-primary shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-sm lg:text-base">Back to Dashboard</button>
              <button onClick={() => { setConfirmedBooking(null); navigateTo('sessions'); }} className="flex-1 rounded-2xl border border-outline-variant/10 bg-surface-variant/20 py-3 lg:py-3.5 font-bold text-on-surface hover:bg-surface-variant/40 transition-all text-sm lg:text-base">View Sessions</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer for mobile sticky button */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default MentorProfile;
