export type Color = 'w' | 'b';
export type Square =
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  color: Color;
  type: PieceSymbol;
}

export interface TimeControl {
  id: string;
  name: string;
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical' | 'Casual';
  initialSeconds: number;
  incrementSeconds: number;
}

export const TIME_CONTROLS: Record<string, TimeControl> = {
  '1+0': { id: '1+0', name: '1 min', category: 'Bullet', initialSeconds: 60, incrementSeconds: 0 },
  '3+0': { id: '3+0', name: '3 min', category: 'Blitz', initialSeconds: 180, incrementSeconds: 0 },
  '3+2': { id: '3+2', name: '3 | 2', category: 'Blitz', initialSeconds: 180, incrementSeconds: 2 },
  '5+0': { id: '5+0', name: '5 min', category: 'Rapid', initialSeconds: 300, incrementSeconds: 0 },
  '10+0': { id: '10+0', name: '10 min', category: 'Rapid', initialSeconds: 600, incrementSeconds: 0 },
  '15+10': { id: '15+10', name: '15 | 10', category: 'Classical', initialSeconds: 900, incrementSeconds: 10 },
  'casual': { id: 'casual', name: 'Unlimited', category: 'Casual', initialSeconds: 0, incrementSeconds: 0 },
};

export interface GamePlayer {
  id: string;
  username: string;
  avatarUrl: string;
  rating: number;
  color: Color;
  connected: boolean;
  timeLeftMs: number;
  isHost?: boolean;
}

export interface MoveRecord {
  from: string;
  to: string;
  san: string;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  fen: string;
  timestamp: number;
  timeLeftWhite: number;
  timeLeftBlack: number;
}

export interface GameState {
  id: string;
  fen: string;
  pgn: string;
  turn: Color;
  isCheck: boolean;
  isGameOver: boolean;
  winner: Color | 'draw' | null;
  endReason:
    | 'checkmate'
    | 'resignation'
    | 'timeout'
    | 'stalemate'
    | 'insufficient_material'
    | 'threefold_repetition'
    | 'draw_agreement'
    | 'abandoned'
    | null;
  white: GamePlayer | null;
  black: GamePlayer | null;
  spectators: Array<{ id: string; username: string; avatarUrl: string }>;
  timeControl: TimeControl;
  history: MoveRecord[];
  lastMove: { from: string; to: string; san: string } | null;
  drawOfferedBy: Color | null;
  rematchRequestedBy: string | null;
  whiteRatingDelta?: number;
  blackRatingDelta?: number;
  status: 'waiting' | 'in_progress' | 'ended';
  createdAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  rating: number;
  online: boolean;
  currentRoomId?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  senderRating: number;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface MatchHistoryItem {
  id: string;
  roomId: string;
  opponent: {
    username: string;
    avatarUrl: string;
    rating: number;
  };
  playerColor: Color;
  result: 'win' | 'loss' | 'draw';
  reason: string;
  date: string;
  movesCount: number;
  ratingDelta: number;
  timeControlName: string;
}

export interface MatchChallenge {
  id: string;
  challengerId: string;
  challengerUsername: string;
  challengerAvatar: string;
  challengerRating: number;
  timeControl: string;
  roomId: string;
}
