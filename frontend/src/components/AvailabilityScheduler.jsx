import { useEffect, useMemo, useState } from 'react';
import api from '../config/api';

const WEEKDAYS = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

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

const convert12hTo24h = (time12) => {
  const [time, period] = time12.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatTimeFrom24h = (t24) => {
  const [hStr, mStr] = t24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(hr12).padStart(2, '0')}:${mStr} ${period}`;
};

const AvailabilityScheduler = ({ mentorId }) => {
  const [availability, setAvailability] = useState({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // 0 = Sunday, 1 = Monday ...
  const [newSlotStart, setNewSlotStart] = useState('09:00 AM');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00 AM');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!mentorId) return;
    const fetchAvailability = async () => {
      try {
        const response = await api.get('/availability', {
          params: { mentorId, limit: 200 }
        });
        const slots = response.data.data || [];
        const mapping = {};
        slots.forEach((slot) => {
          // Only map recurring templates (dayOfWeek is set and date is null/undefined)
          if (slot.slotType === 'recurring' && !slot.date) {
            const key = slot.dayOfWeek;
            if (!mapping[key]) mapping[key] = [];
            const label = `${formatTimeFrom24h(slot.startTime)} – ${formatTimeFrom24h(slot.endTime)}`;
            mapping[key].push({
              _id: slot._id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              label,
              status: slot.status
            });
          }
        });
        setAvailability(mapping);
      } catch (err) {
        console.error("Failed to load availability slots:", err);
      }
    };
    fetchAvailability();
  }, [mentorId]);

  const selectedSlots = useMemo(() => availability[selectedDay] || [], [availability, selectedDay]);

  const validateSlot = (start, end) => {
    const s = parseTime(start);
    const e = parseTime(end);
    if (s >= e) return 'End time must be after start time.';
    for (const slot of selectedSlots) {
      const parts = slot.label.split(' – ');
      if (parts.length === 2) {
        const es = parseTime(parts[0]);
        const ee = parseTime(parts[1]);
        if (s < ee && e > es) return 'This slot overlaps with an existing slot.';
      }
    }
    return null;
  };

  const addSlot = async () => {
    const error = validateSlot(newSlotStart, newSlotEnd);
    if (error) { setStatus(error); return; }

    const s24 = convert12hTo24h(newSlotStart);
    const e24 = convert12hTo24h(newSlotEnd);

    try {
      setStatus('Adding slot...');
      const response = await api.post('/availability', {
        slotType: 'recurring',
        dayOfWeek: selectedDay,
        startTime: s24,
        endTime: e24,
      });
      const newSlotObj = response.data.data;
      const label = `${newSlotStart} – ${newSlotEnd}`;

      setAvailability((prev) => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), {
          _id: newSlotObj._id,
          startTime: s24,
          endTime: e24,
          label,
          status: 'available'
        }].sort((a, b) => parseTime(a.label.split(' – ')[0]) - parseTime(b.label.split(' – ')[0])),
      }));
      setStatus('Slot added successfully.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || 'Failed to add slot.');
    }
  };

  const removeSlot = async (index) => {
    const slot = selectedSlots[index];
    if (!slot?._id) return;

    try {
      setStatus('Removing slot...');
      await api.delete(`/availability/${slot._id}`);
      setAvailability((prev) => {
        const updated = (prev[selectedDay] || []).filter((_, i) => i !== index);
        const next = { ...prev };
        if (updated.length === 0) delete next[selectedDay];
        else next[selectedDay] = updated;
        return next;
      });
      setStatus('Slot removed successfully.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus(err.response?.data?.message || 'Failed to remove slot.');
    }
  };

  const clearAllSlots = async () => {
    try {
      setStatus('Clearing slots...');
      await Promise.all(selectedSlots.map((slot) => api.delete(`/availability/${slot._id}`)));
      setAvailability((prev) => {
        const next = { ...prev };
        delete next[selectedDay];
        return next;
      });
      setStatus('Slots cleared successfully.');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus('Failed to clear some slots.');
    }
  };

  const totalSlotsCount = useMemo(() =>
    Object.values(availability).reduce((sum, slots) => sum + slots.length, 0),
    [availability]
  );

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest overflow-hidden">
      <div className="flex items-center gap-4 border-b border-outline-variant/10 px-6 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
        </span>
        <div className="flex-1 min-w-0">
          <span className="block text-base font-bold text-on-surface">Weekly Availability Schedule</span>
          <span className="block text-xs text-on-surface-variant mt-0.5">
            {totalSlotsCount > 0
              ? `${totalSlotsCount} recurring time slot${totalSlotsCount !== 1 ? 's' : ''} configured across your week`
              : 'No availability set yet. Add time slots for the days of the week.'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,380px]">
          {/* Day list selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-on-surface mb-3">Select Day of Week</h3>
            <div className="flex flex-col gap-1.5">
              {WEEKDAYS.map((day) => {
                const daySlots = availability[day.id] || [];
                const isSelected = selectedDay === day.id;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDay(day.id)}
                    className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-md scale-[1.01]'
                        : 'border border-outline-variant/10 bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold block">{day.label}</span>
                      <span className={`text-xs block mt-0.5 ${isSelected ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                        {daySlots.length > 0
                          ? `${daySlots.length} active slot${daySlots.length !== 1 ? 's' : ''}`
                          : 'No availability set'}
                      </span>
                    </div>
                    {daySlots.length > 0 && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isSelected ? 'bg-on-primary text-primary' : 'bg-primary/10 text-primary'
                      }`}>
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots management panel for the selected day */}
          <div className="space-y-4 border-t border-outline-variant/10 pt-6 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            <div>
              <h4 className="text-sm font-bold text-on-surface">
                {WEEKDAYS.find(d => d.id === selectedDay)?.label} Slots
              </h4>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Configure your general recurring availability for this day.
              </p>
            </div>

            {selectedSlots.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {selectedSlots.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                      {slot.label || slot}
                    </span>
                    <button type="button" onClick={() => removeSlot(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-outline-variant/10 rounded-xl bg-surface-container-low">
                <span className="material-symbols-outlined mb-2 text-2xl text-on-surface/20">schedule</span>
                <p className="text-xs text-on-surface-variant">No slots set for this day</p>
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
                Add Recurring Slot
              </button>
            </div>

            {selectedSlots.length > 0 && (
              <button type="button" onClick={clearAllSlots}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-error-container/50 hover:text-on-error-container"
              >
                <span className="material-symbols-outlined text-[14px]">delete_outline</span>
                Clear all slots for this day
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-outline-variant/10 pt-5">
          {status && (
            <span className="rounded-full bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary-container animate-[fadeIn_0.2s]">
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityScheduler;
