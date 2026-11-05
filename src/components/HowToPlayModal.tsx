import React from 'react';
import { X, HelpCircle, Keyboard, Smartphone, Zap, Shield, Magnet, Flame, ArrowUp, ArrowDown } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">How To Play</h2>
              <p className="text-xs text-zinc-400">Master the lanes, dodge obstacles, and dominate the leaderboard</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* CONTROLS OVERVIEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Desktop Controls */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                <Keyboard className="w-4 h-4" />
                <span>Desktop Controls</span>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Move Left / Right</span>
                  <span className="font-mono bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">
                    A / D or ← / →
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Jump (Double Jump)</span>
                  <span className="font-mono bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">
                    W / ↑ / Space
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Slide Under</span>
                  <span className="font-mono bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">
                    S / ↓
                  </span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Pause Game</span>
                  <span className="font-mono bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">
                    ESC
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Touch Controls */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Mobile Swipes & Touch</span>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Switch Lanes</span>
                  <span className="font-bold text-cyan-400">Swipe Left / Right</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">High Jump</span>
                  <span className="font-bold text-amber-400">Swipe Up</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">Low Slide</span>
                  <span className="font-bold text-red-400">Swipe Down</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-zinc-300">On-Screen D-Pad</span>
                  <span className="font-bold text-emerald-400">Optional HUD buttons</span>
                </div>
              </div>
            </div>
          </div>

          {/* POWER-UPS GUIDE */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Power-Ups & Buffs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <Magnet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">Coin Magnet</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Draws all nearby coins across all lanes directly into your runner.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">Speed Boost Turbo</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Hyper acceleration! Makes you invincible and destroys all obstacles in your path.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">Energy Shield</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Holographic barrier that absorbs one accidental collision without ending your run.
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <ArrowUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-xs uppercase">Super Jump Boots</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Allows you to leap ultra-high and unlocks in-air Double Jumps!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
