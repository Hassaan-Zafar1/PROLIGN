/**
 * Landing Page Component
 * Main landing page showcasing features, testimonials, and call-to-actions
 * 
 * Mock data sources:
 * - Features: mockData.js - FEATURES
 * - Testimonials: mockData.js - TESTIMONIALS
 * - Steps: mockData.js - STEPS
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';
import { FEATURES, TESTIMONIALS, STEPS } from '../constants/mockData';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Smooth fade-in animation for cards on scroll
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.natural-shadow').forEach(el => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Navigation */}
      <TopNavBar isHome={true} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[819px] flex items-center justify-center bg-hero-gradient overflow-hidden">
          <div className="relative z-10 max-w-container-max mx-auto px-gutter text-center py-24">
            <h1 className="font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-8 max-w-3xl mx-auto">
              Find your mentor, shape your future
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-12 max-w-2xl mx-auto">
              Connect with industry leaders for personalized career growth. Our AI-driven platform matches your unique goals with world-class expertise.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-md text-headline-md hover:scale-[1.02] active:scale-95 transition-all shadow-natural"
              >
                Get Started as Mentee
              </button>
              <button
                onClick={() => navigate('/mentor-registration')}
                className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-4 rounded-xl font-headline-md text-headline-md hover:scale-[1.02] active:scale-95 transition-all shadow-natural"
              >
                Become a Mentor
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-gutter max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
              Precision-Crafted Mentorship
            </h2>
            <div className="h-1 w-24 bg-secondary mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
            {/* TODO: Replace FEATURES array with API call: GET /api/features */}
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="natural-shadow bg-surface-variant p-8 rounded-xl border border-secondary/10 hover:-translate-y-1 transition-transform"
              >
                <span
                  className="material-symbols-outlined text-4xl mb-6 text-secondary"
                >
                  {feature.icon}
                </span>
                <h3 className="font-headline-md text-headline-md text-primary mb-4">
                  {feature.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-surface-container">
          <div className="max-w-container-max mx-auto px-gutter">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
                Your Path to Mastery
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                A streamlined journey from discovery to achievement.
              </p>
            </div>

            <div className="relative">
              {/* Connector Line */}
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-secondary/20 -translate-y-1/2 z-0"></div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-base relative z-10">
                {/* TODO: Replace STEPS array with API call: GET /api/steps */}
                {STEPS.map((step) => (
                  <div key={step.id} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center mb-6 font-headline-md text-headline-md natural-shadow shadow-natural">
                      {step.id}
                    </div>
                    <h4 className="font-headline-md text-headline-md text-primary mb-2">
                      {step.title}
                    </h4>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-gutter max-w-container-max mx-auto overflow-hidden">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-primary">
              Voices of Success
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-loose">
            {/* TODO: Replace TESTIMONIALS array with API call: GET /api/testimonials */}
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.id}
                className="natural-shadow bg-surface p-12 rounded-xl border border-secondary/10 flex flex-col items-start italic relative"
              >
                <span
                  className="material-symbols-outlined text-on-surface-variant/20 absolute top-8 right-8 scale-[3]"
                >
                  format_quote
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant mb-8 relative z-10">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                    src={testimonial.image}
                  />
                  <div>
                    <p className="font-label-sm text-label-sm text-primary">
                      {testimonial.author}
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-gutter">
          <div className="max-w-container-max mx-auto bg-primary rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
            <h2 className="font-headline-lg text-headline-lg text-on-primary mb-8 relative z-10">
              Ready to build your bridge?
            </h2>
            <button
              onClick={() => navigate('/signup')}
              className="bg-on-primary text-primary px-12 py-4 rounded-xl font-headline-md text-headline-md hover:bg-surface-dim transition-colors relative z-10 shadow-natural"
            >
              Join Today
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
