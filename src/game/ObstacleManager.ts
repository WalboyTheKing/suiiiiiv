import * as THREE from 'three';

export type ObstacleType = 
  | 'low_barrier' 
  | 'high_sign' 
  | 'moving_van' 
  | 'rolling_ball' 
  | 'road_gap' 
  | 'goalie_dummy';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lane: number; // -1 (left, -2.6), 0 (center, 0), 1 (right, 2.6)
  position: THREE.Vector3;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  group: THREE.Group;
  speedZ: number;
  canJumpOver: boolean;
  canSlideUnder: boolean;
  active: boolean;
  nearMissAwarded?: boolean;
  meshProps?: {
    wheels?: THREE.Mesh[];
    ballMesh?: THREE.Mesh;
    strobeLights?: THREE.Mesh[];
  };
}

/**
 * Next-Gen 3D Volumetric Obstacle Engine
 * High-fidelity 3D models with concrete bases, animated strobe lights,
 * rotating vehicle wheels, aerodynamic chassis, and precise hitboxes.
 */
export class ObstacleManager {
  public scene: THREE.Scene;
  public obstacles: Obstacle[] = [];
  
  private laneX = [-2.6, 0, 2.6];
  private nextSpawnZ = -35;
  private spawnIntervalMin = 22;
  private spawnIntervalMax = 32;

