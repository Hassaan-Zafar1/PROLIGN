import React, { useState } from 'react';
import { getPublishedSiteContent } from '../content/siteContent';

const shellCard =
  'rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_18px_60px_-28px_rgba(76,61,25,0.25)]';

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-on-surface">{q}</span>
        <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 pt-0 text-sm leading-relaxed text-on-surface-variant border-t border-outline-variant/10">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter({ navigateTo }) {
  const helpCenter = getPublishedSiteContent('helpCenter');

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,98,57,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(32,42,16,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,248,243,0.98)_0%,_rgba(250,236,216,0.84)_100%)]" />
        <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur mb-6">
            <span className="material-symbols-outlined text-[16px]">support_agent</span>
            {helpCenter.hero.badge}
          </div>
          <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface max-w-4xl mx-auto">
            {helpCenter.hero.title}
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant max-w-3xl mx-auto mt-5">
            {helpCenter.hero.summary}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-3xl mx-auto mb-14">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Search for answers..."
              className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest py-4 pl-12 pr-4 text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(91,98,57,0.12)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {helpCenter.categories.map((category) => (
            <article key={category.title} className={`${shellCard} p-6 transition-transform hover:-translate-y-1`}>
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-2xl">{category.icon}</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">{category.title}</h3>
              <p className="text-sm leading-relaxed text-on-surface-variant">{category.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low border-y border-outline-variant/10">
        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-3">FAQ</p>
            <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {helpCenter.faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className={`${shellCard} p-8 md:p-10 text-center md:text-left md:flex md:items-center md:justify-between gap-6`}>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary mb-2">Need a person?</p>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface mb-3">{helpCenter.contact.title}</h2>
            <p className="text-on-surface-variant">{helpCenter.contact.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-0">
            <a
              href={`mailto:${helpCenter.contact.email}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              {helpCenter.contact.email}
            </a>
            <button
              onClick={() => navigateTo(helpCenter.contact.ctaRoute)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-5 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              {helpCenter.contact.ctaLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
