import * as THREE from 'three';
import { TrailItem } from '../types/game';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class ParticleSystem {
  public scene: THREE.Scene;
  private particles: Particle[] = [];
  private maxParticles: number = 300;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  public emitDust(pos: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.35,
          pos.y + 0.05,
          pos.z + 0.25
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.5 + 0.1,
          Math.random() * 1.8
        ),
        color: new THREE.Color(0.85, 0.85, 0.85),
        size: 0.24,
        life: 0,
        maxLife: 0.35,
        alpha: 0.7,
      });
    }
  }

  public emitLandingShockwave(pos: THREE.Vector3) {
    // Radial dust ring on jump landing
    const count = 16;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = (i / count) * Math.PI * 2;
      const speed = 2.4 + Math.random() * 1.2;

      this.particles.push({
        position: new THREE.Vector3(pos.x, 0.05, pos.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 0.4 + 0.2,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(0.9, 0.9, 0.9),
        size: 0.3,
        life: 0,
        maxLife: 0.45,
        alpha: 0.8,
      });
    }
  }

  public emitTrail(pos: THREE.Vector3, trailItem?: TrailItem, isSprint: boolean = false) {
    const count = isSprint ? 5 : 2;
    const baseColor = trailItem ? trailItem.particleColor : '#00f5d4';

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const c = new THREE.Color(baseColor);
      if (isSprint) {
        c.set('#ff0055');
      }

      this.particles.push({
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.4,
          pos.y + 0.2 + Math.random() * 0.6,
          pos.z + 0.2 + Math.random() * 0.4
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.0,
          Math.random() * 0.8,
          Math.random() * 2.5 + 1.0
        ),
        color: c,
        size: isSprint ? 0.35 : 0.22,
        life: 0,
        maxLife: isSprint ? 0.6 : 0.4,
        alpha: 0.9,
      });
    }
  }

  public emitCoinSparkles(pos: THREE.Vector3) {
    for (let i = 0; i < 12; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.0;

      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 3.0 + 1.0,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color('#ffd700'),
        size: 0.3,
        life: 0,
        maxLife: 0.5,
        alpha: 1.0,
      });
    }
  }

  public emitCollisionExplosion(pos: THREE.Vector3) {
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const speed = 4.0 + Math.random() * 6.0;

      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          Math.random() * speed + 2,
          (Math.random() - 0.5) * speed
        ),
        color: Math.random() > 0.5 ? new THREE.Color('#ff3b30') : new THREE.Color('#ffcc00'),
        size: 0.4,
        life: 0,
        maxLife: 0.7,
        alpha: 1.0,
      });
    }
  }

  public emitCelebrationConfetti(pos: THREE.Vector3) {
    const confettiColors = ['#ffd700', '#00f5d4', '#ff0055', '#7b2cbf', '#ffffff', '#22c55e'];
    for (let i = 0; i < 50; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 5.0;

      this.particles.push({
        position: pos.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * 5.0 + 3.0,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(confettiColors[Math.floor(Math.random() * confettiColors.length)]),
        size: 0.35,
        life: 0,
        maxLife: 1.2,
        alpha: 1.0,
      });
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // Gravity
      p.alpha = 1.0 - p.life / p.maxLife;
    }

    // Update GPU buffers
    let pIdx = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      this.positions[pIdx] = p.position.x;
      this.positions[pIdx + 1] = p.position.y;
      this.positions[pIdx + 2] = p.position.z;

      this.colors[pIdx] = p.color.r * p.alpha;
      this.colors[pIdx + 1] = p.color.g * p.alpha;
      this.colors[pIdx + 2] = p.color.b * p.alpha;

      pIdx += 3;
    }

    // Zero out unused
    for (let i = pIdx; i < this.maxParticles * 3; i++) {
      this.positions[i] = 0;
      this.colors[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public reset() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles * 3; i++) {
      this.positions[i] = 0;
      this.colors[i] = 0;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }
}
