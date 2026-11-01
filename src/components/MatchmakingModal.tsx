import React, { useState, useEffect } from 'react';
import { X, Swords, Zap, Timer, Loader2 } from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  timeControlId: string;
  onCancel: () => void;
  onChangeTimeControl: (tcId: string) => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  timeControlId,
  onCancel,
  onChangeTimeControl,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timeControlOptions = [
    { id: '1+0', name: '1 min Bullet', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { id: '3+0', name: '3 min Blitz', icon: <Timer className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: '5+0', name: '5 min Rapid', icon: <Swords className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: '10+0', name: '10 min Rapid', icon: <Timer className="w-3.5 h-3.5 text-blue-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Searching Radar animation */}
        <div className="relative w-20 h-20 mx-auto my-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full border border-amber-400/40 animate-pulse" />
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Swords className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Searching for Opponent...</h3>
        <p className="text-xs text-slate-400 mb-4">
          Finding a player with similar rating in real time
        </p>

        {/* Timer display */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 font-mono text-xs font-semibold text-amber-400 mb-5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Queue time: {formatTimer(secondsElapsed)}</span>
        </div>

        {/* Time control selector */}
        <div className="mb-5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Selected Format
          </span>
          <div className="grid grid-cols-2 gap-2">
            {timeControlOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeTimeControl(opt.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  timeControlId === opt.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                }`}
              >
                {opt.icon}
                <span>{opt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
        >
          Cancel Queue
        </button>
      </div>
    </div>
  );
};
