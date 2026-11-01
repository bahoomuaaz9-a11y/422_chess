import React, { useState } from 'react';
import { signInWithGoogle, getSupabaseConfig } from '../lib/supabase';
import { X, Sparkles, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestLogin: (username: string, avatarUrl: string) => void;
  onOpenSupabaseSetup: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGuestLogin,
  onOpenSupabaseSetup,
}) => {
  const [guestName, setGuestName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setLoadingGoogle(true);
    setErrorMsg('');
    const config = getSupabaseConfig();

    if (!config.isConfigured) {
      setLoadingGoogle(false);
      setErrorMsg(
        'Supabase is not configured yet. Click "Configure Supabase" below or play with a username profile.'
      );
      return;
    }

    const { error } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (error) {
      setErrorMsg(error.message);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorMsg('Please enter a username');
      return;
    }
    onGuestLogin(guestName.trim(), selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Join Chess Arena</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Play real-time multiplayer chess with friends worldwide
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Google OAuth Button */}
        <button
          onClick={handleGoogleClick}
          disabled={loadingGoogle}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-white hover:bg-slate-100 text-slate-900 flex items-center justify-center gap-3 shadow-md transition-all active:scale-98 disabled:opacity-50 mb-3"
        >
          {/* Google SVG Icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{loadingGoogle ? 'Connecting...' : 'Sign in with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-semibold">
            Or Play With Custom Name
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* 2. Custom Handle / Guest Form */}
        <form onSubmit={handleGuestSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Choose Avatar
            </label>
            <div className="flex justify-between gap-1.5 mb-2">
              {AVATAR_OPTIONS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-xl overflow-hidden border transition-all ${
                    selectedAvatar === av
                      ? 'border-amber-400 scale-105 shadow-xs shadow-amber-400/20'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Player Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. ChessWizard99"
                maxLength={20}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-colors shadow-md"
          >
            Start Playing
          </button>
        </form>

        {/* Footer info link */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onOpenSupabaseSetup}
            className="text-[11px] text-amber-400/90 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>Configure Supabase & Google OAuth</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
