import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getCurrentUser } from '../utils/db';

export default function WaitingForApproval({ navigateTo }) {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const user = getCurrentUser();
      if (user && user.status && user.status !== 'pending') {
        clearInterval(interval);
        toast.success('Your mentor application has been approved! You can now start using the platform.', {
          position: 'top-right',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClose: () => navigateTo('mentor-dashboard'),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [navigateTo]);

  const steps = [
    { icon: 'rate_review', label: 'Review', description: 'Our team carefully reviews your credentials and experience.', color: 'text-primary' },
    { icon: 'checklist', label: 'Decision', description: 'You will receive an email with the outcome of the review.', color: 'text-secondary' },
    { icon: 'rocket_launch', label: 'Onboarding', description: 'Get started with setting up your profile and availability.', color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className={`bg-surface-container-low rounded-3xl shadow-sm border border-outline-variant/10 p-6 sm:p-10 lg:p-12 transition-all duration-700 ${animationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/5 flex items-center justify-center animate-[successPop_0.4s_ease-out]">
                <span className="material-symbols-outlined text-6xl sm:text-7xl text-secondary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>
                  hourglass
                </span>
              </div>
              <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-secondary flex items-center justify-center animate-[chatbot-bounce-in_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)_0.3s_both]">
                <span className="material-symbols-outlined text-sm text-on-secondary" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
                  schedule
                </span>
              </span>
            </div>

            <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl text-on-surface mb-3">
              Application Under Review
            </h1>

            <p className="text-on-surface-variant text-base sm:text-lg max-w-lg mx-auto mb-6 leading-relaxed">
              Your mentor application has been submitted successfully. Our team is reviewing your credentials and experience.
            </p>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full status-pending text-sm font-semibold mb-8">
              <span className="material-symbols-outlined text-sm">pending</span>
              Pending Review
            </span>

            <div className="w-full bg-surface-container-high/50 rounded-2xl p-5 sm:p-6 mb-8 border border-outline-variant/5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                <span className="font-semibold text-on-surface">Estimated Time</span>
              </div>
              <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
                Typically reviewed within <strong className="text-on-surface">24-48 hours</strong>. You will receive an email notification once the review is complete.
              </p>
            </div>

            <div className="w-full mb-8">
              <h2 className="font-headline-md text-xl sm:text-2xl text-on-surface mb-6">What Happens Next</h2>
              <div className="grid gap-4 sm:gap-5">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-start gap-4 bg-surface-container-high/30 rounded-xl p-4 sm:p-5 border border-outline-variant/5 transition-all duration-300 hover:bg-surface-container-high/60">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className={`material-symbols-outlined ${step.color}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                          {step.icon}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-6 bg-outline-variant/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Step {index + 1}</span>
                        <h3 className="font-semibold text-on-surface">{step.label}</h3>
                      </div>
                      <p className="text-sm text-on-surface-variant">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full bg-primary/5 rounded-2xl p-5 sm:p-6 mb-8 border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                    support
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-on-surface mb-1">Need Help?</h3>
                  <p className="text-sm text-on-surface-variant mb-3">
                    If you have any questions about your application or need to provide additional information, please contact our support team.
                  </p>
                  <a
                    href="mailto:support@prolign.com"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-fixed-dim transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">mail</span>
                    support@prolign.com
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm sm:text-base hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">home</span>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
