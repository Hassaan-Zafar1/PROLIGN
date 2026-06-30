import { useEffect, useMemo, useState, useCallback } from 'react';
import { createBooking, getCurrentUser, getSessions, getUserById, getUsersByRole } from '../utils/db';
import { Button, Card, Modal, Input, Textarea, Avatar, EmptyState } from '../components/common';

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const expandTimeRanges = (slots) => {
  const expanded = [];
  (slots || []).forEach((slot) => {
    if (slot.includes('\u2013')) {
      const [startStr, endStr] = slot.split(' \u2013 ').map((s) => s.trim());
      const toMin = (t) => {
        const [time, period] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      const fromMin = toMin(startStr);
      const toMinutes = toMin(endStr);
      for (let m = fromMin; m < toMinutes; m += 60) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        expanded.push(`${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`);
      }
    } else {
      expanded.push(slot);
    }
  });
  return [...new Set(expanded)];
};

export default function Booking({ navigateTo, params }) {
  const user = getCurrentUser();
  const getToday = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [selectedDateObj, setSelectedDateObj] = useState(getToday);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [showTimeAlert, setShowTimeAlert] = useState(false);

  useEffect(() => {
    const mentorId = params?.mentorId;
    const selectedMentor = getUserById(mentorId) || getUsersByRole('mentor').find((item) => item.status === 'approved');
    setMentor(selectedMentor || null);
  }, [params]);

  const rawAvailabilitySlots = mentor?.availabilitySlots || {};
  const availabilitySlots = useMemo(() => {
    const expanded = {};
    Object.entries(rawAvailabilitySlots).forEach(([date, slots]) => {
      expanded[date] = expandTimeRanges(slots);
    });
    return expanded;
  }, [rawAvailabilitySlots]);
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

  const isPastDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < getToday();
  };

  const hasAvailableSlot = (date) => {
    if (isPastDate(date)) return false;
    const key = dateKey(date);
    const slots = availabilitySlots[key] || [];
    const unavailable = bookedSlots[key] || [];
    return slots.some((time) => !unavailable.includes(time));
  };

  const canGoPrevMonth = () => {
    const t = getToday();
    const prev = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    return prev >= new Date(t.getFullYear(), t.getMonth(), 1);
  };

  const goNextMonth = () => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1));
  const goPrevMonth = () => {
    if (canGoPrevMonth()) {
      setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1));
    }
  };

  const availableTimes = useMemo(() => {
    const key = dateKey(selectedDateObj);
    const rawTimes = availabilitySlots[key] || [];
    const alreadyBooked = bookedSlots[key] || [];
    const now = new Date();
    const isToday = selectedDateObj.toDateString() === now.toDateString();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
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
    const notes = sessionTopic ? `${sessionTopic}${sessionNotes ? '\n\n' + sessionNotes : ''}` : sessionNotes;
    setTimeout(() => {
      const booking = createBooking({
        menteeId: user.id,
        mentorId: mentor.id,
        date: dateKey(selectedDateObj),
        time: selectedTime,
        sessionType: 'Mentorship Session',
        notes,
        amount: total,
      });
      setIsProcessing(false);
      setConfirmedBooking({
        ...booking,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        mentorTitle: mentor.title || mentor.industry,
        date: selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: selectedTime,
        sessionType: 'Mentorship Session',
        total,
      });
    }, 800);
  };

  if (!mentor) {
    return (
      <EmptyState
        icon="person_search"
        title="Choose a mentor first"
        description="Select a mentor from Discovery before booking a session."
        actionLabel="Browse Mentors"
        onAction={() => navigateTo('find-mentors')}
      />
    );
  }

  const renderMentorCard = () => (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar src={mentor.avatar} name={mentor.name} size="lg" className="rounded-xl ring-0!" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-on-surface truncate">{mentor.name}</h3>
          <p className="text-xs text-on-surface-variant truncate">{mentor.title || mentor.industry}</p>
          <div className="flex items-center gap-2 mt-1">
            {mentor.rating && (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-[12px] text-warning">star</span>
                {mentor.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
        <div className="text-center">
          <p className="text-lg font-bold text-primary">${basePrice}</p>
          <p className="text-[10px] text-on-surface-variant">per session</p>
        </div>
        <div className="h-8 w-px bg-outline-variant/20" />
        <div className="text-center">
          <p className="text-lg font-bold text-on-surface">60</p>
          <p className="text-[10px] text-on-surface-variant">minutes</p>
        </div>
      </div>
    </div>
  );

  const renderBookingSummary = () => (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4 space-y-3">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Booking Summary</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Mentor</span>
          <span className="font-semibold text-on-surface truncate ml-4 text-right">{mentor.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Date</span>
          <span className="font-semibold text-on-surface">{selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Time</span>
          <span className="font-semibold text-on-surface">{selectedTime || '\u2014'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Duration</span>
          <span className="font-semibold text-on-surface">60 min</span>
        </div>
      </div>
      <div className="border-t border-outline-variant/10 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Session Fee</span>
          <span className="font-semibold text-on-surface">${basePrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Platform Fee</span>
          <span className="font-semibold text-on-surface">${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-outline-variant/10 pt-2">
          <span className="font-bold text-on-surface">Total</span>
          <span className="font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={!canGoPrevMonth()}
          className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <h4 className="text-sm font-bold text-on-surface">
          {monthLabels[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
        </h4>
        <button
          type="button"
          onClick={goNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-on-surface-variant mb-1">
        {dayLabels.map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {calendarDays.map((day) => {
          const isSelected = day.toDateString() === selectedDateObj.toDateString();
          const isPast = isPastDate(day);
          const isAvailable = hasAvailableSlot(day) && !isPast;
          const isToday = day.toDateString() === getToday().toDateString();
          return (
            <button
              key={dateKey(day)}
              type="button"
              onClick={() => isAvailable && setSelectedDateObj(day)}
              disabled={!isAvailable}
              className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                  : isAvailable
                  ? 'cursor-pointer text-on-surface hover:bg-primary/10 hover:text-primary'
                  : isPast
                  ? 'cursor-not-allowed text-on-surface-variant/25'
                  : 'cursor-not-allowed text-on-surface-variant/35'
              }`}
            >
              {day.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTimeSlots = () => (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4">
      <div className="mb-3">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Available Times</h4>
        <p className="mt-1 text-xs text-on-surface-variant">
          {selectedDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {availableTimes.length > 0 && ` \u00b7 ${availableTimes.length} slot${availableTimes.length > 1 ? 's' : ''}`}
        </p>
      </div>
      {availableTimes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {availableTimes.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary border border-outline-variant/10'
                }`}
              >
                {time}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2.5 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]">event_busy</span>
          <span>No available slots for this date. Choose another date.</span>
        </div>
      )}
    </div>
  );

  const renderSessionDetails = () => (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface p-4 space-y-3">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Session Details</h4>
      <div>
        <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Topic</label>
        <input
          value={sessionTopic}
          onChange={(e) => setSessionTopic(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="e.g. Career guidance, Resume review"
          type="text"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Goals <span className="text-on-surface-variant/50 font-normal">(Optional)</span></label>
        <textarea
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="What would you like to discuss?"
          rows={3}
        />
        {sessionNotes.length > 0 && (
          <p className="mt-0.5 text-[10px] text-on-surface-variant/50 text-right">{sessionNotes.length}/500</p>
        )}
      </div>
    </div>
  );

  const renderPaymentForm = () => (
    <form onSubmit={handlePaymentSubmit} className="rounded-2xl border border-outline-variant/10 bg-surface p-4 space-y-3">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payment</h4>
      <div>
        <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Cardholder Name</label>
        <input
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Full name on card"
          type="text"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Card Number</label>
        <div className="relative">
          <input
            value={cardNumber}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setCardNumber(raw.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19));
            }}
            className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 font-mono text-sm tracking-wider text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="0000 0000 0000 0000"
            type="text"
            maxLength={19}
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-xl">credit_card</span>
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">Expiry</label>
          <input
            value={expiry}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              if (raw.length <= 2) setExpiry(raw);
              else setExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
            }}
            className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 font-mono text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="MM/YY"
            type="text"
            maxLength={5}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-on-surface-variant">CVV</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 font-mono text-sm tracking-widest text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="***"
            type="password"
            maxLength={4}
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-success-container/30 px-3 py-2 text-[10px] font-semibold text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px] text-success">lock</span>
        <span>Secured with end-to-end encryption.</span>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => setPaymentStep(false)}>Back</Button>
        <Button variant="primary" size="md" className="flex-1" type="submit" disabled={isProcessing} loading={isProcessing} icon={isProcessing ? undefined : 'lock'}>
          {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-6">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-on-background">Book a Session</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="lg:w-[280px] flex-shrink-0 space-y-3 lg:sticky lg:top-4 lg:self-start">
            {renderMentorCard()}
            {renderBookingSummary()}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {!paymentStep ? (
              <>
                {renderCalendar()}
                {renderTimeSlots()}
              </>
            ) : (
              <>
                <div className="lg:hidden">
                  {renderBookingSummary()}
                </div>
                {renderPaymentForm()}
              </>
            )}
          </div>

          <div className="lg:w-[300px] flex-shrink-0 space-y-3 lg:sticky lg:top-4 lg:self-start">
            {renderSessionDetails()}
            {!paymentStep && (
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="lg" className="w-full"
                  onClick={() => { if (!selectedTime) { setShowTimeAlert(true); return; } setPaymentStep(true); }}
                >
                  Continue to Payment
                </Button>
                <Button variant="secondary" size="lg" className="w-full"
                  onClick={() => navigateTo('dashboard')}
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showTimeAlert} onClose={() => setShowTimeAlert(false)} className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </span>
            <h3 className="mt-4 text-xl font-bold text-on-surface">Select a Time Slot</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Please choose an available time for your session on{' '}
              <strong>{selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>.
            </p>
          </div>

          {availableTimes.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2 justify-center">
              {availableTimes.map((time) => (
                <button key={time} type="button" onClick={() => { setSelectedTime(time); setShowTimeAlert(false); }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/15 bg-surface-container-high px-4 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">event_busy</span>
              No available slots for this date. Please choose another date.
            </div>
          )}

          <Button variant="secondary" size="lg" className="w-full" onClick={() => setShowTimeAlert(false)}>Close</Button>
        </div>
      </Modal>

      <Modal open={!!confirmedBooking} onClose={() => setConfirmedBooking(null)} className="w-full max-w-md">
        <div className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-container animate-[successPop_0.4s_ease-out]">
              <span className="material-symbols-outlined fill-icon text-4xl text-on-success-container">check_circle</span>
            </div>
            <h3 className="mt-5 text-2xl font-bold text-on-surface">Booking Confirmed!</h3>
            <p className="mt-1.5 text-sm text-on-surface-variant">Your session has been submitted for mentor approval.</p>
          </div>
          <div className="mb-6 rounded-2xl bg-surface-container-low p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar src={confirmedBooking?.mentorAvatar} name={confirmedBooking?.mentorName} size="md" className="ring-0!" />
              <div>
                <p className="font-bold text-on-surface">{confirmedBooking?.mentorName}</p>
                <p className="text-xs text-on-surface-variant">{confirmedBooking?.mentorTitle}</p>
              </div>
            </div>
            <div className="border-t border-outline-variant/10 pt-3 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-on-surface-variant">Date</p><p className="font-semibold text-on-surface">{confirmedBooking?.date}</p></div>
              <div><p className="text-xs text-on-surface-variant">Time</p><p className="font-semibold text-on-surface">{confirmedBooking?.time}</p></div>
              <div><p className="text-xs text-on-surface-variant">Session</p><p className="font-semibold text-on-surface">{confirmedBooking?.sessionType}</p></div>
              <div><p className="text-xs text-on-surface-variant">Total Paid</p><p className="font-semibold text-primary">${Number(confirmedBooking?.total).toFixed(2)}</p></div>
            </div>
          </div>
          <p className="mb-6 text-center text-xs text-on-surface-variant">Notifications were sent to you and {confirmedBooking?.mentorName}. The session is pending approval.</p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full" onClick={() => { setConfirmedBooking(null); navigateTo('sessions'); }}>View My Sessions</Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => { setConfirmedBooking(null); navigateTo('dashboard'); }}>Back to Dashboard</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
