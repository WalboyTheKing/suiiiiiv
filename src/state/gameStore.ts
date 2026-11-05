import { CharacterSkin, SneakerItem, TrailItem, AccessoryItem, Mission, LeaderboardEntry, GameSettings, PlayerProfile, RunStats, GameMode, DailyRewardItem } from '../types/game';

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, title: 'Day 1: Warmup', rewardDescription: '+200 Gold Coins', coins: 200, icon: '🪙' },
  { day: 2, title: 'Day 2: Match Winner', rewardDescription: '+350 Coins & 1 Golden Ball', coins: 350, footballs: 1, icon: '⚽' },
  { day: 3, title: 'Day 3: Speed Cleats', rewardDescription: '+500 Coins & Lightning Boost Cleats', coins: 500, sneakerId: 'lightning-boost', icon: '👟' },
  { day: 4, title: 'Day 4: Titanium Shield', rewardDescription: '+750 Coins & Shield Tokens', coins: 750, icon: '🛡️' },
  { day: 5, title: 'Day 5: Golden Surge', rewardDescription: '+1,200 Match Coins', coins: 1200, icon: '💰' },
  { day: 6, title: 'Day 6: Electric Sparks', rewardDescription: '+1,800 Coins & Electric Sparks Trail', coins: 1800, trailId: 'trail-electric', icon: '⚡' },
  { day: 7, title: 'Day 7: The Ultimate GOAT', rewardDescription: '+3,000 Coins, 5 Balls & Stadium GOAT Skin', coins: 3000, footballs: 5, skinId: 'stadium-goat', icon: '👑' },
];

export const DEFAULT_SKINS: CharacterSkin[] = [
  {
    id: 'speed-prodigy',
    name: 'Speed Prodigy',
    description: 'The energetic iconic #7 runner. Bursting with speed, passion and celebrations.',
    price: 0,
    rarity: 'common',
    jerseyNumber: '7',
    primaryColor: '#e50914', // Vibrant Red
    secondaryColor: '#009739', // Green Portugal/National accents
    accentColor: '#ffd700', // Gold
    hairColor: '#1a110a',
    skinTone: '#613d29',
  },
  {
    id: 'stadium-goat',
    name: 'Stadium GOAT',
    description: 'Gold-embossed championship kit. When you know you are the greatest on the pitch.',
    price: 1500,
    rarity: 'epic',
    jerseyNumber: '7',
    primaryColor: '#111115', // Sleek black
    secondaryColor: '#d4af37', // Polished gold
    accentColor: '#ffffff',
    hairColor: '#000000',
    skinTone: '#5c3924',
    specialAura: '#d4af37',
  },
  {
    id: 'cyber-streamer',
    name: 'Cyber Streamer',
    description: 'Ultra-modern streaming armor with dynamic neon fiber-optics.',
    price: 3000,
    rarity: 'legendary',
    jerseyNumber: '99',
    primaryColor: '#0a0d20',
    secondaryColor: '#00f5d4', // Cyber cyan
    accentColor: '#7b2cbf', // Neon purple
    hairColor: '#7b2cbf',
    skinTone: '#4a2c1a',
    specialAura: '#00f5d4',
  },
  {
    id: 'street-baller',
    name: 'Street Baller',
    description: 'Urban asphalt ruler with heavy street drip and attitude.',
    price: 2000,
    rarity: 'rare',
    jerseyNumber: '10',
    primaryColor: '#3a0ca3',
    secondaryColor: '#f72585',
    accentColor: '#ffffff',
    hairColor: '#1a110a',
    skinTone: '#664028',
  },
  {
    id: 'world-tour-captain',
    name: 'World Tour Captain',
    description: 'Official captain armband and international tournament match kit.',
    price: 4500,
    rarity: 'legendary',
    jerseyNumber: '7',
    primaryColor: '#0077b6',
    secondaryColor: '#ffffff',
    accentColor: '#ffb703',
    hairColor: '#111111',
    skinTone: '#583621',
    specialAura: '#0077b6',
  },
];

