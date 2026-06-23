import React, { useState } from 'react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'Perfect to get started',
    features: ['5 mentor connections', '1 session per month', 'Basic AI matching', 'Community access', 'Goal setting tools'],
    cta: 'Get Started Free',
    highlighted: false,
    icon: 'rocket_launch',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    tagline: 'For serious career growth',
    features: ['Unlimited connections', '8 sessions per month', 'Advanced AI matching', 'Priority support', 'Video call recording', 'Progress analytics'],
    cta: 'Start Pro Plan',
    highlighted: true,
    badge: 'Most Popular',
    icon: 'star',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    tagline: 'For teams and organisations',
    features: ['Everything in Pro', 'Custom mentor pool', 'Team dashboard', 'Dedicated support manager', 'Unlimited sessions', 'SSO and advanced security'],
    cta: 'Contact Sales',
    highlighted: false,
    icon: 'corporate_fare',
  },
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade whenever you need to. Changes take effect at the start of the next billing cycle and we prorate differences where relevant.',
  },
  {
    q: 'Is there a free trial for the Pro plan?',
    a: 'Yes. New users receive a 14-day trial on eligible plans, so they can explore the platform before committing.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept major credit and debit cards, and enterprise customers can also arrange alternative billing options.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Account data is retained for a limited period so you can export what you need before permanent deletion.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
      <button className="w-full flex items-center justify-between px-6 py-5 text-left" onClick={() => setOpen(!open)}>
        <span className="font-semibold text-on-surface">{q}</span>
        <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Pricing({ navigateTo }) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant/15">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(91,98,57,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(32,42,16,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,248,243,0.98)_0%,_rgba(250,236,216,0.84)_100%)]" />
        <div className="absolute -left-12 top-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute right-0 top-8 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest/85 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-secondary backdrop-blur mb-6">
            <span className="material-symbols-outlined text-[16px]">local_offer</span>
            Pricing plans
          </div>
          <h1 className="font-headline-lg text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-on-surface max-w-4xl mx-auto">
            Simple, transparent pricing that grows with you
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-on-surface-variant max-w-3xl mx-auto mt-5">
            Choose the plan that fits your current stage, with room to grow when you need more support.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-1 ${
                tier.highlighted
                  ? 'bg-primary text-on-primary shadow-[0_24px_70px_-30px_rgba(32,42,16,0.45)]'
                  : 'bg-surface-container-lowest border border-outline-variant/15 shadow-[0_18px_60px_-28px_rgba(76,61,25,0.25)]'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-on-primary">
                  {tier.badge}
                </span>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tier.highlighted ? 'bg-on-primary/12' : 'bg-primary-container'}`}>
                  <span className={`material-symbols-outlined text-2xl ${tier.highlighted ? 'text-on-primary' : 'text-primary'}`}>
                    {tier.icon}
                  </span>
                </div>
                <div>
                  <h2 className={`font-headline-md text-2xl font-bold ${tier.highlighted ? 'text-on-primary' : 'text-on-surface'}`}>
                    {tier.name}
                  </h2>
                  <p className={`text-sm ${tier.highlighted ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{tier.tagline}</p>
                </div>
              </div>

              <div className="mb-8">
                <span className={`font-headline-lg text-5xl font-bold ${tier.highlighted ? 'text-on-primary' : 'text-on-surface'}`}>
                  {tier.price}
                </span>
                <span className={`text-base ${tier.highlighted ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{tier.period}</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className={`flex items-start gap-3 text-sm leading-relaxed ${tier.highlighted ? 'text-on-primary/90' : 'text-on-surface-variant'}`}>
                    <span className={`material-symbols-outlined text-[18px] mt-0.5 ${tier.highlighted ? 'text-on-primary' : 'text-primary'}`}>
                      check_circle
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigateTo('login')}
                className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  tier.highlighted ? 'bg-surface-container-lowest text-primary' : 'bg-primary text-on-primary'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-outline-variant/10">
        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20">
          <div className="text-center mb-12">
            <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              Everything you need to know before choosing a plan.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