  // High-End Materials
  private vehicleBodyMat: THREE.MeshStandardMaterial;
  private carGlassMat: THREE.MeshPhysicalMaterial;
  private wheelRubberMat: THREE.MeshStandardMaterial;
  private wheelRimMat: THREE.MeshStandardMaterial;
  private hazardStripesMat: THREE.MeshBasicMaterial;
  private highwaySignMat: THREE.MeshStandardMaterial;
  private soccerBallMat: THREE.MeshStandardMaterial;
  private concreteBarrierMat: THREE.MeshStandardMaterial;
  private strobeAmberMat: THREE.MeshStandardMaterial;
  private metalSteelMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.vehicleBodyMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.25,
      metalness: 0.70,
    });

    this.carGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#0f172a',
      roughness: 0.1,
      metalness: 0.95,
      transmission: 0.35,
    });

    this.wheelRubberMat = new THREE.MeshStandardMaterial({
      color: '#18181b',
      roughness: 0.88,
    });

    this.wheelRimMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.92,
      roughness: 0.18,
    });

    this.concreteBarrierMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.92,
      metalness: 0.08,
    });

    this.strobeAmberMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 3.0,
      roughness: 0.2,
    });

    this.metalSteelMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      metalness: 0.85,
      roughness: 0.25,
    });

    // High-Resolution Hazard Chevron Stripes Texture
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 512;
    hazardCanvas.height = 256;
    const hctx = hazardCanvas.getContext('2d')!;
    hctx.fillStyle = '#fbbf24';
    hctx.fillRect(0, 0, 512, 256);
    hctx.fillStyle = '#0f172a';
    hctx.beginPath();
    for (let x = -256; x < 768; x += 64) {
      hctx.moveTo(x, 0);
      hctx.lineTo(x + 32, 0);
      hctx.lineTo(x + 32 - 128, 256);
      hctx.lineTo(x - 128, 256);
    }
    hctx.fill();
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.repeat.set(2, 1);
    this.hazardStripesMat = new THREE.MeshBasicMaterial({ map: hazardTex });

    this.highwaySignMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.35,
      metalness: 0.2,
    });

    // Soccer Match Ball Texture with Pentagon/Hexagon Seams
    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 512;
    ballCanvas.height = 256;
    const bctx = ballCanvas.getContext('2d')!;
    bctx.fillStyle = '#ffffff';
    bctx.fillRect(0, 0, 512, 256);
    bctx.fillStyle = '#0f172a';

    for (let y = 30; y < 256; y += 70) {
      for (let x = 30; x < 512; x += 80) {
        bctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = x + Math.cos(a) * 22;
          const py = y + Math.sin(a) * 22;
          if (i === 0) bctx.moveTo(px, py);
          else bctx.lineTo(px, py);
        }
        bctx.fill();
      }
    }
    const ballTex = new THREE.CanvasTexture(ballCanvas);
    this.soccerBallMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.38,
      metalness: 0.12,
    });
  }

  public reset() {
    this.obstacles.forEach((obs) => {
      this.scene.remove(obs.group);
    });
    this.obstacles = [];
    this.nextSpawnZ = -35;
  }

  public update(delta: number, playerZ: number, gameSpeed: number) {
    const time = performance.now() * 0.005;

    // 1. Move vehicles & rolling balls towards runner (+Z)
    this.obstacles.forEach((obs) => {
      if (!obs.active) return;

      if (obs.speedZ !== 0) {
        obs.position.z += obs.speedZ * delta;
        obs.bounds.minZ = obs.position.z - 1.5;
        obs.bounds.maxZ = obs.position.z + 1.5;

        // Spin wheels
        if (obs.meshProps?.wheels) {
          obs.meshProps.wheels.forEach((w) => {
            w.rotation.x += obs.speedZ * delta * 2.8;
          });
        }

        // Spin soccer ball
        if (obs.meshProps?.ballMesh) {
          obs.meshProps.ballMesh.rotation.x += obs.speedZ * delta * 2.2;
        }
      }

      // Strobe lights blink on barriers
      if (obs.meshProps?.strobeLights) {
        const isStrobeOn = Math.sin(time * 8) > 0;
        obs.meshProps.strobeLights.forEach((l) => {
          (l.material as THREE.MeshStandardMaterial).emissiveIntensity = isStrobeOn ? 3.5 : 0.4;
        });
      }
    });

    // 2. Remove obstacles that the player passed past (Z > playerZ + 15)
    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.position.z > playerZ + 20) {
        this.scene.remove(obs.group);
        return false;
      }
      return true;
    });

    // 3. Spawn new obstacles ahead (-Z)
    while (this.nextSpawnZ > playerZ - 200) {
      this.spawnObstacleBatch(this.nextSpawnZ);
      const interval = this.spawnIntervalMin + Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin);
      this.nextSpawnZ -= interval;
    }
  }

  private spawnObstacleBatch(z: number) {
    const laneRoll = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const secondLaneRoll = Math.random() > 0.65 ? (laneRoll === 1 ? -1 : laneRoll + 1) : null;

    const types: ObstacleType[] = ['low_barrier', 'high_sign', 'moving_van', 'rolling_ball', 'goalie_dummy'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    this.spawnObstacle(chosenType, laneRoll, z);

    if (secondLaneRoll !== null && chosenType !== 'moving_van') {
      const secondType = chosenType === 'high_sign' ? 'low_barrier' : 'high_sign';
      this.spawnObstacle(secondType, secondLaneRoll, z);
    }
  }

  private spawnObstacle(type: ObstacleType, lane: number, z: number) {
    switch (type) {
      case 'low_barrier':
        this.spawnLowBarrier(lane, z);
        break;
      case 'high_sign':
        this.spawnHighSign(lane, z);
        break;
      case 'moving_van':
        this.spawnMovingVehicle(lane, z);
        break;
      case 'rolling_ball':
        this.spawnRollingBall(lane, z);
        break;
      case 'goalie_dummy':
        this.spawnGoalieDummy(lane, z);
        break;
      default:
        this.spawnLowBarrier(lane, z);
    }
  }

  /**
   * 1. Heavy 3D Highway Barrier: Concrete Jersey base + welded steel frame + reflective chevron board + strobe lamps.
   */
  private spawnLowBarrier(lane: number, z: number) {
    const group = new THREE.Group();
    const x = this.laneX[lane + 1];
    group.position.set(x, 0, z);

    // Concrete Jersey Base
    const baseGeo = new THREE.BoxGeometry(2.35, 0.35, 0.65);
    const base = new THREE.Mesh(baseGeo, this.concreteBarrierMat);
    base.position.y = 0.175;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Chevron Hazard Warning Board
    const boardGeo = new THREE.BoxGeometry(2.30, 0.60, 0.12);
    const board = new THREE.Mesh(boardGeo, this.hazardStripesMat);
    board.position.set(0, 0.65, 0);
    board.castShadow = true;
    group.add(board);

    // Support Steel Uprights
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8);
    const postL = new THREE.Mesh(postGeo, this.metalSteelMat);
    postL.position.set(-1.0, 0.45, 0);
    const postR = new THREE.Mesh(postGeo, this.metalSteelMat);
    postR.position.set(1.0, 0.45, 0);
    group.add(postL, postR);

    // Blinking Amber Strobe Beacons on top
    const strobeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.14, 8);
    const strobeL = new THREE.Mesh(strobeGeo, this.strobeAmberMat.clone());
    strobeL.position.set(-0.95, 1.02, 0);
    const strobeR = new THREE.Mesh(strobeGeo, this.strobeAmberMat.clone());
    strobeR.position.set(0.95, 1.02, 0);
    group.add(strobeL, strobeR);

    this.scene.add(group);

    this.obstacles.push({
      id: 'obs-' + Math.random().toString(36).substring(2, 9),
      type: 'low_barrier',
      lane,
      position: group.position,
      bounds: {
        minX: x - 1.15,
        maxX: x + 1.15,
        minY: 0,
        maxY: 1.15,
        minZ: z - 0.45,
        maxZ: z + 0.45,
      },
      group,
      speedZ: 0,
      canJumpOver: true,
      canSlideUnder: false,
      active: true,
      meshProps: { strobeLights: [strobeL, strobeR] },
    });
  }

  /**
   * 2. High Highway Gantries: Player must slide underneath!
   */
  private spawnHighSign(lane: number, z: number) {
    const group = new THREE.Group();
    const x = this.laneX[lane + 1];
    group.position.set(x, 0, z);

    // Twin structural steel legs spanning the lane
    const legGeo = new THREE.CylinderGeometry(0.09, 0.11, 3.4, 8);
    const legL = new THREE.Mesh(legGeo, this.metalSteelMat);
    legL.position.set(-1.18, 1.7, 0);
    legL.castShadow = true;

    const legR = new THREE.Mesh(legGeo, this.metalSteelMat);
    legR.position.set(1.18, 1.7, 0);
    legR.castShadow = true;
    group.add(legL, legR);

    // Elevated highway sign box (Bottom at Y = 1.6m, requiring slide!)
    const signGeo = new THREE.BoxGeometry(2.35, 1.25, 0.35);
    const sign = new THREE.Mesh(signGeo, this.highwaySignMat);
    sign.position.set(0, 2.35, 0);
    sign.castShadow = true;
    group.add(sign);

    // Amber LED Downlight Strip indicating clearance
    const stripGeo = new THREE.BoxGeometry(2.2, 0.08, 0.15);
    const strip = new THREE.Mesh(stripGeo, this.strobeAmberMat);
    strip.position.set(0, 1.68, 0);
    group.add(strip);

    this.scene.add(group);

    this.obstacles.push({
      id: 'obs-' + Math.random().toString(36).substring(2, 9),
      type: 'high_sign',
      lane,
      position: group.position,
      bounds: {
        minX: x - 1.18,
        maxX: x + 1.18,
        minY: 1.20,
        maxY: 3.20,
        minZ: z - 0.45,
        maxZ: z + 0.45,
      },
      group,
      speedZ: 0,
      canJumpOver: false,
      canSlideUnder: true,
      active: true,
    });
  }

  /**
   * 3. Moving High-Tech Vehicle: Aerodynamic sports taxi driving towards the runner.
   */
  private spawnMovingVehicle(lane: number, z: number) {
    const group = new THREE.Group();
    const x = this.laneX[lane + 1];
    group.position.set(x, 0, z);

    // Vehicle Body Chassis
    const bodyGeo = new THREE.BoxGeometry(1.85, 0.72, 3.4);
    bodyGeo.translate(0, 0.48, 0);
    const body = new THREE.Mesh(bodyGeo, this.vehicleBodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Aerodynamic Glass Cabin
    const cabinGeo = new THREE.BoxGeometry(1.55, 0.55, 1.8);
    cabinGeo.translate(0, 1.05, -0.2);
    const cabin = new THREE.Mesh(cabinGeo, this.carGlassMat);
    cabin.castShadow = true;
    group.add(cabin);

    // Glowing LED Headlights (facing oncoming player at +Z)
    const headlightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#f8fafc',
      emissiveIntensity: 3.5,
    });
    const hlL = new THREE.Mesh(headlightGeo, headlightMat);
    hlL.position.set(-0.65, 0.52, 1.71);
    const hlR = new THREE.Mesh(headlightGeo, headlightMat);
    hlR.position.set(0.65, 0.52, 1.71);
    group.add(hlL, hlR);

    // 4 High-Grip Alloy Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelOffsets = [
      [-0.92, 0.32, 1.1],
      [0.92, 0.32, 1.1],
      [-0.92, 0.32, -1.1],
      [0.92, 0.32, -1.1],
    ];

    wheelOffsets.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, this.wheelRubberMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);

      // Rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.23, 8), this.wheelRimMat);
      rim.position.set(wx, wy, wz);
      rim.rotation.z = Math.PI / 2;
      group.add(rim);
    });

    this.scene.add(group);

    this.obstacles.push({
      id: 'obs-' + Math.random().toString(36).substring(2, 9),
      type: 'moving_van',
      lane,
      position: group.position,
      bounds: {
        minX: x - 0.95,
        maxX: x + 0.95,
        minY: 0,
        maxY: 1.45,
        minZ: z - 1.75,
        maxZ: z + 1.75,
      },
      group,
      speedZ: 8.5,
      canJumpOver: false,
      canSlideUnder: false,
      active: true,
      meshProps: { wheels },
    });
  }

  /**
   * 4. Giant Rolling Match Ball: Physics-based forward spin rolling towards runner.
   */
  private spawnRollingBall(lane: number, z: number) {
    const group = new THREE.Group();
    const x = this.laneX[lane + 1];
    group.position.set(x, 0, z);

    const ballGeo = new THREE.SphereGeometry(0.80, 20, 20);
    const ball = new THREE.Mesh(ballGeo, this.soccerBallMat);
    ball.position.y = 0.80;
    ball.castShadow = true;
    group.add(ball);

    this.scene.add(group);

    this.obstacles.push({
      id: 'obs-' + Math.random().toString(36).substring(2, 9),
      type: 'rolling_ball',
      lane,
      position: group.position,
      bounds: {
        minX: x - 0.82,
        maxX: x + 0.82,
        minY: 0,
        maxY: 1.60,
        minZ: z - 0.82,
        maxZ: z + 0.82,
      },
      group,
      speedZ: 11.5,
      canJumpOver: true,
      canSlideUnder: false,
      active: true,
      meshProps: { ballMesh: ball },
    });
  }

  /**
   * 5. Goalie Training Dummy / Stadium Hurdle
   */
  private spawnGoalieDummy(lane: number, z: number) {
    const group = new THREE.Group();
    const x = this.laneX[lane + 1];
    group.position.set(x, 0, z);

    // Hurdle Frame
    const frameGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8);
    const postL = new THREE.Mesh(frameGeo, this.metalSteelMat);
    postL.position.set(-0.85, 0.525, 0);
    const postR = new THREE.Mesh(frameGeo, this.metalSteelMat);
    postR.position.set(0.85, 0.525, 0);

    const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.hazardStripesMat);
    crossBar.position.set(0, 0.95, 0);
    crossBar.rotation.z = Math.PI / 2;

    group.add(postL, postR, crossBar);
    this.scene.add(group);

    this.obstacles.push({
      id: 'obs-' + Math.random().toString(36).substring(2, 9),
      type: 'goalie_dummy',
      lane,
      position: group.position,
      bounds: {
        minX: x - 0.95,
        maxX: x + 0.95,
        minY: 0,
        maxY: 1.05,
        minZ: z - 0.35,
        maxZ: z + 0.35,
      },
      group,
      speedZ: 0,
      canJumpOver: true,
      canSlideUnder: false,
      active: true,
    });
  }

  public checkCollision(
    playerX: number,
    playerY: number,
    playerZ: number,
    isSliding: boolean,
    hasShield: boolean
  ): { collided: boolean; obstacleHit?: Obstacle; shieldPopped?: boolean } {
    const playerRadiusX = 0.40;
    const playerHeight = isSliding ? 0.60 : 1.75;
    const playerMinY = playerY;
    const playerMaxY = playerY + playerHeight;
    const playerMinZ = playerZ - 0.35;
    const playerMaxZ = playerZ + 0.35;

    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      if (playerMaxZ >= obs.bounds.minZ && playerMinZ <= obs.bounds.maxZ) {
        if (playerX + playerRadiusX >= obs.bounds.minX && playerX - playerRadiusX <= obs.bounds.maxX) {
          const overlapsY = playerMinY < obs.bounds.maxY && playerMaxY > obs.bounds.minY;

          if (overlapsY) {
            if (hasShield) {
              obs.active = false;
              this.scene.remove(obs.group);
              return { collided: false, obstacleHit: obs, shieldPopped: true };
            }
            return { collided: true, obstacleHit: obs };
          }
        }
      }
    }

    return { collided: false };
  }

  public checkNearMiss(
    playerX: number,
    playerY: number,
    playerZ: number,
    isSliding: boolean
  ): { nearMiss: boolean; obstacle?: Obstacle; bonus: number } {
    const playerRadiusX = 0.40;
    const playerHeight = isSliding ? 0.60 : 1.75;
    const playerMinY = playerY;
    const playerMaxY = playerY + playerHeight;

    for (const obs of this.obstacles) {
      if (!obs.active || obs.nearMissAwarded) continue;

      // Obstacle is aligned or right next to player along Z (passed or passing within ±1.2m)
      const inZRange = playerZ >= obs.bounds.minZ - 1.2 && playerZ <= obs.bounds.maxZ + 1.2;
      if (!inZRange) continue;

      // Lateral distance to closest edge
      const lateralDist = Math.max(
        0,
        Math.min(
          Math.abs((playerX + playerRadiusX) - obs.bounds.minX),
          Math.abs((playerX - playerRadiusX) - obs.bounds.maxX)
        )
      );

      // 1. Lateral near-miss: dodged right past the edge within 0.05m to 0.70m
      const isLateralNearMiss =
        lateralDist > 0.05 &&
        lateralDist < 0.70 &&
        playerMinY < obs.bounds.maxY &&
        playerMaxY > obs.bounds.minY;

      // 2. Jump near-miss: jumped cleanly over barrier with small clearance margin (< 0.45m)
      const isJumpNearMiss =
        obs.canJumpOver &&
        playerMinY >= obs.bounds.maxY &&
        playerMinY <= obs.bounds.maxY + 0.45 &&
        Math.abs(playerX - obs.position.x) < 1.0;

      // 3. Slide near-miss: slid cleanly under sign with < 0.35m clearance
      const isSlideNearMiss =
        obs.canSlideUnder &&
        isSliding &&
        playerMaxY <= obs.bounds.minY &&
        playerMaxY >= obs.bounds.minY - 0.35 &&
        Math.abs(playerX - obs.position.x) < 1.0;

      if (isLateralNearMiss || isJumpNearMiss || isSlideNearMiss) {
        obs.nearMissAwarded = true;
        return { nearMiss: true, obstacle: obs, bonus: 250 };
      }
    }

    return { nearMiss: false, bonus: 0 };
  }
}
