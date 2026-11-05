/**
 * Hybrid Web Audio & Real Sample System for SPEED RUSH 3D
 * Plays authentic audio files (such as Cristiano Ronaldo's SIUUU) alongside procedural arcade SFX.
 * Supports custom MP3 imports, AudioBuffer caching, and stadium sound design.
 */

export interface VoiceLineInfo {
  id: 'siuuu' | 'lets_go' | 'speed' | 'close_call' | 'omg' | 'unstoppable' | 'goat';
  name: string;
  trigger: string;
  sourceType: 'official' | 'custom' | 'stadium_sfx';
  sourceLabel: string;
  customDataUrl?: string;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.8;
  private isMuted: boolean = false;

  private isMusicPlaying: boolean = false;
  private currentMusicMode: 'menu' | 'game' | 'none' = 'none';
  private musicTimerId: number | null = null;
  private stepCounter: number = 0;

  // Real Audio Buffer Cache for Zero-Latency Voice Lines
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private pendingFetches: Map<string, Promise<AudioBuffer | null>> = new Map();
  private htmlAudioFallbacks: Map<string, HTMLAudioElement> = new Map();

  // Custom user-loaded voice lines (base64 data URLs)
  private customVoices: Map<string, string> = new Map();
  private lastVoiceLineTime: number = 0;

  // Default audio assets
  public readonly DEFAULT_VOICE_URLS: Record<string, string> = {
    siuuu: '/assets/aistudio/gabbe-suii-by-cristiano-ronaldo-123253_2720c4cd.mp3',
  };

  constructor() {
    this.loadCustomVoicesFromStorage();
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('touchend', unlockAudio);
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('click', unlockAudio);
      };
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('touchend', unlockAudio, { passive: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('click', unlockAudio, { passive: true });
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Preload official voice assets
      this.preloadOfficialVoiceClips();
    } catch (e) {
      console.warn('[SoundManager] Web Audio not supported or blocked:', e);
    }

    return this.ctx;
  }

