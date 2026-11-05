import React, { useState } from 'react';
import { X, CheckCircle, Lock, Gift, Sparkles, Trophy, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameStore, DAILY_REWARDS } from '../state/gameStore';
import { soundManager } from '../audio/SoundManager';
import { DailyRewardItem } from '../types/game';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(() => gameStore.getProfile());
  const [justClaimedReward, setJustClaimedReward] = useState<DailyRewardItem | null>(null);

  if (!isOpen) return null;

  const canClaim = gameStore.canClaimDailyReward();
  const nextDay = gameStore.getNextClaimableDay();
  const claimedDays = profile.claimedStreakDays || [];

  const handleClaim = () => {
    const res = gameStore.claimDailyReward();
    if (res.success && res.reward) {
      setJustClaimedReward(res.reward);
      setProfile(gameStore.getProfile());

      soundManager.playRewardClaim();
      if (res.reward.day === 7) {
        soundManager.playVoiceLine('goat');
      } else {
        soundManager.playVoiceLine('lets_go');
      }

      // Celebratory Confetti Blast
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#22c55e', '#ef4444', '#00f5d4'],
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-black shadow-lg">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
              7-Day Daily Calendar
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              Log in daily to claim bonus coins, speed cleats, and the exclusive Stadium GOAT skin!
            </p>
          </div>
        </div>

        {/* Streak Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 my-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-zinc-300 font-semibold">Current Login Streak:</span>
            <span className="font-black text-amber-400 font-mono text-sm">{profile.dailyStreak || 0} Day{(profile.dailyStreak || 0) > 1 ? 's' : ''}</span>
          </div>
          <span className="text-zinc-400 font-mono">
            {claimedDays.length}/7 Claimed
          </span>
        </div>

        {/* Just Claimed Banner */}
        {justClaimedReward && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-center text-sm font-bold animate-in fade-in duration-300">
            🎉 Awesome! You unlocked: {justClaimedReward.rewardDescription}!
          </div>
        )}

        {/* 7 Days Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-2">
          {DAILY_REWARDS.map((item) => {
            const isClaimed = claimedDays.includes(item.day);
            const isTodayActive = canClaim && item.day === nextDay;
            const isLocked = !isClaimed && !isTodayActive;
            const isGrandPrize = item.day === 7;

            return (
              <div
                key={item.day}
                className={`relative flex flex-col items-center text-center p-3.5 rounded-2xl border transition-all duration-200 ${
                  isGrandPrize ? 'col-span-2 sm:col-span-3 md:col-span-2 bg-gradient-to-br from-amber-950/40 to-yellow-900/20 border-amber-500/50' : 'bg-zinc-900/60 border-white/10'
                } ${
                  isTodayActive
                    ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] scale-[1.02]'
                    : isClaimed
                    ? 'opacity-60 bg-emerald-950/20 border-emerald-500/20'
                    : ''
                }`}
              >
                {/* Badge Status */}
                <div className="w-full flex items-center justify-between mb-1 text-[11px] font-black uppercase tracking-wider">
                  <span className={isGrandPrize ? 'text-amber-400' : 'text-zinc-400'}>
                    Day {item.day}
                  </span>
                  {isClaimed ? (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : isTodayActive ? (
                    <span className="text-amber-400 animate-pulse font-mono font-bold">READY!</span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-600" />
                  )}
                </div>

                {/* Big Icon */}
                <div className="text-3xl sm:text-4xl my-2 drop-shadow filter transition-transform group-hover:scale-110">
                  {item.icon}
                </div>

                {/* Title & Desc */}
                <div className="font-bold text-xs text-white line-clamp-1">{item.title}</div>
                <div className="text-[11px] text-amber-300 font-semibold mt-0.5 line-clamp-2">
                  {item.rewardDescription}
                </div>

                {/* Action Button for Active Day */}
                {isTodayActive && (
                  <button
                    onClick={handleClaim}
                    className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer"
                  >
                    Claim Reward
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Come back tomorrow to keep your daily streak alive!</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
