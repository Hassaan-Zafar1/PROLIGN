import React from 'react';
import { getPublishedSiteContent } from '../content/siteContent';

const shellCard =
  'rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_18px_60px_-28px_rgba(76,61,25,0.25)]';

export default function PrivacyPolicy({ navigateTo }) {
  const privacy = getPublishedSiteContent('privacy');

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,98,57,0.16),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(32,42,16,0.12),_transparent_34%),linear-gradient(180deg,_rgba(255,248,243,0.96)_0%,_rgba(245,230,211,0.9)_100%)]" />
        <div className="absolute left-0 top-16 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-8 top-24 h-60 w-60 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur">
              <span className="material-symbols-outlined text-[16px]">privacy_tip</span>
              {privacy.hero.badge}
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface">
                {privacy.hero.title}
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant">
                {privacy.hero.summary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 font-semibold">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {privacy.hero.updatedLabel}: {privacy.hero.updatedAt}
              </span>
              <button
                onClick={() => navigateTo('cookies')}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">cookie</span>
                Cookie Policy
              </button>
            </div>
          </div>

          <div className={`${shellCard} relative overflow-hidden p-6 lg:p-8`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-primary to-tertiary" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-4">
              Privacy principles
            </p>
            <div className="space-y-4">
              {['Only what we need.', 'Used to run the service.', 'Protected with access controls.'].map((item) => (
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
            {privacy.sections.map((section) => (
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
                shield
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                  Overview
                </p>
                <p className="text-base md:text-lg leading-relaxed text-on-surface-variant">
                  {privacy.overview}
                </p>
              </div>
            </div>
          </section>

          {privacy.sections.map((section) => (
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
                  Contact
                </p>
                <p className="text-on-surface-variant">{privacy.footer.label}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${privacy.footer.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  {privacy.footer.email}
                </a>
                {privacy.footer.links.map((link) => (
                  <button
                    key={link.route}
                    onClick={() => navigateTo(link.route)}
                    className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
