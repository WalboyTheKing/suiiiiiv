import React from 'react';
import { Play, RotateCcw, Home, Settings, HelpCircle, X } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/15 rounded-3xl w-full max-w-sm p-6 flex flex-col items-center shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">GAME PAUSED</h2>
        <p className="text-xs text-zinc-400 mb-6">Take a breather before you sprint</p>

        <div className="w-full flex flex-col gap-2.5">
          {/* RESUME */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg hover:scale-102 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME RUN</span>
          </button>

          {/* RESTART */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onRestart();
            }}
            className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          {/* HOW TO PLAY */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenHowToPlay();
            }}
            className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>HOW TO PLAY</span>
          </button>

          {/* SETTINGS */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onOpenSettings();
            }}
            className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>SETTINGS</span>
          </button>

          {/* HOME */}
          <button
            onClick={() => {
              soundManager.playUiClick();
              onHome();
            }}
            className="w-full py-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
