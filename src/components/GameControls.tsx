import React, { useState } from 'react';
import { Flag, Handshake, RotateCcw, Volume2, VolumeX, Share2, Palette, Check } from 'lucide-react';
import { sounds } from '../lib/sound';

interface GameControlsProps {
  roomId: string;
  isGameInProgress: boolean;
  isGameOver: boolean;
  isSpectator: boolean;
  drawOfferedBy: 'w' | 'b' | null;
  playerColor?: 'w' | 'b' | null;
  rematchRequestedBy: string | null;
  currentUserId: string;
  boardTheme: 'walnut' | 'navy' | 'emerald';
  onFlipBoard: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestRematch: () => void;
  onChangeBoardTheme: (theme: 'walnut' | 'navy' | 'emerald') => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  roomId,
  isGameInProgress,
  isGameOver,
  isSpectator,
  drawOfferedBy,
  playerColor,
  rematchRequestedBy,
  currentUserId,
  boardTheme,
  onFlipBoard,
  onResign,
  onOfferDraw,
  onRequestRematch,
  onChangeBoardTheme,
}) => {
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);
  const [copiedLink, setCopiedLink] = useState(false);

  const toggleSound = () => {
    const newState = sounds.toggleSound();
    setSoundEnabled(newState);
  };

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const isMyDrawOffer = drawOfferedBy && playerColor && drawOfferedBy === playerColor;

  return (
    <div className="flex flex-col gap-2.5 w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800">
      {/* Primary Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Flip Board */}
        <button
          onClick={onFlipBoard}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          title="Flip board orientation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Flip</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-colors"
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span>{soundEnabled ? 'Sound' : 'Muted'}</span>
        </button>

        {/* Draw Offer */}
        {!isSpectator && isGameInProgress && (
          <button
            onClick={onOfferDraw}
            disabled={!!drawOfferedBy}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
              isMyDrawOffer
                ? 'bg-amber-950/60 text-amber-300 border-amber-600/50'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60 disabled:opacity-40'
            }`}
            title="Offer a draw to opponent"
          >
            <Handshake className="w-3.5 h-3.5 text-amber-400" />
            <span>{isMyDrawOffer ? 'Offered' : 'Draw'}</span>
          </button>
        )}

        {/* Resign */}
        {!isSpectator && isGameInProgress && (
          <button
            onClick={() => setShowResignConfirm(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-800/40 text-xs font-medium transition-colors"
            title="Resign the match"
          >
            <Flag className="w-3.5 h-3.5 text-red-400" />
            <span>Resign</span>
          </button>
        )}

        {/* Rematch if Game is Over */}
        {!isSpectator && isGameOver && (
          <button
            onClick={onRequestRematch}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg col-span-2 border text-xs font-semibold transition-colors ${
              rematchRequestedBy === currentUserId
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {rematchRequestedBy === currentUserId
                ? 'Rematch Requested...'
                : rematchRequestedBy
                ? 'Accept Rematch!'
                : 'Play Rematch'}
            </span>
          </button>
        )}
      </div>

      {/* Secondary Bar: Theme selector & Share Link */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        {/* Board theme choices */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400 hidden sm:inline">Theme:</span>
          {(['navy', 'walnut', 'emerald'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onChangeBoardTheme(t)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium transition-colors ${
                boardTheme === t
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Share Invite button */}
        <button
          onClick={copyInvite}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-amber-300 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded border border-slate-700/60 transition-colors"
        >
          {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
          <span>{copiedLink ? 'Link Copied!' : `Invite Code: ${roomId}`}</span>
        </button>
      </div>

      {/* Resign Confirmation Modal */}
      {showResignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-xs w-full text-center shadow-2xl">
            <h4 className="text-base font-bold text-red-400 mb-1">Resign Game?</h4>
            <p className="text-xs text-slate-300 mb-4">
              Are you sure you want to resign? This will result in an immediate loss and rating deduction.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResignConfirm(false)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResignConfirm(false);
                  onResign();
                }}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white"
              >
                Yes, Resign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
