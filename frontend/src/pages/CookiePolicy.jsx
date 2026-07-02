import React from 'react';
import { getPublishedSiteContent } from '../content/siteContent';

const shellCard =
  'rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-xl';

const badgeClasses = {
  Essential: 'bg-primary-container/20 text-on-primary-container',
  Functional: 'bg-secondary-container text-on-secondary-container',
  Analytics: 'bg-primary/10 text-primary',
  Marketing: 'bg-surface-container text-on-surface-variant',
};

export default function CookiePolicy({ navigateTo }) {
  const cookies = getPublishedSiteContent('cookies');

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-primary/5 to-surface-container-high/60" />
        <div className="absolute left-0 top-16 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-8 top-24 h-60 w-60 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur">
              <span className="material-symbols-outlined text-[16px]">cookie</span>
              {cookies.hero.badge}
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface">
                {cookies.hero.title}
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant">
                {cookies.hero.summary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 font-semibold">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {cookies.hero.updatedLabel}: {cookies.hero.updatedAt}
              </span>
              <button
                onClick={() => navigateTo('privacy')}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">privacy_tip</span>
                Privacy Policy
              </button>
            </div>
          </div>

          <div className={`${shellCard} relative overflow-hidden p-6 lg:p-8`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-primary to-tertiary" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-4">
              Cookie summary
            </p>
            <div className="space-y-4">
              {['Essential for sign-in.', 'Used to remember preferences.', 'Analytics are grouped and reviewed.'].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-surface-container px-4 py-3">
                  <span className="material-symbols-outlined mt-0.5 text-secondary text-[18px]">check_circle</span>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className={`${shellCard} h-fit p-6 lg:sticky lg:top-24`}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-4">
            Table of Contents
          </p>
          <div className="space-y-2">
            {[...cookies.sections, { id: 'cookie-types', title: 'Types of Cookies We Use', icon: 'table_chart' }].map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">{section.icon}</span>
                <span>{section.title}</span>
              </a>
            ))}
          </div>
        </aside>

        <div className="space-y-8">
          <section className={`${shellCard} p-6 md:p-8`}>
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined mt-1 rounded-2xl bg-primary-container px-3 py-3 text-on-primary-container">
                cookie
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                  Overview
                </p>
                <p className="text-base md:text-lg leading-relaxed text-on-surface-variant">
                  {cookies.overview}
                </p>
              </div>
            </div>
          </section>

          <section id="cookie-types" className={`${shellCard} p-6 md:p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined rounded-2xl bg-secondary-container px-3 py-3 text-on-secondary-container">
                table_chart
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">Cookie table</p>
                <h2 className="font-headline-md text-2xl font-bold text-on-surface">Types of Cookies We Use</h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-outline-variant/15">
              <div className="hidden md:grid md:grid-cols-[1.2fr_2.4fr_0.8fr_0.8fr] bg-surface-container px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                <span>Name</span>
                <span>Purpose</span>
                <span>Duration</span>
                <span>Category</span>
              </div>
              <div className="divide-y divide-outline-variant/10">
                {cookies.cookieTypes.map((cookie) => (
                  <div key={cookie.name} className="grid gap-3 px-6 py-5 md:grid-cols-[1.2fr_2.4fr_0.8fr_0.8fr] md:items-center">
                    <div className="flex items-center justify-between gap-3 md:block">
                      <span className="font-mono text-sm text-primary break-all">{cookie.name}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold md:hidden ${badgeClasses[cookie.category] || 'bg-surface-container text-on-surface-variant'}`}>
                        {cookie.category}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">{cookie.purpose}</p>
                    <p className="text-sm text-on-surface-variant">
                      <span className="md:hidden font-semibold text-on-surface">Duration: </span>
                      {cookie.duration}
                    </p>
                    <div className="hidden md:block">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses[cookie.category] || 'bg-surface-container text-on-surface-variant'}`}>
                        {cookie.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {cookies.sections.map((section) => (
            <section key={section.id} id={section.id} className={`${shellCard} p-6 md:p-8`}>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined rounded-2xl bg-secondary-container px-3 py-3 text-on-secondary-container">
                  {section.icon}
                </span>
                <h2 className="font-headline-md text-2xl font-bold text-on-surface">{section.title}</h2>
              </div>
              <div className="grid gap-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-relaxed text-on-surface-variant">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section className={`${shellCard} p-6 md:p-8`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary mb-2">
                  Related policies
                </p>
                <p className="text-on-surface-variant">{cookies.footer.label}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {cookies.footer.links.map((link) => (
                  <button
                    key={link.route}
                    onClick={() => navigateTo(link.route)}
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                <span className="material-symbols-outlined text-[16px]">check</span>
              {link.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
