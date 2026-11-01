import React, { useState } from 'react';
import { TIME_CONTROLS, TimeControl } from '../types/chess';
import { X, Shield, Swords, Zap, Timer, Award } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (timeControl: TimeControl, preferredColor: 'w' | 'b' | 'random') => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
}) => {
  const [selectedTimeControlKey, setSelectedTimeControlKey] = useState<string>('5+0');
  const [preferredColor, setPreferredColor] = useState<'w' | 'b' | 'random'>('random');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tc = TIME_CONTROLS[selectedTimeControlKey] || TIME_CONTROLS['5+0'];
    onCreateRoom(tc, preferredColor);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Bullet':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'Blitz':
        return <Timer className="w-3.5 h-3.5 text-yellow-400" />;
      case 'Rapid':
        return <Swords className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Award className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white">Create Private Match</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Generate a custom room code or invite link to play with a friend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Time Control selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Time Control
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TIME_CONTROLS).map(([key, tc]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedTimeControlKey(key)}
                  className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                    selectedTimeControlKey === key
                      ? 'bg-amber-500/20 border-amber-400/60 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{tc.name}</span>
                    {getCategoryIcon(tc.category)}
                  </div>
                  <span className="text-[11px] text-slate-400">{tc.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Preference */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Play As
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreferredColor('w')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  preferredColor === 'w'
                    ? 'bg-slate-100 text-slate-900 border-white font-bold'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                <span>White</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredColor('random')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  preferredColor === 'random'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>🎲 Random</span>
              </button>

              <button
                type="button"
                onClick={() => setPreferredColor('b')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  preferredColor === 'b'
                    ? 'bg-slate-800 text-white border-slate-500 font-bold'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600 inline-block" />
                <span>Black</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Create Room & Get Link
          </button>
        </form>
      </div>
    </div>
  );
};
