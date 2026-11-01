import { Chess } from 'chess.js';
import { Color, PieceSymbol, Square } from '../types/chess';

export interface BotLevelInfo {
  level: number;
  name: string;
  rating: number;
  description: string;
  avatar: string;
  depth: number;
  skillLevel: number;
}

export const BOT_LEVELS: BotLevelInfo[] = [
  {
    level: 1,
    name: 'Beginner Bot',
    rating: 800,
    description: 'Makes basic moves, occasionally overlooks tactics',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    depth: 1,
    skillLevel: 0,
  },
  {
    level: 2,
    name: 'Easy Bot',
    rating: 1000,
    description: 'Understands basic captures and development',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    depth: 2,
    skillLevel: 2,
  },
  {
    level: 3,
    name: 'Casual Bot',
    rating: 1200,
    description: 'Solid opening moves, guards against simple forks',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    depth: 3,
    skillLevel: 4,
  },
  {
    level: 4,
    name: 'Normal Bot',
    rating: 1400,
    description: 'Tactical awareness, controls the center',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    depth: 4,
    skillLevel: 6,
  },
  {
    level: 5,
    name: 'Intermediate Bot',
    rating: 1600,
    description: 'Strong piece coordination and pawn structure',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    depth: 5,
    skillLevel: 9,
  },
  {
    level: 6,
    name: 'Advanced Bot',
    rating: 1800,
    description: 'Sharp calculation and defensive resilience',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    depth: 6,
    skillLevel: 12,
  },
  {
    level: 7,
    name: 'Hard Bot',
    rating: 2000,
    description: 'Candidate master level, punishes inaccuracies',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    depth: 8,
    skillLevel: 15,
  },
  {
    level: 8,
    name: 'Expert Bot',
    rating: 2200,
    description: 'Deep positional play and endgame precision',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    depth: 10,
    skillLevel: 17,
  },
  {
    level: 9,
    name: 'Master Bot',
    rating: 2400,
    description: 'International Master strength, rarely blunders',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    depth: 12,
    skillLevel: 19,
  },
  {
    level: 10,
    name: 'Maximum Bot',
    rating: 2600,
    description: 'Grandmaster engine power, maximum calculation depth',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    depth: 14,
    skillLevel: 20,
  },
];

// Piece value mapping
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (PST) for positional evaluation
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

function evaluateBoard(chess: Chess, forColor: Color): number {
  if (chess.isCheckmate()) {
    return chess.turn() === forColor ? -99999 : 99999;
  }
  if (chess.isDraw()) return 0;

  const board = chess.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let pieceVal = PIECE_VALUES[piece.type] || 0;
      let posVal = 0;
      const idx = piece.color === 'w' ? r * 8 + c : (7 - r) * 8 + c;

      if (piece.type === 'p') posVal = PAWN_TABLE[idx] || 0;
      else if (piece.type === 'n') posVal = KNIGHT_TABLE[idx] || 0;
      else if (piece.type === 'b') posVal = BISHOP_TABLE[idx] || 0;

      const totalVal = pieceVal + posVal;
      if (piece.color === forColor) {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: Color
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, botColor);
  }

  const moves = chess.moves({ verbose: true });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false, botColor);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true, botColor);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * High-performance local minimax calculation as instant fallback
 */
export function getLocalBotMove(
  fen: string,
  level: number
): { from: string; to: string; promotion?: PieceSymbol } | null {
  try {
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    const botColor = chess.turn();

    // Level 1: Sometimes picks random or basic capture
    if (level === 1 && Math.random() < 0.35) {
      const random = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return {
        from: random.from,
        to: random.to,
        promotion: (random.promotion as PieceSymbol) || undefined,
      };
    }

    // Depth scales with level
    const depth = level <= 3 ? 1 : level <= 6 ? 2 : 3;

    let bestMove = legalMoves[0];
    let bestScore = -Infinity;

    // Shuffle moves slightly for varied gameplay
    const shuffled = [...legalMoves].sort(() => Math.random() - 0.5);

    for (const move of shuffled) {
      chess.move(move);
      const score = minimax(chess, depth - 1, -Infinity, Infinity, false, botColor);
      chess.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: (bestMove.promotion as PieceSymbol) || undefined,
    };
  } catch (err) {
    console.error('Local bot move error:', err);
    return null;
  }
}

/**
 * Requests move from server-side Stockfish engine with fallback to local minimax
 */
export async function getEngineBotMove(
  fen: string,
  level: number
): Promise<{ from: string; to: string; promotion?: PieceSymbol } | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2800);

  try {
    const res = await fetch('/api/bot/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen, level }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.move) {
        // Parse UCI move format (e.g., e7e5 or e7e8q)
        const from = data.move.slice(0, 2);
        const to = data.move.slice(2, 4);
        const promotion = (data.move.slice(4, 5) as PieceSymbol) || undefined;
        return { from, to, promotion };
      }
    }
  } catch (err) {
    // Network delay or abort
  }

  // Fallback to local minimax
  return getLocalBotMove(fen, level);
}
