import React, { useState } from 'react';
import { BOT_LEVELS, BotLevelInfo } from '../lib/botEngine';
import { TIME_CONTROLS, TimeControl, Color } from '../types/chess';
import { X, Bot, Zap, Timer, Swords, Award, Sparkles, ChevronRight } from 'lucide-react';

interface BotSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBotGame: (level: number, playerColor: Color, timeControl: TimeControl) => void;
}

export const BotSetupModal: React.FC<BotSetupModalProps> = ({
  isOpen,
  onClose,
  onStartBotGame,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(4); // Default to Normal (1400)
  const [selectedColorPreference, setSelectedColorPreference] = useState<'w' | 'b' | 'random'>('w');
  const [selectedTimeControlKey, setSelectedTimeControlKey] = useState<string>('5+0');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenColor: Color =
      selectedColorPreference === 'w'
        ? 'w'
        : selectedColorPreference === 'b'
        ? 'b'
        : Math.random() > 0.5
        ? 'w'
        : 'b';

    const tc = TIME_CONTROLS[selectedTimeControlKey] || TIME_CONTROLS['5+0'];
    onStartBotGame(selectedLevel, chosenColor, tc);
    onClose();
  };

  const currentLevelInfo = BOT_LEVELS.find((l) => l.level === selectedLevel) || BOT_LEVELS[3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Play vs Computer Bot</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
                Stockfish Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Select difficulty from Beginner (800) to Maximum Grandmaster (2600+)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
          {/* Active Bot Preview Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-slate-800/60 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={currentLevelInfo.avatar}
                alt={currentLevelInfo.name}
                className="w-12 h-12 rounded-xl object-cover bg-slate-800 border-2 border-purple-400/50 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{currentLevelInfo.name}</span>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded">
                    ~{currentLevelInfo.rating} ELO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{currentLevelInfo.description}</p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-400 shrink-0 font-mono">
              Lvl {currentLevelInfo.level}/10
            </span>
          </div>

          {/* 10 Difficulty Levels Selector Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select AI Difficulty Level (1 - 10)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {BOT_LEVELS.map((bot) => (
                <button
                  type="button"
                  key={bot.level}
                  onClick={() => setSelectedLevel(bot.level)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    selectedLevel === bot.level
                      ? 'bg-purple-500/25 border-purple-400 shadow-md scale-[1.02]'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs font-bold text-white">Lvl {bot.level}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {bot.name.replace(' Bot', '')}
                  </span>
                  <span className="text-[9px] font-mono text-amber-400 mt-0.5">
                    {bot.rating}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Side / First Move Choice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Color & Move Order
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedColorPreference('w')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  selectedColorPreference === 'w'
                    ? 'bg-slate-100 text-slate-900 border-white font-bold shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                <span>White (1st)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedColorPreference('random')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  selectedColorPreference === 'random'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>🎲 Random</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedColorPreference('b')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                  selectedColorPreference === 'b'
                    ? 'bg-slate-800 text-white border-slate-400 font-bold shadow-md'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600 inline-block" />
                <span>Black (2nd)</span>
              </button>
            </div>
          </div>

          {/* Time Controls */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Game Clock
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {Object.entries(TIME_CONTROLS).map(([key, tc]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedTimeControlKey(key)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    selectedTimeControlKey === key
                      ? 'bg-purple-500/20 border-purple-400/80 font-bold text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs block font-bold">{tc.name}</span>
                  <span className="text-[10px] opacity-75">{tc.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Start Match vs {currentLevelInfo.name}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
