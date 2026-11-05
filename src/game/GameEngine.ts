import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CharacterModel, CharacterAnimState } from './CharacterModel';
import { TrackManager } from './TrackManager';
import { ObstacleManager } from './ObstacleManager';
import { CollectibleManager } from './CollectibleManager';
import { ParticleSystem } from './ParticleSystem';
import { soundManager } from '../audio/SoundManager';
import { gameStore } from '../state/gameStore';
import { GameMode, WorldType, PowerUpType, PowerUpActive, RunStats, CharacterSkin, SneakerItem, TrailItem, AccessoryItem } from '../types/game';
import { DEFAULT_SKINS, DEFAULT_SNEAKERS, DEFAULT_TRAILS, DEFAULT_ACCESSORIES } from '../state/gameStore';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, distance: number, coins: number, footballs: number, multiplier: number) => void;
  onPowerUpUpdate: (activePowerUps: PowerUpActive[]) => void;
  onGameOver: (stats: RunStats) => void;
  onTimeUpdate?: (secondsLeft: number) => void;
  onDailyComplete?: () => void;
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  onPopup?: (popup: { text: string; subText?: string; type: 'near_miss' | 'powerup' | 'football' | 'coin' | 'combo' | 'record' | 'siuuu'; color?: string }) => void;
  onDangerFlash?: () => void;
  onSpeedLinesUpdate?: (active: boolean, intensity: number) => void;
  onMultiplayerSync?: (data: {
    x: number;
    y: number;
    z: number;
    speed: number;
    animState: string;
    score: number;
    distance: number;
    isSliding: boolean;
    isGrounded: boolean;
  }) => void;
  onMultiplayerEvent?: (event: 'jump' | 'slide' | 'celebrate' | 'powerup' | 'near_miss' | 'crash', meta?: any) => void;
}

export class GameEngine {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  // Components
  public character: CharacterModel;
  public trackManager: TrackManager;
  public obstacleManager: ObstacleManager;
  public collectibleManager: CollectibleManager;
  public particleSystem: ParticleSystem;

  // 3D Menu Showcase Stage (Podium, Stadium Entrance, Floodlights)
  public menuStageGroup!: THREE.Group;
  private menuStageRings: THREE.Mesh[] = [];

  // 3D Multiplayer Opponent
  public opponentModel: CharacterModel | null = null;
  public opponentNameTag: THREE.Sprite | null = null;
  public opponentTargetPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public opponentSpeed: number = 19;
  public opponentDistance: number = 0;
  public opponentUsername: string = 'Opponent';

  // Game State
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public isMenuMode: boolean = true;
  public isInspectMode: boolean = false;
  public inspectCameraAngle: 'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit' = 'orbit';
  public currentMode: GameMode = 'classic';
  public currentWorld: WorldType = 'speed-city';

  // FPS Profiler
  private fpsFrameCount: number = 0;
  private fpsLastTime: number = performance.now();
  public currentFps: number = 60;
  public currentFrameTimeMs: number = 16.6;

  // Player Kinematics
  private laneIndex: number = 0; // -1, 0, 1
  private currentX: number = 0;
  private targetX: number = 0;
  private currentY: number = 0;
  private velocityY: number = 0;
  private currentZ: number = 0;
  private baseSpeed: number = 19;
  private currentSpeed: number = 19;
  private gravity: number = 32;
  private jumpForce: number = 12.8;

  private isGrounded: boolean = true;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private slideDuration: number = 0.78;
  private jumpsInAir: number = 0;
  private maxJumps: number = 1;

  // Power-Ups
  private activePowerUps: Map<PowerUpType, { remaining: number; max: number }> = new Map();

  // Run Stats
  private stats: RunStats = {
    score: 0,
    distance: 0,
    coins: 0,
    footballs: 0,
    powerUpsUsed: 0,
    jumps: 0,
    slides: 0,
    nearMisses: 0,
    multiplier: 1,
    isNewRecord: false,
  };

  // Time Challenge mode timer
  private timeRemaining: number = 90;

  // Camera Shake
  private cameraShake: number = 0;

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Lifecycle
  private animFrameId: number = 0;
  private clock: THREE.Clock;
  private callbacks: GameEngineCallbacks;
  private isSoftwareGl: boolean = false;

