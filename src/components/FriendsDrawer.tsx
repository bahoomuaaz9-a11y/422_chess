import React, { useState } from 'react';
import { Friend, FriendRequest } from '../types/chess';
import { X, UserPlus, Swords, Search, Check, Ban, Users } from 'lucide-react';

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  pendingRequests: FriendRequest[];
  onSendFriendRequest: (username: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onChallengeFriend: (friendId: string) => void;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  isOpen,
  onClose,
  friends,
  pendingRequests,
  onSendFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onChallengeFriend,
}) => {
  const [searchUsername, setSearchUsername] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    onSendFriendRequest(searchUsername.trim());
    setSearchUsername('');
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-sm h-full flex flex-col shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Friends & Rivals</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Friend Input */}
        <form onSubmit={handleAddSubmit} className="my-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Add Friend by Username
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter exact username..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-2">
              Friend Requests ({pendingRequests.length})
            </span>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={req.senderAvatar}
                      alt={req.senderUsername}
                      className="w-7 h-7 rounded-md object-cover bg-slate-800"
                    />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-white truncate block">
                        {req.senderUsername}
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {req.senderRating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAcceptRequest(req.id)}
                      className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                      title="Accept"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeclineRequest(req.id)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                      title="Decline"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends Filter */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter friends list..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-800/50 border border-slate-700/60 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredFriends.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center p-4">
              <Users className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No friends found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Add friends above or play with global players
              </p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={friend.avatarUrl}
                      alt={friend.username}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-800 border border-slate-700"
                    />
                    {/* Status Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        friend.online ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                      title={friend.online ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                        {friend.username}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-amber-400">
                      {friend.rating} ELO
                    </span>
                  </div>
                </div>

                {/* Challenge Button */}
                <button
                  onClick={() => onChallengeFriend(friend.id)}
                  disabled={!friend.online}
                  className={`flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                    friend.online
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-xs'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                  }`}
                  title={friend.online ? 'Challenge to chess match' : 'Player is offline'}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Challenge</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
