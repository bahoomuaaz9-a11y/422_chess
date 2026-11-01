import React, { useState } from 'react';
import { X, LogIn, Hash } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    // If a full URL is pasted, extract room query parameter
    if (val.includes('room=')) {
      const match = val.match(/room=([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        val = match[1];
      }
    }
    setRoomCode(val.toUpperCase());
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    onJoinRoom(roomCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <LogIn className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white">Join Private Room</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Enter a room code or paste an invite link shared by your friend.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Room Code or Link
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={roomCode}
                onChange={handleInputChange}
                placeholder="e.g. ARENA-5821"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400/80 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/15 transition-all"
          >
            Enter Match
          </button>
        </form>
      </div>
    </div>
  );
};
