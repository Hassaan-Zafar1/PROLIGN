const siteContentDefaults = {
  terms: {
    hero: {
      badge: 'Legal',
      icon: 'gavel',
      title: 'Terms of Service',
      summary:
        'These terms explain how MentorBridge works, what you can expect from the platform, and the responsibilities that apply to every member.',
      updatedLabel: 'Last updated',
      updatedAt: 'June 1, 2026',
    },
    overview:
      'MentorBridge exists to create a high-trust learning environment. By using the service, you agree to follow these terms and the related policies that keep the platform safe, respectful, and useful for everyone.',
    sections: [
      {
        id: 'introduction',
        title: '1. Introduction',
        icon: 'article',
        paragraphs: [
          'Welcome to MentorBridge. These Terms of Service govern your access to and use of the website, mobile application, and connected services.',
          'We may update these terms from time to time. Material updates are communicated through the platform so you always know what changed before the new version goes live.',
        ],
      },
      {
        id: 'user-accounts',
        title: '2. User Accounts',
        icon: 'person',
        paragraphs: [
          'You are responsible for the accuracy of your account information and for keeping your credentials secure.',
          'We may suspend or close accounts that provide false information, abuse the service, or create risk for the community.',
        ],
      },
      {
        id: 'acceptable-use',
        title: '3. Acceptable Use',
        icon: 'verified_user',
        paragraphs: [
          'Use the service for lawful, respectful, and platform-aligned activity only. Harassment, impersonation, spam, scraping, and harmful conduct are not allowed.',
          'Mentors and mentees should keep interactions professional and should not use the platform to harm, mislead, or pressure other users.',
        ],
      },
      {
        id: 'sessions-payments',
        title: '4. Sessions and Payments',
        icon: 'payments',
        paragraphs: [
          'Session bookings follow the cancellation and refund rules shown at checkout. Subscription fees, where applicable, are billed in advance and may be subject to taxes.',
          'MentorBridge acts as a marketplace facilitator and may adjust service fees with reasonable advance notice to active mentors.',
        ],
      },
      {
        id: 'intellectual-property',
        title: '5. Intellectual Property',
        icon: 'copyright',
        paragraphs: [
          'The MentorBridge platform, including its design, branding, software, and original content, is protected by applicable intellectual property laws.',
          'You retain ownership of the content you create, but you grant MentorBridge a limited licence to display and process that content so the service can operate correctly.',
        ],
      },
      {
        id: 'termination',
        title: '6. Termination',
        icon: 'logout',
        paragraphs: [
          'You may close your account at any time. We may suspend or terminate access if a user breaches these terms or presents a risk to the platform.',
          'Certain provisions survive termination, including ownership, liability, and data retention terms that must continue to apply after the account closes.',
        ],
      },
    ],
    footer: {
      label: 'Need help understanding these terms?',
      email: 'legal@mentorbridge.io',
      helpRoute: 'help-center',
    },
  },
  privacy: {
    hero: {
      badge: 'Legal',
      icon: 'privacy_tip',
      title: 'Privacy Policy',
      summary:
        'See what information MentorBridge collects, how it is used, and the rights you have over your personal data.',
      updatedLabel: 'Last updated',
      updatedAt: 'June 1, 2026',
    },
    overview:
      'We only use personal data to run the service, improve the experience, and meet legal obligations. Privacy is built into the product, not added later.',
    sections: [
      {
        id: 'information-we-collect',
        title: '1. Information We Collect',
        icon: 'database',
        paragraphs: [
          'We collect the information you provide directly when you sign up, build your profile, book a session, message another user, or contact support.',
          'We also collect technical usage data such as device information, browser type, pages visited, and interaction signals that help us keep the platform stable and useful.',
        ],
      },
      {
        id: 'how-we-use',
        title: '2. How We Use Your Information',
        icon: 'hub',
        paragraphs: [
          'We use the data we collect to provide the service, match users, process transactions, send notifications, and improve the platform.',
          'We may also use aggregated and anonymized insights for analytics, research, and product planning. These insights do not identify individual users.',
        ],
      },
      {
        id: 'information-sharing',
        title: '3. Information Sharing',
        icon: 'share',
        paragraphs: [
          'We do not sell personal data. We share information only when needed to run the service, when you ask us to, or when the law requires it.',
          'Trusted vendors may process limited data on our behalf for payments, hosting, communications, analytics, and similar platform functions.',
        ],
      },
      {
        id: 'data-security',
        title: '4. Data Security',
        icon: 'shield',
        paragraphs: [
          'We use layered safeguards to protect data in transit and at rest, and we restrict internal access to what people need to do their jobs.',
          'No online service is perfectly secure, but we work to reduce risk through monitoring, backups, and regular security reviews.',
        ],
      },
      {
        id: 'your-rights',
        title: '5. Your Rights',
        icon: 'gavel',
        paragraphs: [
          'Depending on where you live, you may have rights to access, correct, delete, or restrict your personal data, and in some cases to object to processing.',
          'To exercise privacy rights, contact our privacy team and we will help verify your request and respond within a reasonable timeframe.',
        ],
      },
      {
        id: 'contact-us',
        title: '6. Contact Us',
        icon: 'mail',
        paragraphs: [
          'For privacy questions, contact privacy@mentorbridge.io or reach out through the Help Center if you need help navigating your account.',
          'If you are not satisfied with our response, you can also escalate to the relevant data protection authority in your region.',
        ],
      },
    ],
    footer: {
      label: 'Need to review related policies?',
      email: 'privacy@mentorbridge.io',
      links: [
        { label: 'Cookie Policy', route: 'cookies' },
        { label: 'Terms of Service', route: 'terms' },
      ],
    },
  },
  cookies: {
    hero: {
      badge: 'Legal',
      icon: 'cookie',
      title: 'Cookie Policy',
      summary:
        'Understand the cookies and tracking technologies used to keep MentorBridge secure, personalized, and measurable.',
      updatedLabel: 'Last updated',
      updatedAt: 'June 1, 2026',
    },
    overview:
      'Cookies help the platform stay signed in, remember preferences, measure usage, and support analytics. You can manage your cookie choices in the browser or through the platform settings.',
    cookieTypes: [
      {
        name: 'session_id',
        purpose: 'Keeps you logged in securely and maintains your authenticated session.',
        duration: 'Session',
        category: 'Essential',
      },
      {
        name: 'csrf_token',
        purpose: 'Protects against cross-site request forgery attacks.',
        duration: 'Session',
        category: 'Essential',
      },
      {
        name: 'mb_preferences',
        purpose: 'Stores your selected preferences such as theme, language, and notifications.',
        duration: '1 year',
        category: 'Functional',
      },
      {
        name: 'mb_analytics',
        purpose: 'Helps us understand usage patterns and improve the product.',
        duration: '2 years',
        category: 'Analytics',
      },
      {
        name: '_ga / _gid',
        purpose: 'Google Analytics cookies used for aggregate traffic analysis.',
        duration: '2 years / 24 hours',
        category: 'Analytics',
      },
      {
        name: 'mb_marketing',
        purpose: 'Supports campaign measurement and audience relevance.',
        duration: '90 days',
        category: 'Marketing',
      },
    ],
    sections: [
      {
        id: 'what-are-cookies',
        title: 'What Are Cookies?',
        icon: 'cookie',
        paragraphs: [
          'Cookies are small text files stored on your device when you visit a website. They help websites remember who you are and how you prefer to use the service.',
          'First-party cookies come from MentorBridge. Third-party cookies may come from analytics or service providers that help us deliver the platform.',
        ],
      },
      {
        id: 'how-we-use',
        title: 'How We Use Cookies',
        icon: 'settings',
        paragraphs: [
          'We use cookies to keep core features working, remember your choices, and make the experience smoother.',
          'We also use cookies to analyze usage trends and understand where the product can be improved.',
        ],
      },
      {
        id: 'managing-cookies',
        title: 'Managing Cookies',
        icon: 'tune',
        paragraphs: [
          'You can manage cookies through your browser settings, and you can delete or block them at any time.',
          'Blocking some cookies may limit functionality, especially essential cookies required for login and account protection.',
        ],
      },
      {
        id: 'contact',
        title: 'Contact',
        icon: 'mail',
        paragraphs: [
          'Questions about cookie usage can be sent to privacy@mentorbridge.io.',
          'If you want to change your cookie choices, use the privacy controls in your account or contact support.',
        ],
      },
    ],
    footer: {
      label: 'Review the connected policies',
      links: [
        { label: 'Privacy Policy', route: 'privacy' },
        { label: 'Terms of Service', route: 'terms' },
      ],
    },
  },
  resources: {
    hero: {
      badge: 'Resource Hub',
      title: 'Career resources built to move you forward',
      summary:
        'Browse the career blog, interview prep materials, and resume templates that help mentees make faster progress.',
      eyebrow: 'Updated by the admin panel',
    },
    blogPosts: [
      {
        category: 'Career Growth',
        title: '10 Questions to Ask Your Mentor in Your First Session',
        excerpt:
          'Learn how to lead your first session with confidence and turn it into a practical roadmap for growth.',
        readTime: '5 min read',
        date: 'Jun 10, 2026',
        icon: 'chat',
      },
      {
        category: 'Leadership',
        title: 'From IC to Manager: Navigating the Transition',
        excerpt:
          'A grounded guide for moving from individual contributor work into your first leadership role.',
        readTime: '7 min read',
        date: 'Jun 4, 2026',
        icon: 'groups',
      },
      {
        category: 'Job Search',
        title: 'How to Stand Out in a Competitive Tech Job Market',
        excerpt:
          'Practical ways to sharpen your applications, interview story, and portfolio so you stand out quickly.',
        readTime: '6 min read',
        date: 'May 28, 2026',
        icon: 'search',
      },
      {
        category: 'Productivity',
        title: 'Building a Learning Routine That Actually Sticks',
        excerpt:
          'Small habits, repeatable systems, and consistency strategies that help career development last.',
        readTime: '4 min read',
        date: 'May 20, 2026',
        icon: 'schedule',
      },
    ],
    interviewTips: [
      {
        icon: 'record_voice_over',
        title: 'Master the STAR Method',
        desc: 'Use Situation, Task, Action, and Result to answer behavioral questions with clarity.',
      },
      {
        icon: 'lightbulb',
        title: 'Research Deeply',
        desc: 'Go beyond the homepage. Learn the company, the product, and the problems it is solving.',
      },
      {
        icon: 'psychology_alt',
        title: 'Practice Out Loud',
        desc: 'Saying answers out loud reveals gaps in structure, pace, and confidence.',
      },
    ],
    interviewResources: [
      {
        title: 'Behavioral Interview Guide',
        desc: 'Common questions, model answers, and scoring rubrics used by strong interviewers.',
        icon: 'description',
      },
      {
        title: 'System Design Cheat Sheet',
        desc: 'A compact reference covering scalability, caching, databases, and load balancing.',
        icon: 'schema',
      },
      {
        title: 'Salary Negotiation Playbook',
        desc: 'A step-by-step framework for negotiating with confidence and keeping the tone collaborative.',
        icon: 'payments',
      },
    ],
    resumeTemplates: [
      { name: 'Modern Professional', type: 'Tech & Engineering', icon: 'code' },
      { name: 'Executive Classic', type: 'Leadership & C-suite', icon: 'business_center' },
      { name: 'Creative Portfolio', type: 'Design & Marketing', icon: 'palette' },
      { name: 'Academic & Research', type: 'Academia & Science', icon: 'science' },
    ],
  },
  helpCenter: {
    hero: {
      badge: 'Help Center',
      title: 'How can we help you today?',
      summary: 'Find answers fast, browse common topics, or reach support when you need a human.',
    },
    categories: [
      {
        icon: 'rocket_launch',
        title: 'Getting Started',
        desc: 'Set up your profile, find your first mentor, and move through onboarding.',
      },
      {
        icon: 'event',
        title: 'Sessions and Bookings',
        desc: 'Learn how scheduling, rescheduling, and cancellation works.',
      },
      {
        icon: 'credit_card',
        title: 'Billing and Payments',
        desc: 'Manage subscriptions, invoices, and payment methods.',
      },
      {
        icon: 'shield',
        title: 'Account and Security',
        desc: 'Password, privacy, and account protection basics.',
      },
    ],
    faqs: [
      {
        q: 'How do I find a mentor on MentorBridge?',
        a: 'After creating your profile, the platform suggests compatible mentors based on your goals, skills, and preferences. You can also browse the mentor directory and filter by expertise and availability.',
      },
      {
        q: 'What happens if my mentor cancels a session?',
        a: 'If a mentor cancels within the policy window, the session credit is handled according to the booking rules shown at checkout.',
      },
      {
        q: 'How are mentors verified on the platform?',
        a: 'Every mentor goes through profile review and platform checks so users have a safer, higher-quality mentoring experience.',
      },
      {
        q: 'Can I request a refund for my subscription?',
        a: 'Refund eligibility depends on the plan and timing. Review the pricing and checkout terms or contact support for account-specific help.',
      },
      {
        q: 'Is my data secure on MentorBridge?',
        a: 'We use standard safeguards, access controls, and privacy practices to protect data and reduce risk across the platform.',
      },
      {
        q: 'Can I be both a mentor and a mentee?',
        a: 'Yes. Many users occupy both roles and can switch between them as their goals evolve.',
      },
    ],
    contact: {
      title: 'Still need help?',
      description:
        'Our support team can help with account questions, bookings, and platform issues.',
      email: 'support@mentorbridge.io',
      ctaLabel: 'Contact Support',
      ctaRoute: 'help-center',
    },
  },
};

