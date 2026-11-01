import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import {
  GameState,
  UserProfile,
  Friend,
  FriendRequest,
  MatchChallenge,
  PieceSymbol,
  Color,
  Square,
  TimeControl,
  TIME_CONTROLS,
  GamePlayer,
  MoveRecord,
} from './types/chess';
import { socket } from './lib/socket';
import { sounds } from './lib/sound';
import { getSupabaseClient, getSupabaseConfig, signOutSupabase } from './lib/supabase';
import { getEngineBotMove, BOT_LEVELS, BotLevelInfo } from './lib/botEngine';
import { Navbar } from './components/Navbar';
import { Chessboard } from './components/Chessboard';
import { PlayerCard } from './components/PlayerCard';
import { MoveHistory } from './components/MoveHistory';
import { GameControls } from './components/GameControls';
import { BotGameControls } from './components/BotGameControls';
import { GameOverModal } from './components/GameOverModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { BotSetupModal } from './components/BotSetupModal';
import { FriendsDrawer } from './components/FriendsDrawer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AuthModal } from './components/AuthModal';
import {
  Swords,
  Shield,
  Zap,
  Timer,
  Users,
  Trophy,
  ArrowRight,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Bot,
  Brain,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const USER_STORAGE_KEY = 'chess_arena_user_profile';

interface BotGameState {
  active: boolean;
  level: number;
  playerColor: Color;
  chess: Chess;
  fen: string;
  pgn: string;
  turn: Color;
  isCheck: boolean;
  isGameOver: boolean;
  winner: Color | 'draw' | null;
  endReason: string | null;
  history: MoveRecord[];
  lastMove: { from: string; to: string; san: string } | null;
  playerTimeLeftMs: number;
  botTimeLeftMs: number;
  timeControl: TimeControl;
  isBotThinking: boolean;
}

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    const randomId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const initialUser: UserProfile = {
      id: randomId,
      username: `Grandmaster_${randomId.substring(5, 9)}`,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
      winRate: 0,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(initialUser));
    return initialUser;
  });

  // Socket & Connection state
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Active Online Game State
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Active Bot Game State
  const [botGame, setBotGame] = useState<BotGameState | null>(null);
  const [isBotSetupOpen, setIsBotSetupOpen] = useState(false);

  // Shared board controls
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number>(-1);
  const [boardOrientation, setBoardOrientation] = useState<Color>('w');
  const [boardTheme, setBoardTheme] = useState<'walnut' | 'navy' | 'emerald'>('navy');
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);

  // Modals state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isJoinRoomOpen, setIsJoinRoomOpen] = useState(false);
  const [isMatchmakingOpen, setIsMatchmakingOpen] = useState(false);
  const [matchmakingTcId, setMatchmakingTcId] = useState('3+0');
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupabaseSetupOpen, setIsSupabaseSetupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Notifications & Challenges
  const [incomingChallenge, setIncomingChallenge] = useState<MatchChallenge | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Friends & Social state
  const [friends, setFriends] = useState<Friend[]>([
    {
      id: 'bot_hikaru',
      username: 'Hikaru_Nakamura',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 2875,
      online: true,
    },
    {
      id: 'bot_magnus',
      username: 'Magnus_Carlsen',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: 2882,
      online: true,
    },
    {
      id: 'bot_alireza',
      username: 'Alireza_Firouzja',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      rating: 2805,
      online: false,
    },
  ]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  const showToast = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Supabase Auth listener
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const updated: UserProfile = {
          ...currentUser,
          id: u.id,
          username: meta.full_name || meta.name || u.email?.split('@')[0] || currentUser.username,
          email: u.email,
          avatarUrl: meta.avatar_url || meta.picture || currentUser.avatarUrl,
        };
        setCurrentUser(updated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const updated: UserProfile = {
          ...currentUser,
          id: u.id,
          username: meta.full_name || meta.name || u.email?.split('@')[0] || currentUser.username,
          email: u.email,
          avatarUrl: meta.avatar_url || meta.picture || currentUser.avatarUrl,
        };
        setCurrentUser(updated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
        showToast(`Signed in as ${updated.username}`, 'success');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Initialize WebSocket connection
  useEffect(() => {
    socket.connect(currentUser);

    const unsubStatus = socket.on('connection_status', (data) => {
      setSocketStatus(data.status);
    });

    const unsubState = socket.on('game_state', (newGameState: GameState) => {
      setGameState((prev) => {
        if (newGameState.lastMove && prev?.history.length !== newGameState.history.length) {
          const lastMoveRecord = newGameState.history[newGameState.history.length - 1];
          if (newGameState.isCheck) {
            sounds.playCheck();
          } else if (lastMoveRecord?.captured) {
            sounds.playCapture();
          } else {
            sounds.playMove();
          }
        }
        return newGameState;
      });

      setSelectedMoveIndex(newGameState.history.length - 1);

      if (newGameState.white?.id === currentUser.id) {
        setBoardOrientation('w');
      } else if (newGameState.black?.id === currentUser.id) {
        setBoardOrientation('b');
      }

      if (newGameState.status === 'ended' && !newGameState.rematchRequestedBy) {
        setIsGameOverModalOpen(true);
      }
    });

    const unsubRoomCreated = socket.on('room_created', (data) => {
      setBotGame(null); // Close bot game if in one
      setCurrentRoomId(data.roomId);
      socket.setCurrentRoom(data.roomId);
      setIsCreateRoomOpen(false);
      showToast(`Room ${data.roomId} created! Share code or link with your friend.`, 'success');
    });

    const unsubRoomJoined = socket.on('room_joined', (data) => {
      setBotGame(null);
      setCurrentRoomId(data.roomId);
      socket.setCurrentRoom(data.roomId);
      setIsJoinRoomOpen(false);
      setIsMatchmakingOpen(false);
      showToast(`Joined match ${data.roomId}!`, 'success');
    });

    const unsubMatchFound = socket.on('match_found', (data) => {
      setBotGame(null);
      setCurrentRoomId(data.roomId);
      socket.setCurrentRoom(data.roomId);
      setIsMatchmakingOpen(false);
      sounds.playVictory();
      showToast('Opponent found! Match starting now.', 'success');
    });

    const unsubError = socket.on('error', (data) => {
      showToast(data.message || 'An error occurred', 'error');
    });

    const unsubChallenge = socket.on('challenge_received', (data: MatchChallenge) => {
      setIncomingChallenge(data);
      sounds.playChallenge();
    });

    const unsubFriendReq = socket.on('friend_request_received', (data) => {
      setPendingRequests((prev) => [
        ...prev,
        {
          id: data.id,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          senderAvatar: data.senderAvatar,
          senderRating: data.senderRating,
          receiverId: currentUser.id,
          status: 'pending',
          createdAt: Date.now(),
        },
      ]);
      showToast(`Friend request received from ${data.senderUsername}!`, 'info');
    });

    const unsubPresence = socket.on('presence_update', (data) => {
      setFriends((prev) =>
        prev.map((f) => (f.id === data.userId ? { ...f, online: data.online } : f))
      );
    });

    return () => {
      unsubStatus();
      unsubState();
      unsubRoomCreated();
      unsubRoomJoined();
      unsubMatchFound();
      unsubError();
      unsubChallenge();
      unsubFriendReq();
      unsubPresence();
    };
  }, [currentUser]);

  // 3. Check URL query params for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && socketStatus === 'connected') {
      socket.send('join_room', { roomId: roomParam.toUpperCase() });
    }
  }, [socketStatus]);

  // 4. Timer countdown for Bot Game
  useEffect(() => {
    if (!botGame || !botGame.active || botGame.isGameOver || botGame.timeControl.initialSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setBotGame((prev) => {
        if (!prev || !prev.active || prev.isGameOver) return prev;

        const isPlayerTurn = prev.turn === prev.playerColor;
        const newPlayerTime = isPlayerTurn
          ? Math.max(0, prev.playerTimeLeftMs - 200)
          : prev.playerTimeLeftMs;
        const newBotTime = !isPlayerTurn
          ? Math.max(0, prev.botTimeLeftMs - 200)
          : prev.botTimeLeftMs;

        if (newPlayerTime <= 0) {
          const botColor = prev.playerColor === 'w' ? 'b' : 'w';
          return {
            ...prev,
            playerTimeLeftMs: 0,
            isGameOver: true,
            winner: botColor,
            endReason: 'timeout',
          };
        }

        if (newBotTime <= 0) {
          return {
            ...prev,
            botTimeLeftMs: 0,
            isGameOver: true,
            winner: prev.playerColor,
            endReason: 'timeout',
          };
        }

        return {
          ...prev,
          playerTimeLeftMs: newPlayerTime,
          botTimeLeftMs: newBotTime,
        };
      });
    }, 200);

    return () => clearInterval(interval);
  }, [botGame?.active, botGame?.isGameOver, botGame?.turn]);

  // ==========================================
  // BOT GAME CONTROLLER & LOGIC
  // ==========================================
  const triggerBotMove = async (chessInstance: Chess, level: number, playerSide: Color) => {
    setBotGame((prev) => (prev ? { ...prev, isBotThinking: true } : null));

    const startTime = Date.now();
    const moveResult = await getEngineBotMove(chessInstance.fen(), level);
    const elapsed = Date.now() - startTime;
    const delay = Math.max(0, 420 - elapsed);

    setTimeout(() => {
      if (!moveResult) {
        setBotGame((prev) => (prev ? { ...prev, isBotThinking: false } : null));
        return;
      }

      try {
        const executed = chessInstance.move({
          from: moveResult.from,
          to: moveResult.to,
          promotion: moveResult.promotion || 'q',
        });

        if (!executed) return;

        const isCheck = chessInstance.inCheck();
        const isGameOver = chessInstance.isGameOver();
        let winner: Color | 'draw' | null = null;
        let endReason: string | null = null;

        if (chessInstance.isCheckmate()) {
          winner = executed.color;
          endReason = 'checkmate';
          sounds.playDefeat();
        } else if (chessInstance.isStalemate()) {
          winner = 'draw';
          endReason = 'stalemate';
        } else if (chessInstance.isThreefoldRepetition()) {
          winner = 'draw';
          endReason = 'threefold_repetition';
        } else if (chessInstance.isInsufficientMaterial()) {
          winner = 'draw';
          endReason = 'insufficient_material';
        } else if (chessInstance.isDrawByFiftyMoves()) {
          winner = 'draw';
          endReason = '50_moves';
        }

        if (isCheck) sounds.playCheck();
        else if (executed.captured) sounds.playCapture();
        else sounds.playMove();

        const newRecord: MoveRecord = {
          from: executed.from,
          to: executed.to,
          san: executed.san,
          piece: executed.piece,
          color: executed.color,
          captured: executed.captured,
          promotion: executed.promotion,
          fen: chessInstance.fen(),
          timestamp: Date.now(),
          timeLeftWhite: 0,
          timeLeftBlack: 0,
        };

        setBotGame((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            fen: chessInstance.fen(),
            pgn: chessInstance.pgn(),
            turn: chessInstance.turn(),
            isCheck,
            isGameOver,
            winner,
            endReason,
            history: [...prev.history, newRecord],
            lastMove: { from: executed.from, to: executed.to, san: executed.san },
            isBotThinking: false,
          };
        });

        setSelectedMoveIndex(chessInstance.history().length - 1);
      } catch (err) {
        console.error('Failed to execute bot move:', err);
        setBotGame((prev) => (prev ? { ...prev, isBotThinking: false } : null));
      }
    }, delay);
  };

  const handleStartBotGame = (level: number, playerColor: Color, tc: TimeControl) => {
    // If inside an online match, clean up
    if (currentRoomId) {
      socket.send('leave_room', { roomId: currentRoomId });
      socket.setCurrentRoom(null);
      setCurrentRoomId(null);
      setGameState(null);
    }

    const initialChess = new Chess();
    const initMs = tc.initialSeconds * 1000;

    const newBotGame: BotGameState = {
      active: true,
      level,
      playerColor,
      chess: initialChess,
      fen: initialChess.fen(),
      pgn: '',
      turn: 'w',
      isCheck: false,
      isGameOver: false,
      winner: null,
      endReason: null,
      history: [],
      lastMove: null,
      playerTimeLeftMs: initMs,
      botTimeLeftMs: initMs,
      timeControl: tc,
      isBotThinking: false,
    };

    setBotGame(newBotGame);
    setBoardOrientation(playerColor);
    setSelectedMoveIndex(-1);

    const botLevelObj = BOT_LEVELS.find((b) => b.level === level) || BOT_LEVELS[3];
    showToast(`Started match vs ${botLevelObj.name} (~${botLevelObj.rating} ELO)!`, 'success');

    // If player is Black, the Bot moves first as White!
    if (playerColor === 'b') {
      setTimeout(() => {
        triggerBotMove(initialChess, level, 'b');
      }, 500);
    }
  };

  const handleBotPlayerMove = (from: string, to: string, promotion?: PieceSymbol) => {
    if (!botGame || !botGame.active || botGame.isGameOver || botGame.isBotThinking) return;
    if (botGame.turn !== botGame.playerColor) return;

    try {
      const executed = botGame.chess.move({
        from,
        to,
        promotion: promotion || 'q',
      });

      if (!executed) return;

      const isCheck = botGame.chess.inCheck();
      const isGameOver = botGame.chess.isGameOver();
      let winner: Color | 'draw' | null = null;
      let endReason: string | null = null;

      if (botGame.chess.isCheckmate()) {
        winner = executed.color;
        endReason = 'checkmate';
        sounds.playVictory();
      } else if (botGame.chess.isStalemate()) {
        winner = 'draw';
        endReason = 'stalemate';
      } else if (botGame.chess.isThreefoldRepetition()) {
        winner = 'draw';
        endReason = 'threefold_repetition';
      } else if (botGame.chess.isInsufficientMaterial()) {
        winner = 'draw';
        endReason = 'insufficient_material';
      } else if (botGame.chess.isDrawByFiftyMoves()) {
        winner = 'draw';
        endReason = '50_moves';
      }

      if (isCheck) sounds.playCheck();
      else if (executed.captured) sounds.playCapture();
      else sounds.playMove();

      const newRecord: MoveRecord = {
        from: executed.from,
        to: executed.to,
        san: executed.san,
        piece: executed.piece,
        color: executed.color,
        captured: executed.captured,
        promotion: executed.promotion,
        fen: botGame.chess.fen(),
        timestamp: Date.now(),
        timeLeftWhite: 0,
        timeLeftBlack: 0,
      };

      const updatedHistory = [...botGame.history, newRecord];

      setBotGame((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fen: botGame.chess.fen(),
          pgn: botGame.chess.pgn(),
          turn: botGame.chess.turn(),
          isCheck,
          isGameOver,
          winner,
          endReason,
          history: updatedHistory,
          lastMove: { from: executed.from, to: executed.to, san: executed.san },
        };
      });

      setSelectedMoveIndex(updatedHistory.length - 1);

      // If game is not over, trigger Bot's response!
      if (!isGameOver) {
        triggerBotMove(botGame.chess, botGame.level, botGame.playerColor);
      }
    } catch (err) {
      console.warn('Illegal move:', err);
    }
  };

  const handleBotUndo = () => {
    if (!botGame || !botGame.active || botGame.isBotThinking) return;
    const movesToUndo = botGame.turn === botGame.playerColor ? 2 : 1;
    if (botGame.history.length < movesToUndo) return;

    for (let i = 0; i < movesToUndo; i++) {
      botGame.chess.undo();
    }

    const newHistory = botGame.history.slice(0, botGame.history.length - movesToUndo);
    const lastRec = newHistory[newHistory.length - 1] || null;

    setBotGame((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        fen: botGame.chess.fen(),
        pgn: botGame.chess.pgn(),
        turn: botGame.chess.turn(),
        isCheck: botGame.chess.inCheck(),
        isGameOver: false,
        winner: null,
        endReason: null,
        history: newHistory,
        lastMove: lastRec ? { from: lastRec.from, to: lastRec.to, san: lastRec.san } : null,
        isBotThinking: false,
      };
    });

    setSelectedMoveIndex(newHistory.length - 1);
    sounds.playClick();
    showToast('Move undone', 'info');
  };

  const handleBotRestart = () => {
    if (!botGame) return;
    handleStartBotGame(botGame.level, botGame.playerColor, botGame.timeControl);
  };

  const handleBotResign = () => {
    if (!botGame || !botGame.active || botGame.isGameOver) return;
    const botColor: Color = botGame.playerColor === 'w' ? 'b' : 'w';
    setBotGame((prev) =>
      prev
        ? {
            ...prev,
            isGameOver: true,
            winner: botColor,
            endReason: 'resignation',
          }
        : null
    );
    sounds.playDefeat();
  };

  const handleLeaveBotGame = () => {
    setBotGame(null);
  };

  // Captured pieces in Bot Game
  const botCapturedStats = useMemo(() => {
    if (!botGame) return { byPlayer: [], byBot: [], materialDiff: 0 };
    const PIECE_VALS: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const byWhite: PieceSymbol[] = [];
    const byBlack: PieceSymbol[] = [];
    let whiteScore = 0;
    let blackScore = 0;

    botGame.history.forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          byWhite.push(m.captured as PieceSymbol);
          whiteScore += PIECE_VALS[m.captured as PieceSymbol] || 0;
        } else {
          byBlack.push(m.captured as PieceSymbol);
          blackScore += PIECE_VALS[m.captured as PieceSymbol] || 0;
        }
      }
    });

    const isWhite = botGame.playerColor === 'w';
    const byPlayer = isWhite ? byWhite : byBlack;
    const byBot = isWhite ? byBlack : byWhite;
    const materialDiff = isWhite ? whiteScore - blackScore : blackScore - whiteScore;

    return { byPlayer, byBot, materialDiff };
  }, [botGame]);

  // Online active player side
  const playerColor: Color | null = useMemo(() => {
    if (!gameState) return null;
    if (gameState.white?.id === currentUser.id) return 'w';
    if (gameState.black?.id === currentUser.id) return 'b';
    return null;
  }, [gameState, currentUser.id]);

  // Captured pieces in Online Game
  const { capturedByWhite, capturedByBlack, materialDifference } = useMemo(() => {
    if (!gameState) return { capturedByWhite: [], capturedByBlack: [], materialDifference: 0 };

    const PIECE_VALS: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    let whiteScore = 0;
    let blackScore = 0;
    const byWhite: PieceSymbol[] = [];
    const byBlack: PieceSymbol[] = [];

    gameState.history.forEach((m) => {
      if (m.captured) {
        if (m.color === 'w') {
          byWhite.push(m.captured as PieceSymbol);
          whiteScore += PIECE_VALS[m.captured as PieceSymbol] || 0;
        } else {
          byBlack.push(m.captured as PieceSymbol);
          blackScore += PIECE_VALS[m.captured as PieceSymbol] || 0;
        }
      }
    });

    return {
      capturedByWhite: byWhite,
      capturedByBlack: byBlack,
      materialDifference: whiteScore - blackScore,
    };
  }, [gameState]);

  // History inspection FEN
  const displayedFen = useMemo(() => {
    if (botGame && botGame.active) {
      if (selectedMoveIndex === -1) {
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
      if (selectedMoveIndex >= 0 && selectedMoveIndex < botGame.history.length) {
        return botGame.history[selectedMoveIndex].fen;
      }
      return botGame.fen;
    }

    if (!gameState) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    if (selectedMoveIndex === -1) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    if (selectedMoveIndex >= 0 && selectedMoveIndex < gameState.history.length) {
      return gameState.history[selectedMoveIndex].fen;
    }
    return gameState.fen;
  }, [gameState, botGame, selectedMoveIndex]);

  // Online Move Handler
  const handleMakeMove = useCallback(
    (from: string, to: string, promotion?: PieceSymbol) => {
      if (botGame && botGame.active) {
        handleBotPlayerMove(from, to, promotion);
        return;
      }

      if (!currentRoomId || !gameState) return;
      socket.send('make_move', {
        roomId: currentRoomId,
        from,
        to,
        promotion,
      });
    },
    [currentRoomId, gameState, botGame]
  );

  // Quick Play trigger
  const handleStartQuickPlay = (tcId: string = '3+0') => {
    setBotGame(null); // Close bot game if switching to online
    setMatchmakingTcId(tcId);
    setIsMatchmakingOpen(true);
    socket.send('join_matchmaking', { timeControlId: tcId });
  };

  const handleCancelMatchmaking = () => {
    socket.send('cancel_matchmaking');
    setIsMatchmakingOpen(false);
  };

  // Online Room actions
  const handleCreateRoom = (timeControl: TimeControl, preferredColor: 'w' | 'b' | 'random') => {
    setBotGame(null);
    socket.send('create_room', { timeControl, preferredColor });
  };

  const handleJoinRoom = (roomId: string) => {
    setBotGame(null);
    socket.send('join_room', { roomId });
  };

  const handleLeaveRoom = () => {
    if (currentRoomId) {
      socket.send('leave_room', { roomId: currentRoomId });
      socket.setCurrentRoom(null);
      setCurrentRoomId(null);
      setGameState(null);
      setIsGameOverModalOpen(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleResign = () => {
    if (currentRoomId) {
      socket.send('resign', { roomId: currentRoomId });
    }
  };

  const handleOfferDraw = () => {
    if (currentRoomId) {
      socket.send('offer_draw', { roomId: currentRoomId });
      showToast('Draw offer sent to opponent', 'info');
    }
  };

  const handleRespondDraw = (accept: boolean) => {
    if (currentRoomId) {
      socket.send('respond_draw', { roomId: currentRoomId, accept });
    }
  };

  const handleRematch = () => {
    if (currentRoomId) {
      socket.send('request_rematch', { roomId: currentRoomId });
      setIsGameOverModalOpen(false);
    }
  };

  // Friend actions
  const handleSendFriendRequest = (targetUsername: string) => {
    socket.send('send_friend_request', { targetUsername });
  };

  const handleAcceptRequest = (requestId: string) => {
    const req = pendingRequests.find((r) => r.id === requestId);
    if (req) {
      setFriends((prev) => [
        ...prev,
        {
          id: req.senderId,
          username: req.senderUsername,
          avatarUrl: req.senderAvatar,
          rating: req.senderRating,
          online: true,
        },
      ]);
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast(`Added ${req.senderUsername} as a friend!`, 'success');
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleChallengeFriend = (friendId: string) => {
    socket.send('send_challenge', { targetUserId: friendId, timeControl: '5+0' });
    showToast('Challenge sent!', 'success');
  };

  const handleAcceptChallenge = (chal: MatchChallenge) => {
    socket.send('create_room', {
      timeControl: TIME_CONTROLS['5+0'],
      preferredColor: 'random',
    });
    setIncomingChallenge(null);
  };

  // Profile actions
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const newProfile = { ...currentUser, ...updated };
    setCurrentUser(newProfile);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newProfile));

    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
      socket.send('identify', { user: newProfile });
      showToast('Profile updated!', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    await signOutSupabase();
    const guestUser: UserProfile = {
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      username: `Player_${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      rating: 1200,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
      winRate: 0,
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(guestUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
    setIsProfileOpen(false);
    socket.send('identify', { user: guestUser });
    showToast('Signed out', 'info');
  };

  const handleGuestLogin = (username: string, avatarUrl: string) => {
    const updated: UserProfile = {
      ...currentUser,
      username,
      avatarUrl,
    };
    setCurrentUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    socket.send('identify', { user: updated });
    setIsAuthOpen(false);
    showToast(`Welcome, ${username}!`, 'success');
  };

  // Bot current info
  const currentBotInfo: BotLevelInfo = useMemo(() => {
    if (!botGame) return BOT_LEVELS[3];
    return BOT_LEVELS.find((b) => b.level === botGame.level) || BOT_LEVELS[3];
  }, [botGame?.level]);

  // Online player orientation
  const topPlayer = boardOrientation === 'w' ? gameState?.black : gameState?.white;
  const bottomPlayer = boardOrientation === 'w' ? gameState?.white : gameState?.black;
  const topColor: Color = boardOrientation === 'w' ? 'b' : 'w';
  const bottomColor: Color = boardOrientation === 'w' ? 'w' : 'b';

  // Bot mode players
  const botSideColor: Color = botGame ? (botGame.playerColor === 'w' ? 'b' : 'w') : 'b';
  const botPlayerObj: GamePlayer | null = botGame
    ? {
        id: `bot_level_${currentBotInfo.level}`,
        username: `${currentBotInfo.name} (${currentBotInfo.rating})`,
        avatarUrl: currentBotInfo.avatar,
        rating: currentBotInfo.rating,
        color: botSideColor,
        connected: true,
        timeLeftMs: botGame.botTimeLeftMs,
      }
    : null;

  const botHumanPlayerObj: GamePlayer | null = botGame
    ? {
        id: currentUser.id,
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
        rating: currentUser.rating,
        color: botGame.playerColor,
        connected: true,
        timeLeftMs: botGame.playerTimeLeftMs,
      }
    : null;

  const topBotPlayer = boardOrientation === 'w' ? (botGame?.playerColor === 'w' ? botPlayerObj : botHumanPlayerObj) : (botGame?.playerColor === 'b' ? botPlayerObj : botHumanPlayerObj);
  const bottomBotPlayer = boardOrientation === 'w' ? (botGame?.playerColor === 'w' ? botHumanPlayerObj : botPlayerObj) : (botGame?.playerColor === 'b' ? botHumanPlayerObj : botPlayerObj);
  const topBotColor: Color = boardOrientation === 'w' ? 'b' : 'w';
  const bottomBotColor: Color = boardOrientation === 'w' ? 'w' : 'b';

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                : toastMessage.type === 'error'
                ? 'bg-red-950/90 text-red-300 border-red-500/50'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Incoming Challenge Toast */}
      {incomingChallenge && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl max-w-sm w-full animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={incomingChallenge.challengerAvatar}
              alt={incomingChallenge.challengerUsername}
              className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
            />
            <div>
              <span className="text-xs font-bold text-white block">
                {incomingChallenge.challengerUsername}
              </span>
              <span className="text-[11px] text-amber-400">
                Challenged you to a 5 min Blitz match!
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAcceptChallenge(incomingChallenge)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400"
            >
              Accept
            </button>
            <button
              onClick={() => setIncomingChallenge(null)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        serverStatus={socketStatus}
        pendingFriendRequestsCount={pendingRequests.length}
        onOpenPlayVsBot={() => setIsBotSetupOpen(true)}
        onOpenQuickPlay={() => handleStartQuickPlay('3+0')}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenJoinRoom={() => setIsJoinRoomOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenSupabaseSetup={() => setIsSupabaseSetupOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {botGame && botGame.active ? (
          /* ========================================================
             PLAY VS COMPUTER / BOT ARENA VIEW
             ======================================================== */
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Left Column: Board and Player Cards */}
            <div className="flex flex-col items-center gap-2.5 w-full max-w-[560px] mx-auto">
              {/* Top Card (Opponent Bot / Player depending on orientation) */}
              <PlayerCard
                player={topBotPlayer}
                color={topBotColor}
                isTurn={botGame.turn === topBotColor && !botGame.isGameOver}
                capturedPieces={topBotColor === botGame.playerColor ? botCapturedStats.byPlayer : botCapturedStats.byBot}
                materialAdvantage={
                  topBotColor === botGame.playerColor
                    ? Math.max(0, botCapturedStats.materialDiff)
                    : Math.max(0, -botCapturedStats.materialDiff)
                }
                timeControlCategory={botGame.timeControl.category}
              />

              {/* Bot Thinking Status Banner */}
              {botGame.isBotThinking && (
                <div className="w-full py-1.5 px-3 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center justify-center gap-2 text-xs font-semibold text-purple-300 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{currentBotInfo.name} is calculating with Stockfish...</span>
                </div>
              )}

              {/* Game Over Banner for Bot Match */}
              {botGame.isGameOver && (
                <div
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    botGame.winner === botGame.playerColor
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : botGame.winner === 'draw'
                      ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                      : 'bg-red-950/60 border-red-500/50 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>
                      {botGame.winner === botGame.playerColor
                        ? `Victory! You defeated ${currentBotInfo.name}!`
                        : botGame.winner === 'draw'
                        ? 'Match Drawn!'
                        : `${currentBotInfo.name} won by ${botGame.endReason || 'checkmate'}.`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBotRestart}
                      className="py-1 px-3 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={() => setIsBotSetupOpen(true)}
                      className="py-1 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                    >
                      Change Level
                    </button>
                  </div>
                </div>
              )}

              {/* The Chessboard */}
              <Chessboard
                fen={displayedFen}
                turn={botGame.turn}
                playerColor={botGame.playerColor}
                orientation={boardOrientation}
                lastMove={botGame.lastMove}
                isCheck={botGame.isCheck}
                disabled={
                  botGame.isGameOver ||
                  botGame.isBotThinking ||
                  selectedMoveIndex !== botGame.history.length - 1
                }
                onMove={handleMakeMove}
                boardTheme={boardTheme}
              />

              {/* Bottom Card */}
              <PlayerCard
                player={bottomBotPlayer}
                color={bottomBotColor}
                isTurn={botGame.turn === bottomBotColor && !botGame.isGameOver}
                capturedPieces={bottomBotColor === botGame.playerColor ? botCapturedStats.byPlayer : botCapturedStats.byBot}
                materialAdvantage={
                  bottomBotColor === botGame.playerColor
                    ? Math.max(0, botCapturedStats.materialDiff)
                    : Math.max(0, -botCapturedStats.materialDiff)
                }
                timeControlCategory={botGame.timeControl.category}
              />

              {/* Bot Game Controls */}
              <BotGameControls
                canUndo={botGame.history.length > 0 && !botGame.isGameOver}
                isGameInProgress={!botGame.isGameOver}
                isBotThinking={botGame.isBotThinking}
                boardTheme={boardTheme}
                botName={currentBotInfo.name}
                botLevel={botGame.level}
                onUndo={handleBotUndo}
                onRestart={handleBotRestart}
                onNewGame={() => setIsBotSetupOpen(true)}
                onFlipBoard={() => setBoardOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
                onResign={handleBotResign}
                onChangeBoardTheme={setBoardTheme}
              />
            </div>

            {/* Right Column: Move History and Bot Info */}
            <div className="w-full lg:w-80 h-[480px] lg:h-[620px] flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      Stockfish AI Mode
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white block">
                    {currentBotInfo.name} · Lvl {botGame.level}
                  </span>
                </div>
                <button
                  onClick={handleLeaveBotGame}
                  className="py-1 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Exit
                </button>
              </div>

              {/* Scrollable Move History */}
              <div className="flex-1 min-h-0">
                <MoveHistory
                  history={botGame.history}
                  currentMoveIndex={selectedMoveIndex}
                  onSelectMove={setSelectedMoveIndex}
                  pgn={botGame.pgn}
                />
              </div>
            </div>
          </div>
        ) : currentRoomId && gameState ? (
          /* ========================================================
             ACTIVE ONLINE MATCH ARENA VIEW
             ======================================================== */
          <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
            {/* Left Column: Board and Player Cards */}
            <div className="flex flex-col items-center gap-2.5 w-full max-w-[560px] mx-auto">
              {/* Opponent Card (Top) */}
              <PlayerCard
                player={topPlayer || null}
                color={topColor}
                isTurn={gameState.turn === topColor && gameState.status === 'in_progress'}
                capturedPieces={topColor === 'w' ? capturedByWhite : capturedByBlack}
                materialAdvantage={
                  topColor === 'w' ? Math.max(0, materialDifference) : Math.max(0, -materialDifference)
                }
                timeControlCategory={gameState.timeControl.category}
              />

              {/* Draw Offer Notification Banner */}
              {gameState.drawOfferedBy &&
                playerColor &&
                gameState.drawOfferedBy !== playerColor &&
                gameState.status === 'in_progress' && (
                  <div className="w-full p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-between text-xs text-amber-200 animate-pulse">
                    <span>Opponent offered a draw. Accept?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondDraw(true)}
                        className="py-1 px-3 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespondDraw(false)}
                        className="py-1 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

              {/* Waiting for Player Banner */}
              {gameState.status === 'waiting' && (
                <div className="w-full p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between text-xs text-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>Waiting for opponent to join...</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}?room=${currentRoomId}`);
                      showToast('Invite link copied!', 'success');
                    }}
                    className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Invite Link</span>
                  </button>
                </div>
              )}

              {/* The Chessboard */}
              <Chessboard
                fen={displayedFen}
                turn={gameState.turn}
                playerColor={playerColor}
                orientation={boardOrientation}
                lastMove={gameState.lastMove}
                isCheck={gameState.isCheck}
                disabled={
                  gameState.status !== 'in_progress' ||
                  selectedMoveIndex !== gameState.history.length - 1
                }
                onMove={handleMakeMove}
                boardTheme={boardTheme}
              />

              {/* Player Card (Bottom) */}
              <PlayerCard
                player={bottomPlayer || null}
                color={bottomColor}
                isTurn={gameState.turn === bottomColor && gameState.status === 'in_progress'}
                capturedPieces={bottomColor === 'w' ? capturedByWhite : capturedByBlack}
                materialAdvantage={
                  bottomColor === 'w'
                    ? Math.max(0, materialDifference)
                    : Math.max(0, -materialDifference)
                }
                timeControlCategory={gameState.timeControl.category}
              />

              {/* Game Controls Bar */}
              <GameControls
                roomId={currentRoomId}
                isGameInProgress={gameState.status === 'in_progress'}
                isGameOver={gameState.status === 'ended'}
                isSpectator={!playerColor}
                drawOfferedBy={gameState.drawOfferedBy}
                playerColor={playerColor}
                rematchRequestedBy={gameState.rematchRequestedBy}
                currentUserId={currentUser.id}
                boardTheme={boardTheme}
                onFlipBoard={() => setBoardOrientation((prev) => (prev === 'w' ? 'b' : 'w'))}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                onRequestRematch={handleRematch}
                onChangeBoardTheme={setBoardTheme}
              />
            </div>

            {/* Right Column: Move History and Room Info */}
            <div className="w-full lg:w-80 h-[480px] lg:h-[620px] flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Room {currentRoomId}
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    {gameState.timeControl.name} · {gameState.timeControl.category}
                  </span>
                </div>
                <button
                  onClick={handleLeaveRoom}
                  className="py-1 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Leave
                </button>
              </div>

              {/* Scrollable Move History */}
              <div className="flex-1 min-h-0">
                <MoveHistory
                  history={gameState.history}
                  currentMoveIndex={selectedMoveIndex}
                  onSelectMove={setSelectedMoveIndex}
                  pgn={gameState.pgn}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================
             LOBBY / HOME DASHBOARD
             ======================================================== */
          <div className="max-w-5xl mx-auto w-full space-y-8 py-4">
            {/* Hero Section */}
            <div className="text-center relative py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Real-Time Chess Engine</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
                Command the Board. <br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  Play Real-Time Multiplayer Chess & AI Bots.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                Play against Stockfish AI across 10 difficulty levels, match instantly with online players, create private rooms with friends, and climb the leaderboard.
              </p>

              {/* Primary Call-to-action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setIsBotSetupOpen(true)}
                  className="py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-xl shadow-purple-600/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Play vs Computer (10 Levels)</span>
                </button>

                <button
                  onClick={() => handleStartQuickPlay('3+0')}
                  className="py-3 px-6 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>Quick Play (Online)</span>
                </button>
              </div>
            </div>

            {/* Feature Cards Grid (4 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Play vs Computer (FEATURED) */}
              <div
                onClick={() => setIsBotSetupOpen(true)}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/50 hover:border-purple-400 shadow-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between ring-1 ring-purple-500/30"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-lg font-bold text-white">Play vs Computer</h3>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Battle Stockfish AI from Beginner (800) to Maximum Grandmaster (2600+). Includes Undo Move and custom timers.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-400">
                  <span>Start Bot Match</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Quick Play */}
              <div
                onClick={() => handleStartQuickPlay('3+0')}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 hover:border-amber-400/80 shadow-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                    <Swords className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Quick Play</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instant matchmaking with real online opponents matched to your rating. Select Blitz or Rapid.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span>Find Online Match</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Create Private Room */}
              <div
                onClick={() => setIsCreateRoomOpen(true)}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/60 shadow-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Create Room</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Set up custom time controls, generate an invite link or room code, and play directly with a friend.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  <span>Create Room & Link</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Join Private Room */}
              <div
                onClick={() => setIsJoinRoomOpen(true)}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-500/60 shadow-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Join via Code</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have a code or link from a friend? Enter it here to join their chess board instantly.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span>Enter Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Formats Strip */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                Featured Game Formats
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: '1+0', name: 'Bullet 1 min', desc: 'Fast reflexes', icon: <Zap className="w-4 h-4 text-amber-400" /> },
                  { id: '3+0', name: 'Blitz 3 min', desc: 'Tactical clash', icon: <Timer className="w-4 h-4 text-yellow-400" /> },
                  { id: '5+0', name: 'Rapid 5 min', desc: 'Popular choice', icon: <Swords className="w-4 h-4 text-emerald-400" /> },
                  { id: '10+0', name: 'Rapid 10 min', desc: 'Strategic depth', icon: <Timer className="w-4 h-4 text-blue-400" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleStartQuickPlay(item.id)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400/50 transition-all text-left"
                  >
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                      {item.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Game Over Celebration Modal for Online Game */}
      {isGameOverModalOpen && gameState && (
        <GameOverModal
          winner={gameState.winner}
          endReason={gameState.endReason}
          playerColor={playerColor}
          whiteRatingDelta={gameState.whiteRatingDelta}
          blackRatingDelta={gameState.blackRatingDelta}
          rematchRequestedBy={gameState.rematchRequestedBy}
          currentUserId={currentUser.id}
          onRematch={handleRematch}
          onReturnToLobby={handleLeaveRoom}
          onClose={() => setIsGameOverModalOpen(false)}
        />
      )}

      {/* Auxiliary Modals */}
      <BotSetupModal
        isOpen={isBotSetupOpen}
        onClose={() => setIsBotSetupOpen(false)}
        onStartBotGame={handleStartBotGame}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={isJoinRoomOpen}
        onClose={() => setIsJoinRoomOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      <MatchmakingModal
        isOpen={isMatchmakingOpen}
        timeControlId={matchmakingTcId}
        onCancel={handleCancelMatchmaking}
        onChangeTimeControl={(tc) => {
          setMatchmakingTcId(tc);
          socket.send('join_matchmaking', { timeControlId: tc });
        }}
      />

      <FriendsDrawer
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        friends={friends}
        pendingRequests={pendingRequests}
        onSendFriendRequest={handleSendFriendRequest}
        onAcceptRequest={handleAcceptRequest}
        onDeclineRequest={handleDeclineRequest}
        onChallengeFriend={handleChallengeFriend}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUserId={currentUser.id}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdateProfile={handleUpdateProfile}
        onSignOut={handleSignOut}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseSetupOpen}
        onClose={() => setIsSupabaseSetupOpen(false)}
        onConfigChanged={() => {
          showToast('Supabase settings updated', 'success');
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onGuestLogin={handleGuestLogin}
        onOpenSupabaseSetup={() => {
          setIsAuthOpen(false);
          setIsSupabaseSetupOpen(true);
        }}
      />
    </div>
  );
}
