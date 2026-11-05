import React, { useState } from 'react';
import { Play, User, Target, ShoppingBag, Trophy, Settings, HelpCircle, Flame, Coins, Sparkles, CheckCircle2, ChevronRight, Zap, Shield, Timer, Eye, Camera, Gift } from 'lucide-react';
import { PlayerProfile, GameMode } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { gameStore } from '../state/gameStore';
import { DailyRewardsModal } from './DailyRewardsModal';
import { PWAInstallButton } from './PWAInstallButton';
import speedRushPoster from '../assets/images/speed_rush_poster_1793878031529.jpg';
import speedAvatarFace from '../assets/images/speed_avatar_face_1793878044431.jpg';

interface MainMenuProps {
  profile: PlayerProfile;
  onPlay: (mode: GameMode) => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  onOpenInspector: () => void;
  onOpenMultiplayer: () => void;
  onCelebrate: () => void;
  onUpdateUsername: (name: string) => void;
}

interface ModeInfo {
  id: GameMode;
  name: string;
  badge: string;
  desc: string;
  icon: string;
  color: string;
}

const MODES: ModeInfo[] = [
  {
    id: 'classic',
    name: 'Classic Run',
    badge: '4 Worlds',
    desc: 'Infinite sprint with dynamic world transitions every 1,200m',
    icon: '🏃',
    color: 'from-red-600 to-amber-600',
  },
  {
    id: 'multiplayer',
    name: '1v1 Online',
    badge: 'Multiplayer',
    desc: 'Live head-to-head sprint duel: see your rival on track in real-time!',
    icon: '⚡',
    color: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'time',
    name: '90s Time Attack',
    badge: 'Time Attack',
    desc: 'Beat the clock! Golden footballs grant +5s bonus time',
    icon: '⏱️',
    color: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'football',
    name: 'Stadium Match',
    badge: 'Football Arena',
    desc: 'Hurdles, field goal targets, and golden balls in the grand stadium',
    icon: '⚽',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'daily',
    name: 'Champion Arena',
    badge: '2x Rewards',
    desc: 'High-octane daily challenge in the golden stadium arena',
    icon: '🏆',
    color: 'from-purple-600 to-indigo-600',
  },
];

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  onPlay,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenHowToPlay,
  onOpenInspector,
  onOpenMultiplayer,
  onCelebrate,
  onUpdateUsername,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [showSeasonModal, setShowSeasonModal] = useState<boolean>(false);
  const [showDailyModal, setShowDailyModal] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(profile.username);

  const canClaimDaily = gameStore.canClaimDailyReward();
  const xpProgress = Math.min(100, Math.floor((profile.xp / (profile.level * 350)) * 100));
  const activeModeData = MODES.find((m) => m.id === selectedMode) || MODES[0];

  const handleStartGame = () => {
    soundManager.playUiClick();
    if (selectedMode === 'multiplayer') {
      onOpenMultiplayer();
    } else {
      onPlay(selectedMode);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUsername(tempName.trim());
      setIsEditingName(false);
      soundManager.playUiClick();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-5 z-20 overflow-hidden safe-top safe-bottom safe-left safe-right">
      {/* 1. TOP HEADER BAR: PRO STREAMER PROFILE & RESOURCES */}
      <header className="flex items-start justify-between w-full pointer-events-auto gap-3">
        {/* Streamer Profile Card */}
        <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center gap-3 max-w-sm">
          <button
            onClick={() => {
              onCelebrate();
              soundManager.playUiClick();
            }}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer group shrink-0"
            title="Profil officiel IShowSpeed - Clique pour célébrer !"
          >
            <img
              src={speedAvatarFace}
              alt="IShowSpeed"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={14}
                    autoFocus
                    className="bg-zinc-800 border border-white/20 text-white text-xs px-2 py-0.5 rounded outline-none w-24"
                  />
                  <button type="submit" className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">
                    OK
                  </button>
                </form>
              ) : (
                <div
                  onClick={() => setIsEditingName(true)}
                  className="font-black text-white text-xs sm:text-sm hover:text-amber-400 cursor-pointer flex items-center gap-1 truncate"
                  title="Modifier le pseudo"
                >
                  <span className="truncate">{profile.username}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 fill-blue-500/20" />
                </div>
              )}

              <span className="text-[9px] uppercase font-black bg-gradient-to-r from-red-600 to-amber-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                LVL {profile.level}
              </span>
            </div>

            {/* Level XP Bar */}
            <div className="w-28 sm:w-36 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400 transition-all duration-300"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-0.5 font-medium">
              <span>XP: {profile.xp}/{profile.level * 350}</span>
              <span className="text-amber-400/80 font-bold hidden sm:inline">35M+ SUBS</span>
            </div>
          </div>
        </div>

        {/* Currency & Score Dashboard */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Coins */}
          <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-3 sm:px-4 py-2 flex items-center gap-2 shadow-2xl">
            <div className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">Coins</span>
              <span className="text-sm sm:text-base font-black text-yellow-400 font-mono leading-none">
                {profile.coins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Record */}
          <div className="bg-black/85 backdrop-blur-xl border border-white/10 rounded-2xl px-3 sm:px-4 py-2 hidden sm:flex items-center gap-2 shadow-2xl">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-wider">High Score</span>
              <span className="text-sm sm:text-base font-black text-white font-mono leading-none">
                {profile.highScore.toLocaleString()} m
              </span>
            </div>
          </div>
          {/* PWA Install Action */}
          <PWAInstallButton />
        </div>
      </header>

      {/* 2. CENTER STAGE: LOGO & FLOATING SEASON 1 LIVE EVENT WIDGET */}
      <div className="flex flex-col md:flex-row items-center justify-between my-auto w-full max-w-6xl mx-auto px-2 pointer-events-auto gap-4">
        {/* Game Title Presentation */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 shadow-lg backdrop-blur-sm">
            <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
            <span>Official 3D Edition</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-amber-500 drop-shadow-[0_10px_25px_rgba(245,158,11,0.35)] leading-none">
            SPEED RUSH
          </h1>

          <p className="text-xs sm:text-sm font-bold text-zinc-400 mt-2 tracking-wide max-w-md">
            DODGE • SPRINT • JUMP • SLIDE • SIUUU!
          </p>
        </div>

        {/* Season 1 Live Event Pro Widget (Desktop & Mobile) */}
        <div
          onClick={() => {
            setShowSeasonModal(true);
            soundManager.playUiClick();
          }}
          className="relative w-full max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border border-amber-500/30 bg-black/70 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] cursor-pointer group hover:border-amber-400 transition-all hover:scale-[1.02]"
        >
          {/* Card Header with Speed Artwork */}
          <div className="relative h-28 sm:h-32 w-full overflow-hidden">
            <img
              src={speedRushPoster}
              alt="Season 1 Tokyo Ignition"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>SEASON 1 PASS</span>
            </div>

            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-white/20 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full shadow">
              LIVE EVENT
            </div>

            <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">
                  TOKYO IGNITION
                </span>
                <span className="text-xs sm:text-sm font-black text-white uppercase drop-shadow">
                  Exclusive Rewards
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card Footer Info */}
          <div className="p-2.5 bg-zinc-950/90 flex items-center justify-between text-[10px] border-t border-white/5">
            <span className="text-zinc-400">Season Perk: 2x Stadium Coins</span>
            <span className="text-amber-400 font-bold">View Rewards</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROL DECK: QUICK MODE SELECTOR & PLAY CTA */}
      <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto pointer-events-auto">
        {/* Game Mode Selector Pills */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 sm:p-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 max-w-full overflow-x-auto">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id);
                  soundManager.playUiClick();
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-102 border border-white/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.name}</span>
                <span className={`text-[9px] px-1 rounded font-bold uppercase ${isSelected ? 'bg-black/40 text-amber-300' : 'text-zinc-500'}`}>
                  {mode.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Big PLAY Launch CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartGame}
            className="group relative px-10 sm:px-14 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-black text-xl sm:text-2xl tracking-wider shadow-[0_10px_35px_rgba(239,68,68,0.55)] hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer border-2 border-white/30"
          >
            <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white group-hover:scale-110 transition-transform" />
            <span>START RUN ({activeModeData.name.toUpperCase()})</span>
          </button>

          <button
            onClick={() => {
              onCelebrate();
              soundManager.playUiClick();
            }}
            className="p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-amber-400/30 text-amber-400 hover:text-amber-300 hover:border-amber-400 hover:bg-amber-500/10 active:scale-95 transition cursor-pointer shadow-xl flex items-center justify-center"
            title="SIUUU Celebration!"
          >
            <Sparkles className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              onOpenInspector();
              soundManager.playUiClick();
            }}
            className="p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-cyan-400/30 text-cyan-400 hover:text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10 active:scale-95 transition cursor-pointer shadow-xl flex items-center justify-center"
            title="Studio d'Audit & Inspection 3D (Angles, Animations & FPS)"
          >
            <Eye className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 4. BOTTOM NAVIGATION DOCK (CONSOLE/ARCADE TILES) */}
      <nav className="w-full flex justify-center pointer-events-auto mt-2">
        <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 px-2.5 sm:px-6 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex items-center gap-1 sm:gap-4 overflow-x-auto max-w-full no-scrollbar">
          <button
            onClick={() => {
              onOpenMultiplayer();
              soundManager.playUiClick();
            }}
            className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition text-cyan-300 hover:text-white cursor-pointer min-w-[54px] border border-cyan-400/40 bg-gradient-to-b from-cyan-500/20 to-blue-600/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            title="Challenge a rival in real-time 1v1 online duel!"
          >
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">1v1 Online</span>
          </button>

          <button
            onClick={() => {
              onOpenInspector();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-cyan-500/20 active:scale-95 transition text-cyan-300 hover:text-white cursor-pointer min-w-[54px] border border-cyan-500/30 bg-cyan-500/10"
          >
            <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">3D Studio</span>
          </button>

          <button
            onClick={() => {
              setShowDailyModal(true);
              soundManager.playUiClick();
            }}
            className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 active:scale-95 transition text-amber-300 hover:text-white cursor-pointer min-w-[54px] border border-amber-500/30 bg-amber-500/10"
            title="7-Day Daily Login Rewards"
          >
            {canClaimDaily && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Rewards</span>
          </button>

          <button
            onClick={() => {
              onOpenShop();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Shop</span>
          </button>

          <button
            onClick={() => {
              onOpenShop();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <User className="w-5 h-5 text-cyan-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Skins</span>
          </button>

          <button
            onClick={() => {
              onOpenMissions();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <Target className="w-5 h-5 text-red-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Missions</span>
          </button>

          <button
            onClick={() => {
              onOpenLeaderboard();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Records</span>
          </button>

          <button
            onClick={() => {
              onOpenHowToPlay();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Guide</span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              soundManager.playUiClick();
            }}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-95 transition text-zinc-300 hover:text-white cursor-pointer min-w-[54px]"
          >
            <Settings className="w-5 h-5 text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-wider">Options</span>
          </button>
        </div>
      </nav>

      {/* 5. PRO SEASON PASS / LIVE EVENT MODAL */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
          <div className="relative max-w-2xl w-full bg-zinc-950 border border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.4)] flex flex-col">
            {/* Header Banner */}
            <div className="relative w-full aspect-video sm:h-64 overflow-hidden">
              <img
                src={speedRushPoster}
                alt="Season 1 Tokyo Ignition"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40" />

              <button
                onClick={() => setShowSeasonModal(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/80 hover:bg-red-600 text-white font-bold flex items-center justify-center transition border border-white/20 cursor-pointer text-sm"
              >
                ✕
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-md">
                    COMMUNITY EVENT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1 drop-shadow">
                    SEASON 1: TOKYO IGNITION
                  </h3>
                  <p className="text-xs text-amber-400 font-bold">
                    IShowSpeed World Tour • Neon tracks & coin multipliers
                  </p>
                </div>
              </div>
            </div>

            {/* Event Rewards & Details */}
            <div className="p-4 sm:p-6 flex flex-col gap-4 bg-zinc-950">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center">
                  <Coins className="w-5 h-5 text-yellow-400 mb-1" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Active Perk</span>
                  <span className="text-xs font-black text-white mt-0.5">2x Stadium Coins</span>
                </div>

                <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center">
                  <Zap className="w-5 h-5 text-amber-400 mb-1" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Turbo Boost</span>
                  <span className="text-xs font-black text-white mt-0.5">+16 m/s Speed</span>
                </div>

                <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-3 flex flex-col items-center text-center">
                  <Shield className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Pro Shield</span>
                  <span className="text-xs font-black text-white mt-0.5">1 Free Revive</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
                <p className="text-xs text-zinc-300">
                  Sprint in daily runs and shatter your personal record to climb the global leaderboard!
                </p>

                <button
                  onClick={() => {
                    setShowSeasonModal(false);
                    handleStartGame();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-black text-sm uppercase shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 7-DAY DAILY LOGIN REWARDS MODAL */}
      <DailyRewardsModal
        isOpen={showDailyModal}
        onClose={() => setShowDailyModal(false)}
      />
    </div>
  );
};
