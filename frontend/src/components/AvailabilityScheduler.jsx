import { useEffect, useMemo, useState } from 'react';
import { getMentorAvailability, saveMentorAvailability } from '../utils/db';

const dateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hr12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  TIME_OPTIONS.push(`${String(hr12).padStart(2, '0')}:00 ${period}`);
  if (h < 22) TIME_OPTIONS.push(`${String(hr12).padStart(2, '0')}:30 ${period}`);
}

const parseTime = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hr12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(hr12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const AvailabilityScheduler = ({ mentorId }) => {
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [newSlotStart, setNewSlotStart] = useState('09:00 AM');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00 AM');
  const [status, setStatus] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (mentorId) {
      const saved = getMentorAvailability(mentorId);
      setAvailability(saved || {});
    }
  }, [mentorId]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const end = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const days = [];
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i));
    }
    return days;
  }, [visibleMonth]);

  const selectedDateStr = selectedDate ? dateKey(selectedDate) : null;
  const selectedSlots = selectedDateStr ? (availability[selectedDateStr] || []) : [];

  const isPastDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const goNextMonth = () => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1));
  const goPrevMonth = () => {
    const prev = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setVisibleMonth(prev);
    }
  };

  const hasSlotOnDate = (date) => {
    const key = dateKey(date);
    return (availability[key] || []).length > 0;
  };

  const validateSlot = (start, end, excludeIndex = -1) => {
    const s = parseTime(start);
    const e = parseTime(end);
    if (s >= e) return 'End time must be after start time.';
    const existing = selectedSlots.filter((_, i) => i !== excludeIndex);
    for (const slot of existing) {
      const parts = slot.split(' – ');
      if (parts.length === 2) {
        const es = parseTime(parts[0]);
        const ee = parseTime(parts[1]);
        if (s < ee && e > es) return 'This slot overlaps with an existing slot.';
      }
    }
    return null;
  };

  const addSlot = () => {
    if (!selectedDateStr) return;
    const slotLabel = `${newSlotStart} – ${newSlotEnd}`;
    const error = validateSlot(newSlotStart, newSlotEnd);
    if (error) { setStatus(error); return; }
    if (selectedSlots.includes(slotLabel)) { setStatus('This slot already exists.'); return; }
    setAvailability((prev) => ({
      ...prev,
      [selectedDateStr]: [...(prev[selectedDateStr] || []), slotLabel].sort((a, b) => parseTime(a.split(' – ')[0]) - parseTime(b.split(' – ')[0])),
    }));
    setHasChanges(true);
    setStatus('');
  };

  const removeSlot = (index) => {
    if (!selectedDateStr) return;
    setAvailability((prev) => {
      const updated = (prev[selectedDateStr] || []).filter((_, i) => i !== index);
      const next = { ...prev };
      if (updated.length === 0) delete next[selectedDateStr];
      else next[selectedDateStr] = updated;
      return next;
    });
    setHasChanges(true);
  };

  const clearAllSlots = () => {
    if (!selectedDateStr) return;
    setAvailability((prev) => {
      const next = { ...prev };
      delete next[selectedDateStr];
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!mentorId) return;
    saveMentorAvailability(mentorId, availability);
    setHasChanges(false);
    setStatus('Availability saved successfully.');
    window.setTimeout(() => setStatus(''), 3500);
  };

  const totalSlotsCount = useMemo(() =>
    Object.values(availability).reduce((sum, slots) => sum + slots.length, 0),
    [availability]
  );

  const firstDayOffset = useMemo(() => {
    const d = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    return d.getDay();
  }, [visibleMonth]);

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
      <div className="flex items-center gap-4 border-b border-outline-variant/10 px-6 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
        </span>
        <div className="flex-1 min-w-0">
          <span className="block text-base font-bold text-on-surface">Availability Schedule</span>
          <span className="block text-xs text-on-surface-variant mt-0.5">
            {totalSlotsCount > 0
              ? `${totalSlotsCount} time slot${totalSlotsCount !== 1 ? 's' : ''} across ${Object.keys(availability).length} date${Object.keys(availability).length !== 1 ? 's' : ''}`
              : 'No availability set yet. Select dates and add time slots.'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,380px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">
                {MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <button type="button" onClick={goPrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                  disabled={new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1) <= new Date(today.getFullYear(), today.getMonth(), 1)}
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button type="button" onClick={goNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px text-center">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-[11px] font-bold text-on-surface-variant uppercase">{d}</div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} />)}
              {calendarDays.map((day) => {
                const key = dateKey(day);
                const past = isPastDate(day);
                const selected = selectedDateStr === key;
                const hasSlots = hasSlotOnDate(day);
                const isToday = day.toDateString() === today.toDateString();

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={past}
                    onClick={() => setSelectedDate(day)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                      past
                        ? 'cursor-not-allowed text-on-surface/30'
                        : selected
                          ? 'bg-primary text-on-primary shadow-md'
                          : hasSlots
                            ? 'bg-secondary-container/50 text-on-secondary-container hover:bg-secondary-container'
                            : 'text-on-surface hover:bg-surface-container'
                    } ${isToday && !selected ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    {day.getDate()}
                    {hasSlots && !past && !selected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-secondary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 border-t border-outline-variant/10 pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            {selectedDate ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h4>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {selectedSlots.length > 0 ? `${selectedSlots.length} slot${selectedSlots.length !== 1 ? 's' : ''} configured` : 'No slots for this date'}
                  </p>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="space-y-2">
                    {selectedSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                          {slot}
                        </span>
                        <button type="button" onClick={() => removeSlot(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-4 space-y-3">
                  <p className="text-xs font-bold text-on-surface-variant uppercase">Add Time Slot</p>
                  <div className="grid grid-cols-[1fr,auto,1fr] items-end gap-2">
                    <label className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant">Start</span>
                      <select value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)}
                        className="h-10 w-full rounded-lg border border-outline-variant/25 bg-surface px-3 text-xs text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                    <span className="mb-2.5 text-on-surface-variant">–</span>
                    <label className="space-y-1">
                      <span className="text-[11px] font-semibold text-on-surface-variant">End</span>
                      <select value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="h-10 w-full rounded-lg border border-outline-variant/25 bg-surface px-3 text-xs text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20"
                      >
                        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                  <button type="button" onClick={addSlot}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/30 py-2.5 text-xs font-bold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Add Slot
                  </button>
                </div>

                {selectedSlots.length > 0 && (
                  <button type="button" onClick={clearAllSlots}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-error-container/50 hover:text-on-error-container"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete_outline</span>
                    Clear all slots for this date
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined mb-3 text-4xl text-on-surface/20">calendar_today</span>
                <p className="text-sm text-on-surface-variant">Select a date to manage availability</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-outline-variant/10 pt-5">
          {status && (
            <span className="rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container animate-[fadeIn_0.2s]">
              {status}
            </span>
          )}
          <button type="button" onClick={handleSave} disabled={!hasChanges}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Save Availability
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityScheduler;
