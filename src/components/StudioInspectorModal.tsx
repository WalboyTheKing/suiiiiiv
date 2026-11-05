import React, { useState } from 'react';
import { X, Camera, Eye, Flame, Play, Sparkles, Activity, Download, RefreshCw, Layers, Shield } from 'lucide-react';
import { CharacterAnimState } from '../game/CharacterModel';
import { WorldType } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface StudioInspectorModalProps {
  currentFps: number;
  currentFrameTimeMs: number;
  onClose: () => void;
  onSelectCameraAngle: (angle: 'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit') => void;
  onSelectAnimation: (anim: CharacterAnimState) => void;
  onSelectWorld: (world: WorldType) => void;
  onCaptureScreenshot: () => string;
}

export const StudioInspectorModal: React.FC<StudioInspectorModalProps> = ({
  currentFps,
  currentFrameTimeMs,
  onClose,
  onSelectCameraAngle,
  onSelectAnimation,
  onSelectWorld,
  onCaptureScreenshot,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit'>('threeQuarter');
  const [selectedAnim, setSelectedAnim] = useState<CharacterAnimState>('idle');
  const [selectedWorld, setSelectedWorld] = useState<WorldType>('speed-city');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  const handleAngleChange = (angle: 'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit') => {
    setSelectedAngle(angle);
    onSelectCameraAngle(angle);
    soundManager.playUiClick();
  };

  const handleAnimChange = (anim: CharacterAnimState) => {
    setSelectedAnim(anim);
    onSelectAnimation(anim);
    soundManager.playUiClick();
    if (anim === 'celebrating') {
      soundManager.playVoiceLine('siuuu', true);
    } else if (anim === 'jumping') {
      soundManager.playJump();
    } else if (anim === 'sliding') {
      soundManager.playSlide();
    } else if (anim === 'collision') {
      soundManager.playCrash();
    }
  };

  const handleWorldChange = (world: WorldType) => {
    setSelectedWorld(world);
    onSelectWorld(world);
    soundManager.playUiClick();
  };

  const handleCapture = () => {
    soundManager.playPowerUp();
    const url = onCaptureScreenshot();
    setScreenshotUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-between p-3 sm:p-6 bg-black/40 backdrop-blur-xs select-none">
      {/* Top Header Bar with Live Performance Profiler */}
      <div className="flex items-center justify-between w-full bg-zinc-950/90 border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>Studio d'Audit Visuel 3D</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                PROFILER ACTIF
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Inspection multi-angles du modèle, locomotion biomécanique & profondeur 3D
            </p>
          </div>
        </div>

        {/* Live FPS & Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-xs font-mono font-black text-emerald-400 leading-none">
                {currentFps} FPS
              </span>
              <span className="text-[9px] font-mono text-zinc-400 leading-none">
                {currentFrameTimeMs} ms
              </span>
            </div>
          </div>

          <button
            onClick={handleCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer shadow-lg"
            title="Prendre un instantané haute résolution de la vue 3D"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Capturer</span>
          </button>

          <button
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Screenshot Preview Modal (if captured) */}
      {screenshotUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/20 rounded-3xl max-w-2xl w-full p-5 flex flex-col items-center gap-4 shadow-2xl">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-black text-white uppercase flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                Instantané 3D Capturé en Temps Réel
              </span>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden border border-white/15 bg-black">
              <img src={screenshotUrl} alt="Inspection Snapshot" className="w-full h-auto object-contain max-h-[60vh]" />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={screenshotUrl}
                download="speed-rush-3d-inspection.png"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger PNG</span>
              </a>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-bold text-xs hover:bg-zinc-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Control Panel (Bottom) */}
      <div className="bg-zinc-950/95 border border-white/15 rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 max-w-4xl mx-auto w-full">
        {/* Row 1: Camera Angle Controls */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>Angles de Caméra Studio</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[
              { id: 'front', label: 'Face' },
              { id: 'profile', label: 'Profil' },
              { id: 'back', label: 'Dos (#7)' },
              { id: 'threeQuarter', label: 'Vue 3/4' },
              { id: 'orbit', label: 'Orbite 360°' },
            ].map((ang) => (
              <button
                key={ang.id}
                onClick={() => handleAngleChange(ang.id as any)}
                className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-black uppercase transition cursor-pointer text-center ${
                  selectedAngle === ang.id
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                    : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {ang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Biomechanical Animation Triggers */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Animations Biologiques & Locomotion</span>
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {[
              { id: 'idle', label: 'Posture' },
              { id: 'running', label: 'Course' },
              { id: 'sprinting', label: 'Sprint' },
              { id: 'jumping', label: 'Saut' },
              { id: 'sliding', label: 'Glissade' },
              { id: 'collision', label: 'Choc' },
              { id: 'celebrating', label: 'SIUUU!' },
            ].map((anim) => (
              <button
                key={anim.id}
                onClick={() => handleAnimChange(anim.id as any)}
                className={`py-2 px-1 sm:px-2 rounded-xl text-xs font-black uppercase transition cursor-pointer text-center ${
                  selectedAnim === anim.id
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
                    : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: 4 World Environments Inspection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Tester les 4 Environnements Volumétriques</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { id: 'speed-city', label: 'Speed City', icon: '🏙️' },
              { id: 'football-stadium', label: 'Football Stadium', icon: '⚽' },
              { id: 'world-tour', label: 'World Tour', icon: '🌉' },
              { id: 'champion-arena', label: 'Champion Arena', icon: '🏆' },
            ].map((wld) => (
              <button
                key={wld.id}
                onClick={() => handleWorldChange(wld.id as any)}
                className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedWorld === wld.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-zinc-900 border border-white/10 text-zinc-300 hover:bg-white/10'
                }`}
              >
                <span>{wld.icon}</span>
                <span>{wld.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