  private loadCustomVoicesFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('speed_rush_custom_voices');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, dataUrl]) => {
          if (typeof dataUrl === 'string') {
            this.customVoices.set(key, dataUrl);
          }
        });
      }
    } catch {
      // storage unavailable
    }
  }

  private saveCustomVoicesToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, string> = {};
      this.customVoices.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem('speed_rush_custom_voices', JSON.stringify(obj));
    } catch {
      // storage failed
    }
  }

  public preloadOfficialVoiceClips() {
    // Preload CR7 SIUUU
    this.loadAudioClip('siuuu', this.DEFAULT_VOICE_URLS.siuuu);

    // Preload any stored custom voices
    this.customVoices.forEach((dataUrl, key) => {
      this.loadAudioClip(key, dataUrl);
    });
  }

  /**
   * Loads and decodes an audio file or data URL into an AudioBuffer.
   */
  public async loadAudioClip(key: string, urlOrDataUrl: string): Promise<AudioBuffer | null> {
    if (this.audioBuffers.has(key)) {
      return this.audioBuffers.get(key)!;
    }

    if (this.pendingFetches.has(key)) {
      return this.pendingFetches.get(key)!;
    }

    const fetchPromise = (async () => {
      try {
        const ctx = this.initContext();
        const response = await fetch(urlOrDataUrl);
        const arrayBuf = await response.arrayBuffer();

        if (ctx) {
          const decoded = await ctx.decodeAudioData(arrayBuf);
          this.audioBuffers.set(key, decoded);
          return decoded;
        }
      } catch (err) {
        console.warn(`[SoundManager] Could not decode audio buffer for "${key}":`, err);
      } finally {
        this.pendingFetches.delete(key);
      }

      // Prepare fallback HTMLAudioElement
      try {
        if (typeof Audio !== 'undefined') {
          const audio = new Audio(urlOrDataUrl);
          audio.preload = 'auto';
          this.htmlAudioFallbacks.set(key, audio);
        }
      } catch {
        // audio tag fallback
      }

      return null;
    })();

    this.pendingFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Plays a preloaded AudioBuffer through the SFX channel.
   */
  private playBuffer(buffer: AudioBuffer, volumeScale: number = 1.0, pitch: number = 1.0): boolean {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return false;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(pitch, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0, Math.min(2, volumeScale)), ctx.currentTime);

      source.connect(gain);
      gain.connect(this.sfxGain);

      source.start(0);
      return true;
    } catch (e) {
      console.warn('[SoundManager] playBuffer failed:', e);
      return false;
    }
  }

  // --- VOLUME CONTROLS ---

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
    this.htmlAudioFallbacks.forEach((audio) => {
      audio.volume = this.sfxVolume;
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    this.htmlAudioFallbacks.forEach((audio) => {
      audio.muted = muted;
    });
  }

  // --- CUSTOM VOICE MANAGEMENT ---

  public setCustomVoice(lineKey: string, dataUrl: string) {
    this.customVoices.set(lineKey, dataUrl);
    this.saveCustomVoicesToStorage();
    // Invalidate cached buffer to load new one
    this.audioBuffers.delete(lineKey);
    this.loadAudioClip(lineKey, dataUrl);
  }

  public removeCustomVoice(lineKey: string) {
    this.customVoices.delete(lineKey);
    this.saveCustomVoicesToStorage();
    this.audioBuffers.delete(lineKey);
    this.htmlAudioFallbacks.delete(lineKey);

    // If it's a default voice like 'siuuu', reload default
    if (this.DEFAULT_VOICE_URLS[lineKey]) {
      this.loadAudioClip(lineKey, this.DEFAULT_VOICE_URLS[lineKey]);
    }
  }

  public getCustomVoice(lineKey: string): string | null {
    return this.customVoices.get(lineKey) || null;
  }

  public getVoiceList(): VoiceLineInfo[] {
    const list: VoiceLineInfo[] = [
      {
        id: 'siuuu',
        name: 'SIIIUUUU! (Cristiano Ronaldo)',
        trigger: 'Célébration (Touche C), Ballon Doré & Nouveau Record',
        sourceType: this.customVoices.has('siuuu')
          ? 'custom'
          : 'official',
        sourceLabel: this.customVoices.has('siuuu')
          ? 'Fichier personnalisé MP3'
          : 'CR7 Officiel (gabbe-suii-by-cristiano-ronaldo)',
        customDataUrl: this.customVoices.get('siuuu'),
      },
      {
        id: 'lets_go',
        name: "LET'S GOOO!",
        trigger: 'Départ Duel 1v1, Récompense Quotidienne & Bonus',
        sourceType: this.customVoices.has('lets_go') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('lets_go')
          ? 'Fichier personnalisé MP3'
          : 'Arcade Hype & Clameur Stade',
        customDataUrl: this.customVoices.get('lets_go'),
      },
      {
        id: 'speed',
        name: 'TURBO SPEED!',
        trigger: 'Activation Super Vitesse / Sneakers Turbo',
        sourceType: this.customVoices.has('speed') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('speed')
          ? 'Fichier personnalisé MP3'
          : 'Réacteur Turbo Supersonique',
        customDataUrl: this.customVoices.get('speed'),
      },
      {
        id: 'close_call',
        name: 'CLOSE CALL / NEAR-MISS',
        trigger: 'Esquive rasante de train ou barrière (Frôlement)',
        sourceType: this.customVoices.has('close_call') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('close_call')
          ? 'Fichier personnalisé MP3'
          : 'Sifflet Doppler & Adrénaline',
        customDataUrl: this.customVoices.get('close_call'),
      },
      {
        id: 'unstoppable',
        name: 'UNSTOPPABLE!',
        trigger: 'Multiplicateur x5 et Bouclier Titane',
        sourceType: this.customVoices.has('unstoppable') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('unstoppable')
          ? 'Fichier personnalisé MP3'
          : 'Onde de Choc Électrique & Tonnerre',
        customDataUrl: this.customVoices.get('unstoppable'),
      },
      {
        id: 'goat',
        name: 'THE GOAT!',
        trigger: 'Victoire Duel 1v1 & Jackpot Jour 7',
        sourceType: this.customVoices.has('goat') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('goat')
          ? 'Fichier personnalisé MP3'
          : 'Fanfare Royale & Triomphe',
        customDataUrl: this.customVoices.get('goat'),
      },
      {
        id: 'omg',
        name: 'OH MY GOD!',
        trigger: 'Combo Exceptionnel & Cascades',
        sourceType: this.customVoices.has('omg') ? 'custom' : 'stadium_sfx',
        sourceLabel: this.customVoices.has('omg')
          ? 'Fichier personnalisé MP3'
          : 'Scratch Vinyle & Stupeur',
        customDataUrl: this.customVoices.get('omg'),
      },
    ];

    return list;
  }

  // --- CORE VOICE LINE PLAYER ---

  public playVoiceLineTest(line: 'siuuu' | 'omg' | 'lets_go' | 'speed' | 'close_call' | 'unstoppable' | 'goat') {
    this.playVoiceLine(line, true);
  }

  public playVoiceLine(
    line: 'siuuu' | 'omg' | 'lets_go' | 'speed' | 'close_call' | 'unstoppable' | 'goat',
    forceImmediate: boolean = false
  ) {
    if (this.isMuted) return;

    // Throttle during rapid gameplay so sounds don't overlap into noise
    const now = Date.now();
    if (!forceImmediate && line !== 'siuuu') {
      if (now - this.lastVoiceLineTime < 1800) return;
    }
    this.lastVoiceLineTime = now;

    this.initContext();

    // 1. Check if we have an AudioBuffer loaded for this line (e.g. CR7 SIUUU or custom audio)
    const buffer = this.audioBuffers.get(line);
    if (buffer) {
      const played = this.playBuffer(buffer, line === 'siuuu' ? 1.3 : 1.1);
      if (played) {
        if (line === 'siuuu') {
          this.playStadiumCheer(0.3);
        }
        return;
      }
    }

    // 2. Fallback to HTMLAudioElement if available
    const fallbackAudio = this.htmlAudioFallbacks.get(line);
    if (fallbackAudio) {
      try {
        fallbackAudio.currentTime = 0;
        fallbackAudio.volume = this.sfxVolume;
        fallbackAudio.play().catch(() => {});
        return;
      } catch {
        // fallback failed
      }
    }

    // If it is 'siuuu' and the buffer is still fetching, fetch immediately and play
    if (line === 'siuuu') {
      const audioUrl = this.customVoices.get('siuuu') || this.DEFAULT_VOICE_URLS.siuuu;
      try {
        const audio = new Audio(audioUrl);
        audio.volume = this.sfxVolume;
        audio.play().catch(() => {});
      } catch {
        // ignored
      }
      this.playStadiumCheer(0.35);
      return;
    }

    // 3. For other voices without a custom MP3, play high-energy stadium sound design
    switch (line) {
      case 'lets_go':
        this.playStadiumLetsGo();
        break;
      case 'speed':
        this.playTurboSpeedCue();
        break;
      case 'close_call':
        this.playCloseCallCue();
        break;
      case 'unstoppable':
        this.playUnstoppableCue();
        break;
      case 'goat':
        this.playGoatCue();
        break;
      case 'omg':
        this.playOmgCue();
        break;
    }

    // 4. Subtle speech synthesis overlay (only if no custom audio provided)
    this.playSpeechAnnouncer(line);
  }

  // --- STADIUM & ARCADE SOUND DESIGNS ---

  public playStadiumCheer(intensity: number = 0.3) {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain || this.isMuted) return;
    const t = ctx.currentTime;

    // Crowd roar noise swell
    const bufferSize = Math.floor(ctx.sampleRate * 0.9);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3 * intensity, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.9);
  }

  private playStadiumLetsGo() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    // Triple ascending trumpet/brass punch: E4 -> G#4 -> B4
    const notes = [329.63, 415.3, 493.88, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, t + idx * 0.08);

      gain.gain.setValueAtTime(0.22, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.24);
    });

    this.playStadiumCheer(0.25);
  }

  private playTurboSpeedCue() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    // Jet spool frequency ramp
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.38);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, t);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);

    // Sonic boom pulse
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(90, t + 0.15);
    boomOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    boomGain.gain.setValueAtTime(0.35, t + 0.15);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    boomOsc.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boomOsc.start(t + 0.15);
    boomOsc.stop(t + 0.42);
  }

  private playCloseCallCue() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    // Heartbeat thump
    const hb = ctx.createOscillator();
    const hbGain = ctx.createGain();
    hb.type = 'sine';
    hb.frequency.setValueAtTime(95, t);
    hb.frequency.exponentialRampToValueAtTime(35, t + 0.15);
    hbGain.gain.setValueAtTime(0.4, t);
    hbGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    hb.connect(hbGain);
    hbGain.connect(this.sfxGain);
    hb.start(t);
    hb.stop(t + 0.17);

    // High warning ping
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(1760, t + 0.05);
    ping.frequency.exponentialRampToValueAtTime(880, t + 0.25);
    pingGain.gain.setValueAtTime(0.18, t + 0.05);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    ping.connect(pingGain);
    pingGain.connect(this.sfxGain);
    ping.start(t + 0.05);
    ping.stop(t + 0.27);
  }

  private playUnstoppableCue() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    // Overdrive lightning chord
    [130.81, 196.0, 261.63, 392.0].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.3);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  private playGoatCue() {
    this.playSiuuFanfare();
    this.playStadiumCheer(0.5);
  }

  private playOmgCue() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    // Record scratch effect
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.21);
  }

  private playSpeechAnnouncer(line: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const phrases: Record<string, string> = {
        lets_go: "LET'S GO!",
        speed: 'MAXIMUM SPEED!',
        close_call: 'CLOSE CALL!',
        unstoppable: 'UNSTOPPABLE!',
        goat: 'THE GOAT!',
        omg: 'OH MY GOD!',
      };

      const text = phrases[line];
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.35;
      utterance.pitch = 1.25;
      utterance.volume = this.sfxVolume * 0.7;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Daniel') ||
            v.name.includes('Alex'))
      );
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech errors
    }
  }

  // --- STANDARD GAME SFX ---

  public playFootstep() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playJump() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playLand() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playSlide() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.3);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.28);
    filter.Q.setValueAtTime(2.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.3);
  }

  public playCoin() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.06); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, t); // B6
    osc2.frequency.setValueAtTime(2637.02, t + 0.06); // E7

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.22);
    osc2.stop(t + 0.22);
  }

  public playFootball() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(0.15, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.2);
    });
  }

  public playPowerUp() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);

      gain.gain.setValueAtTime(0.18, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  public playShieldBreak() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playCrash() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);

    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.36);
  }

  public playSiuuFanfare() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.0],
      [293.66, 369.99, 440.0],
      [329.63, 415.3, 493.88],
      [392.0, 493.88, 587.33, 783.99],
    ];

    chords.forEach((chord, step) => {
      const stepTime = t + step * 0.16;
      const dur = step === chords.length - 1 ? 0.6 : 0.14;
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.12, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(stepTime);
        osc.stop(stepTime + dur);
      });
    });
  }

  public playUiClick() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playNearMiss() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.22);
    filter.Q.setValueAtTime(4.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.23);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
    oscGain.gain.setValueAtTime(0.15, t + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t + 0.04);
    osc.stop(t + 0.23);
  }

  public playRewardClaim() {
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;
    const t = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);

      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.26);
    });
  }

  // --- BACKGROUND MUSIC SYNTHESIZER ---

  public startMusic(mode: 'menu' | 'game') {
    if (this.currentMusicMode === mode && this.isMusicPlaying) return;
    this.stopMusic();
    this.initContext();
    this.currentMusicMode = mode;
    this.isMusicPlaying = true;
    this.stepCounter = 0;

    const tempo = mode === 'game' ? 134 : 118;
    const stepDuration = 60 / tempo / 4;

    const scheduleNextBeat = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      this.playSynthPatternStep(mode, this.stepCounter);
      this.stepCounter = (this.stepCounter + 1) % 64;
      this.musicTimerId = window.setTimeout(scheduleNextBeat, stepDuration * 1000);
    };

    scheduleNextBeat();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    this.currentMusicMode = 'none';
    if (this.musicTimerId !== null) {
      clearTimeout(this.musicTimerId);
      this.musicTimerId = null;
    }
  }

  private playSynthPatternStep(mode: 'menu' | 'game', step: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    const isKick = mode === 'game' ? step % 4 === 0 : step % 8 === 0 || step % 8 === 6;
    if (isKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    const isSnare = step % 8 === 4;
    if (isSnare) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(t);
      noise.stop(t + 0.11);
    }

    if (step % 2 === 1) {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(t);
      noise.stop(t + 0.04);
    }

    const bassScaleGame = [55, 55, 65.41, 73.42, 82.41, 73.42, 65.41, 55];
    const bassScaleMenu = [65.41, 65.41, 82.41, 98.0, 87.31, 82.41];
    const scale = mode === 'game' ? bassScaleGame : bassScaleMenu;
    const bassNote = scale[Math.floor(step / 2) % scale.length];

    if (step % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = mode === 'game' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(bassNote, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'game' ? 450 : 350, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.13);
    }

    if (step % 4 === 0) {
      const leadNotes =
        mode === 'game'
          ? [440, 523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 440]
          : [523.25, 659.25, 783.99, 1046.5, 880, 783.99];
      const leadFreq = leadNotes[Math.floor(step / 4) % leadNotes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(leadFreq, t);

      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.23);
    }
  }
}

export const soundManager = new SoundManager();
