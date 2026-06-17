import React, { useEffect, useMemo, useState } from 'react';
import { createBooking, getCurrentUser, getSessions, getUserById, getUsersByRole } from '../utils/db';

const dateKey = (date) => date.toISOString().split('T')[0];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const sessionTypes = [
  { value: 'Career Strategy Deep Dive (60 min)', icon: 'trending_up', desc: 'Map your career path and set actionable milestones.' },
  { value: 'Technical Portfolio Review (45 min)', icon: 'folder_open', desc: 'Get expert feedback on your projects and portfolio.' },
  { value: 'Leadership Coaching (60 min)', icon: 'groups', desc: 'Develop leadership skills and management strategies.' },
  { value: 'Mock Interview & Feedback (90 min)', icon: 'record_voice_over', desc: 'Practice interviews with real-time, constructive feedback.' },
];

const steps = [
  { id: 1, label: 'Session' },
  { id: 2, label: 'Schedule' },
  { id: 3, label: 'Payment' },
];

export default function Booking({ navigateTo, params }) {
  const user = getCurrentUser();
  const [step, setStep] = useState(1);
  const [sessionType, setSessionType] = useState(sessionTypes[0].value);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const mentorId = params?.mentorId || 'u1';
    const selectedMentor = getUserById(mentorId) || getUsersByRole('mentor').find((item) => item.status === 'approved');
    setMentor(selectedMentor || null);
  }, [params]);

  const availabilitySlots = mentor?.availabilitySlots || {};
  const bookedSlots = useMemo(() => {
    if (!mentor) return {};
    return getSessions()
      .filter((session) => session.mentorId === mentor.id && !['Rejected', 'Cancelled', 'Canceled'].includes(session.status))
      .reduce((acc, session) => {
        const key = session.dateTime || session.date;
        if (!key) return acc;
        acc[key] = [...(acc[key] || []), session.time];
        return acc;
      }, {});
  }, [mentor]);

  const calendarDays = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i));
    }
    return days;
  }, [visibleMonth]);

  const hasAvailableSlot = (date) => {
    const key = dateKey(date);
    const slots = availabilitySlots[key] || [];
    const unavailable = bookedSlots[key] || [];
    return slots.some((time) => !unavailable.includes(time));
  };

  const availableTimes = useMemo(() => {
    const key = dateKey(selectedDateObj);
    const rawTimes = availabilitySlots[key] || [];
    const alreadyBooked = bookedSlots[key] || [];
    const today = new Date();
    const isToday = selectedDateObj.toDateString() === today.toDateString();
    const twoHoursFromNow = new Date(today.getTime() + 2 * 60 * 60 * 1000);

    return rawTimes.filter((timeStr) => {
      if (alreadyBooked.includes(timeStr)) return false;
      if (!isToday) return true;

      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const slotTime = new Date(selectedDateObj);
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime >= twoHoursFromNow;
    });
  }, [availabilitySlots, bookedSlots, selectedDateObj]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    } else if (availableTimes.length === 0) {
      setSelectedTime('');
    }
  }, [availableTimes, selectedTime]);

  useEffect(() => {
    if (!mentor || hasAvailableSlot(selectedDateObj)) return;
    const nextAvailableKey = Object.keys(availabilitySlots)
      .filter((key) => new Date(`${key}T00:00:00`) >= new Date(new Date().toDateString()))
      .sort()
      .find((key) => {
        const unavailable = bookedSlots[key] || [];
        return (availabilitySlots[key] || []).some((time) => !unavailable.includes(time));
      });

    if (nextAvailableKey) {
      const nextDate = new Date(`${nextAvailableKey}T00:00:00`);
      setSelectedDateObj(nextDate);
      setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    }
  }, [availabilitySlots, bookedSlots, mentor]);

  const basePrice = mentor?.hourlyRate || 120;
  const fee = basePrice * 0.05;
  const total = basePrice + fee;

  const handleNextStep = () => {
    if (step === 1) {
      if (!sessionType) { alert('Please select a session type.'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!selectedTime) { alert('Please select an available time slot.'); return; }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePaymentSubmit = (event) => {
    event.preventDefault();
    if (!cardName || !cardNumber || !expiry || !cvv) {
      alert('Please fill in all payment details.');
      return;
    }

    if (!user) {
      alert('Please login first to book a session.');
      navigateTo('login');
      return;
    }

    if (!mentor || !selectedTime) {
      alert('Please select an available mentor slot first.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const booking = createBooking({
        menteeId: user.id,
        mentorId: mentor.id,
        date: dateKey(selectedDateObj),
        time: selectedTime,
        sessionType,
        notes,
        amount: total,
      });

      setIsProcessing(false);
      setIsPaymentOpen(false);
      setConfirmedBooking({
        ...booking,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        date: selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: selectedTime,
        sessionType,
        total,
      });
    }, 800);
  };

  if (!mentor) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-6 text-6xl text-outline-variant">person_search</span>
        <h1 className="mb-3 font-headline-lg text-3xl font-bold text-on-background">Choose a mentor first</h1>
        <p className="mb-8 text-on-surface-variant">Select a mentor from Discovery before booking a session.</p>
        <button
          onClick={() => navigateTo('discovery')}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-on-primary shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
          Browse Mentors
        </button>
      </div>
    );
  }

  const renderStepIndicator = () => (
    <div className="mb-10 flex items-center justify-center gap-0">
      {steps.map((s, index) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                step === s.id
                  ? 'bg-primary text-on-primary shadow-md'
                  : step > s.id
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {step > s.id ? (
                <span className="material-symbols-outlined text-[18px] fill-icon">check</span>
              ) : (
                s.id
              )}
            </div>
            <span className={`mt-2 text-xs font-semibold ${step >= s.id ? 'text-primary' : 'text-on-surface-variant'}`}>
              {s.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`mx-3 mt-[-1.5rem] h-0.5 w-16 sm:w-24 ${step > s.id ? 'bg-secondary-container' : 'bg-surface-container-high'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderMentorSummary = () => (
    <div className="mb-8 flex items-center gap-4 rounded-2xl bg-surface-container-low p-5">
      <img
        alt={mentor.name}
        className="h-14 w-14 rounded-xl object-cover shadow-sm"
        src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`}
      />
      <div className="flex-1">
        <h2 className="font-headline-md text-xl font-bold text-on-surface">{mentor.name}</h2>
        <p className="text-sm text-on-surface-variant">{mentor.title || mentor.industry}</p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold text-on-surface-variant">Rate</p>
        <p className="font-headline-md text-xl font-bold text-primary">${basePrice}/hr</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-headline-md text-2xl font-bold text-on-background">Choose Session Type</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Pick the format that best fits your goals.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sessionTypes.map((type) => {
          const isSelected = sessionType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => setSessionType(type.value)}
              className={`group flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-secondary bg-secondary-container/40 shadow-sm'
                  : 'border-outline-variant/20 bg-surface-container-low hover:border-secondary/40 hover:bg-surface-container'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isSelected ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{type.icon}</span>
              </span>
              <div>
                <p className={`text-sm font-bold ${isSelected ? 'text-secondary' : 'text-on-surface'}`}>
                  {type.value.split('(')[0].trim()}
                </p>
                <p className="text-xs text-on-surface-variant">{type.desc}</p>
              </div>
              <span className="text-xs font-semibold text-on-surface-variant">{type.value.match(/\(([^)]+)\)/)?.[1]}</span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Session Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-4 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
          placeholder="Tell your mentor what you'd like to focus on, questions you have, or specific goals for this session..."
          rows={4}
        />
        <p className="mt-2 text-xs font-semibold text-on-surface-variant">Sharing specific goals helps your mentor prepare effectively.</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-headline-md text-2xl font-bold text-on-background">Pick Date & Time</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Choose from {mentor.name}'s available slots.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="font-headline-md text-lg font-bold text-on-surface">
              {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-on-surface-variant">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
              <span key={d} className="py-2">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.map((day) => {
              const isSelected = day.toDateString() === selectedDateObj.toDateString();
              const isPast = day < new Date(new Date().toDateString());
              const isAvailable = hasAvailableSlot(day) && !isPast;
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <button
                  key={dateKey(day)}
                  type="button"
                  onClick={() => isAvailable && setSelectedDateObj(day)}
                  disabled={!isAvailable}
                  className={`relative flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-sm'
                      : isAvailable
                      ? 'cursor-pointer text-on-surface hover:bg-secondary-container/60'
                      : 'cursor-not-allowed text-on-surface-variant/30'
                  }`}
                >
                  {day.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs font-semibold text-on-surface-variant">Unavailable dates are dimmed.</p>
        </div>

        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
          <h4 className="mb-4 font-headline-md text-lg font-bold text-on-surface">
            {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'border border-outline-variant/20 bg-surface-container text-on-surface hover:border-secondary/40 hover:bg-surface-container-high'
                    }`}
                  >
                    {time}
                  </button>
                );
              })
            ) : (
              <div className="flex w-full flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined mb-3 text-3xl text-outline-variant">event_busy</span>
                <p className="text-sm font-semibold text-on-surface-variant">No available slots for this date.</p>
                <p className="text-xs text-on-surface-variant">Choose another date from the calendar.</p>
              </div>
            )}
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Availability is set by the mentor.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-headline-md text-2xl font-bold text-on-background">Review & Pay</h3>
        <p className="mt-1 text-sm text-on-surface-variant">Confirm your session details before payment.</p>
      </div>

      <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h4 className="mb-4 font-headline-md text-lg font-bold text-on-surface">Booking Summary</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-surface-container p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[22px]">{sessionTypes.find((t) => t.value === sessionType)?.icon || 'event'}</span>
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">{sessionType.split('(')[0].trim()}</p>
              <p className="text-xs text-on-surface-variant">{sessionType.match(/\(([^)]+)\)/)?.[1] || '60 min'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-surface-container p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">{selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="text-xs text-on-surface-variant">{selectedTime}</p>
            </div>
          </div>

          {notes && (
            <div className="rounded-xl bg-surface-container p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Your Notes</p>
              <p className="mt-1 text-sm text-on-surface">{notes}</p>
            </div>
          )}
        </div>

        <div className="mt-5 space-y-2 rounded-xl bg-surface-container-high p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">Session Fee</span>
            <span className="font-semibold text-on-surface">${basePrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-variant">Platform Fee (5%)</span>
            <span className="font-semibold text-on-surface">${fee.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-2">
            <span className="font-bold text-on-surface">Total</span>
            <span className="font-headline-md text-2xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsPaymentOpen(true)}
        className="w-full rounded-2xl bg-primary py-4 text-center font-bold text-on-primary shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        Proceed to Payment
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Dashboard
        </button>
        <h1 className="font-headline-lg text-4xl font-bold text-on-background">Book a Session</h1>
        <p className="mt-1 text-on-surface-variant">Schedule your session with {mentor.name}.</p>
      </div>

      {renderMentorSummary()}
      {renderStepIndicator()}

      <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="mt-8 flex items-center justify-between border-t border-outline-variant/10 pt-6">
          <button
            type="button"
            onClick={step === 1 ? () => navigateTo('dashboard') : handlePrevStep}
            className="inline-flex items-center gap-1 rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {step === 1 ? 'Back to Dashboard' : 'Back'}
          </button>

          {step < 3 && (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">Secure Payment</p>
                <h3 className="mt-1 font-headline-md text-2xl font-bold text-on-surface">Complete Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-surface-container p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-surface-variant">Total</span>
                <span className="font-headline-md text-3xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">{mentor.name} · {selectedDateObj.toLocaleDateString()} at {selectedTime}</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Cardholder Name</label>
                <input
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
                  placeholder="Jane Doe"
                  type="text"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Card Number</label>
                <input
                  value={cardNumber}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/\D/g, '');
                    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
                    setCardNumber(formatted.slice(0, 19));
                  }}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 font-mono text-sm tracking-wider text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
                  placeholder="0000 0000 0000 0000"
                  type="text"
                  maxLength={19}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">Expiry Date</label>
                  <input
                    value={expiry}
                    onChange={(event) => {
                      const raw = event.target.value.replace(/\D/g, '');
                      if (raw.length <= 2) setExpiry(raw);
                      else setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
                    }}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 font-mono text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
                    placeholder="MM/YY"
                    type="text"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">CVV</label>
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-3.5 font-mono text-sm tracking-widest text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary/30"
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary-container/50 p-3 text-xs font-semibold text-on-secondary-container">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Your payment is secured with end-to-end encryption.
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-on-primary shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    Pay ${total.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
            <div className="mb-6 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined fill-icon text-3xl">check_circle</span>
              </span>
              <h3 className="mt-4 font-headline-md text-2xl font-bold text-on-surface">Booking Confirmed!</h3>
              <p className="mt-1 text-sm text-on-surface-variant">Your session has been submitted for mentor approval.</p>
            </div>

            <div className="mb-6 space-y-3 rounded-2xl bg-surface-container-low p-5">
              <div className="flex items-center gap-3">
                <img
                  alt={confirmedBooking.mentorName}
                  className="h-12 w-12 rounded-xl object-cover"
                  src={confirmedBooking.mentorAvatar || `https://ui-avatars.com/api/?name=${confirmedBooking.mentorName}`}
                />
                <div>
                  <p className="font-bold text-on-surface">{confirmedBooking.mentorName}</p>
                  <p className="text-xs text-on-surface-variant">Mentor</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/10 pt-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Session</p>
                  <p className="font-semibold text-on-surface">{confirmedBooking.sessionType.split('(')[0].trim()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Date</p>
                  <p className="font-semibold text-on-surface">{confirmedBooking.date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Time</p>
                  <p className="font-semibold text-on-surface">{confirmedBooking.time}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">Total Paid</p>
                  <p className="font-semibold text-primary">${Number(confirmedBooking.total).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <p className="mb-6 text-center text-sm text-on-surface-variant">
              Notifications were sent to you and {confirmedBooking.mentorName}. The session is pending approval.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => { setConfirmedBooking(null); navigateTo('dashboard'); }}
                className="flex-1 rounded-2xl bg-primary py-3.5 font-bold text-on-primary shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => { setConfirmedBooking(null); navigateTo('sessions'); }}
                className="flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container py-3.5 font-bold text-on-surface transition-all hover:bg-surface-container-high"
              >
                View Sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
