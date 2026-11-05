import * as THREE from 'three';
import { PowerUpType } from '../types/game';

export interface CollectibleItem {
  id: string;
  type: 'coin' | 'football' | PowerUpType;
  position: THREE.Vector3;
  group: THREE.Group;
  active: boolean;
  isPowerUp: boolean;
  value: number;
}

export class CollectibleManager {
  public scene: THREE.Scene;
  public items: CollectibleItem[] = [];

  private laneX = [-2.6, 0, 2.6];
  private nextSpawnZ = -15;

  // Shared Geometries & Materials
  private coinGeo: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;

  private ballGeo: THREE.SphereGeometry;
  private ballMat: THREE.MeshStandardMaterial;

  private powerUpMaterials: Record<PowerUpType, THREE.MeshStandardMaterial>;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      metalness: 0.85,
      roughness: 0.2,
      emissive: '#ffd700',
      emissiveIntensity: 0.25,
    });

    this.ballGeo = new THREE.SphereGeometry(0.38, 12, 12);
    this.ballMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      metalness: 0.5,
      roughness: 0.3,
      emissive: '#fbbf24',
      emissiveIntensity: 0.4,
    });

    this.powerUpMaterials = {
      magnet: new THREE.MeshStandardMaterial({ color: '#ec4899', emissive: '#ec4899', emissiveIntensity: 0.6 }),
      speed_boost: new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#f59e0b', emissiveIntensity: 0.7 }),
      shield: new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 0.7 }),
      score_multiplier: new THREE.MeshStandardMaterial({ color: '#8b5cf6', emissive: '#8b5cf6', emissiveIntensity: 0.7 }),
      coin_boost: new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 0.7 }),
      super_jump: new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#f97316', emissiveIntensity: 0.7 }),
    };
  }

  public reset() {
    this.items.forEach((item) => {
      this.scene.remove(item.group);
    });
    this.items = [];
    this.nextSpawnZ = -15;
  }

  public update(delta: number, playerX: number, playerY: number, playerZ: number, isMagnetActive: boolean) {
    // 1. Animate items (rotate & bob)
    this.items.forEach((item) => {
      if (!item.active) return;
      item.group.rotation.y += delta * 3.5;

      // Magnetic attraction to player if magnet is active and item is a coin
      if (isMagnetActive && item.type === 'coin') {
        const dist = item.position.distanceTo(new THREE.Vector3(playerX, playerY + 0.8, playerZ));
        if (dist < 12) {
          item.position.x = THREE.MathUtils.lerp(item.position.x, playerX, delta * 8);
          item.position.y = THREE.MathUtils.lerp(item.position.y, playerY + 0.8, delta * 8);
          item.position.z = THREE.MathUtils.lerp(item.position.z, playerZ, delta * 12);
        }
      }
    });

    // 2. Despawn old items behind player (+Z)
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.position.z > playerZ + 14 || !item.active) {
        this.scene.remove(item.group);
        this.items.splice(i, 1);
      }
    }

    // 3. Spawn ahead of player in -Z direction
    while (this.nextSpawnZ > playerZ - 210) {
      this.spawnCollectibleBatch(this.nextSpawnZ);
      this.nextSpawnZ -= (18 + Math.random() * 8);
    }
  }

  private spawnCollectibleBatch(z: number) {
    const lane = Math.floor(Math.random() * 3) - 1;
    const x = this.laneX[lane + 1];

    const roll = Math.random();
    if (roll < 0.6) {
      // Line of 4-6 coins extending forward in -Z
      const count = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        this.spawnItem('coin', x, 0.75, z - i * 2.2);
      }
    } else if (roll < 0.78) {
      // Golden Football!
      this.spawnItem('football', x, 0.9, z);
    } else {
      // Power-Up Token!
      const powerUpTypes: PowerUpType[] = ['magnet', 'speed_boost', 'shield', 'score_multiplier', 'coin_boost', 'super_jump'];
      const chosen = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      this.spawnPowerUp(chosen, x, 1.2, z);
    }
  }

  private spawnItem(type: 'coin' | 'football', x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    if (type === 'coin') {
      // 3D Embossed Gold Coin with Rim
      const coin = new THREE.Mesh(this.coinGeo, this.coinMat);
      coin.rotation.x = Math.PI / 2;
      coin.castShadow = true;
      group.add(coin);

      // Outer golden rim
      const rimGeo = new THREE.TorusGeometry(0.36, 0.04, 8, 16);
      const rim = new THREE.Mesh(rimGeo, this.coinMat);
      rim.rotation.x = Math.PI / 2;
      group.add(rim);

      // Star emblem in center
      const starGeo = new THREE.ConeGeometry(0.12, 0.08, 5);
      const star = new THREE.Mesh(starGeo, this.coinMat);
      star.position.set(0, 0, 0.045);
      group.add(star);
    } else {
      // Golden Football with orbiting star ring
      const mesh = new THREE.Mesh(this.ballGeo, this.ballMat);
      mesh.castShadow = true;
      group.add(mesh);

      const ringGeo = new THREE.TorusGeometry(0.58, 0.035, 8, 20);
      const ringMat = new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#ffd700',
        emissiveIntensity: 0.6,
        metalness: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.5;
      group.add(ring);
    }

    this.scene.add(group);

    this.items.push({
      id: 'item-' + Math.random().toString(36).substring(2, 9),
      type,
      position: group.position,
      group,
      active: true,
      isPowerUp: false,
      value: type === 'coin' ? 1 : 10,
    });
  }

  private spawnPowerUp(type: PowerUpType, x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const mat = this.powerUpMaterials[type];

    // High quality floating faceted jewel with dynamic glowing halo
    const gemGeo = new THREE.OctahedronGeometry(0.55, 1);
    const gem = new THREE.Mesh(gemGeo, mat);
    gem.castShadow = true;
    group.add(gem);

    // Dynamic glowing orbit ring
    const haloGeo = new THREE.TorusGeometry(0.8, 0.045, 8, 24);
    const halo = new THREE.Mesh(haloGeo, mat);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    this.scene.add(group);

    this.items.push({
      id: 'pow-' + Math.random().toString(36).substring(2, 9),
      type,
      position: group.position,
      group,
      active: true,
      isPowerUp: true,
      value: 0,
    });
  }

  public checkCollection(
    playerX: number,
    playerY: number,
    playerZ: number,
    pickupRadius: number = 1.2
  ): CollectibleItem[] {
    const collected: CollectibleItem[] = [];

    for (const item of this.items) {
      if (!item.active) continue;

      const dx = playerX - item.position.x;
      const dy = (playerY + 0.8) - item.position.y;
      const dz = playerZ - item.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= pickupRadius * pickupRadius) {
        item.active = false;
        this.scene.remove(item.group);
        collected.push(item);
      }
    }

    return collected;
  }
}
