import React, { useState, useEffect } from 'react';
import { UserProfile, MatchHistoryItem } from '../types/chess';
import { X, User, Trophy, ShieldAlert, Check, LogOut, Swords, Edit2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onSignOut: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Magnus look
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Hikaru look
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', // Queen
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Prodigy
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Tactician
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', // Grandmaster
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateProfile,
  onSignOut,
}) => {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setSelectedAvatar(user.avatarUrl);
  }, [user]);

  useEffect(() => {
    if (isOpen && user.id) {
      setLoadingMatches(true);
      fetch(`/api/profile/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.matches) {
            setMatches(
              data.matches.map((m: any) => ({
                id: m.id,
                roomId: m.roomId,
                opponent: {
                  username: m.whiteId === user.id ? m.blackUsername : m.whiteUsername,
                  avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${
                    m.whiteId === user.id ? m.blackId : m.whiteId
                  }`,
                  rating: 1200,
                },
                playerColor: m.whiteId === user.id ? 'w' : 'b',
                result:
                  m.winner === 'draw'
                    ? 'draw'
                    : (m.winner === 'w' && m.whiteId === user.id) ||
                      (m.winner === 'b' && m.blackId === user.id)
                    ? 'win'
                    : 'loss',
                reason: m.endReason,
                date: new Date(m.createdAt).toLocaleDateString(),
                movesCount: m.movesCount,
                ratingDelta: m.whiteId === user.id ? m.whiteRatingDelta : m.blackRatingDelta,
                timeControlName: m.timeControl,
              }))
            );
          }
        })
        .catch(console.error)
        .finally(() => setLoadingMatches(false));
    }
  }, [isOpen, user.id]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onUpdateProfile({ username: username.trim(), avatarUrl: selectedAvatar });
    setEditing(false);
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

        {/* User Profile Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-slate-800">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt={user.username}
              className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-amber-500/40 shadow-md"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSave} className="space-y-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Choose Avatar:</span>
                  <div className="flex gap-1.5">
                    {PRESET_AVATARS.map((av, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                          selectedAvatar === av ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60'
                        }`}
                      >
                        <img src={av} alt="avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="py-1 px-3 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="py-1 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{user.username}</h3>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                    title="Edit username or avatar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                    {user.rating} ELO
                  </span>
                  {user.email && (
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 my-4">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
              Played
            </span>
            <span className="text-sm font-bold text-white">{user.gamesPlayed}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
              Wins
            </span>
            <span className="text-sm font-bold text-emerald-400">{user.wins}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
              Losses
            </span>
            <span className="text-sm font-bold text-red-400">{user.losses}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
              Win Rate
            </span>
            <span className="text-sm font-bold text-amber-400">{user.winRate}%</span>
          </div>
        </div>

        {/* Match History */}
        <div className="flex-1 overflow-y-auto pr-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Match History
          </span>

          {loadingMatches ? (
            <div className="py-6 text-center text-xs text-slate-500">Loading history...</div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No rated matches played yet.
            </div>
          ) : (
            <div className="space-y-1.5">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        m.result === 'win'
                          ? 'bg-emerald-400'
                          : m.result === 'loss'
                          ? 'bg-red-400'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div className="truncate">
                      <span className="text-slate-200 font-semibold block truncate">
                        vs {m.opponent.username}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {m.timeControlName} · {m.movesCount} moves · {m.date}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-semibold capitalize block ${
                        m.result === 'win'
                          ? 'text-emerald-400'
                          : m.result === 'loss'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {m.result}
                    </span>
                    {m.ratingDelta !== 0 && (
                      <span
                        className={`text-[10px] font-mono ${
                          m.ratingDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {m.ratingDelta > 0 ? `+${m.ratingDelta}` : m.ratingDelta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition-colors py-1.5 px-3 rounded-lg hover:bg-red-950/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <span className="text-[11px] text-slate-500">Arena Member</span>
        </div>
      </div>
    </div>
  );
};