export const DEFAULT_SNEAKERS: SneakerItem[] = [
  {
    id: 'classic-kicks',
    name: 'Classic Mercurials',
    description: 'Reliable high-traction athletic cleats built for sudden lane cuts.',
    price: 0,
    color: '#e63946',
    soleColor: '#ffffff',
    glowColor: '#ff758f',
  },
  {
    id: 'lightning-boost',
    name: 'Lightning Boost',
    description: 'Equipped with ionic shock absorbers for effortless high jumps.',
    price: 1000,
    color: '#00b4d8',
    soleColor: '#90e0ef',
    glowColor: '#00f5d4',
  },
  {
    id: 'golden-cleats',
    name: 'Golden Trophy Cleats',
    description: 'Pure 24k plated studs that leave a shimmer on the asphalt.',
    price: 2500,
    color: '#ffd166',
    soleColor: '#d4af37',
    glowColor: '#ffe49e',
  },
  {
    id: 'magma-striders',
    name: 'Magma Striders',
    description: 'Forged from molten street energy with glowing volcanic soles.',
    price: 3500,
    color: '#d90429',
    soleColor: '#ff4d6d',
    glowColor: '#ff0054',
  },
];

export const DEFAULT_TRAILS: TrailItem[] = [
  {
    id: 'trail-none',
    name: 'Standard Dust',
    description: 'Classic runner dust kick-off.',
    price: 0,
    particleColor: '#bbbbbb',
    type: 'sparks',
  },
  {
    id: 'trail-electric',
    name: 'Electric Sparks',
    description: 'Cracking cyan electricity sparks behind every stride.',
    price: 1200,
    particleColor: '#00f0ff',
    type: 'lightning',
  },
  {
    id: 'trail-golden',
    name: 'Golden Champions',
    description: 'Floating gold stars and winner confetti follow your sprint.',
    price: 2400,
    particleColor: '#ffd700',
    type: 'golden',
  },
  {
    id: 'trail-fire',
    name: 'Inferno Blaze',
    description: 'Flames scorch the pavement as you accelerate past 30 m/s.',
    price: 3800,
    particleColor: '#ff3b00',
    type: 'fire',
  },
];

export const DEFAULT_ACCESSORIES: AccessoryItem[] = [
  {
    id: 'acc-none',
    name: 'None',
    description: 'No accessory equipped.',
    price: 0,
    type: 'armband',
  },
  {
    id: 'acc-headset',
    name: 'Pro Streamer Headset',
    description: 'High-energy studio headset for barking reactions into the mic.',
    price: 1200,
    type: 'headset',
  },
  {
    id: 'acc-chain',
    name: 'Heavy Iced-Out Chain',
    description: 'Diamond studded chain with custom #7 pendant.',
    price: 2200,
    type: 'chain',
  },
  {
    id: 'acc-shades',
    name: 'Speed Hyper Shades',
    description: 'Aerodynamic mirrored visor for zero glare at high velocity.',
    price: 1800,
    type: 'shades',
  },
  {
    id: 'acc-crown',
    name: 'The King Crown',
    description: 'Golden jewel-encrusted crown fitting the true pitch monarch.',
    price: 5000,
    type: 'crown',
  },
];

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-coins-1',
    title: 'Coin Collector',
    description: 'Collect 100 coins in single or multiple runs',
    target: 100,
    current: 0,
    rewardCoins: 250,
    rewardXp: 150,
    completed: false,
    claimed: false,
    type: 'coins',
  },
  {
    id: 'm-dist-1',
    title: 'Distance Prodigy',
    description: 'Sprint a total of 1,000 meters',
    target: 1000,
    current: 0,
    rewardCoins: 300,
    rewardXp: 200,
    completed: false,
    claimed: false,
    type: 'distance',
  },
  {
    id: 'm-jumps-1',
    title: 'Air Time',
    description: 'Jump over 15 obstacles successfully',
    target: 15,
    current: 0,
    rewardCoins: 200,
    rewardXp: 120,
    completed: false,
    claimed: false,
    type: 'jumps',
  },
  {
    id: 'm-slides-1',
    title: 'Slide King',
    description: 'Slide under 10 overhead barriers',
    target: 10,
    current: 0,
    rewardCoins: 200,
    rewardXp: 120,
    completed: false,
    claimed: false,
    type: 'slides',
  },
  {
    id: 'm-footballs-1',
    title: 'Golden Ball Hunter',
    description: 'Collect 5 Golden Footballs',
    target: 5,
    current: 0,
    rewardCoins: 400,
    rewardXp: 250,
    completed: false,
    claimed: false,
    type: 'footballs',
  },
  {
    id: 'm-powerups-1',
    title: 'Overpowered',
    description: 'Grab and activate 3 power-ups',
    target: 3,
    current: 0,
    rewardCoins: 300,
    rewardXp: 180,
    completed: false,
    claimed: false,
    type: 'powerups',
  },
];

