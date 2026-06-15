/**
 * OTPModal Component
 * Reusable modal for email verification via OTP
 * Props:
 *   - isOpen: boolean
 *   - onVerify: callback when user submits OTP
 *   - onClose: callback to close modal
 *   - onResend: callback to resend OTP
 *   - email: string (optional, for display)
 */

import React, { useState, useEffect } from 'react';

export default function OTPModal({ isOpen, onVerify, onClose, onResend, email }) {
  const [otp, setOtp] = useState(['', '', '', '']);

  // Auto-focus first input on modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const inputs = document.querySelectorAll('.otp-input');
      inputs[0]?.focus();
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      document.querySelectorAll('.otp-input')[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.querySelectorAll('.otp-input')[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      onVerify(otpCode);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-on-background/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-gutter pointer-events-none">
        <div
          className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-base shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-base">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl">mail</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary">Verify Email</h3>
            <p className="text-on-surface-variant font-body-md mt-2">
              Enter the 4-digit code sent to your email.
            </p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-4 mb-base">
            {otp.map((digit, index) => (
              <input
                key={index}
                className="otp-input w-14 h-16 bg-surface-container-high border-2 border-transparent text-center text-2xl font-bold rounded-xl focus:border-secondary focus:outline-none transition-colors"
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.join('').length < 4}
            className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify & Continue
          </button>

          {/* Resend Link */}
          <p className="text-center mt-4 font-label-sm text-label-sm text-on-surface-variant">
            Didn't receive a code?{' '}
            <button
              onClick={onResend}
              className="text-secondary font-bold hover:underline"
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