  // Touch handling
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // 1. Software WebGL Guard per Three.js directives
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a0d14');
    this.scene.fog = new THREE.FogExp2('#0a0d14', 0.012);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      400
    );
    this.camera.position.set(0, 3.2, -5.5);

    // 4. Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting & Atmosphere
    this.hemiLight = new THREE.HemisphereLight('#60a5fa', '#1e293b', 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight('#fff7ed', 1.85);
    this.dirLight.position.set(15, 25, 10);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    const d = 16;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    this.updateWorldAtmosphere('speed-city');

    // 6. Subsystems
    this.character = new CharacterModel();
    this.scene.add(this.character.group);

    this.trackManager = new TrackManager(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);
    this.collectibleManager = new CollectibleManager(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);

    // Apply currently equipped skin
    this.refreshEquippedCosmetics();

    // 7. 3D Menu Showcase Stage (Podium, Stadium Gate, Floor Rings)
    this.buildMenuStage();

    // 8. Inputs
    this.bindEvents();

    // Start in Menu Mode
    this.setMenuMode(true);

    // Begin loop
    this.tick();
  }

  public buildMenuStage() {
    this.menuStageGroup = new THREE.Group();

    // 1. Elevated circular championship podium under runner at (0, 0, 0)
    const podiumGeo = new THREE.CylinderGeometry(2.9, 3.3, 0.24, 32);
    const podiumMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.35,
      metalness: 0.85,
    });
    const podiumMesh = new THREE.Mesh(podiumGeo, podiumMat);
    podiumMesh.position.y = -0.12;
    podiumMesh.receiveShadow = true;
    this.menuStageGroup.add(podiumMesh);

    // Glowing Neon Perimeter Ring (Amber Gold)
    const ringGeo = new THREE.TorusGeometry(3.15, 0.06, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    this.menuStageGroup.add(ringMesh);
    this.menuStageRings.push(ringMesh);

    // Inner Cyan Energy Ring
    const innerRingGeo = new THREE.TorusGeometry(2.1, 0.04, 12, 32);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: '#00f5d4' });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.025;
    this.menuStageGroup.add(innerRing);
    this.menuStageRings.push(innerRing);

    // Red Carpet Runway from z = +30 to 0
    const carpetGeo = new THREE.BoxGeometry(3.8, 0.05, 30);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: '#b91c1c',
      roughness: 0.85,
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.position.set(0, -0.01, 15);
    carpet.receiveShadow = true;
    this.menuStageGroup.add(carpet);

    // 2. Grand Stadium Gate & LED Billboard behind runner at z = 14
    const archMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.45,
      metalness: 0.8,
    });
    const archPillarGeo = new THREE.BoxGeometry(1.4, 9.5, 1.4);
    const leftPillar = new THREE.Mesh(archPillarGeo, archMat);
    leftPillar.position.set(-6.8, 4.75, 14);
    this.menuStageGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(archPillarGeo, archMat);
    rightPillar.position.set(6.8, 4.75, 14);
    this.menuStageGroup.add(rightPillar);

    const archBeamGeo = new THREE.BoxGeometry(15, 1.5, 1.5);
    const beam = new THREE.Mesh(archBeamGeo, archMat);
    beam.position.set(0, 9.5, 14);
    this.menuStageGroup.add(beam);

    // Giant Glowing LED Billboard Header
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 64px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPEED RUSH 3D • WORLD TOUR', 512, 128);
    const ledTex = new THREE.CanvasTexture(canvas);
    const ledSignGeo = new THREE.PlaneGeometry(12.5, 3.2);
    const ledMat = new THREE.MeshBasicMaterial({ map: ledTex });
    const ledSign = new THREE.Mesh(ledSignGeo, ledMat);
    ledSign.position.set(0, 7.5, 13.9);
    this.menuStageGroup.add(ledSign);

    // 1b. Grand Championship Arena Plaza Base (Radius 42m, covers entire 360 viewport)
    const arenaBaseGeo = new THREE.CylinderGeometry(44, 46, 0.4, 48);
    const arenaBaseMat = new THREE.MeshStandardMaterial({
      color: '#080c16',
      roughness: 0.55,
      metalness: 0.8,
    });
    const arenaBaseMesh = new THREE.Mesh(arenaBaseGeo, arenaBaseMat);
    arenaBaseMesh.position.y = -0.32;
    arenaBaseMesh.receiveShadow = true;
    this.menuStageGroup.add(arenaBaseMesh);

    // Outer Concentric Neon Guidance Rings on arena floor
    [9.5, 18, 30].forEach((rad, i) => {
      const ringG = new THREE.TorusGeometry(rad, 0.05, 8, 48);
      const ringM = new THREE.MeshBasicMaterial({
        color: i === 0 ? '#00f5d4' : (i === 1 ? '#f59e0b' : '#38bdf8'),
      });
      const ring = new THREE.Mesh(ringG, ringM);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.01;
      this.menuStageGroup.add(ring);
      this.menuStageRings.push(ring);
    });

    // Circular 360 Stadium LED Ribbon Hoarding around arena perimeter
    const canvasRibbon = document.createElement('canvas');
    canvasRibbon.width = 2048;
    canvasRibbon.height = 128;
    const rCtx = canvasRibbon.getContext('2d')!;
    rCtx.fillStyle = '#060911';
    rCtx.fillRect(0, 0, 2048, 128);
    rCtx.fillStyle = '#f59e0b';
    rCtx.font = '900 42px Impact, sans-serif';
    rCtx.textBaseline = 'middle';
    for (let x = 40; x < 2048; x += 512) {
      rCtx.fillStyle = '#00f5d4';
      rCtx.fillText('★ SPEED RUSH 3D ★', x, 64);
      rCtx.fillStyle = '#f59e0b';
      rCtx.fillText('1v1 DUEL MONDIAL', x + 250, 64);
    }
    const ribbonTex = new THREE.CanvasTexture(canvasRibbon);
    ribbonTex.wrapS = THREE.RepeatWrapping;
    ribbonTex.repeat.set(4, 1);
    const ribbonGeo = new THREE.CylinderGeometry(42, 42, 2.8, 48, 1, true);
    const ribbonMat = new THREE.MeshBasicMaterial({ map: ribbonTex, side: THREE.DoubleSide });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.position.y = 1.35;
    this.menuStageGroup.add(ribbonMesh);

    // 4 Corner Stadium Floodlight Towers (providing full 360 illumination)
    const pylonGeo = new THREE.CylinderGeometry(0.25, 0.45, 14, 8);
    const lightBankGeo = new THREE.BoxGeometry(2.2, 1.0, 0.6);
    const lightBankMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });

    [
      { x: -9.5, z: 14, rotX: -0.35, rotY: 0.3 },
      { x: 9.5, z: 14, rotX: -0.35, rotY: -0.3 },
      { x: -14, z: -15, rotX: 0.35, rotY: 0.3 },
      { x: 14, z: -15, rotX: 0.35, rotY: -0.3 },
    ].forEach((pos) => {
      const pylon = new THREE.Mesh(pylonGeo, archMat);
      pylon.position.set(pos.x, 7.0, pos.z);
      this.menuStageGroup.add(pylon);

      const bank = new THREE.Mesh(lightBankGeo, lightBankMat);
      bank.position.set(pos.x, 14.2, pos.z);
      bank.rotation.set(pos.rotX, pos.rotY, 0);
      this.menuStageGroup.add(bank);

      // Warm floodlight aimed at central runner podium
      const spot = new THREE.SpotLight('#fef08a', 2.8, 38, Math.PI / 4, 0.45);
      spot.position.set(pos.x, 14.0, pos.z);
      spot.target.position.set(0, 1.0, 0);
      this.menuStageGroup.add(spot);
      this.menuStageGroup.add(spot.target);
    });

    this.scene.add(this.menuStageGroup);
  }

  // --- MULTIPLAYER OPPONENT 3D RIG & BILLBOARD ---

  public setupMultiplayerOpponent(opponent: import('../types/game').MultiplayerOpponent) {
    this.removeMultiplayerOpponent();

    this.opponentModel = new CharacterModel();
    const skin = DEFAULT_SKINS.find((s) => s.id === opponent.skinId) || DEFAULT_SKINS[1];
    const sneaker = DEFAULT_SNEAKERS.find((s) => s.id === opponent.sneakerId);
    this.opponentModel.applySkin(skin, sneaker);

    this.opponentTargetPos.set(opponent.x || 0, opponent.y || 0, opponent.z || 0);
    this.opponentModel.group.position.copy(this.opponentTargetPos);
    this.opponentSpeed = opponent.speed || 19;
    this.opponentDistance = opponent.distance || 0;
    this.opponentUsername = opponent.username || 'Opponent';

    // 3D Floating Name Tag
    this.opponentNameTag = this.createNameTagSprite(this.opponentUsername);
    this.opponentNameTag.position.set(0, 2.35, 0);
    this.opponentModel.group.add(this.opponentNameTag);

    this.scene.add(this.opponentModel.group);
  }

  public updateOpponentState(data: Partial<import('../types/game').MultiplayerOpponent>) {
    if (!this.opponentModel) return;
    if (data.x !== undefined) this.opponentTargetPos.x = data.x;
    if (data.y !== undefined) this.opponentTargetPos.y = data.y;
    if (data.z !== undefined) this.opponentTargetPos.z = data.z;
    if (data.speed !== undefined) this.opponentSpeed = data.speed;
    if (data.distance !== undefined) {
      this.opponentDistance = data.distance;
      this.updateNameTagText();
    }
    if (data.animState && this.opponentModel) {
      this.opponentModel.currentState = data.animState as any;
    }
  }

  public triggerOpponentAction(event: string, _meta?: any) {
    if (!this.opponentModel) return;
    if (event === 'jump') {
      this.opponentModel.currentState = 'jumping';
    } else if (event === 'slide') {
      this.opponentModel.currentState = 'sliding';
    } else if (event === 'celebrate') {
      this.opponentModel.triggerCelebration();
      this.particleSystem.emitCelebrationConfetti(this.opponentModel.group.position);
    } else if (event === 'crash') {
      this.opponentModel.currentState = 'stumble';
      this.particleSystem.emitCollisionExplosion(this.opponentModel.group.position);
    }
  }

  public removeMultiplayerOpponent() {
    if (this.opponentModel) {
      this.scene.remove(this.opponentModel.group);
      this.opponentModel = null;
      this.opponentNameTag = null;
    }
  }

  private createNameTagSprite(name: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    this.drawNameTag(ctx, name, 0);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.9, 0.48, 1);
    return sprite;
  }

  private updateNameTagText() {
    if (!this.opponentNameTag) return;
    const tex = this.opponentNameTag.material.map;
    if (!tex) return;
    const canvas = tex.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const delta = Math.floor(this.opponentDistance - this.stats.distance);
    this.drawNameTag(ctx, this.opponentUsername, delta);
    tex.needsUpdate = true;
  }

  private drawNameTag(ctx: CanvasRenderingContext2D, name: string, delta: number) {
    ctx.clearRect(0, 0, 256, 64);
    // Background pill with glow border
    ctx.fillStyle = 'rgba(8, 12, 22, 0.88)';
    ctx.strokeStyle = delta >= 0 ? '#38bdf8' : '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 14);
    ctx.fill();
    ctx.stroke();

    // Username & Delta Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const deltaStr = delta >= 0 ? `+${delta}m` : `${delta}m`;
    ctx.fillText(`${name.slice(0, 10)} (${deltaStr})`, 128, 32);
  }

  public refreshEquippedCosmetics() {
    const profile = gameStore.getProfile();
    const s = DEFAULT_SKINS.find((x: CharacterSkin) => x.id === profile.selectedSkinId) || DEFAULT_SKINS[0];
    const snk = DEFAULT_SNEAKERS.find((x: SneakerItem) => x.id === profile.selectedSneakerId);
    const acc = DEFAULT_ACCESSORIES.find((x: AccessoryItem) => x.id === profile.selectedAccessoryId);
    this.character.applySkin(s, snk, acc);
  }

  public setMenuMode(isMenu: boolean) {
    this.isMenuMode = isMenu;
    this.isRunning = !isMenu;
    this.isPaused = false;

    if (this.menuStageGroup) {
      this.menuStageGroup.visible = isMenu;
    }

    if (isMenu) {
      this.removeMultiplayerOpponent();
      this.character.currentState = 'idle';
      this.character.group.position.set(0, 0, 0);
      this.character.group.rotation.set(0, Math.PI, 0); // Face camera in menu
      this.currentX = 0;
      this.currentY = 0;
      this.currentZ = 0;
      this.trackManager.reset('speed-city');
      this.updateWorldAtmosphere('speed-city');
      this.obstacleManager.reset();
      this.collectibleManager.reset();
      this.particleSystem.reset();
      soundManager.startMusic('menu');
    }
  }

  public updateWorldAtmosphere(world: WorldType) {
    switch (world) {
      case 'speed-city':
        this.scene.background = new THREE.Color('#080c16');
        this.scene.fog = new THREE.FogExp2('#080c16', 0.011);
        this.hemiLight.color.set('#38bdf8');
        this.hemiLight.groundColor.set('#0f172a');
        this.hemiLight.intensity = 0.85;
        this.dirLight.color.set('#fff7ed');
        this.dirLight.intensity = 1.85;
        break;
      case 'football-stadium':
        this.scene.background = new THREE.Color('#050e1a');
        this.scene.fog = new THREE.FogExp2('#050e1a', 0.009);
        this.hemiLight.color.set('#60a5fa');
        this.hemiLight.groundColor.set('#064e3b');
        this.hemiLight.intensity = 1.05;
        this.dirLight.color.set('#f8fafc');
        this.dirLight.intensity = 2.2;
        break;
      case 'world-tour':
        this.scene.background = new THREE.Color('#1c1917');
        this.scene.fog = new THREE.FogExp2('#1c1917', 0.010);
        this.hemiLight.color.set('#fdba74');
        this.hemiLight.groundColor.set('#1e1b4b');
        this.hemiLight.intensity = 0.95;
        this.dirLight.color.set('#ffedd5');
        this.dirLight.intensity = 1.95;
        break;
      case 'champion-arena':
        this.scene.background = new THREE.Color('#0c0a09');
        this.scene.fog = new THREE.FogExp2('#0c0a09', 0.012);
        this.hemiLight.color.set('#f59e0b');
        this.hemiLight.groundColor.set('#18181b');
        this.hemiLight.intensity = 1.0;
        this.dirLight.color.set('#fef08a');
        this.dirLight.intensity = 2.1;
        break;
    }
  }

  public startRun(mode: GameMode = 'classic') {
    this.currentMode = mode;
    this.isMenuMode = false;
    this.isRunning = true;
    this.isPaused = false;

    // Reset kinematics
    this.laneIndex = 0;
    this.currentX = 0;
    this.targetX = 0;
    this.currentY = 0;
    this.velocityY = 0;
    this.currentZ = 0;
    this.baseSpeed = 20;
    this.currentSpeed = 20;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.jumpsInAir = 0;
    this.maxJumps = 1;
    this.cameraShake = 0;

    // World selection by mode
    if (mode === 'football') {
      this.currentWorld = 'football-stadium';
    } else if (mode === 'time') {
      this.currentWorld = 'world-tour';
    } else if (mode === 'daily') {
      this.currentWorld = 'champion-arena';
    } else {
      this.currentWorld = 'speed-city';
    }

    this.updateWorldAtmosphere(this.currentWorld);

    // Reset stats
    this.stats = {
      score: 0,
      distance: 0,
      coins: 0,
      footballs: 0,
      powerUpsUsed: 0,
      jumps: 0,
      slides: 0,
      nearMisses: 0,
      multiplier: 1,
      isNewRecord: false,
    };

    this.timeRemaining = 90;
    this.activePowerUps.clear();

    this.character.currentState = 'running';
    this.character.group.position.set(0, 0, 0);
    this.character.group.rotation.set(0, 0, 0); // Run forward

    if (this.menuStageGroup) {
      this.menuStageGroup.visible = false;
    }

    this.trackManager.reset(this.currentWorld);
    this.obstacleManager.reset();
    this.collectibleManager.reset();
    this.particleSystem.reset();

    // Start high-energy run soundtrack
    soundManager.startMusic('game');
  }

  public togglePause(force?: boolean) {
    if (!this.isRunning) return;
    this.isPaused = force !== undefined ? force : !this.isPaused;
  }

  // --- CONTROLS ---

  public moveLeft() {
    if (!this.isRunning || this.isPaused) return;
    if (this.laneIndex > -1) {
      this.laneIndex -= 1;
      this.targetX = this.laneIndex * 2.6;
      this.character.triggerLaneChange('left');
      soundManager.playSlide();
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused) return;
    if (this.laneIndex < 1) {
      this.laneIndex += 1;
      this.targetX = this.laneIndex * 2.6;
      this.character.triggerLaneChange('right');
      soundManager.playSlide();
    }
  }

  public jump() {
    if (!this.isRunning || this.isPaused) return;

    const hasSuperJump = this.activePowerUps.has('super_jump');
    const jumpLimit = hasSuperJump ? 2 : 1;

    if (this.isGrounded || this.jumpsInAir < jumpLimit) {
      this.velocityY = hasSuperJump ? 15.5 : this.jumpForce;
      this.isGrounded = false;
      this.isSliding = false;
      this.jumpsInAir += 1;
      this.stats.jumps += 1;
      this.character.currentState = 'jumping';
      soundManager.playJump();

      if (this.currentMode === 'multiplayer' && this.callbacks.onMultiplayerEvent) {
        this.callbacks.onMultiplayerEvent('jump');
      }
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused) return;
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    this.stats.slides += 1;
    this.character.currentState = 'sliding';
    soundManager.playSlide();

    if (this.currentMode === 'multiplayer' && this.callbacks.onMultiplayerEvent) {
      this.callbacks.onMultiplayerEvent('slide');
    }

    // Fast-drop if in the air
    if (!this.isGrounded) {
      this.velocityY = -18;
    }
  }

  private bindEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        this.jump();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.slide();
      } else if (e.key === 'c' || e.key === 'C') {
        this.celebrate();
      } else if (e.key === 'Escape') {
        this.togglePause();
      }
    });

    // Universal Mobile Swipe Gestures (Android, iPhone, iPad, Tablet)
    window.addEventListener(
      'touchstart',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, input, select, textarea, [role="button"]')) {
          return;
        }
        if (e.touches.length > 0) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          this.touchStartTime = performance.now();
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, input, select, textarea, [role="button"]')) {
          return;
        }
        if (e.changedTouches.length === 0 || !this.isRunning || this.isPaused) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dt = performance.now() - this.touchStartTime;

        if (dt > 650) return; // Too slow for swipe gesture

        const dx = touchEndX - this.touchStartX;
        const dy = touchEndY - this.touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        const threshold = 25; // Responsive swipe distance on smartphones

        if (absX > absY && absX > threshold) {
          if (dx < 0) this.moveLeft();
          else this.moveRight();
        } else if (absY > absX && absY > threshold) {
          if (dy < 0) this.jump();
          else this.slide();
        }
      },
      { passive: true }
    );

    // Window Resize
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // --- INSPECTION & AUDIT STUDIO CONTROLS ---

  public setInspectMode(active: boolean, angle: 'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit' = 'orbit') {
    this.isInspectMode = active;
    this.inspectCameraAngle = angle;
    if (active) {
      this.isMenuMode = true;
      this.isRunning = false;
      this.character.group.position.set(0, 0, 0);
      this.character.group.rotation.set(0, 0, 0); // Face -Z
    }
  }

  public setInspectCameraAngle(angle: 'front' | 'profile' | 'back' | 'threeQuarter' | 'orbit') {
    this.inspectCameraAngle = angle;
  }

  public setInspectAnimation(anim: CharacterAnimState) {
    this.character.currentState = anim;
  }

  public setInspectWorld(world: WorldType) {
    this.currentWorld = world;
    this.updateWorldAtmosphere(world);
    this.trackManager.reset(world);
  }

  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // --- GAME LOOP ---

  private tick = () => {
    this.animFrameId = requestAnimationFrame(this.tick);

    // Measure real FPS & frame time
    this.fpsFrameCount++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 500) {
      this.currentFps = Math.round((this.fpsFrameCount * 1000) / (now - this.fpsLastTime));
      this.currentFrameTimeMs = parseFloat((1000 / Math.max(1, this.currentFps)).toFixed(1));
      this.fpsFrameCount = 0;
      this.fpsLastTime = now;
      if (this.callbacks.onFpsUpdate) {
        this.callbacks.onFpsUpdate(this.currentFps, this.currentFrameTimeMs);
      }
    }

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.isMenuMode) {
      this.updateMenu(delta);
    } else if (this.isRunning && !this.isPaused) {
      this.updateGame(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateMenu(delta: number) {
    // Reset camera upright vector for clean orbit
    this.camera.up.set(0, 1, 0);

    if (this.isInspectMode) {
      let targetX = 0;
      let targetY = 1.35;
      let targetZ = -3.2;

      switch (this.inspectCameraAngle) {
        case 'front':
          targetX = 0;
          targetY = 1.35;
          targetZ = -3.2; // Front of character (faces -Z)
          break;
        case 'profile':
          targetX = -3.4; // Profile view (right side)
          targetY = 1.25;
          targetZ = 0;
          break;
        case 'back':
          targetX = 0;
          targetY = 1.35;
          targetZ = 3.2; // Back of character
          break;
        case 'threeQuarter':
          targetX = -2.5; // Three-quarter front view
          targetY = 1.45;
          targetZ = -2.5;
          break;
        case 'orbit':
        default:
          const time = this.clock.getElapsedTime();
          targetX = Math.sin(time * 0.45) * 4.2;
          targetZ = Math.cos(time * 0.45) * 4.2;
          targetY = 1.8 + Math.sin(time * 0.3) * 0.3;
          break;
      }

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 10, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 10, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 10, delta);
      this.camera.lookAt(0, 1.15, 0);
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();

      this.character.update(delta, 1.0);
    } else {
      // Cinematic camera rotate around character
      const time = this.clock.getElapsedTime();
      const radius = 5.2;
      this.camera.position.x = Math.sin(time * 0.45) * radius;
      this.camera.position.z = Math.cos(time * 0.45) * radius;
      this.camera.position.y = 2.4 + Math.sin(time * 0.3) * 0.4;
      this.camera.lookAt(0, 1.2, 0);
      this.camera.fov = 58;
      this.camera.updateProjectionMatrix();

      // Idle animation
      this.character.update(delta, 1.0);
    }

    // Dynamic rotation of podium neon energy rings
    this.menuStageRings.forEach((r, idx) => {
      r.rotation.z += delta * (idx % 2 === 0 ? 0.75 : -0.75);
    });
  }

  private updateGame(delta: number) {
    // 1. Time challenge countdown
    if (this.currentMode === 'time') {
      this.timeRemaining -= delta;
      if (this.callbacks.onTimeUpdate) {
        this.callbacks.onTimeUpdate(Math.max(0, Math.ceil(this.timeRemaining)));
      }
      if (this.timeRemaining <= 0) {
        this.handleGameOver();
        return;
      }
    }

    // 2. Power-Up timers & buffs
    let isSpeedBoost = false;
    let isMagnet = false;
    let hasShield = false;
    let scoreMultiplier = 1;
    let coinMultiplier = 1;

    const expiredPowerUps: PowerUpType[] = [];
    this.activePowerUps.forEach((val, type) => {
      val.remaining -= delta;
      if (val.remaining <= 0) {
        expiredPowerUps.push(type);
      } else {
        if (type === 'speed_boost') isSpeedBoost = true;
        if (type === 'magnet') isMagnet = true;
        if (type === 'shield') hasShield = true;
        if (type === 'score_multiplier') scoreMultiplier = 2;
        if (type === 'coin_boost') coinMultiplier = 2;
      }
    });

    expiredPowerUps.forEach((type) => {
      this.activePowerUps.delete(type);
      if (type === 'shield') this.character.shieldMesh.visible = false;
      if (type === 'magnet') this.character.magnetAura.visible = false;
    });

    // Notify HUD of power-ups
    const activeList: PowerUpActive[] = [];
    this.activePowerUps.forEach((val, type) => {
      activeList.push({ type, remainingTime: val.remaining, maxDuration: val.max });
    });
    this.callbacks.onPowerUpUpdate(activeList);

    // 3. Speed Progression & Distance
    // Speed increases smoothly with distance
    const speedProgress = Math.min(1.0, this.stats.distance / 3000);
    this.baseSpeed = 20 + speedProgress * 16;
    this.currentSpeed = isSpeedBoost ? this.baseSpeed + 16 : this.baseSpeed;

    const forwardMove = this.currentSpeed * delta;
    this.currentZ -= forwardMove;
    this.stats.distance += forwardMove;
    this.stats.score += Math.floor(forwardMove * 3 * scoreMultiplier);
    this.stats.multiplier = scoreMultiplier;

    // Notify HUD of speed lines tunnel effect
    if (this.callbacks.onSpeedLinesUpdate) {
      const isSprint = isSpeedBoost || this.currentSpeed > 26;
      this.callbacks.onSpeedLinesUpdate(isSprint, speedProgress);
    }

    // 4. Lateral Lane Movement (exponential damping)
    this.currentX = THREE.MathUtils.damp(this.currentX, this.targetX, 16, delta);

    // 5. Jump & Gravity Physics
    if (!this.isGrounded) {
      this.currentY += this.velocityY * delta;
      this.velocityY -= this.gravity * delta;

      if (this.currentY <= 0) {
        this.currentY = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.jumpsInAir = 0;
        soundManager.playLand();
        this.particleSystem.emitDust(new THREE.Vector3(this.currentX, 0, this.currentZ));
        this.particleSystem.emitLandingShockwave(new THREE.Vector3(this.currentX, 0, this.currentZ));

        if (!this.isSliding) {
          this.character.triggerLanding();
        }
      }
    }

    // 6. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        if (this.isGrounded) {
          this.character.currentState = isSpeedBoost ? 'sprinting' : 'running';
        }
      }
    }

    // Footstep audio trigger periodically
    if (this.isGrounded && !this.isSliding) {
      if (Math.sin(this.stats.distance * 1.5) > 0.95) {
        soundManager.playFootstep();
        this.particleSystem.emitDust(new THREE.Vector3(this.currentX, 0, this.currentZ));
      }
    }

    // Update Character Position in 3D
    this.character.group.position.set(this.currentX, this.currentY, this.currentZ);
    this.character.update(delta, this.currentSpeed / 20);

    // Particle Trail behind feet
    const selectedTrail = gameStore.getProfile().selectedTrailId;
    const tr = DEFAULT_TRAILS.find((t: TrailItem) => t.id === selectedTrail);
    this.particleSystem.emitTrail(this.character.group.position, tr, isSpeedBoost);

    // Multiplayer Position Sync to Opponent
    if (this.currentMode === 'multiplayer' && this.callbacks.onMultiplayerSync) {
      this.callbacks.onMultiplayerSync({
        x: this.currentX,
        y: this.currentY,
        z: this.currentZ,
        speed: this.currentSpeed,
        animState: this.character.currentState,
        score: this.stats.score,
        distance: Math.floor(this.stats.distance),
        isSliding: this.isSliding,
        isGrounded: this.isGrounded,
      });
    }

    // Update Opponent 3D Runner Model
    if (this.opponentModel) {
      this.opponentModel.group.position.x = THREE.MathUtils.damp(
        this.opponentModel.group.position.x,
        this.opponentTargetPos.x,
        14,
        delta
      );
      this.opponentModel.group.position.y = THREE.MathUtils.damp(
        this.opponentModel.group.position.y,
        this.opponentTargetPos.y,
        14,
        delta
      );
      this.opponentModel.group.position.z = THREE.MathUtils.damp(
        this.opponentModel.group.position.z,
        this.opponentTargetPos.z,
        22,
        delta
      );
      this.opponentModel.update(delta, this.opponentSpeed / 20);
      this.particleSystem.emitTrail(this.opponentModel.group.position, undefined, false);
      this.updateNameTagText();
    }

    // 7. Cinematographic Third-Person Follow Camera
    const isSprint = isSpeedBoost || this.currentSpeed > 26;
    const targetCamX = this.currentX * 0.72 + (this.character.bankRoll * 0.35);
    const targetCamY = Math.max(2.85, this.currentY * 0.55 + (this.isSliding ? 2.4 : 3.3));
    const targetCamZ = this.currentZ + (isSprint ? 6.8 : 5.8);

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 12, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 10, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 28, delta);

    // Dynamic FOV based on speed progression & turbo boost
    const baseFov = THREE.MathUtils.lerp(58, 68, speedProgress);
    const targetFov = isSpeedBoost ? 76 : (this.isSliding ? baseFov - 3 : baseFov);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();

    // Camera Shake on collisions/speed
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 3.5);
    }

    // Camera look ahead focused on player's upper body and horizon
    const lookTargetZ = this.currentZ - 18;
    // Bank roll via camera.up vector to avoid Euler matrix disruption
    const bank = -this.character.bankRoll * 0.12;
    this.camera.up.set(Math.sin(bank), Math.cos(bank), 0);
    this.camera.lookAt(this.currentX * 0.35, 1.4 + this.currentY * 0.40, lookTargetZ);

    // Move directional light along with player for consistent high-quality shadows
    this.dirLight.position.set(this.currentX + 15, 25, this.currentZ - 12);
    this.dirLight.target.position.set(this.currentX, 0, this.currentZ);
    this.dirLight.target.updateMatrixWorld();

    // 8. Update Track & Environments
    // Switch world dynamically every 1,200 meters in Classic Run!
    if (this.currentMode === 'classic') {
      const worldCycle: WorldType[] = ['speed-city', 'football-stadium', 'world-tour', 'champion-arena'];
      const cycleIdx = Math.floor(this.stats.distance / 1200) % worldCycle.length;
      const nextWorld = worldCycle[cycleIdx];
      if (this.currentWorld !== nextWorld) {
        this.currentWorld = nextWorld;
        this.updateWorldAtmosphere(this.currentWorld);
      }
    }
    this.trackManager.update(this.currentZ, this.currentWorld);

    // 9. Update Obstacles & Check Collisions
    this.obstacleManager.update(delta, this.currentZ, this.currentSpeed);

    // Collision check: Speed boost destroys obstacles in path!
    if (isSpeedBoost) {
      // Auto demolish obstacles
      this.obstacleManager.obstacles.forEach((obs) => {
        if (obs.active && Math.abs(obs.position.z - this.currentZ) < 3.0 && Math.abs(obs.position.x - this.currentX) < 1.4) {
          obs.active = false;
          this.scene.remove(obs.group);
          this.particleSystem.emitCollisionExplosion(obs.position);
          soundManager.playCrash();
          this.stats.score += 500;
        }
      });
    } else {
      const col = this.obstacleManager.checkCollision(
        this.currentX,
        this.currentY,
        this.currentZ,
        this.isSliding,
        hasShield
      );

      if (col.shieldPopped) {
        // Shield protected the player!
        this.activePowerUps.delete('shield');
        this.character.shieldMesh.visible = false;
        soundManager.playShieldBreak();
        if (this.callbacks.onDangerFlash) this.callbacks.onDangerFlash();
        this.cameraShake = 0.45;
        this.particleSystem.emitCollisionExplosion(this.character.group.position);
      } else if (col.collided) {
        // Crash game over!
        if (this.callbacks.onDangerFlash) this.callbacks.onDangerFlash();
        this.handleGameOver();
        return;
      } else {
        // Razor-thin Near-Miss (Close Call) check
        const nm = this.obstacleManager.checkNearMiss(
          this.currentX,
          this.currentY,
          this.currentZ,
          this.isSliding
        );
        if (nm.nearMiss) {
          this.stats.score += nm.bonus;
          this.stats.nearMisses = (this.stats.nearMisses || 0) + 1;
          soundManager.playNearMiss();
          soundManager.playVoiceLine('close_call');
          this.cameraShake = 0.16;
          if (this.callbacks.onPopup) {
            this.callbacks.onPopup({
              text: '⚡ CLOSE CALL!',
              subText: `+${nm.bonus} PTS`,
              type: 'near_miss',
              color: '#fbbf24',
            });
          }
        }
      }
    }

    // 10. Update Collectibles & Pickups
    this.collectibleManager.update(delta, this.currentX, this.currentY, this.currentZ, isMagnet);
    const collected = this.collectibleManager.checkCollection(
      this.currentX,
      this.currentY,
      this.currentZ,
      isMagnet ? 2.5 : 1.3
    );

    collected.forEach((item) => {
      if (item.type === 'coin') {
        const amt = item.value * coinMultiplier;
        this.stats.coins += amt;
        const pts = 100 * amt;
        this.stats.score += pts;
        soundManager.playCoin();
        this.particleSystem.emitCoinSparkles(item.position);

        // Floating score popup every 4 coins or when bonus multiplier is active
        if (this.stats.coins % 4 === 0 || coinMultiplier > 1) {
          if (this.callbacks.onPopup) {
            this.callbacks.onPopup({
              text: `+${pts} PTS`,
              subText: coinMultiplier > 1 ? `🪙 +${amt} COINS (2X BOOST)` : `🪙 +${amt} COINS`,
              type: 'coin',
              color: '#facc15',
            });
          }
        }
      } else if (item.type === 'football') {
        this.stats.footballs += 1;
        this.stats.score += 1000;
        soundManager.playFootball();
        soundManager.playVoiceLine('siuuu');
        this.particleSystem.emitCelebrationConfetti(item.position);

        if (this.callbacks.onPopup) {
          this.callbacks.onPopup({
            text: '⚽ SIUUU! GOLDEN GOAL!',
            subText: '+1,000 PTS & BONUS TIME',
            type: 'football',
            color: '#4ade80',
          });
        }

        if (this.currentMode === 'time') {
          this.timeRemaining = Math.min(120, this.timeRemaining + 5); // +5 seconds!
        }
      } else if (item.isPowerUp) {
        this.activatePowerUp(item.type as PowerUpType);
      }
    });

    // 11. Update Particles
    this.particleSystem.update(delta);

    // 12. HUD Callback
    this.callbacks.onScoreUpdate(
      this.stats.score,
      Math.floor(this.stats.distance),
      this.stats.coins,
      this.stats.footballs,
      this.stats.multiplier
    );
  }

  public activatePowerUp(type: PowerUpType) {
    const duration = type === 'speed_boost' ? 6.0 : 12.0;
    this.activePowerUps.set(type, { remaining: duration, max: duration });
    this.stats.powerUpsUsed += 1;
    soundManager.playPowerUp();

    if (type === 'shield') {
      this.character.shieldMesh.visible = true;
    }
    if (type === 'magnet') {
      this.character.magnetAura.visible = true;
    }

    if (this.callbacks.onPopup) {
      const names: Record<PowerUpType, { title: string; color: string }> = {
        speed_boost: { title: '🔥 TURBO SPRINT!', color: '#fbbf24' },
        magnet: { title: '🧲 COIN MAGNET!', color: '#f472b6' },
        shield: { title: '🛡️ TITANIUM SHIELD!', color: '#22d3ee' },
        score_multiplier: { title: '⚡ 2X SCORE ACTIVE!', color: '#c084fc' },
        coin_boost: { title: '🪙 2X COINS ACTIVE!', color: '#34d399' },
        super_jump: { title: '🚀 SUPER JUMP!', color: '#fb923c' },
      };
      const info = names[type] || { title: 'POWER-UP!', color: '#00f5d4' };
      this.callbacks.onPopup({
        text: info.title,
        type: 'powerup',
        color: info.color,
      });
    }

    if (type === 'speed_boost') {
      soundManager.playVoiceLine('speed');
    } else {
      soundManager.playVoiceLine('lets_go');
    }
  }

  public handleGameOver() {
    this.isRunning = false;
    soundManager.stopMusic();
    soundManager.playCrash();
    this.character.currentState = 'stumble';
    this.cameraShake = 0.6;
    this.particleSystem.emitCollisionExplosion(this.character.group.position);

    if (this.currentMode === 'multiplayer' && this.callbacks.onMultiplayerEvent) {
      this.callbacks.onMultiplayerEvent('crash', { score: this.stats.score, distance: this.stats.distance });
    }

    const isRecord = gameStore.recordRun(this.stats, this.currentMode);
    this.stats.isNewRecord = isRecord;

    if (isRecord) {
      soundManager.playVoiceLine('siuuu');
      if (this.callbacks.onPopup) {
        this.callbacks.onPopup({
          text: '👑 NEW RECORD SIUUU!',
          subText: `${this.stats.score.toLocaleString()} PTS`,
          type: 'record',
          color: '#ffd700',
        });
      }
    }

    setTimeout(() => {
      this.callbacks.onGameOver(this.stats);
    }, 1200);
  }

  public revive() {
    // Revive mechanic: consumes coins or gives second chance with shield!
    this.isRunning = true;
    this.isPaused = false;
    this.currentY = 0;
    this.character.currentState = 'running';
    this.activatePowerUp('shield');
    this.activatePowerUp('speed_boost');
    soundManager.startMusic('game');
  }

  public celebrate() {
    this.character.triggerCelebration();
    soundManager.playVoiceLine('siuuu');
    this.particleSystem.emitCelebrationConfetti(this.character.group.position);

    if (this.currentMode === 'multiplayer' && this.callbacks.onMultiplayerEvent) {
      this.callbacks.onMultiplayerEvent('celebrate');
    }

    if (this.callbacks.onPopup) {
      this.callbacks.onPopup({
        text: '👑 SIUUUUUU !',
        subText: 'THE GOAT CELEBRATION',
        type: 'siuuu',
        color: '#ffd700',
      });
    }
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
