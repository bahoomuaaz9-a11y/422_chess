import React from 'react';
import { Color, PieceSymbol } from '../types/chess';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';

  // Crisp standard vector chess pieces with refined gradients
  switch (type) {
    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill={isWhite ? '#ffffff' : '#1e293b'}
            fillRule="evenodd"
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? '#222' : '#f8fafc'} strokeLinejoin="miter" />
            <path
              d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
              fill={isWhite ? '#f8fafc' : '#0f172a'}
              stroke={isWhite ? '#222' : '#f8fafc'}
            />
            <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5C20 16 10.5 13 6.5 19.5c-3 6 5 10.5 5 10.5v7z" />
            <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" />
            {isWhite && <path d="M22.5 30v7" stroke="#cbd5e1" strokeWidth="1" />}
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill={isWhite ? '#ffffff' : '#1e293b'}
            fillRule="evenodd"
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5-4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm16.5 4.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM13 16a2 2 0 1 1-4 0 2 2 0 1 1 4 0zm19 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
            <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-16-6 16-7-11 2 12z" />
            <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
            <path d="M11 38.5a35 35 1 0 0 23 0" />
            <path d="M11 29a35 35 1 0 1 23 0m-21.5 2.5h20m-21 3a35 35 1 0 0 22 0m-23 3a35 35 1 0 0 24 0" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill={isWhite ? '#ffffff' : '#1e293b'}
            fillRule="evenodd"
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2.5-4.5l1-14.5h18l1 14.5h-20zM9 10v4h4v-4H9zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4z"
              strokeLinejoin="miter"
            />
            <path d="M11 14v3h23v-3H11z" />
            <path d="M12 35.5h21m-20-4h19m-18-14.5h17" stroke={isWhite ? '#cbd5e1' : '#475569'} strokeWidth="1" />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill={isWhite ? '#ffffff' : '#1e293b'}
            fillRule="evenodd"
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g>
              <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.35.49-2.32.47-3-.5 1.35-1.46 3-2 3-2z" />
              <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
              <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
            </g>
            <path d="M17.5 26h10M15 30h15m-7.5-14.5v5m-3-2.5h6" stroke={isWhite ? '#64748b' : '#f8fafc'} strokeLinejoin="miter" />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <g
            fill={isWhite ? '#ffffff' : '#1e293b'}
            fillRule="evenodd"
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
            <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 1-5-1-2.5-3.21-2.47-5-5.5-1.79-3.03-.54-6.38 1-7 2.5-1 4.5 1.5 6 1 1.5-.5 3-4 6-5 2.5-.5 4.5 1 5 2.5z" />
            <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zm5.5-8.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill={isWhite ? '#1e293b' : '#ffffff'} />
            <path d="M24.55 10.4s.6 1.87-.5 2.6c-1.1.73-1.6 1.1-1.6 1.1" stroke={isWhite ? '#64748b' : '#f8fafc'} strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className}>
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={isWhite ? '#ffffff' : '#1e293b'}
            stroke={isWhite ? '#1e293b' : '#f8fafc'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
};
