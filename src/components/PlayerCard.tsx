import React, { useMemo } from 'react';
import { GamePlayer, Color, PieceSymbol } from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { WifiOff, Clock } from 'lucide-react';

interface PlayerCardProps {
  player: GamePlayer | null;
  color: Color;
  isTurn: boolean;
  capturedPieces: PieceSymbol[];
  materialAdvantage: number;
  timeControlCategory?: string;
}

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  color,
  isTurn,
  capturedPieces,
  materialAdvantage,
  timeControlCategory,
}) => {
  const isWhite = color === 'w';

  // Format millisecond timer into mm:ss
  const formattedTime = useMemo(() => {
    if (!player) return '--:--';
    if (timeControlCategory === 'Casual') return '∞';

    const totalSeconds = Math.max(0, Math.floor(player.timeLeftMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Show tenths of a second if under 10 seconds
    if (totalSeconds < 10 && player.timeLeftMs > 0) {
      const tenths = Math.floor((player.timeLeftMs % 1000) / 100);
      return `${seconds}.${tenths}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [player, timeControlCategory]);

  const isLowTime = player && player.timeLeftMs < 20000 && timeControlCategory !== 'Casual';

  return (
    <div
      className={`flex items-center justify-between w-full max-w-[560px] px-3.5 py-2.5 rounded-xl border transition-all ${
        isTurn
          ? 'bg-slate-900/90 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
          : 'bg-slate-900/50 border-slate-800/80'
      }`}
    >
      {/* Player identity & avatar */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <img
            src={
              player?.avatarUrl ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${color === 'w' ? 'white' : 'black'}`
            }
            alt={player?.username || 'Opponent'}
            className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
          />
          {/* Side Indicator dot */}
          <span
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold ${
              isWhite ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'
            }`}
          >
            {isWhite ? 'W' : 'B'}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-100 truncate max-w-[130px] sm:max-w-[180px]">
              {player ? player.username : 'Waiting for player...'}
            </span>
            {player && (
              <span className="text-xs font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                {player.rating}
              </span>
            )}
          </div>

          {/* Captured pieces display & status */}
          <div className="flex items-center gap-1.5 mt-0.5 min-h-[18px]">
            {player && !player.connected ? (
              <div className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                <WifiOff className="w-3 h-3" />
                <span>Reconnecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {/* Captured icons */}
                <div className="flex items-center -space-x-1">
                  {capturedPieces.slice(-6).map((piece, idx) => (
                    <div key={idx} className="w-3.5 h-3.5">
                      <ChessPiece type={piece} color={isWhite ? 'b' : 'w'} />
                    </div>
                  ))}
                </div>
                {materialAdvantage > 0 && (
                  <span className="text-[11px] font-semibold text-amber-300 ml-1">
                    +{materialAdvantage}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clock Display */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-base sm:text-lg font-bold border transition-colors ${
          isLowTime
            ? 'bg-red-950/60 text-red-400 border-red-500/40 animate-pulse'
            : isTurn
            ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
            : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
        }`}
      >
        <Clock className="w-4 h-4 opacity-70" />
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
