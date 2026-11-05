import React, { useState } from 'react';
import { X, Trophy, Medal, Flame, Calendar, MapPin, Coins } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentUsername: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentUsername,
  onClose,
}) => {
  const [filterMode, setFilterMode] = useState<string>('all');

  const filtered = entries.filter((entry) => {
    if (filterMode === 'all') return true;
    return entry.mode === filterMode;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">Records & Hall of Fame</h2>
              <p className="text-xs text-zinc-400">Verified high-score runs, max distances & tournament records</p>
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

        {/* Filter Pills */}
        <div className="p-4 bg-zinc-900/30 border-b border-white/10 flex gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Modes' },
            { id: 'classic', label: 'Classic Run' },
            { id: 'time', label: 'Time Sprint' },
            { id: 'football', label: 'Stadium Match' },
            { id: 'daily', label: 'Daily Arena' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterMode(tab.id);
                soundManager.playUiClick();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer whitespace-nowrap ${
                filterMode === tab.id
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Entries */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm font-semibold">
              No runs recorded in this category yet. Start running!
            </div>
          ) : (
            filtered.map((item, index) => {
              const isTop1 = index === 0;
              const isTop2 = index === 1;
              const isTop3 = index === 2;
              const isSelf = item.username.toLowerCase() === currentUsername.toLowerCase();

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isSelf
                      ? 'border-amber-400/50 bg-amber-500/10'
                      : isTop1
                      ? 'border-yellow-500/40 bg-yellow-500/5'
                      : 'border-white/5 bg-zinc-900/40'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                        isTop1
                          ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30'
                          : isTop2
                          ? 'bg-zinc-300 text-black'
                          : isTop3
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/5 text-zinc-400'
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm tracking-wide">
                          {item.username}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500 text-black">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">
                          • {item.characterName}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-3 mt-0.5 font-medium">
                        <span>Dist: {item.distance.toLocaleString()}m</span>
                        <span>Coins: {item.coins}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-black text-amber-400 font-mono tracking-tight">
                      {item.score.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">
                      Points
                    </div>
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
