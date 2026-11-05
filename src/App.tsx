/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { gameStore } from './state/gameStore';
import { soundManager } from './audio/SoundManager';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { ShopModal } from './components/ShopModal';
import { MissionsModal } from './components/MissionsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { StudioInspectorModal } from './components/StudioInspectorModal';
import { GameMode, PowerUpActive, RunStats, PlayerProfile, GameSettings, FloatingPopup, MultiplayerState, MultiplayerOpponent } from './types/game';
import { MultiplayerModal } from './components/MultiplayerModal';
import { multiplayerClient } from './network/MultiplayerClient';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Reactive Game Store State
  const [profile, setProfile] = useState<PlayerProfile>(gameStore.getProfile());
  const [settings, setSettings] = useState<GameSettings>(gameStore.getSettings());

  // Game UI State
  const [isMenuMode, setIsMenuMode] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<GameMode>('classic');
  const [activeModal, setActiveModal] = useState<
    'none' | 'shop' | 'missions' | 'leaderboard' | 'settings' | 'howToPlay' | 'inspector' | 'multiplayer'
  >('none');
  const [gameOverStats, setGameOverStats] = useState<RunStats | null>(null);

  // Multiplayer State
  const [multiplayerState, setMultiplayerState] = useState<MultiplayerState>({
    status: 'idle',
    roomId: null,
    opponent: null,
    opponentDistanceDelta: 0,
  });

  // Profiler & FPS
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);

  // HUD Dynamic Values & Juice Effects
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [footballs, setFootballs] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpActive[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [showSpeedLines, setShowSpeedLines] = useState<boolean>(false);
  const [speedIntensity, setSpeedIntensity] = useState<number>(0);
  const [showDangerFlash, setShowDangerFlash] = useState<boolean>(false);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onScoreUpdate: (s, d, c, f, m) => {
        setScore(s);
        setDistance(d);
        setCoins(c);
        setFootballs(f);
        setMultiplier(m);
      },
      onPowerUpUpdate: (powerUps) => {
        setActivePowerUps(powerUps);
      },
      onGameOver: (stats) => {
        setGameOverStats(stats);
      },
      onTimeUpdate: (secs) => {
        setTimeRemaining(secs);
      },
      onFpsUpdate: (f, ms) => {
        setFps(f);
        setFrameTimeMs(ms);
      },
      onPopup: (popup) => {
        const id = 'pop-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const newPopup: FloatingPopup = { id, ...popup };
        setPopups((prev) => [...prev.slice(-3), newPopup]);
        setTimeout(() => {
          setPopups((prev) => prev.filter((p) => p.id !== id));
        }, 1500);
      },
      onDangerFlash: () => {
        setShowDangerFlash(true);
        setTimeout(() => setShowDangerFlash(false), 350);
      },
      onSpeedLinesUpdate: (active, intensity) => {
        setShowSpeedLines(active);
        setSpeedIntensity(intensity);
      },
      onMultiplayerSync: (syncData) => {
        multiplayerClient.syncPlayer(syncData);
      },
      onMultiplayerEvent: (event, meta) => {
        if (event === 'crash') {
          multiplayerClient.sendCrash(meta?.score || 0, meta?.distance || 0);
        } else {
          multiplayerClient.sendEvent(event as any, meta);
        }
      },
    });

    engineRef.current = engine;

    // Apply initial sound settings
    soundManager.setMusicVolume(settings.musicVolume);
    soundManager.setSfxVolume(settings.sfxVolume);

    // Subscribe to store updates
    const unsubscribe = gameStore.subscribe(() => {
      setProfile(gameStore.getProfile());
      setSettings(gameStore.getSettings());
    });

    return () => {
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Listen to incoming multiplayer network events
  useEffect(() => {
    multiplayerClient.setCallbacks({
      onStatusChange: (status) => {
        setMultiplayerState((prev) => ({ ...prev, status }));
      },
      onMatchStart: (roomId, opponent) => {
        setMultiplayerState({
          status: 'in_game',
          roomId,
          opponent,
          opponentDistanceDelta: 0,
        });
        setCurrentMode('multiplayer');
        setIsMenuMode(false);
        setIsPaused(false);
        setGameOverStats(null);
        setActiveModal('none');
        engineRef.current?.setupMultiplayerOpponent(opponent);
        engineRef.current?.startRun('multiplayer');
      },
      onOpponentSync: (opp) => {
        setMultiplayerState((prev) => ({
          ...prev,
          opponent: { ...(prev.opponent || opp), ...opp },
          opponentDistanceDelta: distance - (opp.distance || 0),
        }));
        engineRef.current?.updateOpponentState(opp);
      },
      onOpponentEvent: (event, meta) => {
        engineRef.current?.triggerOpponentAction(event, meta);
      },
      onOpponentCrashed: () => {
        engineRef.current?.triggerOpponentAction('crash');
        setMultiplayerState((prev) => ({ ...prev, winner: 'player' }));
        const id = 'pop-win-' + Date.now();
        setPopups((prev) => [
          ...prev.slice(-3),
          {
            id,
            text: '🏆 OPPONENT CRASHED!',
            subText: 'VICTORY IN LIVE 1v1 DUEL!',
            type: 'record',
            color: '#22c55e',
          },
        ]);
        soundManager.playVoiceLine('goat');
      },
      onOpponentLeft: () => {
        const id = 'pop-left-' + Date.now();
        setPopups((prev) => [
          ...prev.slice(-3),
          {
            id,
            text: '⚠️ OPPONENT DISCONNECTED',
            subText: '1v1 Session Ended',
            type: 'record',
            color: '#38bdf8',
          },
        ]);
      },
    });
  }, [distance]);

  // --- ACTIONS ---

  const handleStartRun = (mode: GameMode) => {
    if (mode === 'multiplayer') {
      setActiveModal('multiplayer');
      return;
    }
    setCurrentMode(mode);
    setIsMenuMode(false);
    setIsPaused(false);
    setGameOverStats(null);
    setActiveModal('none');
    engineRef.current?.removeMultiplayerOpponent();
    engineRef.current?.startRun(mode);
  };

  const handlePause = () => {
    setIsPaused(true);
    engineRef.current?.togglePause(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    engineRef.current?.togglePause(false);
  };

  const handleRestart = () => {
    setIsPaused(false);
    setGameOverStats(null);
    engineRef.current?.startRun(currentMode);
  };

  const handleHome = () => {
    if (currentMode === 'multiplayer') {
      multiplayerClient.leaveRoom();
      engineRef.current?.removeMultiplayerOpponent();
    }
    setIsMenuMode(true);
    setIsPaused(false);
    setGameOverStats(null);
    setActiveModal('none');
    engineRef.current?.setMenuMode(true);
  };

  const handleRevive = () => {
    if (profile.coins >= 250) {
      gameStore.addCoins(-250);
      setGameOverStats(null);
      engineRef.current?.revive();
    }
  };

  const handleCelebrate = () => {
    engineRef.current?.celebrate();
  };

  const handleApplyCosmetics = () => {
    engineRef.current?.refreshEquippedCosmetics();
  };

  const handleUpdateUsername = (newName: string) => {
    gameStore.setUsername(newName);
  };

  const handleResetProgress = () => {
    gameStore.resetProgress();
    engineRef.current?.refreshEquippedCosmetics();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans text-white">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* In-Game HUD (when running & not in menu) */}
      {!isMenuMode && !gameOverStats && (
        <HUD
          score={score}
          distance={distance}
          coins={coins}
          footballs={footballs}
          multiplier={multiplier}
          powerUps={activePowerUps}
          timeRemaining={currentMode === 'time' ? timeRemaining : undefined}
          gameMode={currentMode}
          onPause={handlePause}
          showTouchControls={settings.touchControlsVisible}
          onMoveLeft={() => engineRef.current?.moveLeft()}
          onMoveRight={() => engineRef.current?.moveRight()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
          popups={popups}
          showSpeedLines={showSpeedLines}
          speedIntensity={speedIntensity}
          showDangerFlash={showDangerFlash}
          multiplayerState={multiplayerState}
          onCelebrate={() => engineRef.current?.celebrate()}
        />
      )}

      {/* Main Menu (when in menu mode) */}
      {isMenuMode && (
        <MainMenu
          profile={profile}
          onPlay={handleStartRun}
          onOpenShop={() => setActiveModal('shop')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenHowToPlay={() => setActiveModal('howToPlay')}
          onOpenInspector={() => {
            setActiveModal('inspector');
            engineRef.current?.setInspectMode(true, 'threeQuarter');
          }}
          onOpenMultiplayer={() => setActiveModal('multiplayer')}
          onCelebrate={handleCelebrate}
          onUpdateUsername={handleUpdateUsername}
        />
      )}

      {/* Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          onOpenSettings={() => setActiveModal('settings')}
          onOpenHowToPlay={() => setActiveModal('howToPlay')}
        />
      )}

      {/* Game Over Modal */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          profile={profile}
          onRunAgain={handleRestart}
          onRevive={handleRevive}
          onHome={handleHome}
          onOpenMissions={() => setActiveModal('missions')}
        />
      )}

      {/* Modals */}
      {activeModal === 'inspector' && (
        <StudioInspectorModal
          currentFps={fps}
          currentFrameTimeMs={frameTimeMs}
          onClose={() => {
            setActiveModal('none');
            engineRef.current?.setInspectMode(false);
          }}
          onSelectCameraAngle={(angle) => engineRef.current?.setInspectCameraAngle(angle)}
          onSelectAnimation={(anim) => engineRef.current?.setInspectAnimation(anim)}
          onSelectWorld={(world) => engineRef.current?.setInspectWorld(world)}
          onCaptureScreenshot={() => engineRef.current?.captureScreenshot() || ''}
        />
      )}

      {activeModal === 'shop' && (
        <ShopModal
          profile={profile}
          onClose={() => setActiveModal('none')}
          onApplyCosmetics={handleApplyCosmetics}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          profile={profile}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          entries={gameStore.getLeaderboard()}
          currentUsername={profile.username}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onClose={() => setActiveModal('none')}
          onResetProgress={handleResetProgress}
        />
      )}

      {activeModal === 'howToPlay' && (
        <HowToPlayModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'multiplayer' && (
        <MultiplayerModal
          isOpen={true}
          profile={profile}
          onClose={() => setActiveModal('none')}
          onMatchReady={(opponent) => {
            setMultiplayerState({
              status: 'in_game',
              roomId: 'live_match',
              opponent,
              opponentDistanceDelta: 0,
            });
            setCurrentMode('multiplayer');
            setIsMenuMode(false);
            setIsPaused(false);
            setGameOverStats(null);
            setActiveModal('none');
            engineRef.current?.setupMultiplayerOpponent(opponent);
            engineRef.current?.startRun('multiplayer');
          }}
        />
      )}
    </main>
  );
}