const STORAGE_KEYS = {
  PROFILE: 'speedrush_player_profile',
  SETTINGS: 'speedrush_game_settings',
  LEADERBOARD: 'speedrush_leaderboard',
};

const DEFAULT_PROFILE: PlayerProfile = {
  username: 'SpeedRunner7',
  coins: 500, // starting coins to buy a starter cosmetic!
  highScore: 0,
  highestDistance: 0,
  level: 1,
  xp: 0,
  selectedSkinId: 'speed-prodigy',
  selectedSneakerId: 'classic-kicks',
  selectedTrailId: 'trail-none',
  selectedAccessoryId: 'acc-none',
  unlockedSkins: ['speed-prodigy'],
  unlockedSneakers: ['classic-kicks'],
  unlockedTrails: ['trail-none'],
  unlockedAccessories: ['acc-none'],
  missions: INITIAL_MISSIONS,
  completedRuns: 0,
  totalFootballsCollected: 0,
  totalCoinsCollectedAllTime: 0,
  lastDailyDate: '',
  dailyStreak: 0,
  lastStreakClaimDate: '',
  claimedStreakDays: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.6,
  sfxVolume: 0.8,
  graphicsQuality: 'high',
  touchControlsVisible: true,
  swipeSensitivity: 1.0,
  soundEnabled: true,
  musicEnabled: true,
};

