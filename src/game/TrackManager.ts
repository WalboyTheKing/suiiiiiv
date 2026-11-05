import * as THREE from 'three';
import { WorldType } from '../types/game';

export interface TrackChunk {
  group: THREE.Group;
  zStart: number;
  zEnd: number;
  worldType: WorldType;
  flameEmitters?: THREE.Mesh[];
  animatedProps?: { mesh: THREE.Object3D; update: (time: number) => void }[];
}

/**
 * Next-Gen Volumetric 3D Track & Environment Engine
 * Constructs deep, multi-layered 3D highway infrastructure with true volumetric roadbed,
 * beveled curbs, steel W-beam guardrails, 3D cat's-eye pavement markers, overhead trusses,
 * and high-fidelity architectural worlds.
 */
export class TrackManager {
  public scene: THREE.Scene;
  public chunks: TrackChunk[] = [];
  public currentWorld: WorldType = 'speed-city';

  private chunkLength: number = 60;
  private numChunks: number = 9;
  private nextChunkZ: number = 120;

  // High-End Materials & PBR Textures
  private roadMaterial!: THREE.MeshStandardMaterial;
  private roadbedBaseMaterial!: THREE.MeshStandardMaterial;
  private curbMaterial!: THREE.MeshStandardMaterial;
  private sidewalkMaterial!: THREE.MeshStandardMaterial;
  private guardrailMaterial!: THREE.MeshStandardMaterial;
  private metalMaterial!: THREE.MeshStandardMaterial;
  private goldMat!: THREE.MeshStandardMaterial;
  private roofPropsMaterial!: THREE.MeshStandardMaterial;
  private catsEyeAmberMaterial!: THREE.MeshStandardMaterial;
  private catsEyeCyanMaterial!: THREE.MeshStandardMaterial;
  private flameGlowMaterial!: THREE.MeshBasicMaterial;

  private windowMaterials: THREE.MeshStandardMaterial[] = [];
  private neonBillboards: THREE.CanvasTexture[] = [];
  private skylineGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skylineGroup = new THREE.Group();
    this.scene.add(this.skylineGroup);

