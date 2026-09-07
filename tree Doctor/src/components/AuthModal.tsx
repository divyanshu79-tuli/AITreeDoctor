import React, { useState } from 'react';
import { X, Sprout, ShieldCheck, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signInAnonymously } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
      setLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Guest Sign-In Error:', err);
      setError(err.message || 'Guest Sign-In failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sprout className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-emerald-950">
            Save Diagnoses & Garden
          </h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Sign in to access your diagnosed plant prescriptions, watering logs, and treatments across devices.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            id="btn-signin-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-stone-50 text-stone-900 font-bold rounded-full border border-stone-300 shadow-2xs hover:border-stone-400 transition-all text-xs uppercase tracking-wider disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <button
            id="btn-signin-guest"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold uppercase tracking-wider rounded-full transition-all text-xs disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-stone-500" />
            <span>Continue as Guest (Instant Local Sync)</span>
          </button>
        </div>

        {/* Benefits list */}
        <div className="mt-5 pt-4 border-t border-stone-100 text-[11px] text-stone-500 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Firestore encrypted storage for plant health history</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>Reminders for watering and fertilizer schedules</span>
          </div>
        </div>
      </div>
    </div>
  );
};
