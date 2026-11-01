import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, Home, Eye } from 'lucide-react';
import { Color } from '../types/chess';
import { sounds } from '../lib/sound';

interface GameOverModalProps {
  winner: Color | 'draw' | null;
  endReason: string | null;
  playerColor?: Color | null;
  whiteRatingDelta?: number;
  blackRatingDelta?: number;
  rematchRequestedBy: string | null;
  currentUserId: string;
  onRematch: () => void;
  onReturnToLobby: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  endReason,
  playerColor,
  whiteRatingDelta = 0,
  blackRatingDelta = 0,
  rematchRequestedBy,
  currentUserId,
  onRematch,
  onReturnToLobby,
  onClose,
}) => {
  const isDraw = winner === 'draw';
  const isSpectator = !playerColor;
  const isVictory = !isSpectator && !isDraw && winner === playerColor;
  const isDefeat = !isSpectator && !isDraw && winner !== playerColor;

  const playerRatingDelta = playerColor === 'w' ? whiteRatingDelta : blackRatingDelta;

  useEffect(() => {
    if (isVictory) {
      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f59e0b', '#38bdf8', '#ffffff'],
      });
    } else if (isDefeat) {
      sounds.playDefeat();
    }
  }, [isVictory, isDefeat]);

  const formattedReason = React.useMemo(() => {
    switch (endReason) {
      case 'checkmate':
        return 'by Checkmate';
      case 'resignation':
        return 'by Resignation';
      case 'timeout':
        return 'on Time';
      case 'stalemate':
        return 'by Stalemate';
      case 'insufficient_material':
        return 'by Insufficient Material';
      case 'threefold_repetition':
        return 'by Threefold Repetition';
      case 'draw_agreement':
        return 'by Mutual Agreement';
      case '50_moves':
        return 'by 50-Move Rule';
      case 'abandoned':
        return 'by Disconnection / Abandonment';
      default:
        return '';
    }
  }, [endReason]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full text-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glow Header Background */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 opacity-15 pointer-events-none ${
            isVictory
              ? 'bg-gradient-to-b from-amber-400 to-transparent'
              : isDefeat
              ? 'bg-gradient-to-b from-red-500 to-transparent'
              : 'bg-gradient-to-b from-blue-400 to-transparent'
          }`}
        />

        {/* Icon & Title */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
              isVictory
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-400'
                : isDefeat
                ? 'bg-red-500/20 border-red-400/50 text-red-400'
                : 'bg-blue-500/20 border-blue-400/50 text-blue-400'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-7 h-7" />
            ) : isDefeat ? (
              <Award className="w-7 h-7" />
            ) : (
              <Award className="w-7 h-7" />
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-white mb-1">
          {isSpectator
            ? winner === 'draw'
              ? 'Game Drawn'
              : `${winner === 'w' ? 'White' : 'Black'} Won!`
            : isVictory
            ? 'Victory!'
            : isDefeat
            ? 'Defeat'
            : 'Draw'}
        </h3>

        <p className="text-xs text-slate-400 mb-4">{formattedReason}</p>

        {/* Rating Delta */}
        {!isSpectator && playerRatingDelta !== 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold mb-5">
            <span className="text-slate-400">Rating:</span>
            <span
              className={
                playerRatingDelta > 0
                  ? 'text-emerald-400'
                  : playerRatingDelta < 0
                  ? 'text-red-400'
                  : 'text-slate-300'
              }
            >
              {playerRatingDelta > 0 ? `+${playerRatingDelta}` : playerRatingDelta}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-2">
          {!isSpectator && (
            <button
              onClick={onRematch}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                rematchRequestedBy === currentUserId
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {rematchRequestedBy === currentUserId
                  ? 'Rematch Requested...'
                  : rematchRequestedBy
                  ? 'Accept Rematch'
                  : 'Request Rematch'}
              </span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review Board</span>
            </button>

            <button
              onClick={onReturnToLobby}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
