import { useState, useEffect, useRef } from 'react';
import { getTestimonials } from '../utils/db';

const TestimonialCarousel = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const totalSlides = testimonials.length;

  const goTo = (index) => setCurrentIndex((index + totalSlides) % totalSlides);
  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, totalSlides]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((t) => (
            <div key={t.id} className="min-w-full flex justify-center px-4">
              <div className="w-full max-w-2xl bg-gradient-to-b from-surface to-surface-variant/40 rounded-2xl border border-outline-variant/15 shadow-xl flex flex-col relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                {/* Top decorative band */}
                <div className="h-2 w-full bg-gradient-to-r from-secondary via-primary to-secondary shrink-0" />
                {/* Main content */}
                <div className="p-8 md:p-10 flex flex-col items-center text-center relative">
                  {/* Large subtle quote mark */}
                  <span className="material-symbols-outlined text-secondary/8 absolute top-6 right-8 scale-[3.5] md:scale-[4.5] select-none leading-none">format_quote</span>
                  {/* Avatar with gradient ring */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary to-primary p-[3px]">
                      <div className="w-full h-full rounded-full bg-surface" />
                    </div>
                    <img
                      alt={t.name}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-surface relative z-10"
                      src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}`}
                    />
                  </div>
                  {/* Name & role */}
                  <h4 className="font-headline-md text-lg font-bold text-primary">{t.name}</h4>
                  <p className="font-caption text-sm text-on-surface-variant mb-4">{t.role} at {t.company}</p>
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-secondary text-xl fill-icon">star</span>
                    ))}
                  </div>
                  {/* Quote with left accent bar */}
                  <div className="relative pl-5 border-l-[3px] border-secondary/40 text-left w-full">
                    <p className="font-body-md text-on-surface-variant leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                </div>
                {/* Bottom gradient fade */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-secondary/20 to-transparent shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-container-low shadow-lg border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors z-10"
            aria-label="Previous testimonial"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-container-low shadow-lg border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors z-10"
            aria-label="Next testimonial"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-8 bg-gradient-to-r from-secondary to-primary'
                  : 'w-2 bg-outline-variant/50 hover:bg-outline-variant'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LandingPage = ({ navigateTo }) => {
  const [testimonials, setTestimonials] = useState([]);
  const mainRef = useRef(null);
  const journeyRef = useRef(null);
  const [visibleSteps, setVisibleSteps] = useState(new Set());

  useEffect(() => {
    setTestimonials(getTestimonials().filter(t => t.published));
  }, []);

  useEffect(() => {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Determine animation type based on data attribute
                if (entry.target.dataset.animation === 'slide-right') {
                    entry.target.classList.add('opacity-100', 'translate-x-0');
                    entry.target.classList.remove('opacity-0', '-translate-x-16');
                } else {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            }
        });
    }, observerOptions);

    if (mainRef.current) {
        const shadowElements = mainRef.current.querySelectorAll('.natural-shadow');
        shadowElements.forEach((el, index) => {
            // Apply different initial state for testimonials to float left-to-right
            if (el.closest('#testimonials-section')) {
                el.dataset.animation = 'slide-right';
                el.classList.add('transition-all', 'duration-1000', 'opacity-0', '-translate-x-16');
                // Stagger the animation
                el.style.transitionDelay = `${index * 150}ms`;
            } else {
                el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
            }
            observer.observe(el);
        });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!journeyRef.current) return;
    const steps = journeyRef.current.querySelectorAll('[data-journey-step]');
    if (steps.length === 0) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = entry.target.dataset.journeyStep;
          setVisibleSteps((prev) => new Set([...prev, idx]));
        }
      });
    }, { threshold: 0.2 });

    steps.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main ref={mainRef}>
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[700px] lg:min-h-[819px] flex items-center justify-center hero-gradient overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80"
          >
            <source src="https://videos.pexels.com/video-files/5764741/5764741-uhd_3840_2160_24fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center py-16 sm:py-24">
          <h1 className="font-headline-xl text-3xl sm:text-4xl md:text-5xl text-white mb-6 sm:mb-8 max-w-3xl mx-auto font-bold tracking-tight">
            Find your mentor, shape your future
          </h1>
          <p className="font-body-md text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Connect with industry leaders for personalized career growth. Our AI-driven platform matches your unique goals with world-class expertise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigateTo('menteeRegistration')}
              className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-md text-xl hover:scale-[1.02] active:scale-95 transition-all natural-shadow"
            >
              Get Started as Mentee
            </button>
            <button 
              onClick={() => navigateTo('mentorRegistration')}
              className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-4 rounded-xl font-headline-md text-xl hover:scale-[1.02] active:scale-95 transition-all natural-shadow"
            >
              Become a Mentor
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-3xl font-bold text-primary mb-4">Precision-Crafted Mentorship</h2>
          <div className="h-1 w-24 bg-secondary mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-variant p-8 rounded-xl border border-secondary/10 natural-shadow hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-4xl mb-6">psychology</span>
            <h3 className="font-headline-md text-xl font-bold text-primary mb-4">AI Matching</h3>
            <p className="font-body-md text-on-surface-variant">
              Our intelligent algorithm analyzes your career path and aspirations to find the perfect professional counterpart.
            </p>
          </div>
          <div className="bg-surface-variant p-8 rounded-xl border border-secondary/10 natural-shadow hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-4xl mb-6">video_chat</span>
            <h3 className="font-headline-md text-xl font-bold text-primary mb-4">Video Sessions</h3>
            <p className="font-body-md text-on-surface-variant">
              High-definition integrated video calls with automated scheduling, note-taking, and resource sharing features.
            </p>
          </div>
          <div className="bg-surface-variant p-8 rounded-xl border border-secondary/10 natural-shadow hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-4xl mb-6">explore</span>
            <h3 className="font-headline-md text-xl font-bold text-primary mb-4">Career Guidance</h3>
            <p className="font-body-md text-on-surface-variant">
              Receive personalized roadmaps, interview preparation, and portfolio reviews from veterans in your chosen industry.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works — Your Path to Mastery */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-container-low to-surface" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />

        <div ref={journeyRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="text-center mb-14 sm:mb-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container/50 px-4 py-2 text-xs font-bold text-on-primary-container mb-5 border border-primary/10">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Your Path to Mastery
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface leading-tight mb-4">
              Your Journey to<br className="hidden sm:block" /> Professional Growth
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Join ProLign in just a few simple steps and connect with experienced mentors who will help accelerate your career.
            </p>
          </div>

          {/* Journey Roadmap */}
          <div className="relative">
            {/* Connector Line — Desktop */}
            <div className="hidden lg:block absolute top-[72px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 rounded-full" />
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out"
                style={{ width: visibleSteps.size >= 4 ? '100%' : visibleSteps.size >= 3 ? '66%' : visibleSteps.size >= 2 ? '33%' : visibleSteps.size >= 1 ? '0%' : '0%' }}
              />
            </div>

            {/* Connector Line — Tablet (2-col) */}
            <div className="hidden sm:block lg:hidden absolute top-[72px] left-[25%] right-[25%] h-[2px]">
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 rounded-full" />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
              {[
                {
                  num: '01',
                  icon: 'person_add',
                  title: 'Create Your Account',
                  description: 'Register as a Mentor or Mentee and create your professional profile in just a few minutes.',
                  color: 'primary',
                },
                {
                  num: '02',
                  icon: 'psychology',
                  title: 'AI Career Assessment',
                  description: 'Answer a few questions so our AI can understand your goals, strengths, and career aspirations.',
                  color: 'secondary',
                },
                {
                  num: '03',
                  icon: 'handshake',
                  title: 'Get Matched',
                  description: 'Receive personalized mentor recommendations based on your skills, interests, and career objectives.',
                  color: 'tertiary',
                },
                {
                  num: '04',
                  icon: 'calendar_month',
                  title: 'Book Your First Session',
                  description: 'Choose an available time, confirm your booking, and begin your mentorship journey.',
                  color: 'primary',
                },
              ].map((step, idx) => {
                const isVisible = visibleSteps.has(String(idx));
                return (
                  <div
                    key={idx}
                    data-journey-step={idx}
                    className={`relative flex flex-col items-center text-center transition-all duration-500 ease-out ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${idx * 120}ms` }}
                  >
                    {/* Step Number Badge */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-5 transition-all duration-300 ${
                      step.color === 'primary'
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                        : step.color === 'secondary'
                        ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20'
                        : 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20'
                    } group-hover:scale-110`}>
                      {step.num}
                    </div>

                    {/* Card */}
                    <div className="flex-1 w-full bg-surface rounded-[18px] p-6 sm:p-7 border border-outline-variant/10 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/20 transition-all duration-300 group cursor-default">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                        step.color === 'primary'
                          ? 'bg-primary-container text-on-primary-container'
                          : step.color === 'secondary'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                      </div>

                      <h3 className="text-base font-bold text-on-surface mb-2">{step.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
                    </div>

                    {/* Mobile/Tablet Connector (vertical) */}
                    {idx < 3 && (
                      <div className="sm:hidden w-0.5 h-8 bg-gradient-to-b from-primary/25 to-primary/10 my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Highlight Banner */}
          <div className="mt-16 sm:mt-20 bg-surface rounded-2xl border border-outline-variant/10 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { icon: 'psychology', text: 'Personalized AI Matching' },
                { icon: 'verified', text: 'Verified Professional Mentors' },
                { icon: 'lock', text: 'Secure Session Booking' },
                { icon: 'trending_up', text: 'Continuous Career Growth' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 justify-center sm:justify-start">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-container text-on-success-container flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-semibold text-on-surface">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-24 px-6 overflow-hidden bg-surface-container/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-secondary font-semibold text-sm uppercase tracking-[0.2em]">Testimonials</span>
            <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-primary mt-2">Voices of Success</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full mt-4"></div>
          </div>

          {testimonials.length > 0 && <TestimonialCarousel testimonials={testimonials} />}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-3xl p-12 md:p-24 text-center relative overflow-hidden natural-shadow">
          <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-on-primary mb-8 relative z-10">Ready to build your bridge?</h2>
          <button 
            onClick={() => navigateTo('menteeRegistration')}
            className="bg-on-primary text-primary px-12 py-4 rounded-xl font-headline-md text-xl hover:bg-surface-dim transition-colors relative z-10 natural-shadow font-bold"
          >
            Join Today
          </button>
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
