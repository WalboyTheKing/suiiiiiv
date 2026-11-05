import React, { useState, useEffect } from 'react';
import { X, Users, Globe, Zap, Copy, Check, ArrowRight, Play, Loader2, Trophy, Shield } from 'lucide-react';
import { multiplayerClient } from '../network/MultiplayerClient';
import { PlayerProfile, MultiplayerOpponent } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onMatchReady: (opponent: MultiplayerOpponent) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  profile,
  onMatchReady,
}) => {
  const [status, setStatus] = useState<'idle' | 'searching' | 'connected' | 'in_game' | 'game_over'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'private'>('quick');

  useEffect(() => {
    if (!isOpen) return;

    multiplayerClient.setCallbacks({
      onStatusChange: (newStatus, msg) => {
        setStatus(newStatus);
        if (msg) setStatusMessage(msg);
      },
      onRoomCreated: (code) => {
        setCreatedRoomCode(code);
        setStatusMessage(`Private room created! Share this code: ${code}`);
      },
      onMatchStart: (_roomId, opponent) => {
        soundManager.playPowerUp();
        soundManager.playVoiceLine('lets_go');
        onMatchReady(opponent);
        onClose();
      },
      onOpponentSync: () => {},
      onOpponentEvent: () => {},
      onOpponentCrashed: () => {},
      onOpponentLeft: () => {},
    });

    return () => {
      if (status === 'searching') {
        multiplayerClient.cancelMatchmaking();
      }
    };
  }, [isOpen, onMatchReady, onClose, status]);

  if (!isOpen) return null;

  const handleStartQuickMatch = () => {
    soundManager.playUiClick();
    setStatus('searching');
    setStatusMessage('Connecting to multiplayer battle server...');
    multiplayerClient.startQuickMatch(profile);
  };

  const handleCreateRoom = () => {
    soundManager.playUiClick();
    setStatus('searching');
    setStatusMessage('Generating private battle room...');
    multiplayerClient.createPrivateRoom(profile);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    soundManager.playUiClick();
    setStatus('searching');
    setStatusMessage(`Searching for battle room ${roomCodeInput.trim().toUpperCase()}...`);
    multiplayerClient.joinPrivateRoom(roomCodeInput.trim(), profile);
  };

  const handleCancel = () => {
    soundManager.playUiClick();
    multiplayerClient.cancelMatchmaking();
    setStatus('idle');
    setStatusMessage('');
    setCreatedRoomCode(null);
  };

  const handleCopyCode = () => {
    if (createdRoomCode) {
      navigator.clipboard.writeText(createdRoomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      soundManager.playUiClick();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            handleCancel();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/30">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500">
                1v1 Online Multiplayer
              </h2>
              <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Server Online
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Real-time 1v1 sprint duel: race head-to-head and see your rival in 3D right on your screen!
            </p>
          </div>
        </div>

        {/* Tabs: Quick Match vs Private Room */}
        {status === 'idle' && (
          <div className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/10 mb-5">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Quick Match (1v1)</span>
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'private'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Private Room & Code</span>
            </button>
          </div>
        )}

        {/* Searching Status Overlay */}
        {status === 'searching' && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-cyan-950/20 border border-cyan-500/30 rounded-2xl mb-4">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <Zap className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
            </div>

            <span className="text-base font-black text-white uppercase tracking-wider mb-1">
              Searching for Opponent...
            </span>
            <p className="text-xs text-cyan-300 font-medium max-w-sm mb-4">
              {statusMessage || 'Synchronizing with online runners...'}
            </p>

            {createdRoomCode && (
              <div className="bg-black/80 border-2 border-cyan-400 rounded-2xl p-4 flex flex-col items-center mb-5 w-full max-w-xs shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <span className="text-[10px] uppercase font-black text-zinc-400 mb-1">Room Code</span>
                <span className="text-3xl font-black font-mono tracking-widest text-cyan-300 mb-2">
                  {createdRoomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
                </button>
                <span className="text-[10px] text-zinc-500 mt-2">Waiting for your friend to join...</span>
              </div>
            )}

            <button
              onClick={handleCancel}
              className="px-6 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tab 1: Quick Match Content */}
        {status === 'idle' && activeTab === 'quick' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">Instant 1v1 Matchmaking</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Instantly pair with another active runner worldwide. First to crash or highest distance claims victory!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Live synchronized distance & score</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Opponent appears in 3D right on your track</span>
              </div>
            </div>

            <button
              onClick={handleStartQuickMatch}
              className="mt-2 w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-base uppercase tracking-wider shadow-[0_10px_30px_rgba(6,182,212,0.4)] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Start Matchmaking</span>
            </button>
          </div>
        )}

        {/* Tab 2: Private Room Content */}
        {status === 'idle' && activeTab === 'private' && (
          <div className="flex flex-col gap-5">
            {/* Create Room */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase">Create Private Room</h3>
                  <p className="text-xs text-zinc-400">Generate a unique 4-letter battle code to challenge a friend.</p>
                </div>
              </div>
              <button
                onClick={handleCreateRoom}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Generate Room Code
              </button>
            </div>

            {/* Join Room */}
            <form onSubmit={handleJoinRoom} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase">Join Friend's Room</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Enter the code received from your friend.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: 4ABC"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 bg-black/70 border border-white/20 rounded-xl px-4 py-2 text-white font-mono font-black text-center tracking-widest uppercase outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="submit"
                  disabled={!roomCodeInput.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
