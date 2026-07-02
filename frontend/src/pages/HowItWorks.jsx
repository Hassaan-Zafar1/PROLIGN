import { useState, useEffect, useRef } from 'react';

const journeySteps = [
  { icon: 'person_add', title: 'Create Your Profile', description: 'Set up your profile and tell us about your goals or expertise.' },
  { icon: 'search', title: 'Find Your Match', description: 'Browse mentors or receive personalized recommendations.' },
  { icon: 'calendar_month', title: 'Book a Session', description: 'Schedule a session based on mentor availability.' },
  { icon: 'trending_up', title: 'Learn & Grow', description: 'Attend sessions, gain insights, and track your development.' },
];

const menteePath = ['Create Profile', 'Define Goals', 'Find Mentors', 'Book Sessions', 'Learn & Grow'];
const mentorPath = ['Create Profile', 'Add Expertise', 'Set Availability', 'Accept Bookings', 'Guide Learners'];

const features = [
  { icon: 'psychology', title: 'Smart Mentor Discovery', description: 'Find mentors based on expertise and goals.' },
  { icon: 'calendar_month', title: 'Flexible Scheduling', description: 'Book sessions according to availability.' },
  { icon: 'lock', title: 'Secure Communication', description: 'Safe and professional interactions.' },
  { icon: 'rocket_launch', title: 'Career Growth', description: 'Gain guidance from experienced professionals.' },
];

const stats = [
  { icon: 'groups', value: 500, suffix: '+', label: 'Mentors Available' },
  { icon: 'event_available', value: 10000, suffix: '+', label: 'Sessions Conducted' },
  { icon: 'thumb_up', value: 95, suffix: '%', label: 'Success Rate' },
  { icon: 'domain', value: 50, suffix: '+', label: 'Industries Covered' },
];

const faqs = [
  { q: 'How do I find a mentor?', a: 'Browse our mentor directory, filter by expertise and availability, or let our AI matching engine recommend the best mentors for your goals.' },
  { q: 'How do bookings work?', a: 'Select a mentor, pick an available date and time, confirm your session type, and complete the booking. You will receive a confirmation with meeting details.' },
  { q: 'How are mentors verified?', a: 'Every mentor undergoes a thorough verification process including identity checks, credential validation, and experience verification before being approved on the platform.' },
  { q: 'Can I become a mentor?', a: 'Absolutely. If you have professional expertise and want to help others grow, apply to become a mentor. Our team will review your application and get you set up.' },
  { q: 'Is my information secure?', a: 'Yes. We use end-to-end encryption, secure payment processing, and strict data privacy policies to protect all your personal and professional information.' },
];

const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref };
};

