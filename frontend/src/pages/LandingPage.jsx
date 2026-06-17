import React, { useState, useEffect, useRef } from 'react';
import { getTestimonials } from '../utils/db';

const LandingPage = ({ navigateTo }) => {
  const [testimonials, setTestimonials] = useState([]);
  const mainRef = useRef(null);

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

  return (
    <main ref={mainRef}>
      {/* Hero Section */}
      <section className="relative min-h-[819px] flex items-center justify-center hero-gradient overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center py-24">
          <h1 className="font-headline-xl text-4xl md:text-5xl text-on-surface mb-8 max-w-3xl mx-auto font-bold tracking-tight">
            Find your mentor, shape your future
          </h1>
          <p className="font-body-md text-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
            Connect with industry leaders for personalized career growth. Our AI-driven platform matches your unique goals with world-class expertise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigateTo('login')}
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

      {/* How It Works */}
      <section className="py-24 bg-surface-container">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-3xl font-bold text-primary mb-4">Your Path to Mastery</h2>
            <p className="font-body-md text-on-surface-variant">A streamlined journey from discovery to achievement.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-secondary/20 -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-6 font-headline-md text-2xl natural-shadow">1</div>
                <h4 className="font-headline-md text-xl font-bold text-primary mb-2">Register</h4>
                <p className="font-caption text-sm text-on-surface-variant">Create your professional profile in minutes.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-6 font-headline-md text-2xl natural-shadow">2</div>
                <h4 className="font-headline-md text-xl font-bold text-primary mb-2">AI Interview</h4>
                <p className="font-caption text-sm text-on-surface-variant">Share your goals with our virtual analyst.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-6 font-headline-md text-2xl natural-shadow">3</div>
                <h4 className="font-headline-md text-xl font-bold text-primary mb-2">Get Matched</h4>
                <p className="font-caption text-sm text-on-surface-variant">Review top-tier mentor recommendations.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-6 font-headline-md text-2xl natural-shadow">4</div>
                <h4 className="font-headline-md text-xl font-bold text-primary mb-2">Book Session</h4>
                <p className="font-caption text-sm text-on-surface-variant">Begin your journey with your first 1-on-1.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-24 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-3xl font-bold text-primary">Voices of Success</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-surface p-12 rounded-xl border border-secondary/10 natural-shadow flex flex-col items-start italic relative">
              <span className="material-symbols-outlined text-on-surface-variant/20 absolute top-8 right-8 scale-[3]">format_quote</span>
              <p className="font-body-md text-on-surface-variant mb-8 relative z-10 flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img alt={t.name} className="w-12 h-12 rounded-full object-cover" src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}`}/>
                <div>
                  <p className="font-label-sm font-bold text-primary">{t.name}</p>
                  <p className="font-caption text-sm text-on-surface-variant">{t.role} at {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-3xl p-12 md:p-24 text-center relative overflow-hidden natural-shadow">
          <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-on-primary mb-8 relative z-10">Ready to build your bridge?</h2>
          <button 
            onClick={() => navigateTo('login')}
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
