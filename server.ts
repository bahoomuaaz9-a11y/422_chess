import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';
import dotenv from 'dotenv';
// @ts-ignore
import stockfishInit from 'stockfish';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Stockfish Engine Singleton (Single-threaded WASM for instant execution in Node)
let stockfishEngine: any = null;
try {
  const singlePath = path.resolve(__dirname, 'node_modules/stockfish/bin/stockfish-19-single.js');
  stockfishEngine = stockfishInit(singlePath);
  stockfishEngine.processCommand('uci');
  stockfishEngine.processCommand('isready');
} catch (err) {
  try {
    const litePath = path.resolve(__dirname, 'node_modules/stockfish/bin/stockfish-19-lite-single.js');
    stockfishEngine = stockfishInit(litePath);
    stockfishEngine.processCommand('uci');
    stockfishEngine.processCommand('isready');
  } catch (e) {
    console.error('Failed to initialize Stockfish engine:', e);
  }
}

const BOT_LEVEL_CONFIG: Record<number, { skill: number; depth: number }> = {
  1: { skill: 0, depth: 1 },
  2: { skill: 2, depth: 2 },
  3: { skill: 4, depth: 3 },
  4: { skill: 6, depth: 4 },
  5: { skill: 9, depth: 5 },
  6: { skill: 12, depth: 6 },
  7: { skill: 15, depth: 8 },
  8: { skill: 17, depth: 10 },
  9: { skill: 19, depth: 12 },
  10: { skill: 20, depth: 14 },
};

// Queued Stockfish processor
let isComputingBotMove = false;
const botComputeQueue: Array<{
  fen: string;
  level: number;
  resolve: (move: string) => void;
  reject: (err: any) => void;
}> = [];

function processNextBotCalculation() {
  if (isComputingBotMove || botComputeQueue.length === 0 || !stockfishEngine) return;
  isComputingBotMove = true;
  const current = botComputeQueue.shift()!;
  const config = BOT_LEVEL_CONFIG[current.level] || BOT_LEVEL_CONFIG[5];

  let resolved = false;
  const timeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      isComputingBotMove = false;
      current.reject(new Error('Calculation timeout'));
      processNextBotCalculation();
    }
  }, 2500);

  stockfishEngine.listener = (line: string) => {
    if (line.startsWith('bestmove') && !resolved) {
      resolved = true;
      clearTimeout(timeout);
      isComputingBotMove = false;
      const parts = line.split(' ');
      current.resolve(parts[1]);
      processNextBotCalculation();
    }
  };

  try {
    stockfishEngine.processCommand(`setoption name Skill Level value ${config.skill}`);
    stockfishEngine.processCommand(`position fen ${current.fen}`);
    stockfishEngine.processCommand(`go depth ${config.depth}`);
  } catch (err) {
    if (!resolved) {
      resolved = true;
      clearTimeout(timeout);
      isComputingBotMove = false;
      current.reject(err);
      processNextBotCalculation();
    }
  }
}

function requestStockfishMove(fen: string, level: number): Promise<string> {
  return new Promise((resolve, reject) => {
    botComputeQueue.push({ fen, level, resolve, reject });
    processNextBotCalculation();
  });
}

