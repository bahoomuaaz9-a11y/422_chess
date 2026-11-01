import React, { useState, useMemo, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Color, PieceSymbol, Square } from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { PromotionModal } from './PromotionModal';
import { sounds } from '../lib/sound';

interface ChessboardProps {
  fen: string;
  turn: Color;
  playerColor?: Color | null;
  orientation?: Color;
  lastMove?: { from: string; to: string } | null;
  isCheck?: boolean;
  disabled?: boolean;
  onMove: (from: string, to: string, promotion?: PieceSymbol) => void;
  boardTheme?: 'walnut' | 'navy' | 'emerald';
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  turn,
  playerColor,
  orientation = 'w',
  lastMove,
  isCheck = false,
  disabled = false,
  onMove,
  boardTheme = 'navy',
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Sync chess instance for legal move calculation
  const chessInstance = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  // Reset selection on fen change
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  // Compute legal destination squares for the selected square
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      const moves = chessInstance.moves({ square: selectedSquare, verbose: true });
      return moves.map((m) => ({
        to: m.to as Square,
        captured: !!m.captured,
        isPromotion: m.isPromotion ? m.isPromotion() : !!m.promotion,
      }));
    } catch {
      return [];
    }
  }, [chessInstance, selectedSquare]);

  const legalDestinationMap = useMemo(() => {
    const map = new Map<string, { captured: boolean; isPromotion: boolean }>();
    legalMoves.forEach((m) => map.set(m.to, m));
    return map;
  }, [legalMoves]);

  // Find King square to apply check pulse
  const kingInCheckSquare = useMemo(() => {
    if (!isCheck) return null;
    const board = chessInstance.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          return `${FILES[c]}${8 - r}` as Square;
        }
      }
    }
    return null;
  }, [chessInstance, isCheck, turn]);

  // Theme square colors
  const themeClasses = useMemo(() => {
    switch (boardTheme) {
      case 'walnut':
        return {
          light: 'bg-[#f0d9b5] text-[#b58863]',
          dark: 'bg-[#b58863] text-[#f0d9b5]',
          selected: 'bg-amber-300/60 ring-3 ring-amber-400 inset-0',
          lastMove: 'bg-amber-200/40',
        };
      case 'emerald':
        return {
          light: 'bg-[#eeeed2] text-[#769656]',
          dark: 'bg-[#769656] text-[#eeeed2]',
          selected: 'bg-emerald-300/60 ring-3 ring-emerald-400 inset-0',
          lastMove: 'bg-emerald-200/40',
        };
      case 'navy':
      default:
        return {
          light: 'bg-[#2a374a] text-[#64748b]',
          dark: 'bg-[#15202e] text-[#475569]',
          selected: 'bg-amber-500/35 ring-2 ring-amber-400',
          lastMove: 'bg-amber-500/20',
        };
    }
  }, [boardTheme]);

  const filesToRender = orientation === 'w' ? FILES : [...FILES].reverse();
  const ranksToRender = orientation === 'w' ? RANKS : [...RANKS].reverse();

  // Interaction handlers
  const handleSquareClick = (sq: Square) => {
    if (disabled) return;

    // Is it player's turn?
    const canInteract = !playerColor || playerColor === turn;
    if (!canInteract) return;

    const piece = chessInstance.get(sq);

    // If already selected, check if clicking a destination square
    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      const isTarget = legalDestinationMap.has(sq);
      if (isTarget) {
        const moveData = legalDestinationMap.get(sq);
        // Check for pawn promotion
        const movingPiece = chessInstance.get(selectedSquare);
        const isPawnPromotion =
          movingPiece?.type === 'p' &&
          ((movingPiece.color === 'w' && sq.endsWith('8')) ||
            (movingPiece.color === 'b' && sq.endsWith('1')));

        if (isPawnPromotion) {
          setPendingPromotion({ from: selectedSquare, to: sq });
          return;
        }

        // Normal move
        onMove(selectedSquare, sq);
        setSelectedSquare(null);
        return;
      }

      // If clicked another own piece, select that instead
      if (piece && piece.color === turn) {
        setSelectedSquare(sq);
        sounds.playClick();
        return;
      }

      // Clicked unrelated empty square
      setSelectedSquare(null);
      return;
    }

    // Select piece if it's the current player's piece
    if (piece && piece.color === turn) {
      setSelectedSquare(sq);
      sounds.playClick();
    }
  };

  const handlePromotionSelect = (promotedPiece: PieceSymbol) => {
    if (pendingPromotion) {
      onMove(pendingPromotion.from, pendingPromotion.to, promotedPiece);
      setPendingPromotion(null);
      setSelectedSquare(null);
    }
  };

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-[560px] mx-auto">
      {/* Board Outer Container */}
      <div className="w-full aspect-square p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden border border-slate-700/50">
          {ranksToRender.map((rank, rankIdx) =>
            filesToRender.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const isDark = (fileIdx + rankIdx) % 2 === 1;
              const piece = chessInstance.get(square);
              const isSelected = selectedSquare === square;
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isKingInCheck = kingInCheckSquare === square;
              const legalMoveInfo = legalDestinationMap.get(square);

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                    isDark ? themeClasses.dark : themeClasses.light
                  } ${isLastMove ? themeClasses.lastMove : ''} ${
                    isSelected ? themeClasses.selected : ''
                  } ${isKingInCheck ? 'check-pulse' : ''}`}
                >
                  {/* Coordinate labels on corners */}
                  {fileIdx === 0 && (
                    <span className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-semibold opacity-40 pointer-events-none">
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-semibold opacity-40 pointer-events-none">
                      {file}
                    </span>
                  )}

                  {/* Piece Display */}
                  {piece && (
                    <div className="w-[82%] h-[82%] relative z-10 transition-transform active:scale-95 drop-shadow-md">
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators */}
                  {legalMoveInfo && !piece && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400/40 border border-amber-300/30 z-20 pointer-events-none" />
                  )}

                  {legalMoveInfo && piece && (
                    <div className="absolute inset-1 rounded-full border-3 sm:border-4 border-amber-400/60 z-20 pointer-events-none animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pawn Promotion Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={turn}
          onSelect={handlePromotionSelect}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
};
