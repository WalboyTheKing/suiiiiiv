export type GameMode = 'classic' | 'time' | 'football' | 'daily' | 'multiplayer';

export type WorldType = 'speed-city' | 'football-stadium' | 'world-tour' | 'champion-arena';

export interface MultiplayerOpponent {
  id: string;
  username: string;
  skinId: string;
  sneakerId: string;
  trailId: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  animState: string;
  score: number;
  distance: number;
  isSliding?: boolean;
  isGrounded?: boolean;
  isCrashed?: boolean;
}

export interface MultiplayerState {
  status: 'idle' | 'searching' | 'connected' | 'in_game' | 'game_over';
  roomId: string | null;
  roomCode?: string;
  opponent: MultiplayerOpponent | null;
  opponentDistanceDelta: number; // positive = player is ahead, negative = opponent is ahead
  winner?: 'player' | 'opponent' | null;
}

export type PowerUpType = 
  | 'magnet' 
  | 'speed_boost' 
  | 'shield' 
  | 'score_multiplier' 
  | 'coin_boost' 
  | 'super_jump';

export interface PowerUpActive {
  type: PowerUpType;
  remainingTime: number;
  maxDuration: number;
}

export interface CharacterSkin {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  jerseyNumber: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  hairColor: string;
  skinTone: string;
  specialAura?: string;
}

export interface SneakerItem {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  soleColor: string;
  glowColor: string;
}

export interface TrailItem {
  id: string;
  name: string;
  description: string;
  price: number;
  particleColor: string;
  type: 'sparks' | 'golden' | 'fire' | 'lightning' | 'rainbow';
}

export interface AccessoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'headset' | 'chain' | 'armband' | 'shades' | 'crown';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  type: 'coins' | 'distance' | 'jumps' | 'slides' | 'footballs' | 'powerups' | 'score';
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  distance: number;
  coins: number;
  date: string;
  mode: GameMode;
  characterName: string;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  touchControlsVisible: boolean;
  swipeSensitivity: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface PlayerProfile {
  username: string;
  coins: number;
  highScore: number;
  highestDistance: number;
  level: number;
  xp: number;
  selectedSkinId: string;
  selectedSneakerId: string;
  selectedTrailId: string;
  selectedAccessoryId: string;
  unlockedSkins: string[];
  unlockedSneakers: string[];
  unlockedTrails: string[];
  unlockedAccessories: string[];
  missions: Mission[];
  completedRuns: number;
  totalFootballsCollected: number;
  totalCoinsCollectedAllTime: number;
  lastDailyDate: string;
  dailyStreak: number;
  lastStreakClaimDate: string;
  claimedStreakDays: number[];
}

export interface RunStats {
  score: number;
  distance: number;
  coins: number;
  footballs: number;
  powerUpsUsed: number;
  jumps: number;
  slides: number;
  nearMisses?: number;
  multiplier: number;
  timeRemaining?: number; // for time challenge
  isNewRecord: boolean;
}

export interface FloatingPopup {
  id: string;
  text: string;
  subText?: string;
  type: 'near_miss' | 'powerup' | 'football' | 'coin' | 'combo' | 'record' | 'siuuu';
  color?: string;
}

export interface DailyRewardItem {
  day: number;
  title: string;
  rewardDescription: string;
  coins: number;
  footballs?: number;
  skinId?: string;
  sneakerId?: string;
  trailId?: string;
  icon: string;
}
