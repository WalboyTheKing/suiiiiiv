import React from 'react';
import { RotateCcw, Home, Target, Heart, Trophy, Coins, Flame, Sparkles } from 'lucide-react';
import { RunStats, PlayerProfile } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import speedAvatarFace from '../assets/images/speed_avatar_face_1793878044431.jpg';

interface GameOverModalProps {
  stats: RunStats;
  profile: PlayerProfile;
  onRunAgain: () => void;
  onRevive: () => void;
  onHome: () => void;
  onOpenMissions: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  profile,
  onRunAgain,
  onRevive,
  onHome,
  onOpenMissions,
}) => {
  const canRevive = profile.coins >= 250;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-md p-5 sm:p-6 flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center relative max-h-[90dvh] overflow-y-auto">
        {/* Speed Face Reaction Header */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            <img src={speedAvatarFace} alt="IShowSpeed" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full border border-black uppercase">
            {stats.isNewRecord ? 'SIUUU!' : 'SPEED'}
          </div>
        </div>

        {/* New High Score Banner */}
        {stats.isNewRecord && (
          <div className="w-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-xs uppercase py-1.5 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-lg mb-3 animate-bounce">
            <Trophy className="w-4 h-4 fill-white" />
            <span>NEW ALL-TIME RECORD! SIUUU!</span>
          </div>
        )}

        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
          {stats.isNewRecord ? 'LEGENDARY RUN!' : 'RUN FINISHED'}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {stats.isNewRecord ? '"OH MY GOD CHAT WE DID IT!!"' : '"WE GO AGAIN! CHAT PRESS RUN!"'}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2.5 my-6">
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black">Score</span>
            <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black">Distance</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5">
              {Math.floor(stats.distance).toLocaleString()} m
            </span>
          </div>

          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black">Coins Earned</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Coins className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-black text-yellow-400 font-mono">+{stats.coins}</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 uppercase font-black">Footballs</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg">⚽</span>
              <span className="text-xl font-black text-emerald-400 font-mono">+{stats.footballs}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {/* RUN AGAIN */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onRunAgain();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-base uppercase tracking-wider shadow-lg hover:scale-102 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RUN AGAIN</span>
          </button>

          {/* REVIVE */}
          <button
            onClick={() => {
              if (canRevive) {
                soundManager.playUiClick();
                onRevive();
              }
            }}
            disabled={!canRevive}
            className={`w-full py-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition ${
              canRevive
                ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 cursor-pointer'
                : 'border-white/5 bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Heart className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            <span>REVIVE WITH SHIELD (250 COINS)</span>
          </button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                soundManager.playUiClick();
                onOpenMissions();
              }}
              className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Target className="w-4 h-4 text-red-400" />
              <span>Missions</span>
            </button>

            <button
              onClick={() => {
                soundManager.playUiClick();
                onHome();
              }}
              className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 text-xs font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-zinc-400" />
              <span>Home Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