    this.initProceduralTexturesAndMaterials();
    this.buildDistantSkyline();
  }

  private initProceduralTexturesAndMaterials() {
    // 1. High-Detail PBR Asphalt Texture with Micro-Aggregates & Road Markings
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 1024;
    roadCanvas.height = 1024;
    const ctx = roadCanvas.getContext('2d')!;

    // Rich dark charcoal asphalt base
    ctx.fillStyle = '#16191f';
    ctx.fillRect(0, 0, 1024, 1024);

    // Micro stone aggregate noise
    for (let i = 0; i < 20000; i++) {
      const g = Math.floor(Math.random() * 30 + 18);
      ctx.fillStyle = `rgb(${g},${g + 3},${g + 6})`;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Tire tread marks in each lane
    ctx.fillStyle = 'rgba(10, 12, 16, 0.4)';
    [-290, 0, 290].forEach((offset) => {
      const cx = 512 + offset;
      ctx.fillRect(cx - 65, 0, 40, 1024);
      ctx.fillRect(cx + 25, 0, 40, 1024);
    });

    // Solid outer shoulder lines with slight weathering
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(60, 0, 16, 1024);
    ctx.fillRect(948, 0, 16, 1024);

    // Continuous bright reflective yellow center lines
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(350, 0, 12, 1024);
    ctx.fillRect(662, 0, 12, 1024);

    // White dashed high-visibility lane markers
    ctx.fillStyle = '#ffffff';
    for (let y = 30; y < 1024; y += 180) {
      ctx.fillRect(350, y, 12, 95);
      ctx.fillRect(662, y, 12, 95);
    }

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 4);
    roadTex.colorSpace = THREE.SRGBColorSpace;
    roadTex.anisotropy = 8;

    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.72,
      metalness: 0.15,
    });

    // 2. Concrete Roadbed Base (Under slab)
    this.roadbedBaseMaterial = new THREE.MeshStandardMaterial({
      color: '#1f2937',
      roughness: 0.9,
      metalness: 0.1,
    });

    // 3. Volumetric Sidewalks & Beveled Curbs
    const swCanvas = document.createElement('canvas');
    swCanvas.width = 256;
    swCanvas.height = 256;
    const sctx = swCanvas.getContext('2d')!;
    sctx.fillStyle = '#374151';
    sctx.fillRect(0, 0, 256, 256);
    sctx.strokeStyle = '#1f2937';
    sctx.lineWidth = 4;
    sctx.strokeRect(2, 2, 252, 252);
    const swTex = new THREE.CanvasTexture(swCanvas);
    swTex.wrapS = THREE.RepeatWrapping;
    swTex.wrapT = THREE.RepeatWrapping;
    swTex.repeat.set(2, 8);

    this.sidewalkMaterial = new THREE.MeshStandardMaterial({
      map: swTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.65,
      metalness: 0.15,
    });

    // 4. Steel Guardrails & Metal Infrastructure
    this.guardrailMaterial = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.9,
      roughness: 0.22,
    });

    this.metalMaterial = new THREE.MeshStandardMaterial({
      color: '#64748b',
      metalness: 0.88,
      roughness: 0.24,
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.92,
      roughness: 0.18,
    });

    this.roofPropsMaterial = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.6,
      roughness: 0.5,
    });

    // 5. Glowing 3D Cat's-Eye Reflective Pavement Markers
    this.catsEyeAmberMaterial = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.catsEyeCyanMaterial = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 2.0,
      roughness: 0.2,
      metalness: 0.8,
    });

    // 6. Pyrotechnic Flame Glow
    this.flameGlowMaterial = new THREE.MeshBasicMaterial({
      color: '#ffedd5',
    });

    // 7. Illuminated Window Grids
    const winCanvas1 = this.createWindowGridTexture('#38bdf8', '#0284c7');
    const winCanvas2 = this.createWindowGridTexture('#fbbf24', '#f59e0b');
    const winCanvas3 = this.createWindowGridTexture('#a855f7', '#7e22ce');

    this.windowMaterials = [
      new THREE.MeshStandardMaterial({ map: winCanvas1, roughness: 0.25, metalness: 0.45 }),
      new THREE.MeshStandardMaterial({ map: winCanvas2, roughness: 0.25, metalness: 0.45 }),
      new THREE.MeshStandardMaterial({ map: winCanvas3, roughness: 0.25, metalness: 0.45 }),
    ];

    // 8. Animated Digital Neon Billboards
    this.neonBillboards = [
      this.createBillboardCanvas('⚡ SPEED RUSH 3D ⚡', '#00f5d4', '#090d16', 'OFFICIAL NEXT-GEN STREAM RUNNER'),
      this.createBillboardCanvas('★ I SHOW SPEED ★', '#ffd700', '#7f1d1d', 'LIVE MATCHDAY • 150K VIEWERS'),
      this.createBillboardCanvas('SIUUUUUUU!', '#f43f5e', '#111827', 'UNLEASH THE GOAT ENERGY'),
      this.createBillboardCanvas('CHAMPIONSHIP TOUR', '#38bdf8', '#0c4a6e', 'PASS THE 5,000 METER MARK'),
    ];
  }

  private createWindowGridTexture(glowCol: string, accentCol: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, 256, 512);

    const rows = 16;
    const cols = 8;
    const w = 256 / cols;
    const h = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isLit = Math.random() > 0.38;
        if (isLit) {
          ctx.fillStyle = Math.random() > 0.85 ? glowCol : '#fef3c7';
          ctx.fillRect(c * w + 3, r * h + 3, w - 6, h - 6);
        } else {
          ctx.fillStyle = '#111827';
          ctx.fillRect(c * w + 3, r * h + 3, w - 6, h - 6);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createBillboardCanvas(title: string, fg: string, bg: string, subtitle: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 160);

    ctx.strokeStyle = fg;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 148);

    ctx.fillStyle = fg;
    ctx.font = '900 46px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 256, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(subtitle, 256, 114);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildDistantSkyline() {
    // 1. Endless Ground / Horizon Base Plate (prevents any bottom/edge black void)
    const groundGeo = new THREE.PlaneGeometry(900, 1100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#060911',
      roughness: 0.95,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(0, -0.65, -80);
    groundMesh.receiveShadow = true;
    this.skylineGroup.add(groundMesh);

    // 2. 360-Degree Panoramic Skyline (Skyscrapers both ahead in -Z and behind in +Z)
    const skyMat = new THREE.MeshBasicMaterial({ color: '#070a12' });
    const litMat1 = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 });

    // Forward corridor (-Z, from -50 to -420)
    for (let i = 0; i < 52; i++) {
      const h = 70 + (i * 7) % 110;
      const w = 22 + (i * 5) % 30;
      const d = 20 + (i * 4) % 25;
      const bldgGeo = new THREE.BoxGeometry(w, h, d);
      const mat = i % 3 === 0 ? this.windowMaterials[i % this.windowMaterials.length] : (i % 2 === 0 ? skyMat : litMat1);
      const mesh = new THREE.Mesh(bldgGeo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (55 + ((i * 13) % 75));
      const z = -(i * 18) - 40;
      mesh.position.set(x, h / 2 - 12, z);
      this.skylineGroup.add(mesh);
    }

    // Rear corridor (+Z behind player at lobby, from +20 to +240)
    for (let i = 0; i < 36; i++) {
      const h = 65 + (i * 9) % 95;
      const w = 20 + (i * 6) % 28;
      const d = 22 + (i * 3) % 24;
      const bldgGeo = new THREE.BoxGeometry(w, h, d);
      const mat = i % 2 === 0 ? this.windowMaterials[i % this.windowMaterials.length] : skyMat;
      const mesh = new THREE.Mesh(bldgGeo, mat);
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (50 + ((i * 11) % 70));
      const z = (i * 16) + 20;
      mesh.position.set(x, h / 2 - 12, z);
      this.skylineGroup.add(mesh);
    }

    // Panoramic back-wall towers (Z = +160 to +220 spanning X = -140 to +140)
    for (let i = 0; i < 20; i++) {
      const h = 90 + (i * 8) % 130;
      const w = 26 + (i * 4) % 32;
      const d = 26;
      const bldgGeo = new THREE.BoxGeometry(w, h, d);
      const mat = this.windowMaterials[i % this.windowMaterials.length];
      const mesh = new THREE.Mesh(bldgGeo, mat);
      const x = -130 + i * 14;
      const z = 180 + ((i * 7) % 40);
      mesh.position.set(x, h / 2 - 12, z);
      this.skylineGroup.add(mesh);
    }
  }

  public reset(initialWorld: WorldType = 'speed-city') {
    this.currentWorld = initialWorld;
    this.nextChunkZ = 120; // 2 chunks (120m) behind player at z=0 so there is no black void

    this.chunks.forEach((chunk) => {
      this.scene.remove(chunk.group);
    });
    this.chunks = [];

    // Chunks extend forward in -Z direction
    for (let i = 0; i < this.numChunks; i++) {
      const zStart = this.nextChunkZ;
      const zEnd = zStart - this.chunkLength;
      const chunkData = this.buildChunkMesh(zStart, this.chunkLength, this.currentWorld);
      this.chunks.push({
        group: chunkData.group,
        zStart,
        zEnd,
        worldType: this.currentWorld,
        flameEmitters: chunkData.flameEmitters,
        animatedProps: chunkData.animatedProps,
      });
      this.scene.add(chunkData.group);
      this.nextChunkZ = zEnd;
    }
  }

  public update(playerZ: number, worldType: WorldType) {
    if (this.currentWorld !== worldType) {
      this.currentWorld = worldType;
    }

    // Keep distant skyline anchored ahead of player in -Z
    this.skylineGroup.position.z = playerZ - 160;

    // Dynamic animation of environmental elements (flame jets, stadium lights)
    const time = performance.now() * 0.003;
    this.chunks.forEach((chunk) => {
      if (chunk.flameEmitters) {
        chunk.flameEmitters.forEach((flame, idx) => {
          const sy = 1.0 + Math.sin(time * 14 + idx * 2.3) * 0.55;
          const sx = 0.85 + Math.cos(time * 10 + idx) * 0.25;
          flame.scale.set(sx, sy, sx);
        });
      }
    });

    // Recycle chunks when player passes past them
    const oldestChunk = this.chunks[0];
    if (playerZ < oldestChunk.zEnd - 15) {
      this.scene.remove(oldestChunk.group);
      this.chunks.shift();

      const newZStart = this.nextChunkZ;
      const newZEnd = newZStart - this.chunkLength;
      const chunkData = this.buildChunkMesh(newZStart, this.chunkLength, this.currentWorld);

      this.chunks.push({
        group: chunkData.group,
        zStart: newZStart,
        zEnd: newZEnd,
        worldType: this.currentWorld,
        flameEmitters: chunkData.flameEmitters,
        animatedProps: chunkData.animatedProps,
      });

      this.scene.add(chunkData.group);
      this.nextChunkZ = newZEnd;
    }
  }

  /**
   * Constructs a volumetric 3D chunk with road slab depth, beveled curbs,
   * guardrails, cat's-eye pavement markers, and world-specific 3D architecture.
   */
  private buildChunkMesh(
    zPos: number,
    length: number,
    world: WorldType
  ): { group: THREE.Group; flameEmitters?: THREE.Mesh[]; animatedProps?: { mesh: THREE.Object3D; update: (time: number) => void }[] } {
    const chunk = new THREE.Group();
    chunk.position.z = zPos - length / 2;

    const trackWidth = 8.8; // Lanes at X = -2.6 (Left), 0 (Center), +2.6 (Right)
    const roadDepth = 0.42;

    // 1. Volumetric 3D Roadbed (Deep slab, NOT a flat plane!)
    const roadBoxGeo = new THREE.BoxGeometry(trackWidth, roadDepth, length);
    const roadMesh = new THREE.Mesh(roadBoxGeo, this.roadMaterial);
    roadMesh.position.y = -roadDepth / 2;
    roadMesh.receiveShadow = true;
    chunk.add(roadMesh);

    // Structural underside bed
    const underGeo = new THREE.BoxGeometry(trackWidth + 0.4, 0.3, length);
    const underMesh = new THREE.Mesh(underGeo, this.roadbedBaseMaterial);
    underMesh.position.y = -roadDepth - 0.15;
    underMesh.receiveShadow = true;
    chunk.add(underMesh);

    // 2. Volumetric Curbs with Beveled Chamfers
    const curbGeo = new THREE.BoxGeometry(0.75, 0.26, length);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    leftCurb.position.set(-trackWidth / 2 - 0.375, 0.08, 0);
    leftCurb.receiveShadow = true;
    chunk.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    rightCurb.position.set(trackWidth / 2 + 0.375, 0.08, 0);
    rightCurb.receiveShadow = true;
    chunk.add(rightCurb);

    // 3. Volumetric Sidewalks
    const swGeo = new THREE.BoxGeometry(3.6, 0.22, length);
    const leftSw = new THREE.Mesh(swGeo, this.sidewalkMaterial);
    leftSw.position.set(-trackWidth / 2 - 2.55, 0.06, 0);
    leftSw.receiveShadow = true;
    chunk.add(leftSw);

    const rightSw = new THREE.Mesh(swGeo, this.sidewalkMaterial);
    rightSw.position.set(trackWidth / 2 + 2.55, 0.06, 0);
    rightSw.receiveShadow = true;
    chunk.add(rightSw);

    // 4. Volumetric Steel Guardrails (W-Beam + Vertical Support I-Posts)
    this.addVolumetricGuardrails(chunk, trackWidth, length);

    // 5. 3D Cat's-Eye Reflective Pavement Studs (amber & cyan down lane borders)
    this.addCatsEyePavementStuds(chunk, length);

    // 6. World-Specific AAA 3D Scenery
    let flameEmitters: THREE.Mesh[] | undefined;
    const animatedProps: { mesh: THREE.Object3D; update: (time: number) => void }[] = [];

    switch (world) {
      case 'speed-city':
        this.buildSpeedCityArchitecture(chunk, length);
        break;
      case 'football-stadium':
        this.buildStadiumArchitecture(chunk, length);
        break;
      case 'world-tour':
        this.buildWorldTourArchitecture(chunk, length);
        break;
      case 'champion-arena':
        flameEmitters = this.buildChampionArenaArchitecture(chunk, length);
        break;
    }

    return { group: chunk, flameEmitters, animatedProps };
  }

  /**
   * Adds realistic 3D steel guardrails along the road edges with vertical posts every 4 meters.
   */
  private addVolumetricGuardrails(chunk: THREE.Group, trackWidth: number, length: number) {
    const railX = trackWidth / 2 + 0.8;
    const postInterval = 4.0;

    // Horizontal W-beam guardrail meshes
    const railGeo = new THREE.BoxGeometry(0.08, 0.32, length);
    const leftRail = new THREE.Mesh(railGeo, this.guardrailMaterial);
    leftRail.position.set(-railX, 0.45, 0);
    leftRail.castShadow = true;
    chunk.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, this.guardrailMaterial);
    rightRail.position.set(railX, 0.45, 0);
    rightRail.castShadow = true;
    chunk.add(rightRail);

    // Vertical I-posts
    const postGeo = new THREE.BoxGeometry(0.12, 0.75, 0.12);
    for (let z = -length / 2 + 2; z <= length / 2; z += postInterval) {
      const postL = new THREE.Mesh(postGeo, this.metalMaterial);
      postL.position.set(-railX, 0.25, z);
      postL.castShadow = true;
      chunk.add(postL);

      const postR = new THREE.Mesh(postGeo, this.metalMaterial);
      postR.position.set(railX, 0.25, z);
      postR.castShadow = true;
      chunk.add(postR);
    }
  }

  /**
   * Embeds 3D reflective cat's-eye markers along the lane dividing lines (X = -1.3 and X = +1.3).
   */
  private addCatsEyePavementStuds(chunk: THREE.Group, length: number) {
    const studGeo = new THREE.BoxGeometry(0.16, 0.04, 0.24);
    const interval = 5.0;

    for (let z = -length / 2 + 2.5; z <= length / 2; z += interval) {
      // Left lane divider studs
      const studL = new THREE.Mesh(studGeo, this.catsEyeAmberMaterial);
      studL.position.set(-1.3, 0.02, z);
      chunk.add(studL);

      // Right lane divider studs
      const studR = new THREE.Mesh(studGeo, this.catsEyeAmberMaterial);
      studR.position.set(1.3, 0.02, z);
      chunk.add(studR);
    }
  }

  // --- AAA WORLD ENVIRONMENTS ---

  /**
   * 1. SPEED CITY: Volumetric skyscrapers, neon fins, skybridges, highway gantries, and street lamps.
   */
  private buildSpeedCityArchitecture(chunk: THREE.Group, length: number) {
    const step = 18;
    for (let z = -length / 2 + 9; z < length / 2; z += step) {
      // Left Skyscraper (-X)
      const heightL = 34 + Math.random() * 32;
      const widthL = 14 + Math.random() * 8;
      const depthL = 16;
      const winMatL = this.windowMaterials[Math.floor(Math.random() * this.windowMaterials.length)];

      const bldgL = new THREE.Mesh(new THREE.BoxGeometry(widthL, heightL, depthL), winMatL);
      bldgL.position.set(-9.5 - widthL / 2, heightL / 2, z);
      bldgL.castShadow = true;
      bldgL.receiveShadow = true;
      chunk.add(bldgL);

      // Roof HVAC and Antenna
      const hvacL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.0, 3.5), this.roofPropsMaterial);
      hvacL.position.set(-9.5 - widthL / 2, heightL + 1.0, z);
      chunk.add(hvacL);

      // Right Skyscraper (+X)
      const heightR = 32 + Math.random() * 36;
      const widthR = 14 + Math.random() * 8;
      const depthR = 16;
      const winMatR = this.windowMaterials[Math.floor(Math.random() * this.windowMaterials.length)];

      const bldgR = new THREE.Mesh(new THREE.BoxGeometry(widthR, heightR, depthR), winMatR);
      bldgR.position.set(9.5 + widthR / 2, heightR / 2, z);
      bldgR.castShadow = true;
      bldgR.receiveShadow = true;
      chunk.add(bldgR);

      const antR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 8, 6), this.metalMaterial);
      antR.position.set(9.5 + widthR / 2, heightR + 4, z);
      chunk.add(antR);

      // Modern Architectural Streetlamps
      this.addStreetlight(chunk, -5.2, z);
      this.addStreetlight(chunk, 5.2, z);
    }

    // Overhead Highway Truss Gantry with High-Resolution Digital Billboards
    if (Math.random() > 0.35) {
      const gantry = new THREE.Group();
      gantry.position.set(0, 5.4, 0);

      const beam = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.45, 0.6), this.metalMaterial);
      gantry.add(beam);

      const pillL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.6, 8), this.metalMaterial);
      pillL.position.set(-5.6, -2.7, 0);
      const pillR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 5.6, 8), this.metalMaterial);
      pillR.position.set(5.6, -2.7, 0);
      gantry.add(pillL, pillR);

      // Digital Matrix Billboard facing oncoming player (-Z)
      const bbTex = this.neonBillboards[Math.floor(Math.random() * this.neonBillboards.length)];
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(7.6, 2.4),
        new THREE.MeshBasicMaterial({ map: bbTex })
      );
      board.position.set(0, 0, 0.32);
      gantry.add(board);

      chunk.add(gantry);
    }

    // Suspended Skybridge connecting buildings in the distance
    if (Math.random() > 0.6) {
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(32, 3.2, 4.5),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.8 })
      );
      bridge.position.set(0, 24, -length / 3);
      chunk.add(bridge);
    }
  }

  /**
   * 2. FOOTBALL STADIUM: Tiered grandstands with instanced crowds, floodlights, dugouts, and LED hoardings.
   */
  private buildStadiumArchitecture(chunk: THREE.Group, length: number) {
    // Multi-tiered grandstands
    const standGeo = new THREE.BoxGeometry(18, 12, length);
    const seatMatL = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.65 });
    const seatMatR = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.65 });

    const standL = new THREE.Mesh(standGeo, seatMatL);
    standL.position.set(-15.5, 6, 0);
    standL.rotation.z = -0.22;
    chunk.add(standL);

    const standR = new THREE.Mesh(standGeo, seatMatR);
    standR.position.set(15.5, 6, 0);
    standR.rotation.z = 0.22;
    chunk.add(standR);

    // Roaring Crowd Simulation (Instanced colored cubes on stands)
    const crowdGeo = new THREE.BoxGeometry(0.4, 0.7, 0.4);
    const crowdMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 });
    const crowdColors = ['#f87171', '#60a5fa', '#facc15', '#ffffff', '#34d399'];

    for (let c = 0; c < 24; c++) {
      const personL = new THREE.Mesh(
        crowdGeo,
        new THREE.MeshBasicMaterial({ color: crowdColors[c % crowdColors.length] })
      );
      personL.position.set(-9.5 - (c % 4) * 1.8, 2.2 + (c % 4) * 1.5, -length / 2 + (c * 2.5));
      chunk.add(personL);

      const personR = new THREE.Mesh(
        crowdGeo,
        new THREE.MeshBasicMaterial({ color: crowdColors[(c + 1) % crowdColors.length] })
      );
      personR.position.set(9.5 + (c % 4) * 1.8, 2.2 + (c % 4) * 1.5, -length / 2 + (c * 2.5));
      chunk.add(personR);
    }

    // Colossal Stadium Floodlight Pylons
    const pylonL = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.65, 18, 8), this.metalMaterial);
    pylonL.position.set(-8.8, 9, 0);
    chunk.add(pylonL);

    const bankL = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.6, 0.8),
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 3.5,
      })
    );
    bankL.position.set(-8.8, 17.5, 0);
    bankL.rotation.z = 0.35;
    chunk.add(bankL);

    const pylonR = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.65, 18, 8), this.metalMaterial);
    pylonR.position.set(8.8, 9, 0);
    chunk.add(pylonR);

    const bankR = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.6, 0.8),
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 3.5,
      })
    );
    bankR.position.set(8.8, 17.5, 0);
    bankR.rotation.z = -0.35;
    chunk.add(bankR);

    // Sideline LED Perimeter Hoardings
    const ledGeo = new THREE.BoxGeometry(0.12, 1.1, length);
    const ledMat = new THREE.MeshStandardMaterial({
      color: '#059669',
      emissive: '#10b981',
      emissiveIntensity: 1.5,
    });
    const ledL = new THREE.Mesh(ledGeo, ledMat);
    ledL.position.set(-5.6, 0.55, 0);
    chunk.add(ledL);

    const ledR = new THREE.Mesh(ledGeo, ledMat);
    ledR.position.set(5.6, 0.55, 0);
    chunk.add(ledR);
  }

  /**
   * 3. WORLD TOUR: Suspension bridge pylons, illuminated stay-cables, palm trees, and cliffside rocks.
   */
  private buildWorldTourArchitecture(chunk: THREE.Group, length: number) {
    // Massive Suspension Bridge Pylon
    if (Math.random() > 0.4) {
      const pylonGroup = new THREE.Group();
      pylonGroup.position.set(0, 0, 0);

      const towerGeo = new THREE.CylinderGeometry(0.65, 1.1, 26, 10);
      const towerL = new THREE.Mesh(towerGeo, this.metalMaterial);
      towerL.position.set(-6.8, 13, 0);
      const towerR = new THREE.Mesh(towerGeo, this.metalMaterial);
      towerR.position.set(6.8, 13, 0);

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 1.5), this.metalMaterial);
      crossBeam.position.set(0, 22, 0);

      pylonGroup.add(towerL, towerR, crossBeam);
      chunk.add(pylonGroup);
    }

    // Coastal Palm Trees with 3D Fronds
    const numPalms = 4;
    for (let p = 0; p < numPalms; p++) {
      const palmZ = -length / 2 + p * 15 + 5;
      this.addVolumetricPalmTree(chunk, -7.5, palmZ);
      this.addVolumetricPalmTree(chunk, 7.5, palmZ);
    }

    // Coastal Cliffs & Rocks
    const rockGeo = new THREE.DodecahedronGeometry(4.5, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#44403c', roughness: 0.95 });
    const rockL = new THREE.Mesh(rockGeo, rockMat);
    rockL.position.set(-16, 2, 0);
    rockL.scale.set(1.5, 1.0, 3.0);
    chunk.add(rockL);

    const rockR = new THREE.Mesh(rockGeo, rockMat);
    rockR.position.set(16, 2, 0);
    rockR.scale.set(1.5, 1.0, 3.0);
    chunk.add(rockR);
  }

  private addVolumetricPalmTree(chunk: THREE.Group, x: number, z: number) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    // Curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.20, 0.35, 7.5, 8);
    trunkGeo.translate(0, 3.75, 0);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.rotation.z = x > 0 ? -0.12 : 0.12;
    palm.add(trunk);

    // Palm fronds canopy
    const frondMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7 });
    for (let f = 0; f < 6; f++) {
      const angle = (f / 6) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.8, 3.6, 5);
      frondGeo.translate(0, 1.8, 0);
      frondGeo.rotateX(Math.PI / 2.5);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0, 7.2, 0);
      frond.rotation.y = angle;
      palm.add(frond);
    }

    chunk.add(palm);
  }

  /**
   * 4. CHAMPION ARENA: Monumental gold & obsidian Colosseum arches, giant trophy statues, and pyrotechnic flame jets.
   */
  private buildChampionArenaArchitecture(chunk: THREE.Group, length: number): THREE.Mesh[] {
    const flameEmitters: THREE.Mesh[] = [];

    // Colosseum Obsidian & Gold Arches
    const colosseumMat = new THREE.MeshStandardMaterial({
      color: '#18181b',
      roughness: 0.4,
      metalness: 0.6,
    });

    const step = 20;
    for (let z = -length / 2 + 10; z < length / 2; z += step) {
      // Monumental Golden Columns
      const colL = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 12), this.goldMat);
      colL.position.set(-8.5, 7, z);
      chunk.add(colL);

      const colR = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 12), this.goldMat);
      colR.position.set(8.5, 7, z);
      chunk.add(colR);

      // Pyrotechnic Flame Jets along track
      const jetBaseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
      const jetL = new THREE.Mesh(jetBaseGeo, this.metalMaterial);
      jetL.position.set(-4.8, 0.4, z);
      chunk.add(jetL);

      const flameL = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 1.6, 8),
        new THREE.MeshBasicMaterial({ color: '#f97316' })
      );
      flameL.position.set(-4.8, 1.4, z);
      chunk.add(flameL);
      flameEmitters.push(flameL);

      const jetR = new THREE.Mesh(jetBaseGeo, this.metalMaterial);
      jetR.position.set(4.8, 0.4, z);
      chunk.add(jetR);

      const flameR = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 1.6, 8),
        new THREE.MeshBasicMaterial({ color: '#f97316' })
      );
      flameR.position.set(4.8, 1.4, z);
      chunk.add(flameR);
      flameEmitters.push(flameR);
    }

    // Giant Monumental Golden Trophy
    if (Math.random() > 0.5) {
      const trophyGroup = new THREE.Group();
      trophyGroup.position.set(0, 10, 0);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 0.8, 4.0, 16), this.goldMat);
      trophyGroup.add(cup);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.5, 12), this.goldMat);
      stem.position.y = -3.0;
      trophyGroup.add(stem);

      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.5, 4.0), colosseumMat);
      pedestal.position.y = -4.8;
      trophyGroup.add(pedestal);

      const arch = new THREE.Mesh(new THREE.BoxGeometry(18, 1.0, 2.0), this.goldMat);
      arch.position.y = 3.2;
      trophyGroup.add(arch);

      chunk.add(trophyGroup);
    }

    return flameEmitters;
  }

  private addStreetlight(chunk: THREE.Group, x: number, z: number) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 8), this.metalMaterial);
    pole.position.set(x, 2.6, z);
    chunk.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), this.metalMaterial);
    arm.position.set(x > 0 ? x - 0.4 : x + 0.4, 5.1, z);
    chunk.add(arm);

    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.12, 0.22),
      new THREE.MeshStandardMaterial({
        color: '#fef08a',
        emissive: '#fef08a',
        emissiveIntensity: 2.5,
      })
    );
    lamp.position.set(x > 0 ? x - 0.75 : x + 0.75, 5.0, z);
    chunk.add(lamp);
  }
}
