import React, { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, createBooking, getUserById } from '../utils/db';

const Booking = ({ navigateTo, params }) => {
  const user = getCurrentUser();
  const [sessionType, setSessionType] = useState('Career Strategy Deep Dive (60 min)');
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mentor, setMentor] = useState(null);

  // Generate 14 days starting from today
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  useEffect(() => {
    const mentorId = params?.mentorId || 'u1';
    setMentor(getUserById(mentorId));
  }, [params]);

  // Payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  if (!mentor) {
    return <div className="p-8 text-center text-on-surface-variant">Loading booking...</div>;
  }

  const basePrice = mentor.hourlyRate || 120.00;
  const fee = basePrice * 0.05; // 5% fee
  const total = basePrice + fee;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !expiry || !cvv) {
      alert("Please fill in all payment details.");
      return;
    }

    // Mock creating a booking
    if (user) {
      createBooking({
        menteeId: user.id,
        mentorId: mentor.id,
        date: selectedDateObj.toISOString().split('T')[0],
        time: selectedTime,
        sessionType,
        notes,
        amount: total
      });
      setIsModalOpen(false);
      alert("Payment successful! Your session is booked.");
      navigateTo('dashboard');
    } else {
      alert("Please login first to book a session.");
      navigateTo('login');
    }
  };

  const baseTimes = ["09:00 AM", "10:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM"];

  // Filter times: if the selected date is today, only show times that are at least 2 hours from now
  const availableTimes = useMemo(() => {
    const today = new Date();
    const isToday = selectedDateObj.toDateString() === today.toDateString();
    
    if (!isToday) return baseTimes;

    const twoHoursFromNow = new Date(today.getTime() + 2 * 60 * 60 * 1000);
    
    return baseTimes.filter(timeStr => {
      // Parse timeStr (e.g. "09:00 AM") to compare with twoHoursFromNow
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const slotTime = new Date(selectedDateObj);
      slotTime.setHours(hours, minutes, 0, 0);
      
      return slotTime >= twoHoursFromNow;
    });
  }, [selectedDateObj]);

  // If the currently selected time is no longer available, select the first available time or empty
  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    } else if (availableTimes.length === 0) {
      setSelectedTime('');
    }
  }, [availableTimes, selectedTime]);

  // Auto-advance date if today has no available slots
  useEffect(() => {
    const today = new Date();
    if (selectedDateObj.toDateString() === today.toDateString() && availableTimes.length === 0) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDateObj(tomorrow);
    }
  }, [selectedDateObj, availableTimes]);

  const currentMonthYear = selectedDateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="font-headline-lg text-4xl font-bold text-on-background mb-2">Complete Your Booking</h1>
        <p className="text-on-surface-variant">Schedule your session and prepare for growth.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Session Type Section */}
          <section className="bg-surface-container p-6 rounded-xl natural-depth border border-outline/10">
            <label className="block font-headline-md text-2xl font-bold mb-3">Select Session Type</label>
            <select 
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full p-4 rounded-lg bg-surface-variant border-none focus:ring-2 focus:ring-secondary text-on-surface font-medium outline-none cursor-pointer"
            >
              <option>Career Strategy Deep Dive (60 min)</option>
              <option>Technical Portfolio Review (45 min)</option>
              <option>Leadership Coaching (60 min)</option>
              <option>Mock Interview & Feedback (90 min)</option>
            </select>
          </section>

          {/* Calendar & Times Section */}
          <section className="bg-surface-container p-6 rounded-xl natural-depth border border-outline/10">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Mini Calendar */}
              <div className="flex-1">
                <label className="block font-headline-md text-2xl font-bold mb-3">Date</label>
                <div className="bg-background rounded-lg p-4 border border-outline-variant/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-sm">{currentMonthYear}</span>
                    <div className="flex gap-2">
                      <button className="material-symbols-outlined text-sm hover:bg-surface-variant p-1 rounded-full transition-colors">chevron_left</button>
                      <button className="material-symbols-outlined text-sm hover:bg-surface-variant p-1 rounded-full transition-colors">chevron_right</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold mb-2 opacity-60">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Add empty slots for days of week before the first upcoming date */}
                    {Array.from({ length: upcomingDates[0].getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2 text-xs"></div>
                    ))}
                    
                    {upcomingDates.map((d, i) => {
                      const isSelected = d.toDateString() === selectedDateObj.toDateString();
                      return (
                        <div 
                          key={i}
                          onClick={() => setSelectedDateObj(d)}
                          className={`p-2 text-xs rounded-full flex items-center justify-center h-8 w-8 mx-auto cursor-pointer hover:bg-secondary-container transition-colors
                            ${isSelected ? 'bg-primary text-on-primary font-bold hover:bg-primary' : ''}
                          `}
                        >
                          {d.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Chips */}
              <div className="flex-1">
                <label className="block font-headline-md text-2xl font-bold mb-3">Available Times</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableTimes.length > 0 ? (
                    availableTimes.map(time => (
                      <button 
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 text-sm rounded-lg transition-all
                          ${selectedTime === time 
                            ? 'bg-primary text-on-primary font-bold shadow-md transform scale-105' 
                            : 'bg-surface-variant text-on-background hover:bg-secondary-container'
                          }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <p className="col-span-full text-sm font-semibold text-on-surface-variant p-2">
                      No more available slots for today.
                    </p>
                  )}
                </div>
                <p className="mt-4 text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">info</span> All times shown in your local timezone (GMT-5)
                </p>
              </div>
            </div>
          </section>

          {/* Session Notes Section */}
          <section className="bg-surface-container p-6 rounded-xl natural-depth border border-outline/10">
            <label className="block font-headline-md text-2xl font-bold mb-3">Session Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 rounded-lg bg-surface-variant border border-outline-variant/30 focus:border-secondary focus:ring-2 focus:ring-secondary/20 text-on-surface resize-none outline-none transition-all" 
              placeholder="Tell your mentor what you'd like to focus on..." 
              rows="4"
            ></textarea>
            <p className="mt-2 text-sm font-semibold text-on-surface-variant">Sharing specific goals helps your mentor prepare effectively.</p>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <div className="bg-surface-container p-6 rounded-xl natural-depth border border-outline/20">
              <h2 className="font-headline-md text-2xl font-bold mb-6 pb-2 border-b border-outline-variant/30 text-on-surface">Session Summary</h2>
              
              {/* Mentor Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary-fixed">
                  <img alt={mentor.name} className="w-full h-full object-cover" src={mentor.avatar || `https://ui-avatars.com/api/?name=${mentor.name}`} />
                </div>
                <div>
                  <p className="font-bold text-on-background">{mentor.name}</p>
                  <p className="text-sm font-semibold text-on-surface-variant">{mentor.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-primary">
                    <span className="material-symbols-outlined text-[16px] fill-icon">star</span>
                    <span className="text-xs font-bold text-on-surface">{mentor.rating} ({mentor.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-8 text-sm font-semibold">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>{sessionType.split('(')[0].trim()}</span>
                  <span className="font-bold text-on-surface">${basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>Platform Processing Fee (5%)</span>
                  <span className="font-bold text-on-surface">${fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
                  <span className="font-headline-md text-2xl font-bold text-on-surface">Total</span>
                  <span className="font-headline-md text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Proceed Button */}
              <button 
                onClick={() => {
                  if (!selectedTime) {
                    alert("Please select an available time slot first.");
                    return;
                  }
                  setIsModalOpen(true);
                }}
                disabled={!selectedTime}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-md transition-all
                  ${selectedTime 
                    ? 'bg-primary text-on-primary hover:bg-primary-container hover:shadow-lg cursor-pointer' 
                    : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined">lock</span>
                {selectedTime ? 'Proceed to Payment' : 'Select a Time Slot'}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
                <span className="material-symbols-outlined text-2xl">payments</span>
                <span className="material-symbols-outlined text-2xl">credit_card</span>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-secondary/20 bg-secondary-container/30">
              <p className="text-sm italic font-semibold text-on-secondary-container leading-relaxed">
                "Marcus helped me navigate a major career pivot last year. His insights on strategy are truly transformative." 
                <span className="block mt-2 font-bold not-italic text-xs uppercase tracking-wider">— Sarah J., Mentee</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal (Stripe Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#CFBB99] w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative border border-white/20">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline-md text-2xl font-bold text-primary">Secure Payment</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="material-symbols-outlined text-primary hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  close
                </button>
              </div>
              
              <form className="space-y-5" onSubmit={handlePaymentSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Cardholder Name</label>
                  <input 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full p-3.5 rounded-lg bg-surface-bright border border-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface outline-none transition-all" 
                    placeholder="Jane Doe" 
                    type="text"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Card Number</label>
                  <div className="relative">
                    <input 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-3.5 rounded-lg bg-surface-bright border border-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface outline-none transition-all tracking-wider font-mono text-sm" 
                      placeholder="0000 0000 0000 0000" 
                      type="text"
                      maxLength="19"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">credit_card</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider">Expiry Date</label>
                    <input 
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full p-3.5 rounded-lg bg-surface-bright border border-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface outline-none transition-all font-mono text-sm" 
                      placeholder="MM/YY" 
                      type="text"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider">CVV</label>
                    <input 
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full p-3.5 rounded-lg bg-surface-bright border border-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface outline-none transition-all font-mono text-sm tracking-widest" 
                      placeholder="***" 
                      type="password"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-8">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold text-lg hover:bg-primary-container transition-colors shadow-xl"
                  >
                    Pay ${total.toFixed(2)}
                  </button>
                </div>
              </form>
              
              <p className="text-center text-xs mt-6 text-primary/80 font-semibold leading-relaxed">
                Your payment information is encrypted and processed securely. By clicking "Pay", you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
