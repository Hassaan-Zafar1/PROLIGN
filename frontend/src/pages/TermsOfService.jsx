import { getPublishedSiteContent } from '../content/siteContent';

const shellCard =
  'rounded-3xl border border-outline-variant/15 bg-surface-container-lowest shadow-[0_18px_60px_-28px_rgba(76,61,25,0.25)]';

export default function TermsOfService({ navigateTo }) {
  const terms = getPublishedSiteContent('terms');

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,98,57,0.18),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(32,42,16,0.12),_transparent_32%),linear-gradient(180deg,_rgba(255,248,243,0.96)_0%,_rgba(250,236,216,0.85)_100%)]" />
        <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-20 h-56 w-56 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              {terms.hero.badge}
            </div>
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface">
                {terms.hero.title}
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant">
                {terms.hero.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 font-semibold">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {terms.hero.updatedLabel}: {terms.hero.updatedAt}
              </span>
            </div>
          </div>

          <div className={`${shellCard} relative overflow-hidden p-6 lg:p-8`}>
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary via-primary to-tertiary" />
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-on-surface-variant mb-4">
              In plain language
            </p>
            <div className="space-y-4">
              {[
                'Use the platform respectfully.',
                'Keep payment and booking rules clear.',
                'Treat mentor and mentee relationships with care.',
              ].map((item) => (
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
            {terms.sections.map((section) => (
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
                article
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-2">
                  Overview
                </p>
                <p className="text-base md:text-lg leading-relaxed text-on-surface-variant">
                  {terms.overview}
                </p>
              </div>
            </div>
          </section>

          {terms.sections.map((section) => (
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
                  Need help?
                </p>
                <p className="text-on-surface-variant">{terms.footer.label}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:${terms.footer.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  {terms.footer.email}
                </a>
                <button
                  onClick={() => navigateTo(terms.footer.helpRoute)}
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  Help Center
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
