import React, { useRef, useEffect } from 'react';
import { MoveRecord } from '../types/chess';
import { Copy, Check, ChevronFirst, ChevronLeft, ChevronRight, ChevronLast } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
  pgn: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currentMoveIndex,
  onSelectMove,
  pgn,
}) => {
  const [copied, setCopied] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (turn #, white move, black move)
  const movePairs = React.useMemo(() => {
    const pairs: Array<{
      turn: number;
      white?: { san: string; index: number };
      black?: { san: string; index: number };
    }> = [];

    for (let i = 0; i < history.length; i += 2) {
      const turn = Math.floor(i / 2) + 1;
      const whiteMove = history[i];
      const blackMove = history[i + 1];

      pairs.push({
        turn,
        white: whiteMove ? { san: whiteMove.san, index: i } : undefined,
        black: blackMove ? { san: blackMove.san, index: i + 1 } : undefined,
      });
    }

    return pairs;
  }, [history]);

  // Auto-scroll on new moves
  useEffect(() => {
    if (scrollRef.current && currentMoveIndex === history.length - 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length, currentMoveIndex]);

  const handleCopyPGN = () => {
    if (!pgn && history.length === 0) return;
    navigator.clipboard.writeText(pgn || 'No moves yet.');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Move Notation
        </span>
        <button
          onClick={handleCopyPGN}
          disabled={history.length === 0}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-400 disabled:opacity-40 transition-colors py-1 px-2 rounded hover:bg-slate-800"
          title="Copy PGN notation"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'PGN'}</span>
        </button>
      </div>

      {/* Move list table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Moves will appear here
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.turn}
              className="flex items-center py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <span className="w-8 text-slate-500 text-right mr-3">{pair.turn}.</span>

              {/* White move */}
              {pair.white ? (
                <button
                  onClick={() => onSelectMove(pair.white!.index)}
                  className={`flex-1 text-left px-1.5 py-0.5 rounded font-medium transition-colors ${
                    currentMoveIndex === pair.white.index
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-slate-200 hover:text-amber-300'
                  }`}
                >
                  {pair.white.san}
                </button>
              ) : (
                <span className="flex-1" />
              )}

              {/* Black move */}
              {pair.black ? (
                <button
                  onClick={() => onSelectMove(pair.black!.index)}
                  className={`flex-1 text-left px-1.5 py-0.5 rounded font-medium transition-colors ${
                    currentMoveIndex === pair.black.index
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-slate-200 hover:text-amber-300'
                  }`}
                >
                  {pair.black.san}
                </button>
              ) : (
                <span className="flex-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-center gap-1 p-2 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={() => onSelectMove(-1)}
          disabled={history.length === 0 || currentMoveIndex === -1}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          title="Initial position"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
          disabled={history.length === 0 || currentMoveIndex === -1}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          title="Previous move"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(Math.min(history.length - 1, currentMoveIndex + 1))}
          disabled={history.length === 0 || currentMoveIndex >= history.length - 1}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          title="Next move"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectMove(history.length - 1)}
          disabled={history.length === 0 || currentMoveIndex === history.length - 1}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
          title="Latest move"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
