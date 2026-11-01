import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/chess';
import { X, Trophy, Medal, RefreshCw, Flame } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400 flex items-center justify-center text-xs font-black shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300 flex items-center justify-center text-xs font-black">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 border border-amber-600 flex items-center justify-center text-xs font-black">
          3
        </span>
      );
    }
    return <span className="w-6 text-center text-xs font-semibold text-slate-500">{rank}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Global Leaderboard</h3>
              <p className="text-xs text-slate-400">Top grandmasters and arena champions</p>
            </div>
          </div>

          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-1.5">
          {leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {loading ? 'Loading grandmasters...' : 'No players found yet.'}
            </div>
          ) : (
            leaderboard.map((player, idx) => {
              const rank = idx + 1;
              const isCurrentUser = currentUserId === player.id;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                    isCurrentUser
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-xs'
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex justify-center">{getRankBadge(rank)}</div>

                    <img
                      src={player.avatarUrl}
                      alt={player.username}
                      className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-slate-700"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[130px] sm:max-w-[170px]">
                          {player.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1 rounded font-semibold">
                            YOU
                          </span>
                        )}
                        {rank <= 3 && <Flame className="w-3.5 h-3.5 text-amber-400 inline" />}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {player.gamesPlayed} games · {player.winRate}% win rate
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-amber-300">
                      {player.rating}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">ELO</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
