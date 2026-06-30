import { useState, useEffect, useRef } from 'react';
import { getTestimonials } from '../utils/db';

const TestimonialCarousel = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const totalSlides = testimonials.length;

  const goTo = (index) => setCurrentIndex((index + totalSlides) % totalSlides);
  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, totalSlides]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((t) => (
            <div key={t.id} className="min-w-full flex justify-center px-2 sm:px-6">
              <div className="w-full max-w-2xl bg-surface rounded-2xl sm:rounded-3xl border border-outline-variant/10 shadow-lg hover:shadow-2xl flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-all duration-500">
                {/* Premium gradient top bar */}
                <div className="h-2 w-full bg-gradient-to-r from-secondary via-primary-fixed-dim to-secondary shrink-0" />

                <div className="p-8 sm:p-10 flex flex-col items-center text-center relative">
                  {/* Decorative quote mark — subtle */}
                  <span className="material-symbols-outlined text-primary/8 absolute top-6 right-8 scale-[4] md:scale-[5] select-none leading-none opacity-[0.06]">format_quote</span>

                  {/* Profile image with premium ring */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary to-primary p-[3px]">
                      <div className="w-full h-full rounded-full bg-surface" />
                    </div>
                    <img
                      alt={t.name}
                      loading={testimonials[0]?.id === t.id ? "eager" : "lazy"}
                      fetchpriority={testimonials[0]?.id === t.id ? "high" : "low"}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-surface relative z-10"
                      src={t.avatar || `https://ui-avatars.com/api/?name=${t.name}`}
                    />
                  </div>

                  {/* Name + role */}
                  <h4 className="font-headline-md text-xl font-bold text-on-surface mb-1">{t.name}</h4>
                  <p className="font-caption text-sm text-on-surface-variant mb-5">
                    {t.role} at <span className="font-semibold text-primary">{t.company}</span>
                  </p>

                  {/* Stars with rating value */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-secondary text-lg sm:text-xl fill-icon">star</span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant">5.0</span>
                  </div>

                  {/* Quote */}
                  <div className="relative w-full">
                    <p className="font-body-md text-on-surface-variant leading-relaxed italic text-base sm:text-lg max-w-lg mx-auto">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Bottom gradient accent */}
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-secondary/20 to-transparent shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface shadow-lg border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:shadow-xl hover:scale-110 active:scale-95 transition-all z-10 backdrop-blur-sm"
            aria-label="Previous testimonial"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            onClick={next}
            className="absolute right-0 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface shadow-lg border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:shadow-xl hover:scale-110 active:scale-95 transition-all z-10 backdrop-blur-sm"
            aria-label="Next testimonial"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </>
      )}

      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 sm:mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-500 ${
                i === currentIndex
                  ? 'w-10 h-2.5 bg-gradient-to-r from-secondary to-primary shadow-sm shadow-secondary/30'
                  : 'w-2.5 h-2.5 bg-outline-variant/30 hover:bg-outline-variant/60'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Interactive helpers (additive, do not touch original logic) ---------- */

const CountUp = ({ end, suffix = '', duration = 1400 }) => {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(Math.floor(eased * end));
              if (progress < 1) requestAnimationFrame(tick);
              else setValue(end);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};

// Button: magnetic pull + ripple + optional burst-of-particles on click
const InteractiveButton = ({ onClick, className = '', burst = false, children }) => {
  const btnRef = useRef(null);

  const handleMouseMove = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.12}px, ${y * 0.25}px) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (btnRef.current) btnRef.current.style.transform = '';
  };

  const spawnBurst = (btn, originX, originY) => {
    const colors = ['#ffffff', 'rgba(255,255,255,0.6)'];
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 40 + Math.random() * 30;
      p.style.position = 'absolute';
      p.style.left = `${originX}px`;
      p.style.top = `${originY}px`;
      p.style.width = p.style.height = `${4 + Math.random() * 3}px`;
      p.style.borderRadius = '9999px';
      p.style.background = colors[i % colors.length];
      p.style.pointerEvents = 'none';
      p.style.opacity = '0.9';
      p.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1), opacity 700ms ease-out';
      p.style.transform = 'translate(0,0) scale(1)';
      btn.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`;
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), 720);
    }
  };

  const handleClick = (e) => {
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;

      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.6;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '9999px';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${originX - size / 2}px`;
      ripple.style.top = `${originY - size / 2}px`;
      ripple.style.background = 'currentColor';
      ripple.style.opacity = '0.25';
      ripple.style.pointerEvents = 'none';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 600ms ease-out, opacity 600ms ease-out';
      btn.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 650);

      if (burst) spawnBurst(btn, originX, originY);
    }
    onClick?.(e);
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-transform duration-150 ease-out ${className}`}
    >
      {children}
    </button>
  );
};

const useTypewriter = (text, speed = 35, startDelay = 200) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    let timeoutId;
    const startTimeout = setTimeout(() => {
      const tick = () => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i < text.length) {
          timeoutId = setTimeout(tick, speed);
        }
      };
      tick();
    }, startDelay);
    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutId);
    };
  }, [text, speed, startDelay]);
  return displayed;
};

// 3D tilt wrapper for cards
const TiltCard = ({ children, className = '', maxTilt = 10 }) => {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - py) * maxTilt * 2;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

// Mini interactive "match quiz" — purely additive engagement widget, doesn't touch routing logic except reusing navigateTo
const MatchQuiz = ({ navigateTo }) => {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);

  const questions = [
    {
      q: "What's your primary goal right now?",
      options: ['Switch careers', 'Grow in current role', 'Land my first job', 'Start a business'],
    },
    {
      q: 'How experienced are you?',
      options: ['Just starting out', '1\u20133 years', '3\u20137 years', '7+ years'],
    },
  ];

  const handlePick = (opt) => {
    setAnswer(opt);
    setTimeout(() => {
      if (step < questions.length - 1) {
        setStep((s) => s + 1);
        setAnswer(null);
      } else {
        setStep(questions.length);
      }
    }, 350);
  };

  const reset = () => {
    setStep(0);
    setAnswer(null);
  };

  return (
    <div className="reveal-on-scroll reveal-scale max-w-2xl mx-auto bg-surface rounded-3xl border border-outline-variant/15 shadow-xl p-8 md:p-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-outline-variant/20">
        <div
          className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500 ease-out"
          style={{ width: `${(Math.min(step, questions.length) / questions.length) * 100}%` }}
        />
      </div>

      {step < questions.length ? (
        <div key={step} className="animate-[fadeSlide_400ms_ease-out]">
          <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-2">
            Quick Match &middot; Step {step + 1} of {questions.length}
          </p>
          <h3 className="font-headline-md text-xl md:text-2xl font-bold text-primary mb-6">
            {questions[step].q}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {questions[step].options.map((opt) => (
              <button
                key={opt}
                onClick={() => handlePick(opt)}
                className={`text-left px-5 py-4 rounded-xl border transition-all duration-200 font-semibold text-sm ${
                  answer === opt
                    ? 'bg-primary text-on-primary border-primary scale-[0.98]'
                    : 'bg-surface-container-low border-outline-variant/20 text-on-surface hover:border-primary hover:bg-primary-container/30 hover:-translate-y-0.5'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center animate-[fadeSlide_400ms_ease-out]">
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-3xl text-primary">celebration</span>
          </div>
          <h3 className="font-headline-md text-xl md:text-2xl font-bold text-primary mb-2">
            We've got mentors who fit.
          </h3>
          <p className="text-on-surface-variant mb-6">
            Create your free profile and we'll surface your best matches instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <InteractiveButton
              burst
              onClick={() => navigateTo('menteeRegistration')}
              className="bg-primary text-on-primary px-7 py-3 rounded-xl font-bold hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/30"
            >
              See My Matches
            </InteractiveButton>
            <button
              onClick={reset}
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ---------------------------------------------------------------------- */

const LandingPage = ({ navigateTo }) => {
  const [testimonials, setTestimonials] = useState(() => getTestimonials().filter(t => t.published));
  const mainRef = useRef(null);
  const journeyRef = useRef(null);
  const [visibleSteps, setVisibleSteps] = useState(new Set());

  const [scrollProgress, setScrollProgress] = useState(0);

  const heroRef = useRef(null);
  const [heroGlow, setHeroGlow] = useState({ x: 50, y: 50 });

  // Cursor trail dots in hero
  const trailContainerRef = useRef(null);

  const headlineLine1 = useTypewriter('Find your mentor,', 30, 150);
  const headlineLine2 = useTypewriter('shape your future', 30, 150 + 'Find your mentor,'.length * 30 + 150);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let lastSpawn = 0;
    const onMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setHeroGlow({ x, y });

      const now = performance.now();
      if (now - lastSpawn > 60 && trailContainerRef.current) {
        lastSpawn = now;
        const dot = document.createElement('span');
        dot.style.position = 'absolute';
        dot.style.left = `${e.clientX - rect.left}px`;
        dot.style.top = `${e.clientY - rect.top}px`;
        dot.style.width = dot.style.height = '5px';
        dot.style.borderRadius = '9999px';
        dot.style.background = 'rgba(255,255,255,0.55)';
        dot.style.pointerEvents = 'none';
        dot.style.transform = 'translate(-50%,-50%) scale(1)';
        dot.style.transition = 'opacity 700ms ease-out, transform 700ms ease-out';
        trailContainerRef.current.appendChild(dot);
        requestAnimationFrame(() => {
          dot.style.opacity = '0';
          dot.style.transform = 'translate(-50%,-50%) scale(0.2)';
        });
        setTimeout(() => dot.remove(), 720);
      }
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.dataset.animation === 'slide-right') {
                    entry.target.classList.add('opacity-100', 'translate-x-0');
                    entry.target.classList.remove('opacity-0', '-translate-x-16');
                } else if (entry.target.dataset.animation === 'scale-in') {
                    entry.target.classList.add('opacity-100', 'scale-100');
                    entry.target.classList.remove('opacity-0', 'scale-90');
                } else {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            }
        });
    }, observerOptions);

    if (mainRef.current) {
        const revealElements = mainRef.current.querySelectorAll('.reveal-on-scroll');
        revealElements.forEach((el, index) => {
            if (el.closest('#testimonials-section')) {
                el.dataset.animation = 'slide-right';
                el.classList.add('transition-all', 'duration-1000', 'opacity-0', '-translate-x-16');
                el.style.transitionDelay = `${index * 150}ms`;
            } else if (el.classList.contains('reveal-scale')) {
                el.dataset.animation = 'scale-in';
                el.classList.add('transition-all', 'duration-700', 'opacity-0', 'scale-90');
            } else {
                el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
            }
            observer.observe(el);
        });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!journeyRef.current) return;
    const steps = journeyRef.current.querySelectorAll('[data-journey-step]');
    if (steps.length === 0) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = entry.target.dataset.journeyStep;
          setVisibleSteps((prev) => new Set([...prev, idx]));
        }
      });
    }, { threshold: 0.2 });

    steps.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main ref={mainRef}>
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-secondary via-primary to-secondary transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[500px] md:min-h-[700px] lg:min-h-[819px] flex items-center justify-center overflow-hidden hero-gradient"
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80"
          >
            <source src="https://videos.pexels.com/video-files/5764741/5764741-uhd_3840_2160_24fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
        </div>

        {/* Pointer-follow glow */}
        <div
          className="absolute inset-0 z-[5] pointer-events-none transition-[background] duration-300 ease-out"
          style={{
            background: `radial-gradient(420px circle at ${heroGlow.x}% ${heroGlow.y}%, rgba(255,255,255,0.12), transparent 70%)`,
          }}
        />

        {/* Cursor trail layer */}
        <div ref={trailContainerRef} className="absolute inset-0 z-[6] pointer-events-none" />

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <div className="absolute top-[15%] left-[10%] w-16 h-16 border-2 border-white/10 rounded-full animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute top-[25%] right-[15%] w-12 h-12 border-2 border-white/20 rotate-45 animate-[float_6s_ease-in-out_infinite_reverse]" />
          <div className="absolute bottom-[30%] left-[20%] w-20 h-20 border-2 border-white/5 rounded-full animate-[float_10s_ease-in-out_infinite_1s]" />
          <div className="absolute bottom-[20%] right-[10%] w-14 h-14 border-2 border-white/15 rotate-[30deg] animate-[float_7s_ease-in-out_infinite_0.5s]" />
          <div className="absolute top-[50%] left-[50%] w-10 h-10 border border-white/10 rounded-full animate-[float_9s_ease-in-out_infinite_2s]" />
          <div className="absolute top-[10%] left-[40%] w-24 h-24 bg-white/[0.02] rounded-full blur-sm animate-[float_12s_ease-in-out_infinite_0.3s]" />
          <div className="absolute bottom-[40%] right-[30%] w-8 h-8 border border-white/10 rotate-12 animate-[float_5s_ease-in-out_infinite_1.5s]" />
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}</style>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center py-16 sm:py-24">

          {/* Rotating tagline badge */}
          <RotatingBadge />

          <h1 className="reveal-on-scroll font-headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-on-primary mb-6 sm:mb-8 max-w-4xl mx-auto font-bold tracking-tight leading-[1.1] min-h-[2.2em] sm:min-h-0">
            {headlineLine1}
            <br />
            {headlineLine2}
            <span className="inline-block w-[2px] h-[0.9em] bg-on-primary/70 ml-1 align-middle animate-pulse" />
          </h1>
          <p className="reveal-on-scroll font-body-md text-lg md:text-xl text-on-primary/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connect with industry leaders for personalized career growth. Our AI-driven platform matches your unique goals with world-class expertise.
          </p>
          <div className="reveal-on-scroll flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <InteractiveButton
              burst
              onClick={() => navigateTo('menteeRegistration')}
              className="group w-full sm:w-auto bg-on-primary text-primary px-8 py-4 rounded-xl font-headline-md text-lg font-bold hover:bg-on-primary/90 active:scale-95 shadow-xl shadow-primary/30"
            >
              <span className="flex items-center justify-center gap-2">
                Get Started as Mentee
              </span>
            </InteractiveButton>
            <InteractiveButton
              burst
              onClick={() => navigateTo('mentorRegistration')}
              className="group w-full sm:w-auto bg-secondary text-on-secondary px-8 py-4 rounded-xl font-headline-md text-lg font-bold hover:bg-secondary/90 active:scale-95 border border-on-primary/10 shadow-xl shadow-secondary/30"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-on-secondary">school</span>
                Become a Mentor
              </span>
            </InteractiveButton>
          </div>

          {/* Animated stats strip */}
          <div className="reveal-on-scroll mt-14 sm:mt-16 grid grid-cols-3 gap-4 sm:gap-10 max-w-2xl mx-auto">
            {[
              { end: 5000, suffix: '+', label: 'Mentees Matched' },
              { end: 850, suffix: '+', label: 'Expert Mentors' },
              { end: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="font-headline-md text-2xl sm:text-4xl font-bold text-on-primary">
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-on-primary/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
          <span className="text-on-primary/50 text-xs font-semibold tracking-widest uppercase">Scroll</span>
          <span className="material-symbols-outlined text-on-primary/50 text-xl">expand_more</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="reveal-on-scroll inline-flex items-center gap-2 rounded-full bg-primary-container/40 px-4 py-2 text-xs font-bold text-primary mb-4 border border-primary/10">
            <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
            What We Offer
          </div>
          <h2 className="reveal-on-scroll font-headline-lg text-3xl md:text-4xl font-bold text-primary mb-4">Precision-Crafted Mentorship</h2>
          <div className="reveal-on-scroll h-1 w-24 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'psychology', title: 'AI Matching', desc: 'Our intelligent algorithm analyzes your career path and aspirations to find the perfect professional counterpart.', gradient: 'from-primary/5 via-primary/10 to-transparent' },
            { icon: 'video_chat', title: 'Video Sessions', desc: 'High-definition integrated video calls with automated scheduling, note-taking, and resource sharing features.', gradient: 'from-secondary/5 via-secondary/10 to-transparent' },
            { icon: 'explore', title: 'Career Guidance', desc: 'Receive personalized roadmaps, interview preparation, and portfolio reviews from veterans in your chosen industry.', gradient: 'from-tertiary/5 via-tertiary/10 to-transparent' },
          ].map((feature, idx) => (
            <TiltCard
              key={idx}
              className="reveal-on-scroll group relative bg-surface rounded-2xl border border-outline-variant/15 shadow-sm hover:shadow-2xl"
            >
              <div
                style={{ transitionDelay: `${idx * 100}ms` }}
                className={`absolute inset-0 bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{
                  background: 'radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.10), transparent 70%)',
                }}
              />
              <div className="relative p-8" style={{ transform: 'translateZ(30px)' }}>
                <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl text-primary">{feature.icon}</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-primary mb-3 group-hover:translate-x-1 transition-transform duration-300">{feature.title}</h3>
                <p className="font-body-md text-on-surface-variant leading-relaxed">{feature.desc}</p>
              </div>
              <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-b-2xl" />
            </TiltCard>
          ))}
        </div>
      </section>

      {/* How It Works — Your Path to Mastery */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        {/* Premium layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-container-low to-surface" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] dot-grid text-on-surface pointer-events-none" />
        {/* Floating accent shapes */}
        <div className="absolute top-[20%] right-[8%] w-24 h-24 border border-primary/10 rounded-2xl rotate-12 hidden lg:block" />
        <div className="absolute bottom-[15%] left-[5%] w-32 h-32 border border-secondary/10 rounded-full hidden lg:block" />

        <div ref={journeyRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header — redesigned */}
          <div className="text-center mb-16 sm:mb-24">
            <div className="reveal-on-scroll inline-flex items-center gap-2 rounded-full bg-primary-container/50 px-4 py-2 text-xs font-bold text-on-primary-container mb-6 border border-primary/10">
              <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <span className="font-bold tracking-tight text-primary border-r border-on-primary-container/30 pr-2">ProLign</span>
              Your Path to Mastery
            </div>
            <h2 className="reveal-on-scroll text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-on-surface leading-[1.15] mb-5">
              Your Journey to{' '}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Professional Growth</span>
            </h2>
            <p className="reveal-on-scroll text-on-surface-variant text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Join ProLign in just a few simple steps and connect with experienced mentors who will help accelerate your career.
            </p>
            {/* Progress indicator */}
            <div className="reveal-on-scroll mt-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                4 steps
              </span>
              <span className="text-on-surface-variant/40">&bull;</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                ~5 minutes
              </span>
            </div>
          </div>

          {/* Journey Roadmap */}
          <div className="relative">
            {/* Connector Line — Desktop — redesigned with glow */}
            <div className="hidden lg:block absolute top-[76px] left-[calc(12.5%+28px)] right-[calc(12.5%+28px)] h-[4px]">
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-full" />
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary via-primary to-secondary rounded-full transition-all duration-1000 ease-out shadow-md"
                style={{
                  width: visibleSteps.size >= 4 ? '100%' : visibleSteps.size >= 3 ? '66%' : visibleSteps.size >= 2 ? '33%' : visibleSteps.size >= 1 ? '0%' : '0%',
                }}
              />
            </div>

            {/* Connector Line — Tablet (2-col) */}
            <div className="hidden sm:block lg:hidden absolute top-[76px] left-[25%] right-[25%] h-[4px]">
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 rounded-full" />
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary via-primary to-secondary rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: visibleSteps.size >= 4 ? '100%' : visibleSteps.size >= 3 ? '66%' : visibleSteps.size >= 2 ? '33%' : visibleSteps.size >= 1 ? '0%' : '0%' }}
              />
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
              {[
                {
                  num: '01',
                  icon: 'person_add',
                  title: 'Create Your Account',
                  description: 'Register as a Mentor or Mentee and create your professional profile in just a few minutes.',
                  outcome: 'Profile created & verified',
                  color: 'primary',
                },
                {
                  num: '02',
                  icon: 'psychology',
                  title: 'AI Career Assessment',
                  description: 'Answer a few questions so our AI can understand your goals, strengths, and career aspirations.',
                  outcome: 'Goals mapped & aligned',
                  color: 'secondary',
                },
                {
                  num: '03',
                  icon: 'handshake',
                  title: 'Get Matched',
                  description: 'Receive personalized mentor recommendations based on your skills, interests, and career objectives.',
                  outcome: 'Perfect mentor found',
                  color: 'tertiary',
                },
                {
                  num: '04',
                  icon: 'calendar_month',
                  title: 'Book Your First Session',
                  description: 'Choose an available time, confirm your booking, and begin your mentorship journey.',
                  outcome: 'First session scheduled',
                  color: 'primary',
                },
              ].map((step, idx) => {
                const isVisible = visibleSteps.has(String(idx));
                const isCompleted = isVisible && (idx === 0 || visibleSteps.has(String(idx - 1)));
                return (
                  <div
                    key={idx}
                    data-journey-step={idx}
                    className={`relative flex flex-col items-center text-center transition-all duration-500 ease-out ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ transitionDelay: `${idx * 150}ms` }}
                  >
                    {/* Step Number Badge — premium glass gradient */}
                    <div
                      className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-base mb-6 transition-all duration-500 ${
                        isVisible ? 'scale-100' : 'scale-0'
                      } ${step.color === 'primary'
                          ? 'bg-gradient-to-br from-primary/90 to-primary text-on-primary shadow-lg shadow-primary/25'
                          : step.color === 'secondary'
                          ? 'bg-gradient-to-br from-secondary/90 to-secondary text-on-secondary shadow-lg shadow-secondary/25'
                          : 'bg-gradient-to-br from-tertiary/90 to-tertiary text-on-tertiary shadow-lg shadow-tertiary/25'
                      }`}
                      style={{ transitionDelay: `${idx * 150 + 200}ms` }}
                    >
                      <span className="relative z-10">{step.num}</span>
                      {/* Glass overlay */}
                      <div className="absolute inset-0 rounded-2xl bg-white/10" />
                    </div>

                    {/* Card — redesigned premium */}
                    <div className="flex-1 w-full bg-surface rounded-2xl p-7 border border-outline-variant/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-primary/25 transition-all duration-300 group cursor-default relative overflow-hidden">
                      {/* Hover gradient accent */}
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                        step.color === 'primary' ? 'bg-gradient-to-b from-primary/[0.03] to-transparent'
                          : step.color === 'secondary' ? 'bg-gradient-to-b from-secondary/[0.03] to-transparent'
                          : 'bg-gradient-to-b from-tertiary/[0.03] to-transparent'
                      }`} />
                      {/* Top accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${
                        step.color === 'primary' ? 'bg-gradient-to-r from-primary to-secondary'
                          : step.color === 'secondary' ? 'bg-gradient-to-r from-secondary to-primary'
                          : 'bg-gradient-to-r from-tertiary to-primary'
                      }`} />

                      <div className="relative z-10">
                        {/* Icon — larger, better container */}
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                          step.color === 'primary'
                            ? 'bg-primary-container text-primary group-hover:shadow-lg group-hover:shadow-primary/20'
                            : step.color === 'secondary'
                            ? 'bg-secondary-container text-secondary group-hover:shadow-lg group-hover:shadow-secondary/20'
                            : 'bg-tertiary-container text-tertiary group-hover:shadow-lg group-hover:shadow-tertiary/20'
                        }`}>
                          <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                        </div>

                        <h3 className="text-lg font-bold text-on-surface mb-3 group-hover:text-primary transition-colors duration-300">{step.title}</h3>
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{step.description}</p>

                        {/* Outcome badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/30 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          {step.outcome}
                        </div>
                      </div>
                    </div>

                    {/* Mobile/Tablet Connector (vertical) */}
                    {idx < 3 && (
                      <div className="sm:hidden w-0.5 h-10 bg-gradient-to-b from-primary/30 to-primary/10 my-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Benefits — redesigned premium badges */}
          <div className="reveal-on-scroll mt-20 sm:mt-24">
            <div className="text-center mb-10">
              <p className="text-xs font-bold text-primary uppercase tracking-[0.15em]">Why ProLign</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: 'psychology', text: 'Personalized AI Matching' },
                { icon: 'verified', text: 'Verified Professional Mentors' },
                { icon: 'lock', text: 'Secure Session Booking' },
                { icon: 'trending_up', text: 'Continuous Career Growth' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group relative bg-surface rounded-xl border border-outline-variant/10 p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/40 group-hover:bg-primary-container group-hover:scale-110 transition-all duration-300">
                    <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                  </div>
                  <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors duration-300">{item.text}</span>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="material-symbols-outlined text-[10px] text-primary">check_small</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Match Quiz — engaging mini-interaction */}
      <section className="py-24 px-6 bg-gradient-to-b from-surface-container-low/40 to-transparent">
        <div className="text-center mb-12">
          <div className="reveal-on-scroll inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-4 py-2 text-xs font-bold text-tertiary mb-4 border border-tertiary/10">
            <span className="material-symbols-outlined text-[14px] text-tertiary">bolt</span>
            30-Second Match
          </div>
          <h2 className="reveal-on-scroll font-headline-lg text-3xl md:text-4xl font-bold text-primary">Find Your Fit, Instantly</h2>
        </div>
        <MatchQuiz navigateTo={navigateTo} />
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="py-24 px-6 overflow-hidden relative">
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low/60 via-surface-container/30 to-surface-container-low/40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-secondary/5 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="reveal-on-scroll inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-secondary/15 to-primary/15 px-5 py-2 text-xs font-bold text-secondary mb-4 shadow-sm backdrop-blur-sm">
              <span className="material-symbols-outlined text-[16px]">forum</span>
              Testimonials
            </div>
            <h2 className="reveal-on-scroll font-headline-lg text-3xl md:text-4xl lg:text-5xl font-bold text-primary mt-3">
              Voices of Success
            </h2>
            <p className="reveal-on-scroll text-on-surface-variant max-w-xl mx-auto mt-4 text-base md:text-lg leading-relaxed">
              Real stories from mentors and mentees who transformed their professional journey through ProLign
            </p>
            <div className="reveal-on-scroll h-1 w-24 bg-gradient-to-r from-secondary to-primary mx-auto rounded-full mt-5" />
          </div>

          {testimonials.length > 0 && <TestimonialCarousel testimonials={testimonials} />}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="reveal-on-scroll reveal-scale max-w-7xl mx-auto bg-gradient-to-br from-primary via-primary to-primary-container rounded-3xl p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-on-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-on-primary)_0%,_transparent_70%)] opacity-5" />

          <div className="relative z-10">
            <h2 className="font-headline-lg text-3xl md:text-5xl font-bold text-on-primary mb-6">Ready to build your bridge?</h2>
            <p className="text-on-primary/70 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of professionals who have transformed their careers through meaningful mentorship.
            </p>
            <InteractiveButton
              burst
              onClick={() => navigateTo('menteeRegistration')}
              className="group bg-on-primary text-primary px-10 py-4 rounded-xl font-headline-md text-lg font-bold hover:bg-on-primary/90 active:scale-95 shadow-xl shadow-black/20 inline-flex items-center gap-2"
            >
              Join Today
            </InteractiveButton>
          </div>
        </div>
      </section>
    </main>
  );
};

// Rotating tagline chip above the headline
const RotatingBadge = () => {
  const taglines = ['1,200+ sessions booked this week', '850+ verified mentors online', 'New matches every hour'];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % taglines.length), 2800);
    return () => clearInterval(id);
  }, [taglines.length]);

  return (
    <div className="reveal-on-scroll inline-flex items-center gap-2 rounded-full bg-on-primary/10 backdrop-blur-sm px-4 py-2 text-xs font-bold text-on-primary mb-6 border border-on-primary/20 min-w-[260px] justify-center">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
      </span>
      <span key={idx} className="animate-[fadeIn_400ms_ease-out]">{taglines[idx]}</span>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;