const SITE_CONTENT_STORAGE_KEY = 'mentorBridgeSiteContent';
const DB_STORAGE_KEY = 'mentorBridgeDB';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const mergeObjects = (baseValue, savedValue) => {
  if (Array.isArray(baseValue)) {
    return Array.isArray(savedValue) ? savedValue : baseValue;
  }

  if (!baseValue || typeof baseValue !== 'object') {
    return savedValue ?? baseValue;
  }

  const merged = { ...baseValue };
  if (savedValue && typeof savedValue === 'object') {
    Object.keys(savedValue).forEach((key) => {
      merged[key] = mergeObjects(baseValue[key], savedValue[key]);
    });
  }

  return merged;
};

export const getDefaultSiteContent = () => deepClone(siteContentDefaults);

export const getStoredSiteContent = () => {
  if (typeof localStorage === 'undefined') {
    return getDefaultSiteContent();
  }

  try {
    const storedValue = localStorage.getItem(SITE_CONTENT_STORAGE_KEY);
    if (storedValue) {
      return mergeObjects(siteContentDefaults, JSON.parse(storedValue));
    }

    const dbValue = localStorage.getItem(DB_STORAGE_KEY);
    if (dbValue) {
      const parsedDb = JSON.parse(dbValue);
      if (parsedDb.siteContent) {
        return mergeObjects(siteContentDefaults, parsedDb.siteContent);
      }
    }

    return getDefaultSiteContent();
  } catch {
    return getDefaultSiteContent();
  }
};

export const saveStoredSiteContent = (content) => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(SITE_CONTENT_STORAGE_KEY, JSON.stringify(content));
};

export const getPublishedSiteContent = (sectionKey) => {
  const siteContent = getStoredSiteContent();
  return siteContent[sectionKey] ? deepClone(siteContent[sectionKey]) : null;
};

export const savePublishedSiteContent = (sectionKey, nextContent) => {
  const siteContent = getStoredSiteContent();
  siteContent[sectionKey] = deepClone(nextContent);
  saveStoredSiteContent(siteContent);

  if (typeof localStorage !== 'undefined') {
    const storedDbValue = localStorage.getItem(DB_STORAGE_KEY);
    if (storedDbValue) {
      try {
        const parsedDb = JSON.parse(storedDbValue);
        parsedDb.siteContent = deepClone(siteContent);
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(parsedDb));
      } catch {
        // Ignore malformed DB payloads and keep the content store updated.
      }
    }
  }

  return deepClone(siteContent[sectionKey]);
};

export const siteContentKeys = Object.keys(siteContentDefaults);

export { siteContentDefaults };