export class GameStore {
  private static instance: GameStore;
  private profile: PlayerProfile;
  private settings: GameSettings;
  private leaderboard: LeaderboardEntry[];
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.profile = this.loadProfile();
    this.settings = this.loadSettings();
    this.leaderboard = this.loadLeaderboard();
  }

  public static getInstance(): GameStore {
    if (!GameStore.instance) {
      GameStore.instance = new GameStore();
    }
    return GameStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getProfile(): PlayerProfile {
    return { ...this.profile };
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  private loadProfile(): PlayerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_PROFILE };
  }

  private saveProfile() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    } catch {
      // ignore
    }
    this.notify();
  }

  private loadSettings(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // fallback
    }
    return { ...DEFAULT_SETTINGS };
  }

  public updateSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch {
      // ignore
    }
    this.notify();
  }

  private loadLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    // Pre-populate with iconic challenger scores for excitement!
    return [
      { id: 'lb-1', username: 'Speed_Live_99', score: 38450, distance: 3420, coins: 410, date: 'Today', mode: 'classic', characterName: 'Stadium GOAT' },
      { id: 'lb-2', username: 'SpeedGang_Official', score: 29800, distance: 2850, coins: 330, date: 'Yesterday', mode: 'classic', characterName: 'Speed Prodigy' },
      { id: 'lb-3', username: 'BarkingBandit', score: 21400, distance: 2190, coins: 260, date: '2 days ago', mode: 'classic', characterName: 'Street Baller' },
      { id: 'lb-4', username: 'SiuuuStreamer', score: 16500, distance: 1740, coins: 180, date: '3 days ago', mode: 'time', characterName: 'Speed Prodigy' },
      { id: 'lb-5', username: 'SpeedDribbler', score: 11200, distance: 1250, coins: 140, date: '4 days ago', mode: 'football', characterName: 'Cyber Streamer' },
    ];
  }

  public setUsername(username: string) {
    if (!username.trim()) return;
    this.profile.username = username.trim().slice(0, 16);
    this.saveProfile();
  }

  public addCoins(amount: number) {
    this.profile.coins += amount;
    this.profile.totalCoinsCollectedAllTime += amount;
    this.saveProfile();
  }

  public addXp(amount: number) {
    this.profile.xp += amount;
    const requiredForNext = this.profile.level * 350;
    while (this.profile.xp >= requiredForNext) {
      this.profile.xp -= requiredForNext;
      this.profile.level += 1;
      this.profile.coins += 200; // Level up reward
    }
    this.saveProfile();
  }

  public selectSkin(id: string) {
    if (this.profile.unlockedSkins.includes(id)) {
      this.profile.selectedSkinId = id;
      this.saveProfile();
    }
  }

  public buySkin(id: string): boolean {
    const skin = DEFAULT_SKINS.find((s) => s.id === id);
    if (!skin) return false;
    if (this.profile.unlockedSkins.includes(id)) return true;
    if (this.profile.coins >= skin.price) {
      this.profile.coins -= skin.price;
      this.profile.unlockedSkins.push(id);
      this.profile.selectedSkinId = id;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public selectSneaker(id: string) {
    if (this.profile.unlockedSneakers.includes(id)) {
      this.profile.selectedSneakerId = id;
      this.saveProfile();
    }
  }

  public buySneaker(id: string): boolean {
    const item = DEFAULT_SNEAKERS.find((s) => s.id === id);
    if (!item) return false;
    if (this.profile.unlockedSneakers.includes(id)) return true;
    if (this.profile.coins >= item.price) {
      this.profile.coins -= item.price;
      this.profile.unlockedSneakers.push(id);
      this.profile.selectedSneakerId = id;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public selectTrail(id: string) {
    if (this.profile.unlockedTrails.includes(id)) {
      this.profile.selectedTrailId = id;
      this.saveProfile();
    }
  }

  public buyTrail(id: string): boolean {
    const item = DEFAULT_TRAILS.find((s) => s.id === id);
    if (!item) return false;
    if (this.profile.unlockedTrails.includes(id)) return true;
    if (this.profile.coins >= item.price) {
      this.profile.coins -= item.price;
      this.profile.unlockedTrails.push(id);
      this.profile.selectedTrailId = id;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public selectAccessory(id: string) {
    if (this.profile.unlockedAccessories.includes(id)) {
      this.profile.selectedAccessoryId = id;
      this.saveProfile();
    }
  }

  public buyAccessory(id: string): boolean {
    const item = DEFAULT_ACCESSORIES.find((s) => s.id === id);
    if (!item) return false;
    if (this.profile.unlockedAccessories.includes(id)) return true;
    if (this.profile.coins >= item.price) {
      this.profile.coins -= item.price;
      this.profile.unlockedAccessories.push(id);
      this.profile.selectedAccessoryId = id;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public updateMissionProgress(type: Mission['type'], delta: number) {
    let changed = false;
    this.profile.missions.forEach((m) => {
      if (m.type === type && !m.completed) {
        m.current = Math.min(m.target, m.current + delta);
        if (m.current >= m.target) {
          m.completed = true;
        }
        changed = true;
      }
    });
    if (changed) {
      this.saveProfile();
    }
  }

  public claimMissionReward(missionId: string): boolean {
    const m = this.profile.missions.find((x) => x.id === missionId);
    if (m && m.completed && !m.claimed) {
      m.claimed = true;
      this.addCoins(m.rewardCoins);
      this.addXp(m.rewardXp);
      this.saveProfile();
      return true;
    }
    return false;
  }

  public recordRun(stats: RunStats, mode: GameMode): boolean {
    this.profile.completedRuns += 1;
    this.profile.coins += stats.coins;
    this.profile.totalCoinsCollectedAllTime += stats.coins;
    this.profile.totalFootballsCollected += stats.footballs;

    // Mission updates
    this.updateMissionProgress('coins', stats.coins);
    this.updateMissionProgress('distance', Math.floor(stats.distance));
    this.updateMissionProgress('jumps', stats.jumps);
    this.updateMissionProgress('slides', stats.slides);
    this.updateMissionProgress('footballs', stats.footballs);
    this.updateMissionProgress('powerups', stats.powerUpsUsed);
    this.updateMissionProgress('score', stats.score);

    // XP gained based on score & distance
    const xpEarned = Math.floor(stats.score / 25) + Math.floor(stats.distance / 10);
    this.addXp(xpEarned);

    const isRecord = stats.score > this.profile.highScore;
    if (isRecord) {
      this.profile.highScore = stats.score;
    }
    if (stats.distance > this.profile.highestDistance) {
      this.profile.highestDistance = Math.floor(stats.distance);
    }

    // Add entry to leaderboard
    const newEntry: LeaderboardEntry = {
      id: 'lb-' + Date.now(),
      username: this.profile.username,
      score: stats.score,
      distance: Math.floor(stats.distance),
      coins: stats.coins,
      date: 'Just now',
      mode,
      characterName: DEFAULT_SKINS.find((s) => s.id === this.profile.selectedSkinId)?.name || 'Runner',
    };

    this.leaderboard.push(newEntry);
    this.leaderboard.sort((a, b) => b.score - a.score);
    if (this.leaderboard.length > 20) {
      this.leaderboard = this.leaderboard.slice(0, 20);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(this.leaderboard));
    } catch {
      // ignore
    }

    this.saveProfile();
    return isRecord;
  }

  public getDailyRewards(): DailyRewardItem[] {
    return DAILY_REWARDS;
  }

  public getNextClaimableDay(): number {
    const claimed = this.profile.claimedStreakDays || [];
    if (claimed.length >= 7) return 1;
    return (claimed.length + 1);
  }

  public canClaimDailyReward(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.profile.lastStreakClaimDate !== today;
  }

  public claimDailyReward(): { success: boolean; reward?: DailyRewardItem } {
    if (!this.canClaimDailyReward()) {
      return { success: false };
    }
    const today = new Date().toISOString().split('T')[0];
    let claimed = [...(this.profile.claimedStreakDays || [])];
    if (claimed.length >= 7) {
      claimed = [];
    }
    const dayToClaim = claimed.length + 1;
    const reward = DAILY_REWARDS.find((r) => r.day === dayToClaim) || DAILY_REWARDS[0];

    claimed.push(dayToClaim);
    this.profile.claimedStreakDays = claimed;
    this.profile.lastStreakClaimDate = today;
    this.profile.dailyStreak = (this.profile.dailyStreak || 0) + 1;

    // Grant rewards
    if (reward.coins) {
      this.profile.coins += reward.coins;
      this.profile.totalCoinsCollectedAllTime += reward.coins;
    }
    if (reward.footballs) {
      this.profile.totalFootballsCollected += reward.footballs;
    }
    if (reward.sneakerId && !this.profile.unlockedSneakers.includes(reward.sneakerId)) {
      this.profile.unlockedSneakers.push(reward.sneakerId);
    }
    if (reward.trailId && !this.profile.unlockedTrails.includes(reward.trailId)) {
      this.profile.unlockedTrails.push(reward.trailId);
    }
    if (reward.skinId && !this.profile.unlockedSkins.includes(reward.skinId)) {
      this.profile.unlockedSkins.push(reward.skinId);
    }

    this.saveProfile();
    return { success: true, reward };
  }

  public resetProgress() {
    this.profile = { ...DEFAULT_PROFILE };
    this.leaderboard = this.loadLeaderboard();
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.LEADERBOARD);
    } catch {
      // ignore
    }
    this.saveProfile();
    this.notify();
  }
}

export const gameStore = GameStore.getInstance();