export default function HowItWorks({ navigateTo, onHelpClick }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-background text-on-surface">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-secondary/10 border-b border-outline-variant/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary rounded-full blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-xs font-bold text-on-secondary-container mb-5 border border-outline-variant/10">
                <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                <span className="font-bold border-r border-on-secondary-container/20 pr-2">ProLign</span>
                How It Works
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary leading-tight mb-4">
                Your Mentorship Journey<br />in Four Simple Steps
              </h1>
              <p className="text-on-surface-variant text-base lg:text-lg leading-relaxed max-w-xl mb-8">
                Connect, learn, grow, and achieve your goals through meaningful mentorship relationships.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigateTo('find-mentors')}
                  className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                  Find a Mentor
                </button>
                <button
                  onClick={() => navigateTo('mentorRegistration')}
                  className="inline-flex items-center gap-2 bg-surface border border-outline-variant/30 text-on-surface px-6 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-lg">school</span>
                  Become a Mentor
                </button>
              </div>
            </div>
            <div className="hidden lg:flex flex-shrink-0 w-80 h-80 items-center justify-center">
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl -rotate-3" />
                <div className="absolute inset-0 bg-surface rounded-3xl shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-primary text-7xl mb-4">school</span>
                    <p className="font-bold text-primary text-lg">ProLign</p>
                    <p className="text-on-surface-variant text-sm">Mentorship Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">Your Journey in Four Steps</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">Getting started is simple. Here is how it all comes together.</p>
        </div>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden md:block relative mb-8">
          <div className="absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary/20 via-secondary/40 to-primary/20" />
          <div className="grid grid-cols-4 gap-6 relative z-10">
            {journeySteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-surface border border-outline-variant/10 shadow-md flex items-center justify-center mb-4 group-hover:scale-105 transition-all">
                  <span className="material-symbols-outlined text-primary text-3xl">{step.icon}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm mb-3 -mt-10 relative z-20 border-4 border-surface">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-on-surface text-sm lg:text-base mb-1">{step.title}</h3>
                <p className="text-on-surface-variant text-xs lg:text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Timeline */}
        <div className="md:hidden space-y-6 relative pl-8">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-secondary/30" />
          {journeySteps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className="absolute -left-8 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs z-10 border-2 border-surface">
                {idx + 1}
              </div>
              <div className="bg-surface rounded-xl p-4 border border-outline-variant/10 shadow-sm flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary text-xl">{step.icon}</span>
                  <h3 className="font-bold text-on-surface text-sm">{step.title}</h3>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dedicated Paths Section */}
      <section className="bg-surface-container-low border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">Choose Your Path</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Whether you are looking for guidance or want to give back, we have a path for you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* For Mentees */}
            <div className="group relative bg-surface rounded-2xl p-6 lg:p-8 border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-2xl">school</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-4">For Mentees</h3>
                <ul className="space-y-3 mb-6">
                  {menteePath.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigateTo('menteeRegistration')}
                  className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-sm"
                >
                  Get Started as Mentee
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-secondary/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>

            {/* For Mentors */}
            <div className="group relative bg-surface rounded-2xl p-6 lg:p-8 border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-secondary/20 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-secondary text-2xl">workspace_premium</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-4">For Mentors</h3>
                <ul className="space-y-3 mb-6">
                  {mentorPath.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigateTo('mentorRegistration')}
                  className="w-full py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-sm"
                >
                  Become a Mentor
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary/40 to-primary/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/50 px-4 py-2 text-xs font-bold text-on-primary-container mb-4 border border-primary/10">
            <span className="material-symbols-outlined text-[16px]">school</span>
            ProLign Platform
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">Platform Features</h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">Everything you need for a successful mentorship experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="group relative bg-surface rounded-2xl p-6 border border-outline-variant/10 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300 cursor-default overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-container to-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="material-symbols-outlined text-primary text-2xl">{f.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface text-sm mb-1.5">{f.title}</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">{f.description}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-secondary/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>
      </section>

      {/* Success Statistics Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-primary mb-3">Trusted by Thousands</h2>
            <p className="text-on-primary/70 max-w-xl mx-auto">Our growing community of mentors and mentees is achieving real results.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const { count, ref } = useCountUp(stat.value, 2000);
              return (
                <div key={idx} ref={ref} className="text-center bg-on-primary/10 rounded-2xl p-5 border border-on-primary/10">
                  <span className="material-symbols-outlined text-on-primary/80 text-2xl mb-2">{stat.icon}</span>
                  <p className="text-3xl lg:text-4xl font-bold text-on-primary">{count}{stat.suffix}</p>
                  <p className="text-on-primary/60 text-xs mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">Frequently Asked Questions</h2>
          <p className="text-on-surface-variant">Everything you need to know about the platform.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-xl border border-outline-variant/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-container-low transition-colors"
                aria-expanded={openFaq === idx}
              >
                <span className="font-semibold text-sm text-on-surface pr-4">{faq.q}</span>
                <span className={`material-symbols-outlined text-lg text-on-surface-variant transition-transform duration-200 flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="bg-surface-container-low border-y border-outline-variant/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="bg-surface rounded-2xl p-8 lg:p-12 border border-outline-variant/10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-secondary text-3xl">smart_toy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-3">Need Help Getting Started?</h2>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-6">
              Our AI Assistant can guide you through the entire mentorship journey.
            </p>
            <button
              onClick={onHelpClick}
              className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              Chat with AI Assistant
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-on-primary rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-on-primary rounded-full blur-[60px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-on-primary mb-4">
              Ready to Start Your Growth Journey?
            </h2>
            <p className="text-on-primary/70 text-sm sm:text-base max-w-lg mx-auto mb-8">
              Join thousands of professionals who have accelerated their careers with ProLign.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigateTo('find-mentors')}
                className="inline-flex items-center gap-2 bg-on-primary text-primary px-6 py-3 rounded-xl font-bold text-sm hover:bg-on-primary/90 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-lg">search</span>
                Find a Mentor
              </button>
              <button
                onClick={() => navigateTo('mentorRegistration')}
                className="inline-flex items-center gap-2 bg-on-primary/15 text-on-primary border border-on-primary/30 px-6 py-3 rounded-xl font-bold text-sm hover:bg-on-primary/25 transition-all"
              >
                <span className="material-symbols-outlined text-lg">school</span>
                Become a Mentor
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
