import React from 'react';
import { X, Target, CheckCircle2, Gift, Coins, Sparkles, Award } from 'lucide-react';
import { Mission, PlayerProfile } from '../types/game';
import { gameStore } from '../state/gameStore';
import { soundManager } from '../audio/SoundManager';

interface MissionsModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ profile, onClose }) => {
  const handleClaim = (missionId: string) => {
    const success = gameStore.claimMissionReward(missionId);
    if (success) {
      soundManager.playPowerUp();
      soundManager.playCoin();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">Missions & Bounties</h2>
              <p className="text-xs text-zinc-400">Complete challenges to level up and earn coin bonuses</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Level Banner */}
        <div className="p-4 bg-gradient-to-r from-red-950/60 to-zinc-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-lg">
              {profile.level}
            </div>
            <div>
              <div className="text-sm font-black text-white uppercase">Runner Rank: Level {profile.level}</div>
              <div className="text-xs text-zinc-400">
                {profile.xp} / {profile.level * 350} XP to next level
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <Award className="w-4 h-4" />
            <span>+200 Coins/Level</span>
          </div>
        </div>

        {/* Missions List */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3">
          {profile.missions.map((m) => {
            const pct = Math.min(100, Math.floor((m.current / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  m.claimed
                    ? 'border-white/5 bg-zinc-900/20 opacity-60'
                    : m.completed
                    ? 'border-amber-400/50 bg-amber-500/10 shadow-lg'
                    : 'border-white/10 bg-zinc-900/50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">{m.title}</span>
                    {m.completed && !m.claimed && (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Completed!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{m.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-2.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        m.completed ? 'bg-emerald-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {m.current} / {m.target} ({pct}%)
                  </div>
                </div>

                {/* Reward & Claim */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-black">
                      <Coins className="w-3.5 h-3.5 fill-current" />
                      <span>+{m.rewardCoins}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold">+{m.rewardXp} XP</div>
                  </div>

                  {m.claimed ? (
                    <div className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-500 text-xs font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Claimed
                    </div>
                  ) : m.completed ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-black font-black text-xs uppercase shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer flex items-center gap-1"
                    >
                      <Gift className="w-4 h-4 text-black" />
                      <span>Claim</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-white/5 text-zinc-500 text-xs font-bold uppercase">
                      In Progress
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
