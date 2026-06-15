import React from 'react';
import { getPublishedSiteContent } from '../content/siteContent';

const shellCard =
  'rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_18px_60px_-28px_rgba(76,61,25,0.25)]';

export default function Resources({ navigateTo }) {
  const resources = getPublishedSiteContent('resources');

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,98,57,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(32,42,16,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,248,243,0.98)_0%,_rgba(250,236,216,0.84)_100%)]" />
        <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur">
              <span className="material-symbols-outlined text-[16px]">auto_stories</span>
              {resources.hero.badge}
            </div>
            <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface max-w-3xl">
              {resources.hero.title}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant max-w-2xl">
              {resources.hero.summary}
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              {resources.hero.eyebrow}
            </p>
          </div>

          <div className={`${shellCard} p-6 md:p-8`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-container p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-2">Career Blog</p>
                <p className="text-sm leading-relaxed text-on-surface-variant">Editorial guides, job search advice, and career growth notes.</p>
              </div>
              <div className="rounded-2xl bg-surface-container p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-2">Resume Templates</p>
                <p className="text-sm leading-relaxed text-on-surface-variant">Templates for technical, creative, academic, and leadership paths.</p>
              </div>
              <div className="rounded-2xl bg-surface-container p-5 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-2">Interview Prep</p>
                <p className="text-sm leading-relaxed text-on-surface-variant">Practical materials to help candidates prepare with confidence and clarity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined rounded-2xl bg-primary-container px-3 py-3 text-on-primary-container">
            article
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Career blog</p>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface">Fresh reading for ambitious careers</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {resources.blogPosts.map((post) => (
            <article key={post.title} className={`${shellCard} overflow-hidden group transition-transform hover:-translate-y-1`}>
              <div className="h-40 bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-primary/45">{post.icon}</span>
              </div>
              <div className="p-5">
                <div className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container mb-3">
                  {post.category}
                </div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface leading-snug mb-2">
                  {post.title}
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>{post.readTime}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low border-y border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined rounded-2xl bg-primary-container px-3 py-3 text-on-primary-container">
              quiz
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Interview prep</p>
              <h2 className="font-headline-md text-2xl font-bold text-on-surface">Tools that make practice easier</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {resources.interviewTips.map((tip) => (
              <div key={tip.title} className={`${shellCard} p-6 flex gap-4`}>
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">{tip.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface mb-1">{tip.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.interviewResources.map((item) => (
              <div key={item.title} className={`${shellCard} p-6`}>
                <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-headline-md text-lg font-bold text-on-surface mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-on-surface-variant mb-5">{item.desc}</p>
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined rounded-2xl bg-primary-container px-3 py-3 text-on-primary-container">
            description
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Resume templates</p>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface">Polished templates for every path</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {resources.resumeTemplates.map((template) => (
            <article key={template.name} className={`${shellCard} overflow-hidden`}>
              <div className="h-44 bg-surface-container relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 opacity-25">
                  <div className="h-2.5 w-3/5 rounded bg-primary" />
                  <div className="h-1.5 w-4/5 rounded bg-on-surface-variant/40" />
                  <div className="h-px w-full bg-outline-variant/30 my-1" />
                  <div className="h-1.5 w-[90%] rounded bg-on-surface-variant/40" />
                  <div className="h-1.5 w-3/4 rounded bg-on-surface-variant/40" />
                  <div className="h-1.5 w-[85%] rounded bg-on-surface-variant/40" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">{template.icon}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-on-surface mb-1">{template.name}</h3>
                <p className="text-sm text-on-surface-variant mb-4">{template.type}</p>
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary-container px-4 py-2.5 text-sm font-semibold text-on-secondary-container transition-opacity hover:opacity-90">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
