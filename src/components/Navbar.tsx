import React from 'react';
import { UserProfile } from '../types/chess';
import { Trophy, Users, Database, Swords, Crown, User, LogIn, Plus, Bot } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  serverStatus: 'connected' | 'connecting' | 'disconnected';
  pendingFriendRequestsCount: number;
  onOpenPlayVsBot: () => void;
  onOpenQuickPlay: () => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onOpenFriends: () => void;
  onOpenLeaderboard: () => void;
  onOpenSupabaseSetup: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  serverStatus,
  pendingFriendRequestsCount,
  onOpenPlayVsBot,
  onOpenQuickPlay,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenFriends,
  onOpenLeaderboard,
  onOpenSupabaseSetup,
  onOpenProfile,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/10">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5 fill-amber-400/20" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                CHESS ARENA
              </span>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : serverStatus === 'connecting'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">
                  {serverStatus === 'connected' ? 'Live Arena' : 'Reconnecting'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Actions (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenPlayVsBot}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Play vs Bot</span>
          </button>

          <button
            onClick={onOpenQuickPlay}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Quick Play</span>
          </button>

          <button
            onClick={onOpenCreateRoom}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Create Room</span>
          </button>

          <button
            onClick={onOpenJoinRoom}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors"
          >
            <span>Join Code</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs font-medium transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Rankings</span>
          </button>

          <button
            onClick={onOpenFriends}
            className="relative flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs font-medium transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Friends</span>
            {pendingFriendRequestsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={onOpenSupabaseSetup}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 text-xs font-medium transition-colors"
            title="Configure Supabase & Google OAuth"
          >
            <Database className="w-4 h-4" />
            <span>Database & Auth</span>
          </button>
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Mobile Action Icons */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={onOpenPlayVsBot}
              className="p-2 rounded-lg text-purple-400 hover:text-white hover:bg-slate-800"
              title="Play vs Bot"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenFriends}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Users className="w-4 h-4" />
              {pendingFriendRequestsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
              )}
            </button>
            <button
              onClick={onOpenLeaderboard}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={onOpenSupabaseSetup}
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>

          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-lg object-cover bg-slate-800 border border-amber-500/30 group-hover:border-amber-400 transition-colors"
              />
              <div className="hidden sm:block min-w-0">
                <span className="text-xs font-bold text-white block truncate max-w-[100px]">
                  {user.username}
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 block -mt-0.5">
                  {user.rating} ELO
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