// ==========================================
// Types
// ==========================================
interface UserRecord {
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

interface MatchRecord {
  id: string;
  roomId: string;
  whiteId: string;
  blackId: string;
  whiteUsername: string;
  blackUsername: string;
  winner: 'w' | 'b' | 'draw';
  endReason: string;
  timeControl: string;
  movesCount: number;
  pgn: string;
  fen: string;
  whiteRatingDelta: number;
  blackRatingDelta: number;
  createdAt: string;
}

interface ServerRoom {
  id: string;
  chess: Chess;
  timeControl: {
    id: string;
    name: string;
    category: string;
    initialSeconds: number;
    incrementSeconds: number;
  };
  white: {
    id: string;
    username: string;
    avatarUrl: string;
    rating: number;
    color: 'w' | 'b';
    connected: boolean;
    timeLeftMs: number;
    isHost?: boolean;
  } | null;
  black: {
    id: string;
    username: string;
    avatarUrl: string;
    rating: number;
    color: 'w' | 'b';
    connected: boolean;
    timeLeftMs: number;
    isHost?: boolean;
  } | null;
  spectators: Map<string, { id: string; username: string; avatarUrl: string }>;
  history: Array<{
    from: string;
    to: string;
    san: string;
    piece: string;
    color: 'w' | 'b';
    captured?: string;
    promotion?: string;
    fen: string;
    timestamp: number;
    timeLeftWhite: number;
    timeLeftBlack: number;
  }>;
  lastMove: { from: string; to: string; san: string } | null;
  status: 'waiting' | 'in_progress' | 'ended';
  winner: 'w' | 'b' | 'draw' | null;
  endReason: string | null;
  drawOfferedBy: 'w' | 'b' | null;
  rematchRequestedBy: string | null;
  whiteRatingDelta: number;
  blackRatingDelta: number;
  createdAt: number;
  lastTickTimestamp: number;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

// In-Memory Database
const users = new Map<string, UserRecord>();
const matches: MatchRecord[] = [];
const rooms = new Map<string, ServerRoom>();
const connectedClients = new Map<WebSocket, { userId: string; roomId?: string }>();
const userSockets = new Map<string, Set<WebSocket>>();
const friendRequests: Array<{
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}> = [];

// Seed sample leaderboard & players for a vibrant community
const SEED_USERS: UserRecord[] = [
  {
    id: 'bot_magnus',
    username: 'Magnus_Carlsen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    rating: 2882,
    wins: 342,
    losses: 48,
    draws: 110,
    gamesPlayed: 500,
    winRate: 68.4,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'bot_hikaru',
    username: 'Hikaru_Nakamura',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    rating: 2875,
    wins: 310,
    losses: 52,
    draws: 88,
    gamesPlayed: 450,
    winRate: 68.8,
    createdAt: '2025-01-20T00:00:00.000Z',
  },
  {
    id: 'bot_alireza',
    username: 'Alireza_Firouzja',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    rating: 2805,
    wins: 215,
    losses: 62,
    draws: 53,
    gamesPlayed: 330,
    winRate: 65.1,
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'bot_judit',
    username: 'Judit_Polgar',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    rating: 2735,
    wins: 198,
    losses: 45,
    draws: 47,
    gamesPlayed: 290,
    winRate: 68.2,
    createdAt: '2025-02-10T00:00:00.000Z',
  },
  {
    id: 'bot_anand',
    username: 'Vishy_Anand',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    rating: 2750,
    wins: 185,
    losses: 50,
    draws: 65,
    gamesPlayed: 300,
    winRate: 61.6,
    createdAt: '2025-02-14T00:00:00.000Z',
  },
];

SEED_USERS.forEach((u) => users.set(u.id, u));

// Matchmaking Queue: timeControlId -> list of { userId, rating, socket }
const matchmakingQueues = new Map<
  string,
  Array<{ userId: string; socket: WebSocket; joinedAt: number }>
>();

// Helpers
function getOrCreateUser(userData: {
  id: string;
  username: string;
  avatarUrl?: string;
  email?: string;
}): UserRecord {
  let existing = users.get(userData.id);
  if (!existing) {
    existing = {
      id: userData.id,
      username: userData.username || `Player_${userData.id.substring(0, 5)}`,
      email: userData.email,
      avatarUrl:
        userData.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.id}`,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
      winRate: 0,
      createdAt: new Date().toISOString(),
    };
    users.set(userData.id, existing);
  } else {
    // Keep username and avatar synced
    if (userData.username) existing.username = userData.username;
    if (userData.avatarUrl) existing.avatarUrl = userData.avatarUrl;
  }
  return existing;
}

function calculateElo(ratingA: number, ratingB: number, scoreA: number) {
  const K = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const newRatingA = Math.round(ratingA + K * (scoreA - expectedA));
  const deltaA = newRatingA - ratingA;
  return { newRatingA, deltaA };
}

function serializeRoom(room: ServerRoom) {
  return {
    id: room.id,
    fen: room.chess.fen(),
    pgn: room.chess.pgn(),
    turn: room.chess.turn(),
    isCheck: room.chess.inCheck(),
    isGameOver: room.status === 'ended',
    winner: room.winner,
    endReason: room.endReason,
    white: room.white,
    black: room.black,
    spectators: Array.from(room.spectators.values()),
    timeControl: room.timeControl,
    history: room.history,
    lastMove: room.lastMove,
    drawOfferedBy: room.drawOfferedBy,
    rematchRequestedBy: room.rematchRequestedBy,
    whiteRatingDelta: room.whiteRatingDelta,
    blackRatingDelta: room.blackRatingDelta,
    status: room.status,
    createdAt: room.createdAt,
  };
}

function broadcastToRoom(room: ServerRoom, type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  const recipientIds = new Set<string>();

  if (room.white) recipientIds.add(room.white.id);
  if (room.black) recipientIds.add(room.black.id);
  room.spectators.forEach((s) => recipientIds.add(s.id));

  recipientIds.forEach((uid) => {
    const sockets = userSockets.get(uid);
    if (sockets) {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  });
}

function sendToUser(userId: string, type: string, payload: any) {
  const sockets = userSockets.get(userId);
  if (sockets) {
    const message = JSON.stringify({ type, payload });
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

function broadcastPresence(userId: string, online: boolean) {
  const msg = JSON.stringify({
    type: 'presence_update',
    payload: { userId, online },
  });
  connectedClients.forEach((_, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function endRoomGame(
  room: ServerRoom,
  winner: 'w' | 'b' | 'draw',
  reason: string
) {
  if (room.status === 'ended') return;

  room.status = 'ended';
  room.winner = winner;
  room.endReason = reason;

  // Rating updates
  if (room.white && room.black && room.timeControl.category !== 'Casual') {
    const whiteScore = winner === 'w' ? 1 : winner === 'draw' ? 0.5 : 0;
    const blackScore = winner === 'b' ? 1 : winner === 'draw' ? 0.5 : 0;

    const { deltaA: whiteDelta } = calculateElo(
      room.white.rating,
      room.black.rating,
      whiteScore
    );
    const { deltaA: blackDelta } = calculateElo(
      room.black.rating,
      room.white.rating,
      blackScore
    );

    room.whiteRatingDelta = whiteDelta;
    room.blackRatingDelta = blackDelta;

    // Update in-memory records
    const uWhite = users.get(room.white.id);
    if (uWhite) {
      uWhite.rating = Math.max(100, uWhite.rating + whiteDelta);
      uWhite.gamesPlayed += 1;
      if (winner === 'w') uWhite.wins += 1;
      else if (winner === 'draw') uWhite.draws += 1;
      else uWhite.losses += 1;
      uWhite.winRate = Math.round(
        ((uWhite.wins + uWhite.draws * 0.5) / uWhite.gamesPlayed) * 100
      );
    }

    const uBlack = users.get(room.black.id);
    if (uBlack) {
      uBlack.rating = Math.max(100, uBlack.rating + blackDelta);
      uBlack.gamesPlayed += 1;
      if (winner === 'b') uBlack.wins += 1;
      else if (winner === 'draw') uBlack.draws += 1;
      else uBlack.losses += 1;
      uBlack.winRate = Math.round(
        ((uBlack.wins + uBlack.draws * 0.5) / uBlack.gamesPlayed) * 100
      );
    }

    // Save match record
    matches.unshift({
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: room.id,
      whiteId: room.white.id,
      blackId: room.black.id,
      whiteUsername: room.white.username,
      blackUsername: room.black.username,
      winner,
      endReason: reason,
      timeControl: room.timeControl.name,
      movesCount: room.history.length,
      pgn: room.chess.pgn(),
      fen: room.chess.fen(),
      whiteRatingDelta: whiteDelta,
      blackRatingDelta: blackDelta,
      createdAt: new Date().toISOString(),
    });
  }

  broadcastToRoom(room, 'game_state', serializeRoom(room));
}

// Master tick for chess clocks
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room) => {
    if (room.status !== 'in_progress') return;
    if (room.timeControl.initialSeconds <= 0) return; // casual has no clock
    if (!room.white || !room.black) return;

    const delta = now - room.lastTickTimestamp;
    room.lastTickTimestamp = now;

    const currentTurn = room.chess.turn();
    const activePlayer = currentTurn === 'w' ? room.white : room.black;

    activePlayer.timeLeftMs = Math.max(0, activePlayer.timeLeftMs - delta);

    if (activePlayer.timeLeftMs <= 0) {
      const winner = currentTurn === 'w' ? 'b' : 'w';
      endRoomGame(room, winner, 'timeout');
    }
  });
}, 200);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // REST APIs
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), rooms: rooms.size });
  });

  // Stockfish Bot Move API
  app.post('/api/bot/move', async (req, res) => {
    const { fen, level = 5 } = req.body;
    if (!fen) {
      return res.status(400).json({ error: 'FEN required' });
    }

    if (!stockfishEngine) {
      return res.status(503).json({ error: 'Stockfish unavailable' });
    }

    try {
      const move = await requestStockfishMove(fen, Number(level));
      const config = BOT_LEVEL_CONFIG[level] || BOT_LEVEL_CONFIG[5];
      res.json({ move, depth: config.depth, level });
    } catch (err: any) {
      res.status(504).json({ error: err?.message || 'Calculation timeout' });
    }
  });

  app.get('/api/leaderboard', (req, res) => {
    const list = Array.from(users.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 50);
    res.json({ leaderboard: list });
  });

  app.get('/api/profile/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userMatches = matches
      .filter((m) => m.whiteId === user.id || m.blackId === user.id)
      .slice(0, 20);

    res.json({ profile: user, matches: userMatches });
  });

  app.post('/api/profile', (req, res) => {
    const { id, username, avatarUrl } = req.body;
    if (!id || !username) {
      return res.status(400).json({ error: 'id and username required' });
    }
    const user = getOrCreateUser({ id, username, avatarUrl });
    res.json({ profile: user });
  });

  // WebSocket Server logic
  wss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null;
    let currentRoomId: string | null = null;

    ws.on('message', (raw: string) => {
      try {
        const { type, payload } = JSON.parse(raw);
        if (type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // 1. Identify client
        if (type === 'identify') {
          if (!payload.user || !payload.user.id) return;
          const userRec = getOrCreateUser(payload.user);
          currentUserId = userRec.id;

          connectedClients.set(ws, { userId: currentUserId, roomId: currentRoomId || undefined });
          if (!userSockets.has(currentUserId)) {
            userSockets.set(currentUserId, new Set());
          }
          userSockets.get(currentUserId)!.add(ws);

          ws.send(JSON.stringify({ type: 'identified', payload: { user: userRec } }));
          broadcastPresence(currentUserId, true);
          return;
        }

        if (!currentUserId) return;
        const currentUser = users.get(currentUserId);
        if (!currentUser) return;

        // 2. Create Room
        if (type === 'create_room') {
          const { timeControl, preferredColor } = payload;
          const roomId = `ARENA-${Math.floor(1000 + Math.random() * 9000)}`;

          const tc = timeControl || {
            id: '5+0',
            name: '5 min',
            category: 'Rapid',
            initialSeconds: 300,
            incrementSeconds: 0,
          };

          const room: ServerRoom = {
            id: roomId,
            chess: new Chess(),
            timeControl: tc,
            white: null,
            black: null,
            spectators: new Map(),
            history: [],
            lastMove: null,
            status: 'waiting',
            winner: null,
            endReason: null,
            drawOfferedBy: null,
            rematchRequestedBy: null,
            whiteRatingDelta: 0,
            blackRatingDelta: 0,
            createdAt: Date.now(),
            lastTickTimestamp: Date.now(),
            disconnectTimers: new Map(),
          };

          // Assign preferred color
          const chooseWhite =
            preferredColor === 'w'
              ? true
              : preferredColor === 'b'
              ? false
              : Math.random() > 0.5;

          const playerObj = {
            id: currentUser.id,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            rating: currentUser.rating,
            color: (chooseWhite ? 'w' : 'b') as 'w' | 'b',
            connected: true,
            timeLeftMs: tc.initialSeconds * 1000,
            isHost: true,
          };

          if (chooseWhite) {
            room.white = playerObj;
          } else {
            room.black = playerObj;
          }

          rooms.set(roomId, room);
          currentRoomId = roomId;

          ws.send(JSON.stringify({ type: 'room_created', payload: { roomId } }));
          broadcastToRoom(room, 'game_state', serializeRoom(room));
          return;
        }

        // 3. Join Room
        if (type === 'join_room' || type === 'rejoin_room') {
          const { roomId } = payload;
          const room = rooms.get(roomId);

          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: `Room ${roomId} not found or has expired.` },
              })
            );
            return;
          }

          currentRoomId = roomId;

          // Check if reconnecting player
          if (room.white && room.white.id === currentUser.id) {
            room.white.connected = true;
            if (room.disconnectTimers.has(currentUser.id)) {
              clearTimeout(room.disconnectTimers.get(currentUser.id)!);
              room.disconnectTimers.delete(currentUser.id);
            }
          } else if (room.black && room.black.id === currentUser.id) {
            room.black.connected = true;
            if (room.disconnectTimers.has(currentUser.id)) {
              clearTimeout(room.disconnectTimers.get(currentUser.id)!);
              room.disconnectTimers.delete(currentUser.id);
            }
          } else if (!room.white) {
            room.white = {
              id: currentUser.id,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
              rating: currentUser.rating,
              color: 'w',
              connected: true,
              timeLeftMs: room.timeControl.initialSeconds * 1000,
            };
          } else if (!room.black) {
            room.black = {
              id: currentUser.id,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
              rating: currentUser.rating,
              color: 'b',
              connected: true,
              timeLeftMs: room.timeControl.initialSeconds * 1000,
            };
          } else {
            // Join as spectator
            room.spectators.set(currentUser.id, {
              id: currentUser.id,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
            });
          }

          // If both players are present and status was waiting, start the match!
          if (room.white && room.black && room.status === 'waiting') {
            room.status = 'in_progress';
            room.lastTickTimestamp = Date.now();
          }

          ws.send(JSON.stringify({ type: 'room_joined', payload: { roomId } }));
          broadcastToRoom(room, 'game_state', serializeRoom(room));
          return;
        }

        // 4. Leave Room
        if (type === 'leave_room') {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (room) {
            room.spectators.delete(currentUser.id);
            broadcastToRoom(room, 'game_state', serializeRoom(room));
          }
          currentRoomId = null;
          return;
        }

        // 5. Make Move
        if (type === 'make_move') {
          const { roomId, from, to, promotion } = payload;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'in_progress') return;

          // Check if sender is active player
          const turn = room.chess.turn();
          const activeColor = turn;
          const senderPlayer = activeColor === 'w' ? room.white : room.black;

          if (!senderPlayer || senderPlayer.id !== currentUser.id) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: "It's not your turn!" } }));
            return;
          }

          try {
            const moveResult = room.chess.move({
              from,
              to,
              promotion: promotion || 'q',
            });

            if (!moveResult) {
              ws.send(JSON.stringify({ type: 'error', payload: { message: 'Illegal move.' } }));
              return;
            }

            // Apply increment to player who just moved
            if (room.timeControl.incrementSeconds > 0) {
              senderPlayer.timeLeftMs += room.timeControl.incrementSeconds * 1000;
            }

            room.lastTickTimestamp = Date.now();
            room.lastMove = { from, to, san: moveResult.san };

            room.history.push({
              from,
              to,
              san: moveResult.san,
              piece: moveResult.piece,
              color: moveResult.color,
              captured: moveResult.captured,
              promotion: moveResult.promotion,
              fen: room.chess.fen(),
              timestamp: Date.now(),
              timeLeftWhite: room.white ? room.white.timeLeftMs : 0,
              timeLeftBlack: room.black ? room.black.timeLeftMs : 0,
            });

            // Clear any pending draw offer on move
            room.drawOfferedBy = null;

            // Check game termination conditions
            if (room.chess.isCheckmate()) {
              const winner = activeColor;
              endRoomGame(room, winner, 'checkmate');
            } else if (room.chess.isStalemate()) {
              endRoomGame(room, 'draw', 'stalemate');
            } else if (room.chess.isThreefoldRepetition()) {
              endRoomGame(room, 'draw', 'threefold_repetition');
            } else if (room.chess.isInsufficientMaterial()) {
              endRoomGame(room, 'draw', 'insufficient_material');
            } else if (room.chess.isDrawByFiftyMoves()) {
              endRoomGame(room, 'draw', '50_moves');
            } else {
              broadcastToRoom(room, 'game_state', serializeRoom(room));
            }
          } catch (err: any) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: err?.message || 'Invalid move.' },
              })
            );
          }
          return;
        }

        // 6. Resign
        if (type === 'resign') {
          const { roomId } = payload;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'in_progress') return;

          let winner: 'w' | 'b' | null = null;
          if (room.white && room.white.id === currentUser.id) {
            winner = 'b';
          } else if (room.black && room.black.id === currentUser.id) {
            winner = 'w';
          }

          if (winner) {
            endRoomGame(room, winner, 'resignation');
          }
          return;
        }

        // 7. Offer Draw
        if (type === 'offer_draw') {
          const { roomId } = payload;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'in_progress') return;

          let playerColor: 'w' | 'b' | null = null;
          if (room.white && room.white.id === currentUser.id) playerColor = 'w';
          if (room.black && room.black.id === currentUser.id) playerColor = 'b';

          if (playerColor) {
            room.drawOfferedBy = playerColor;
            broadcastToRoom(room, 'game_state', serializeRoom(room));
          }
          return;
        }

        // 8. Respond to Draw
        if (type === 'respond_draw') {
          const { roomId, accept } = payload;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'in_progress') return;

          if (accept) {
            endRoomGame(room, 'draw', 'draw_agreement');
          } else {
            room.drawOfferedBy = null;
            broadcastToRoom(room, 'game_state', serializeRoom(room));
          }
          return;
        }

        // 9. Rematch
        if (type === 'request_rematch') {
          const { roomId } = payload;
          const room = rooms.get(roomId);
          if (!room || room.status !== 'ended') return;

          if (!room.rematchRequestedBy) {
            room.rematchRequestedBy = currentUser.id;
            broadcastToRoom(room, 'game_state', serializeRoom(room));
          } else if (room.rematchRequestedBy !== currentUser.id) {
            // Both accepted! Reset game and swap colors
            const oldWhite = room.white;
            const oldBlack = room.black;

            room.chess = new Chess();
            room.status = 'in_progress';
            room.winner = null;
            room.endReason = null;
            room.drawOfferedBy = null;
            room.rematchRequestedBy = null;
            room.history = [];
            room.lastMove = null;
            room.lastTickTimestamp = Date.now();

            if (oldWhite && oldBlack) {
              room.white = {
                ...oldBlack,
                color: 'w',
                timeLeftMs: room.timeControl.initialSeconds * 1000,
              };
              room.black = {
                ...oldWhite,
                color: 'b',
                timeLeftMs: room.timeControl.initialSeconds * 1000,
              };
            }

            broadcastToRoom(room, 'game_state', serializeRoom(room));
          }
          return;
        }

        // 10. Matchmaking Queue
        if (type === 'join_matchmaking') {
          const { timeControlId = '3+0' } = payload;
          let queue = matchmakingQueues.get(timeControlId);
          if (!queue) {
            queue = [];
            matchmakingQueues.set(timeControlId, queue);
          }

          // Remove any existing entry for this user
          const filtered = queue.filter((q) => q.userId !== currentUser.id);
          matchmakingQueues.set(timeControlId, filtered);

          // Check if an opponent is waiting
          if (filtered.length > 0) {
            const opponentEntry = filtered.shift()!;
            const opponentUser = users.get(opponentEntry.userId);

            if (opponentUser && opponentEntry.socket.readyState === WebSocket.OPEN) {
              // Create matched room!
              const roomId = `ARENA-${Math.floor(1000 + Math.random() * 9000)}`;
              const tcMap: Record<string, any> = {
                '1+0': { id: '1+0', name: '1 min', category: 'Bullet', initialSeconds: 60, incrementSeconds: 0 },
                '3+0': { id: '3+0', name: '3 min', category: 'Blitz', initialSeconds: 180, incrementSeconds: 0 },
                '5+0': { id: '5+0', name: '5 min', category: 'Rapid', initialSeconds: 300, incrementSeconds: 0 },
                '10+0': { id: '10+0', name: '10 min', category: 'Rapid', initialSeconds: 600, incrementSeconds: 0 },
              };
              const tc = tcMap[timeControlId] || tcMap['3+0'];

              const coinFlip = Math.random() > 0.5;
              const pWhite = coinFlip ? currentUser : opponentUser;
              const pBlack = coinFlip ? opponentUser : currentUser;

              const room: ServerRoom = {
                id: roomId,
                chess: new Chess(),
                timeControl: tc,
                white: {
                  id: pWhite.id,
                  username: pWhite.username,
                  avatarUrl: pWhite.avatarUrl,
                  rating: pWhite.rating,
                  color: 'w',
                  connected: true,
                  timeLeftMs: tc.initialSeconds * 1000,
                },
                black: {
                  id: pBlack.id,
                  username: pBlack.username,
                  avatarUrl: pBlack.avatarUrl,
                  rating: pBlack.rating,
                  color: 'b',
                  connected: true,
                  timeLeftMs: tc.initialSeconds * 1000,
                },
                spectators: new Map(),
                history: [],
                lastMove: null,
                status: 'in_progress',
                winner: null,
                endReason: null,
                drawOfferedBy: null,
                rematchRequestedBy: null,
                whiteRatingDelta: 0,
                blackRatingDelta: 0,
                createdAt: Date.now(),
                lastTickTimestamp: Date.now(),
                disconnectTimers: new Map(),
              };

              rooms.set(roomId, room);

              // Notify both players
              sendToUser(pWhite.id, 'match_found', { roomId });
              sendToUser(pBlack.id, 'match_found', { roomId });
              broadcastToRoom(room, 'game_state', serializeRoom(room));
              return;
            }
          }

          // Otherwise, wait in queue
          matchmakingQueues.get(timeControlId)!.push({
            userId: currentUser.id,
            socket: ws,
            joinedAt: Date.now(),
          });

          ws.send(JSON.stringify({ type: 'queued', payload: { timeControlId } }));
          return;
        }

        if (type === 'cancel_matchmaking') {
          matchmakingQueues.forEach((q, tc) => {
            matchmakingQueues.set(
              tc,
              q.filter((item) => item.userId !== currentUser.id)
            );
          });
          ws.send(JSON.stringify({ type: 'queue_cancelled' }));
          return;
        }

        // 11. Challenge Friend
        if (type === 'send_challenge') {
          const { targetUserId, timeControl } = payload;
          const targetSockets = userSockets.get(targetUserId);

          if (!targetSockets || targetSockets.size === 0) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: 'Player is currently offline.' },
              })
            );
            return;
          }

          const challengeId = `chal_${Date.now()}`;
          const challengePayload = {
            id: challengeId,
            challengerId: currentUser.id,
            challengerUsername: currentUser.username,
            challengerAvatar: currentUser.avatarUrl,
            challengerRating: currentUser.rating,
            timeControl: timeControl || '5+0',
          };

          sendToUser(targetUserId, 'challenge_received', challengePayload);
          return;
        }

        // 12. Friend Request
        if (type === 'send_friend_request') {
          const { targetUsername } = payload;
          const target = Array.from(users.values()).find(
            (u) => u.username.toLowerCase() === targetUsername.toLowerCase()
          );

          if (!target) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: `Player "${targetUsername}" not found.` },
              })
            );
            return;
          }

          if (target.id === currentUser.id) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: 'You cannot add yourself as a friend.' },
              })
            );
            return;
          }

          const req = {
            id: `freq_${Date.now()}`,
            senderId: currentUser.id,
            receiverId: target.id,
            status: 'pending' as const,
            createdAt: Date.now(),
          };

          friendRequests.push(req);

          sendToUser(target.id, 'friend_request_received', {
            id: req.id,
            senderId: currentUser.id,
            senderUsername: currentUser.username,
            senderAvatar: currentUser.avatarUrl,
            senderRating: currentUser.rating,
          });

          ws.send(
            JSON.stringify({
              type: 'friend_request_sent',
              payload: { username: target.username },
            })
          );
          return;
        }
      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      if (currentUserId) {
        const set = userSockets.get(currentUserId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) {
            userSockets.delete(currentUserId);
            broadcastPresence(currentUserId, false);

            // If active in a room, start disconnect timer
            if (currentRoomId) {
              const room = rooms.get(currentRoomId);
              if (room && room.status === 'in_progress') {
                if (room.white && room.white.id === currentUserId) room.white.connected = false;
                if (room.black && room.black.id === currentUserId) room.black.connected = false;

                broadcastToRoom(room, 'game_state', serializeRoom(room));

                // 60-second grace timer before forfeit
                const timer = setTimeout(() => {
                  if (room.status === 'in_progress') {
                    const forfeiterColor = room.white?.id === currentUserId ? 'w' : 'b';
                    const winner = forfeiterColor === 'w' ? 'b' : 'w';
                    endRoomGame(room, winner, 'abandoned');
                  }
                }, 60000);

                room.disconnectTimers.set(currentUserId, timer);
              }
            }
          }
        }
      }
    });
  });

  // Mount Vite or static dist
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Chess Arena full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server start error:', err);
});
