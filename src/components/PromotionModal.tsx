import React from 'react';
import { Color, PieceSymbol } from '../types/chess';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect, onCancel }) => {
  const pieces: Array<{ type: PieceSymbol; label: string }> = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 shadow-2xl max-w-sm w-full text-center">
        <h3 className="text-lg font-semibold text-amber-300 mb-1">Pawn Promotion</h3>
        <p className="text-xs text-slate-400 mb-5">Choose a piece to promote your pawn to</p>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700/60 hover:border-amber-400/50 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 mb-1">
                <ChessPiece type={p.type} color={color} />
              </div>
              <span className="text-xs font-medium text-slate-200">{p.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-4 rounded hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
