import React from 'react';

const steps = [
  {
    icon: 'person_add',
    number: '01',
    title: 'Create Your Profile',
    description:
      'Sign up and build a rich profile highlighting your career goals, skills, and areas you want to grow in. Mentors showcase their expertise and industry experience.',
  },
  {
    icon: 'hub',
    number: '02',
    title: 'Get Matched by AI',
    description:
      'Our intelligent matching engine analyzes your profile, goals, and learning style to recommend the most compatible mentors — saving you hours of searching.',
  },
  {
    icon: 'trending_up',
    number: '03',
    title: 'Grow Together',
    description:
      'Schedule sessions, track milestones, exchange feedback, and build a lasting professional relationship that accelerates your career journey.',
  },
];

const features = [
  {
    icon: 'psychology',
    title: 'AI Matching',
    description: 'Smart algorithms pair you with mentors who truly align with your goals and personality.',
  },
  {
    icon: 'verified',
    title: 'Verified Mentors',
    description: 'Every mentor is vetted and verified, ensuring quality guidance from real industry experts.',
  },
  {
    icon: 'calendar_month',
    title: 'Flexible Scheduling',
    description: 'Book sessions at your convenience with integrated calendar syncing and reminders.',
  },
  {
    icon: 'videocam',
    title: 'Video Sessions',
    description: 'High-quality video calls with recording, whiteboard, and note-taking tools built in.',
  },
  {
    icon: 'insights',
    title: 'Progress Tracking',
    description: 'Set goals and monitor your development with rich dashboards and milestone tracking.',
  },
  {
    icon: 'support_agent',
    title: '24/7 Support',
    description: 'Our dedicated support team and AI assistant are available around the clock to help you.',
  },
];

export default function HowItWorks({ navigateTo }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">

      {/* Hero Section */}
      <section className="hero-gradient py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Platform Overview
          </span>
          <h1 className="font-headline-lg text-4xl md:text-5xl font-bold text-on-surface mb-6">
            How ProLign Works
          </h1>
          <p className="font-body-md text-on-surface-variant text-lg leading-relaxed max-w-2xl mx-auto">
            ProLign connects ambitious professionals with world-class mentors through an intelligent, human-centred platform designed to make meaningful growth effortless.
          </p>
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">
            Your Journey in Three Steps
          </h2>
          <p className="text-on-surface-variant mt-3 leading-relaxed">
            Getting started is simple. Here's how it all comes together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-outline-variant/30" />

          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center text-center bg-surface-container-lowest p-8 rounded-2xl natural-shadow border border-outline-variant/10 group transition-all duration-300 hover:-translate-y-1"
            >
              {/* Step number badge */}
              <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg mb-5">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-on-primary-container text-3xl">{step.icon}</span>
              </div>

              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">
                {step.title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-surface-container-low border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">
              Everything You Need to Succeed
            </h2>
            <p className="text-on-surface-variant mt-3 leading-relaxed">
              Powerful features built for serious professional growth.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <div
                key={idx}
                className="flex gap-5 bg-surface-container-low p-6 rounded-xl group transition-all duration-300 hover:-translate-y-1 border border-outline-variant/10"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                  <span className="material-symbols-outlined text-primary text-2xl">{f.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-1">{f.title}</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="bg-primary-container rounded-2xl p-12">
          <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-on-primary-container mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-on-primary-container/80 text-base mb-8 leading-relaxed">
            Join thousands of professionals who have already accelerated their careers with ProLign.
          </p>
          <button
            onClick={() => navigateTo('menteeRegistration')}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Get Started for Free
            <span className="material-symbols-outlined text-xl">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
}
