import React, { useEffect, useRef } from 'react';
import { Pause, Play, Coins, Trophy, Zap, Shield, Magnet, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { PowerUpActive, GameMode, FloatingPopup } from '../types/game';

interface HUDProps {
  score: number;
  distance: number;
  coins: number;
  footballs: number;
  multiplier: number;
  powerUps: PowerUpActive[];
  timeRemaining?: number;
  gameMode: GameMode;
  onPause: () => void;
  showTouchControls: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  popups?: FloatingPopup[];
  showSpeedLines?: boolean;
  speedIntensity?: number;
  showDangerFlash?: boolean;
  multiplayerState?: import('../types/game').MultiplayerState;
  onCelebrate?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  distance,
  coins,
  footballs,
  multiplier,
  powerUps,
  timeRemaining,
  gameMode,
  onPause,
  showTouchControls,
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  popups = [],
  showSpeedLines = false,
  speedIntensity = 0,
  showDangerFlash = false,
  multiplayerState,
  onCelebrate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Speed lines canvas animation
  useEffect(() => {
    if (!showSpeedLines) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const numLines = Math.floor(20 + speedIntensity * 30);
    const lines = Array.from({ length: numLines }, () => ({
      angle: Math.random() * Math.PI * 2,
      r1: 0.35 + Math.random() * 0.3,
      r2: 0.65 + Math.random() * 0.35,
      speed: 0.02 + Math.random() * 0.03,
      alpha: 0.15 + Math.random() * 0.35,
      width: 1.2 + Math.random() * 1.8,
    }));

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const h = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.hypot(cx, cy);

      ctx.clearRect(0, 0, w, h);

      lines.forEach((l) => {
        l.r1 += l.speed;
        l.r2 += l.speed * 1.4;
        if (l.r1 > 1.0) {
          l.r1 = 0.35 + Math.random() * 0.2;
          l.r2 = l.r1 + 0.2 + Math.random() * 0.25;
          l.angle = Math.random() * Math.PI * 2;
        }

        const x1 = cx + Math.cos(l.angle) * l.r1 * maxR;
        const y1 = cy + Math.sin(l.angle) * l.r1 * maxR;
        const x2 = cx + Math.cos(l.angle) * l.r2 * maxR;
        const y2 = cy + Math.sin(l.angle) * l.r2 * maxR;

        ctx.strokeStyle = `rgba(255, 255, 255, ${l.alpha})`;
        ctx.lineWidth = l.width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [showSpeedLines, speedIntensity]);

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'magnet':
        return <Magnet className="w-5 h-5 text-pink-400" />;
      case 'speed_boost':
        return <Flame className="w-5 h-5 text-yellow-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'score_multiplier':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'coin_boost':
        return <Coins className="w-5 h-5 text-emerald-400" />;
      case 'super_jump':
        return <ArrowUp className="w-5 h-5 text-orange-400" />;
      default:
        return <Zap className="w-5 h-5 text-white" />;
    }
  };

  const isMultiplayer = gameMode === 'multiplayer';
  const opponent = multiplayerState?.opponent;
  const oppDist = opponent ? Math.floor(opponent.distance) : 0;
  const distDelta = distance - oppDist;
  const isAhead = distDelta >= 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-5 z-20 overflow-hidden safe-top safe-bottom safe-left safe-right">
      {/* 1. Dynamic Speed Lines Tunnel Overlay (Softened, road corridor kept clean) */}
      {showSpeedLines && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
        />
      )}

      {/* 2. Red Danger / Impact Flash Overlay */}
      {showDangerFlash && (
        <div className="absolute inset-0 pointer-events-none z-10 border-[10px] border-red-500/80 bg-red-600/15 animate-pulse transition-opacity duration-200" />
      )}

      {/* 3. NON-OBSTRUCTIVE Floating Popups: Positioned at Top-Right so track & obstacles are 100% visible */}
      <div className="absolute top-20 right-3 sm:right-6 flex flex-col items-end gap-1.5 pointer-events-none z-30 max-w-[280px]">
        {popups.map((p) => (
          <div
            key={p.id}
            className="animate-in fade-in slide-in-from-right-4 duration-150 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-lg"
            style={{ borderColor: p.color || '#fbbf24' }}
          >
            <div className="flex flex-col items-end text-right">
              <span
                className="text-xs sm:text-sm font-black italic tracking-wide uppercase drop-shadow"
                style={{ color: p.color || '#fbbf24' }}
              >
                {p.text}
              </span>
              {p.subText && (
                <span className="text-[10px] font-mono font-bold text-zinc-300 tracking-wider">
                  {p.subText}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Real-Time Online Multiplayer Duel Header Bar */}
      {isMultiplayer && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/85 backdrop-blur-xl border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] pointer-events-auto z-40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-300">1v1 LIVE DUEL</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Player vs Opponent Delta */}
          <div className="flex items-center gap-3 text-xs font-mono font-black">
            <span className="text-white">YOU: {distance}m</span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] uppercase font-extrabold ${
                isAhead ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isAhead ? `1st (+${distDelta}m)` : `2nd (${distDelta}m)`}
            </span>
            <span className="text-zinc-400">
              {opponent ? `${opponent.username}: ${oppDist}m` : 'Connecting...'}
            </span>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Score & Distance */}
        <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 min-w-[140px]">
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Score</div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight leading-none drop-shadow">
            {score.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-300 font-semibold">
            <span className="text-zinc-500">DIST:</span>
            <span>{distance} m</span>
          </div>
        </div>

        {/* Top-Center: Mode Special / Time Challenge */}
        {gameMode === 'time' && timeRemaining !== undefined && (
          <div className="bg-red-950/80 border border-red-500/30 rounded-2xl px-5 py-2 flex items-center gap-2 shadow-2xl animate-pulse">
            <span className="text-xs uppercase font-bold text-red-300">Time Left</span>
            <span className="text-2xl font-black text-red-400 font-mono">{timeRemaining}s</span>
          </div>
        )}

        {/* Top-Right: Coins, Footballs, Multiplier & Pause */}
        <div className="flex items-center gap-2">
          {/* Multiplier Badge */}
          {multiplier > 1 && (
            <div className="bg-gradient-to-r from-amber-500 to-red-500 text-white font-black px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-lg">
              <Zap className="w-3.5 h-3.5" />
              <span>{multiplier}X</span>
            </div>
          )}

          {/* Footballs */}
          <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-xl text-white">
            <span className="text-base">⚽</span>
            <span className="text-sm font-black font-mono">{footballs}</span>
          </div>

          {/* Coins */}
          <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-xl text-yellow-400">
            <Coins className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-black font-mono">{coins}</span>
          </div>

          {/* SIUUU Celebration Button */}
          {onCelebrate && (
            <button
              onClick={onCelebrate}
              className="pointer-events-auto bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 transition text-black font-black px-3 py-2 rounded-2xl shadow-xl flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
              title="Célébration CR7 SIUUU (ou Touche C)"
            >
              <span>👑</span>
              <span className="hidden sm:inline">SIUUU!</span>
            </button>
          )}

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto bg-black/80 hover:bg-zinc-800 active:scale-95 transition border border-white/10 text-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mid-Left: Active Power-Ups Stack */}
      <div className="flex flex-col gap-2 max-w-[200px]">
        {powerUps.map((pow) => {
          const pct = Math.max(0, Math.min(100, (pow.remainingTime / pow.maxDuration) * 100));
          return (
            <div
              key={pow.type}
              className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2 flex items-center gap-2 shadow-xl"
            >
              <div className="p-1 rounded-lg bg-white/5">{getPowerUpIcon(pow.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center text-[10px] text-zinc-300 uppercase font-black">
                  <span>{pow.type.replace('_', ' ')}</span>
                  <span className="font-mono">{pow.remainingTime.toFixed(1)}s</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-100"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area: Optional On-Screen Touch Controls for Mobile/Tablets */}
      {showTouchControls && (
        <div className="w-full flex items-end justify-between pb-2 pointer-events-auto">
          {/* Left/Right Directional Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onMoveLeft}
              className="w-16 h-16 rounded-2xl bg-black/70 active:bg-amber-500/80 border border-white/15 text-white flex items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={onMoveRight}
              className="w-16 h-16 rounded-2xl bg-black/70 active:bg-amber-500/80 border border-white/15 text-white flex items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Center: Mobile SIUUU Button */}
          {onCelebrate && (
            <button
              onClick={onCelebrate}
              className="h-14 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 active:scale-90 transition text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-2xl border border-amber-300 cursor-pointer"
            >
              <span className="text-sm">👑</span>
              <span>SIUUU!</span>
            </button>
          )}

          {/* Jump / Slide Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onSlide}
              className="w-16 h-16 rounded-2xl bg-black/70 active:bg-cyan-500/80 border border-white/15 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
            >
              <ArrowDown className="w-6 h-6" />
              <span className="text-[9px] uppercase font-black text-cyan-300">Slide</span>
            </button>
            <button
              onClick={onJump}
              className="w-16 h-16 rounded-2xl bg-black/70 active:bg-amber-500/80 border border-white/15 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
            >
              <ArrowUp className="w-6 h-6" />
              <span className="text-[9px] uppercase font-black text-amber-300">Jump</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
