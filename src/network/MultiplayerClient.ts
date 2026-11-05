import { PlayerProfile, MultiplayerOpponent } from '../types/game';

export type MultiplayerEventCallback = {
  onMatchStart: (roomId: string, opponent: MultiplayerOpponent, seed: number) => void;
  onOpponentSync: (opponent: MultiplayerOpponent) => void;
  onOpponentEvent: (event: string, meta?: any) => void;
  onOpponentCrashed: (finalScore: number, finalDistance: number) => void;
  onOpponentLeft: () => void;
  onStatusChange: (status: 'idle' | 'searching' | 'connected' | 'in_game' | 'game_over', message?: string) => void;
  onRoomCreated?: (roomCode: string) => void;
};

export class MultiplayerClient {
  private static instance: MultiplayerClient;
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private roomId: string | null = null;
  private callbacks: MultiplayerEventCallback | null = null;
  private lastSyncTime: number = 0;
  private pingInterval: number | null = null;
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): MultiplayerClient {
    if (!MultiplayerClient.instance) {
      MultiplayerClient.instance = new MultiplayerClient();
    }
    return MultiplayerClient.instance;
  }

  public setCallbacks(callbacks: MultiplayerEventCallback) {
    this.callbacks = callbacks;
  }

  public connect(): Promise<boolean> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }
    if (this.isConnecting) {
      return Promise.resolve(false);
    }

    this.isConnecting = true;
    return new Promise((resolve) => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          this.isConnecting = false;
          this.ws = ws;
          this.startHeartbeat();
          resolve(true);
        };

        ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        ws.onclose = () => {
          this.isConnecting = false;
          this.ws = null;
          this.stopHeartbeat();
          if (this.callbacks) {
            this.callbacks.onStatusChange('idle', 'Déconnecté du serveur multijoueur');
          }
        };

        ws.onerror = () => {
          this.isConnecting = false;
          resolve(false);
        };
      } catch {
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(data: string) {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'connected':
          this.playerId = msg.playerId;
          break;

        case 'match_waiting':
          if (this.callbacks) {
            this.callbacks.onStatusChange('searching', `Searching for opponent (Queue position: ${msg.queuePosition})...`);
          }
          break;

        case 'room_created':
          this.roomId = msg.roomId;
          if (this.callbacks?.onRoomCreated) {
            this.callbacks.onRoomCreated(msg.roomCode);
          }
          if (this.callbacks) {
            this.callbacks.onStatusChange('searching', `Room created! Code: ${msg.roomCode}`);
          }
          break;

        case 'match_start': {
          this.roomId = msg.roomId;
          const opponentData = msg.players.find((p: any) => p.id !== this.playerId) || msg.players[0];
          const opponent: MultiplayerOpponent = {
            id: opponentData.id,
            username: opponentData.username,
            skinId: opponentData.skinId,
            sneakerId: opponentData.sneakerId,
            trailId: opponentData.trailId,
            x: 0,
            y: 0,
            z: 0,
            speed: 19,
            animState: 'running',
            score: 0,
            distance: 0,
          };
          if (this.callbacks) {
            this.callbacks.onStatusChange('in_game');
            this.callbacks.onMatchStart(msg.roomId, opponent, msg.seed);
          }
          break;
        }

        case 'opponent_sync':
          if (this.callbacks && msg.playerId !== this.playerId) {
            this.callbacks.onOpponentSync({
              id: msg.playerId,
              username: '',
              skinId: '',
              sneakerId: '',
              trailId: '',
              x: msg.x,
              y: msg.y,
              z: msg.z,
              speed: msg.speed,
              animState: msg.animState,
              score: msg.score,
              distance: msg.distance,
              isSliding: msg.isSliding,
              isGrounded: msg.isGrounded,
            });
          }
          break;

        case 'opponent_event':
          if (this.callbacks && msg.playerId !== this.playerId) {
            this.callbacks.onOpponentEvent(msg.event, msg.meta);
          }
          break;

        case 'opponent_crashed':
          if (this.callbacks && msg.playerId !== this.playerId) {
            this.callbacks.onOpponentCrashed(msg.finalScore, msg.finalDistance);
          }
          break;

        case 'opponent_left':
          if (this.callbacks && msg.playerId !== this.playerId) {
            this.callbacks.onOpponentLeft();
          }
          break;

        case 'error':
          if (this.callbacks) {
            this.callbacks.onStatusChange('idle', msg.message);
          }
          break;
      }
    } catch {
      // ignore
    }
  }

  public async startQuickMatch(profile: PlayerProfile) {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.callbacks) {
      this.callbacks.onStatusChange('searching', 'Connecting to multiplayer servers...');
    }

    this.ws.send(
      JSON.stringify({
        type: 'quick_match',
        username: profile.username,
        skinId: profile.selectedSkinId,
        sneakerId: profile.selectedSneakerId,
        trailId: profile.selectedTrailId,
      })
    );
  }

  public async createPrivateRoom(profile: PlayerProfile) {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: 'create_private_room',
        username: profile.username,
        skinId: profile.selectedSkinId,
        sneakerId: profile.selectedSneakerId,
        trailId: profile.selectedTrailId,
      })
    );
  }

  public async joinPrivateRoom(roomCode: string, profile: PlayerProfile) {
    await this.connect();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.callbacks) {
      this.callbacks.onStatusChange('searching', `Recherche de la salle ${roomCode}...`);
    }

    this.ws.send(
      JSON.stringify({
        type: 'join_private_room',
        roomCode,
        username: profile.username,
        skinId: profile.selectedSkinId,
        sneakerId: profile.selectedSneakerId,
        trailId: profile.selectedTrailId,
      })
    );
  }

  public cancelMatchmaking() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'cancel_matchmaking' }));
    }
    if (this.callbacks) {
      this.callbacks.onStatusChange('idle');
    }
  }

  public syncPlayer(data: {
    x: number;
    y: number;
    z: number;
    speed: number;
    animState: string;
    score: number;
    distance: number;
    isSliding: boolean;
    isGrounded: boolean;
  }) {
    const now = performance.now();
    // Throttle sync to ~25Hz (every 40ms) to conserve network while keeping smooth interpolation
    if (now - this.lastSyncTime < 40) return;
    this.lastSyncTime = now;

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId) {
      this.ws.send(
        JSON.stringify({
          type: 'player_sync',
          ...data,
        })
      );
    }
  }

  public sendEvent(event: 'jump' | 'slide' | 'celebrate' | 'powerup' | 'near_miss', meta?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId) {
      this.ws.send(
        JSON.stringify({
          type: 'player_event',
          event,
          meta,
        })
      );
    }
  }

  public sendCrash(finalScore: number, finalDistance: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId) {
      this.ws.send(
        JSON.stringify({
          type: 'player_crash',
          finalScore,
          finalDistance,
        })
      );
    }
  }

  public leaveRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.roomId) {
      this.ws.send(JSON.stringify({ type: 'leave_room' }));
    }
    this.roomId = null;
    if (this.callbacks) {
      this.callbacks.onStatusChange('idle');
    }
  }
}

export const multiplayerClient = MultiplayerClient.getInstance();
