import React, { useState } from 'react';
import { RotateCcw, Undo2, Plus, Volume2, VolumeX, Flag, Bot, Palette } from 'lucide-react';
import { sounds } from '../lib/sound';

interface BotGameControlsProps {
  canUndo: boolean;
  isGameInProgress: boolean;
  isBotThinking: boolean;
  boardTheme: 'walnut' | 'navy' | 'emerald';
  botName: string;
  botLevel: number;
  onUndo: () => void;
  onRestart: () => void;
  onNewGame: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onChangeBoardTheme: (theme: 'walnut' | 'navy' | 'emerald') => void;
}

export const BotGameControls: React.FC<BotGameControlsProps> = ({
  canUndo,
  isGameInProgress,
  isBotThinking,
  boardTheme,
  botName,
  botLevel,
  onUndo,
  onRestart,
  onNewGame,
  onFlipBoard,
  onResign,
  onChangeBoardTheme,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  const toggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800">
      {/* Primary Game Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Undo Move */}
        <button
          onClick={onUndo}
          disabled={!canUndo || isBotThinking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold disabled:opacity-40 transition-colors"
          title="Take back your last move"
        >
          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Undo Move</span>
        </button>

        {/* Restart Game */}
        <button
          onClick={onRestart}
          disabled={isBotThinking}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
          title="Restart match from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>

        {/* New Game / Change Difficulty */}
        <button
          onClick={onNewGame}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-colors"
          title="Start new bot match or change difficulty"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>

        {/* Resign or Sound */}
        {isGameInProgress ? (
          <button
            onClick={onResign}
            disabled={isBotThinking}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-800/40 text-xs font-semibold transition-colors"
            title="Resign against bot"
          >
            <Flag className="w-3.5 h-3.5 text-red-400" />
            <span>Resign</span>
          </button>
        ) : (
          <button
            onClick={toggleSound}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>{soundEnabled ? 'Sound' : 'Muted'}</span>
          </button>
        )}
      </div>

      {/* Secondary Row: Theme & Flip & Status */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">Theme:</span>
          {(['navy', 'walnut', 'emerald'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChangeBoardTheme(t)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-colors ${
                boardTheme === t
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onFlipBoard}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Flip</span>
          </button>

          <span className="text-[11px] text-purple-300 font-medium">
            AI Lvl {botLevel}
          </span>
        </div>
      </div>
    </div>
  );
};
