import * as THREE from 'three';
import { CharacterSkin, SneakerItem, AccessoryItem } from '../types/game';

export type CharacterAnimState = 
  | 'idle' 
  | 'running' 
  | 'sprinting' 
  | 'jumping' 
  | 'landing' 
  | 'sliding' 
  | 'turn_left' 
  | 'turn_right' 
  | 'collision' 
  | 'stumble' 
  | 'recovery' 
  | 'celebrating' 
  | 'defeat';

/**
 * Ultra-Realistic Next-Gen Athletic Runner 3D Model & Biomechanical Kinematic Rig
 * Features sculpted anatomical musculature (quads, teardrop vastus, calves, lats, deltoids, pecs),
 * realistic facial structure with organic contours, 5-finger hands, high-performance running cleats,
 * breathable technical fabric jersey, and true sprint kinematics with thoracic counter-rotation.
 */
export class CharacterModel {
  public group: THREE.Group;

  // Kinetic Rig Hierarchy
  public rootJoint: THREE.Group;
  public pelvis: THREE.Group;
  public spineLumbar: THREE.Group;
  public spineThoracic: THREE.Group;
  public chest: THREE.Group;
  public neck: THREE.Group;
  public head: THREE.Group;

  // Head & Realistic Face
  public faceGroup: THREE.Group;
  public headMesh!: THREE.Mesh;
  public faceDecalMesh!: THREE.Mesh;
  public jaw: THREE.Group;
  public mouthMesh!: THREE.Mesh;
  public leftEar!: THREE.Group;
  public rightEar!: THREE.Group;
  public hairGroup: THREE.Group;
  private dreadlocks: { mesh: THREE.Mesh; baseAngle: number; restPos: THREE.Vector3 }[] = [];

  // Left Arm & Anatomical 5-Finger Hand
  public leftClavicle: THREE.Group;
  public leftShoulder: THREE.Group;
  public leftDeltoidMesh!: THREE.Mesh;
  public leftUpperArmMesh!: THREE.Mesh;
  public leftElbow: THREE.Group;
  public leftForearmMesh!: THREE.Mesh;
  public leftWrist: THREE.Group;
  public leftHand!: THREE.Group;

  // Right Arm & Anatomical 5-Finger Hand
  public rightClavicle: THREE.Group;
  public rightShoulder: THREE.Group;
  public rightDeltoidMesh!: THREE.Mesh;
  public rightUpperArmMesh!: THREE.Mesh;
  public rightElbow: THREE.Group;
  public rightForearmMesh!: THREE.Mesh;
  public rightWrist: THREE.Group;
  public rightHand!: THREE.Group;

  // Left Sprinter Leg & Pro Cleat
  public leftHip: THREE.Group;
  public leftThighMesh!: THREE.Mesh;
  public leftKnee: THREE.Group;
  public leftPatellaMesh!: THREE.Mesh;
  public leftCalfMesh!: THREE.Mesh;
  public leftSockMesh!: THREE.Mesh;
  public leftAnkle: THREE.Group;
  public leftFoot: THREE.Group;
  public leftShoeUpper!: THREE.Mesh;
  public leftShoeSole!: THREE.Mesh;

  // Right Sprinter Leg & Pro Cleat
  public rightHip: THREE.Group;
  public rightThighMesh!: THREE.Mesh;
  public rightKnee: THREE.Group;
  public rightPatellaMesh!: THREE.Mesh;
  public rightCalfMesh!: THREE.Mesh;
  public rightSockMesh!: THREE.Mesh;
  public rightAnkle: THREE.Group;
  public rightFoot: THREE.Group;
  public rightShoeUpper!: THREE.Mesh;
  public rightShoeSole!: THREE.Mesh;

  // Realistic Apparel & High-Detail Decals
  public jerseyMesh!: THREE.Mesh;
  public jerseyCollarMesh!: THREE.Mesh;
  public shortsMesh!: THREE.Mesh;
  public shortsTrimL!: THREE.Mesh;
  public shortsTrimR!: THREE.Mesh;
  public numberDecalBack!: THREE.Mesh;
  public numberDecalFront!: THREE.Mesh;
  public crestDecal!: THREE.Mesh;

  // Accessories
  public headsetGroup!: THREE.Group;
  public chainGroup!: THREE.Group;
  public shadesGroup!: THREE.Group;
  public crownGroup!: THREE.Group;

  // Power-Up Auras & Ground Contact Shadow
  public shieldMesh!: THREE.Mesh;
  public magnetAura!: THREE.Mesh;
  public shadowMesh!: THREE.Mesh;
  private shadowMat!: THREE.MeshBasicMaterial;

  // High-End PBR Materials
  private skinMat!: THREE.MeshStandardMaterial;
  private jerseyMat!: THREE.MeshStandardMaterial;
  private shortsMat!: THREE.MeshStandardMaterial;
  private hairMat!: THREE.MeshStandardMaterial;
  private shoeUpperMat!: THREE.MeshStandardMaterial;
  private shoeSoleMat!: THREE.MeshStandardMaterial;
  private goldMat!: THREE.MeshStandardMaterial;
  private socksMat!: THREE.MeshStandardMaterial;

  // Procedural Canvas Textures
  private faceTexture!: THREE.CanvasTexture;
  private jerseyFabricTexture!: THREE.CanvasTexture;
  private sneakerKnitTexture!: THREE.CanvasTexture;

  // State & Animation Timing
  public currentState: CharacterAnimState = 'idle';
  private animTime: number = 0;
  private stateTimer: number = 0;
  public bankRoll: number = 0;
  public landingTimer: number = 0;

  // Biomechanical Locomotion Variables
  private stridePhase: number = 0;
  private currentForwardTilt: number = -0.16;
  private targetForwardTilt: number = -0.16;

  constructor() {
    this.group = new THREE.Group();

    // 1. Initialize High-Fidelity Textures & PBR Materials
    this.initProceduralTextures();
    this.initPBRMaterials();

    // 2. Build Root & Pelvic Core (~1.80m tall athletic build)
    this.rootJoint = new THREE.Group();
    this.group.add(this.rootJoint);

    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.98;
    this.rootJoint.add(this.pelvis);

    this.buildPelvisAndShorts();

    // 3. Spinal Articulation (Lumbar -> Thoracic -> Chest)
    this.spineLumbar = new THREE.Group();
    this.spineLumbar.position.y = 0.10;
    this.pelvis.add(this.spineLumbar);

    this.spineThoracic = new THREE.Group();
    this.spineThoracic.position.y = 0.14;
    this.spineLumbar.add(this.spineThoracic);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.13;
    this.spineThoracic.add(this.chest);

    this.buildAthleticTorso();

    // 4. Neck & Sculpted Organic Head
    this.neck = new THREE.Group();
    this.neck.position.y = 0.28;
    this.chest.add(this.neck);

    this.head = new THREE.Group();
    this.head.position.y = 0.13;
    this.neck.add(this.head);

    this.faceGroup = new THREE.Group();
    this.head.add(this.faceGroup);

    this.jaw = new THREE.Group();
    this.faceGroup.add(this.jaw);

    this.hairGroup = new THREE.Group();
    this.head.add(this.hairGroup);

    this.buildRealisticHeadAndFace();
    this.buildRealisticHairstyle();

    // 5. Left Arm Chain (Clavicle -> Shoulder -> Bicep -> Elbow -> Forearm -> Wrist -> 5-Finger Hand)
    this.leftClavicle = new THREE.Group();
    this.leftClavicle.position.set(-0.16, 0.22, 0);
    this.chest.add(this.leftClavicle);

    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.12, 0, 0);
    this.leftClavicle.add(this.leftShoulder);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.27, 0);
    this.leftShoulder.add(this.leftElbow);

    this.leftWrist = new THREE.Group();
    this.leftWrist.position.set(0, -0.26, 0);
    this.leftElbow.add(this.leftWrist);

    this.buildArm(true);

    // 6. Right Arm Chain
    this.rightClavicle = new THREE.Group();
    this.rightClavicle.position.set(0.16, 0.22, 0);
    this.chest.add(this.rightClavicle);

    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.12, 0, 0);
    this.rightClavicle.add(this.rightShoulder);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.27, 0);
    this.rightShoulder.add(this.rightElbow);

    this.rightWrist = new THREE.Group();
    this.rightWrist.position.set(0, -0.26, 0);
    this.rightElbow.add(this.rightWrist);

    this.buildArm(false);

    // 7. Left Sprinter Leg (Hip -> Quad/Hamstring -> Knee/Patella -> Calf/Shin -> Sock -> Cleat)
    this.leftHip = new THREE.Group();
    this.leftHip.position.set(-0.14, -0.09, 0);
    this.pelvis.add(this.leftHip);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.44, 0);
    this.leftHip.add(this.leftKnee);

    this.leftAnkle = new THREE.Group();
    this.leftAnkle.position.set(0, -0.42, 0);
    this.leftKnee.add(this.leftAnkle);

    this.leftFoot = new THREE.Group();
    this.leftAnkle.add(this.leftFoot);

    this.buildLeg(true);

    // 8. Right Sprinter Leg
    this.rightHip = new THREE.Group();
    this.rightHip.position.set(0.14, -0.09, 0);
    this.pelvis.add(this.rightHip);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.44, 0);
    this.rightHip.add(this.rightKnee);

    this.rightAnkle = new THREE.Group();
    this.rightAnkle.position.set(0, -0.42, 0);
    this.rightKnee.add(this.rightAnkle);

    this.rightFoot = new THREE.Group();
    this.rightAnkle.add(this.rightFoot);

    this.buildLeg(false);

    // 9. Accessories & Props
    this.buildAccessories();

    // 10. Power-Up Auras & Shields
    this.buildPowerUpAuras();

    // 11. Soft Ground Occlusion Shadow
    this.buildContactShadow();
  }

  // ==========================================
  // PROCEDURAL TEXTURES & PBR MATERIALS
  // ==========================================

  private initProceduralTextures() {
    // 1. High-Detail Realistic Face Texture (Canvas 512x512)
    // Includes warm skin tones, lifelike eyes with pupils and corneal reflection,
    // tapered athletic eyebrows, shaded nose contours, sculpted lips, and clean edge-up fade.
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 512;
    fCanvas.height = 512;
    const fCtx = fCanvas.getContext('2d')!;

    // Base Warm Athletic Skin Undertone
    const skinGrad = fCtx.createLinearGradient(0, 0, 0, 512);
    skinGrad.addColorStop(0, '#5a3825'); // Forehead
    skinGrad.addColorStop(0.35, '#68422d'); // Eye & Cheek zone
    skinGrad.addColorStop(0.7, '#623e2a'); // Mouth & Chin
    skinGrad.addColorStop(1, '#50311f'); // Neck
    fCtx.fillStyle = skinGrad;
    fCtx.fillRect(0, 0, 512, 512);

    // Subtle Cheek Warmth & Highlight Sheen
    const cheekGradL = fCtx.createRadialGradient(160, 260, 10, 160, 260, 90);
    cheekGradL.addColorStop(0, 'rgba(145, 65, 45, 0.35)');
    cheekGradL.addColorStop(1, 'rgba(100, 60, 40, 0)');
    fCtx.fillStyle = cheekGradL;
    fCtx.fillRect(70, 170, 180, 180);

    const cheekGradR = fCtx.createRadialGradient(352, 260, 10, 352, 260, 90);
    cheekGradR.addColorStop(0, 'rgba(145, 65, 45, 0.35)');
    cheekGradR.addColorStop(1, 'rgba(100, 60, 40, 0)');
    fCtx.fillStyle = cheekGradR;
    fCtx.fillRect(262, 170, 180, 180);

    // Temple & Hairline Clean Fade Edge-Up
    fCtx.fillStyle = '#1e140d';
    fCtx.beginPath();
    fCtx.moveTo(70, 0);
    fCtx.lineTo(442, 0);
    fCtx.lineTo(430, 90);
    fCtx.bezierCurveTo(390, 80, 310, 85, 256, 85);
    fCtx.bezierCurveTo(202, 85, 122, 80, 82, 90);
    fCtx.closePath();
    fCtx.fill();

    // Sculpted Athletic Eyebrows
    fCtx.fillStyle = '#140d08';
    // Left eyebrow
    fCtx.beginPath();
    fCtx.moveTo(130, 180);
    fCtx.quadraticCurveTo(180, 160, 225, 178);
    fCtx.quadraticCurveTo(180, 170, 130, 184);
    fCtx.fill();
    // Right eyebrow
    fCtx.beginPath();
    fCtx.moveTo(287, 178);
    fCtx.quadraticCurveTo(332, 160, 382, 180);
    fCtx.quadraticCurveTo(332, 170, 287, 184);
    fCtx.fill();

    // Lifelike Eyes (Sclera + Limbal Ring + Hazel-Brown Iris + Pupil + Catchlight)
    const drawEye = (cx: number, cy: number) => {
      // Sclera (White with slight warm shadow)
      fCtx.save();
      fCtx.beginPath();
      fCtx.ellipse(cx, cy, 38, 20, 0, 0, Math.PI * 2);
      fCtx.clip();

      const eyeGrad = fCtx.createLinearGradient(cx, cy - 20, cx, cy + 20);
      eyeGrad.addColorStop(0, '#e2e8f0');
      eyeGrad.addColorStop(0.3, '#f8fafc');
      eyeGrad.addColorStop(1, '#cbd5e1');
      fCtx.fillStyle = eyeGrad;
      fCtx.fillRect(cx - 40, cy - 22, 80, 44);

      // Limbal Ring (Dark rim)
      fCtx.fillStyle = '#18100a';
      fCtx.beginPath();
      fCtx.arc(cx, cy, 21, 0, Math.PI * 2);
      fCtx.fill();

      // Iris (Warm Hazel-Amber texture)
      const irisGrad = fCtx.createRadialGradient(cx, cy, 3, cx, cy, 20);
      irisGrad.addColorStop(0, '#78350f');
      irisGrad.addColorStop(0.6, '#92400e');
      irisGrad.addColorStop(1, '#451a03');
      fCtx.fillStyle = irisGrad;
      fCtx.beginPath();
      fCtx.arc(cx, cy, 19, 0, Math.PI * 2);
      fCtx.fill();

      // Pupil (Deep black)
      fCtx.fillStyle = '#0a0a0a';
      fCtx.beginPath();
      fCtx.arc(cx, cy, 9, 0, Math.PI * 2);
      fCtx.fill();

      // Crisp Specular Catchlight (Eye sparkle)
      fCtx.fillStyle = '#ffffff';
      fCtx.beginPath();
      fCtx.arc(cx - 5, cy - 5, 3.5, 0, Math.PI * 2);
      fCtx.fill();
      fCtx.beginPath();
      fCtx.arc(cx + 4, cy + 3, 1.8, 0, Math.PI * 2);
      fCtx.fill();

      fCtx.restore();

      // Eyelid crease & dark upper lash line
      fCtx.strokeStyle = '#22140c';
      fCtx.lineWidth = 3.5;
      fCtx.beginPath();
      fCtx.ellipse(cx, cy, 38, 20, 0, Math.PI * 1.05, Math.PI * 1.95);
      fCtx.stroke();
    };

    drawEye(182, 210);
    drawEye(330, 210);

    // Shaded Nasal Bridge & Athletic Nostrils
    fCtx.fillStyle = 'rgba(45, 25, 15, 0.45)';
    fCtx.beginPath();
    // Left nostril wing
    fCtx.arc(238, 305, 9, 0, Math.PI * 2);
    // Right nostril wing
    fCtx.arc(274, 305, 9, 0, Math.PI * 2);
    fCtx.fill();

    // Nose tip highlight
    const noseTipGrad = fCtx.createRadialGradient(256, 292, 2, 256, 292, 16);
    noseTipGrad.addColorStop(0, 'rgba(255, 230, 210, 0.28)');
    noseTipGrad.addColorStop(1, 'rgba(255, 230, 210, 0)');
    fCtx.fillStyle = noseTipGrad;
    fCtx.fillRect(236, 272, 40, 40);

    // Realistic Sculpted Lips & Confident Athletic Smile
    // Upper lip
    fCtx.fillStyle = '#4a251b';
    fCtx.beginPath();
    fCtx.moveTo(205, 365);
    fCtx.quadraticCurveTo(238, 352, 256, 356);
    fCtx.quadraticCurveTo(274, 352, 307, 365);
    fCtx.quadraticCurveTo(256, 362, 205, 365);
    fCtx.fill();

    // Clean white teeth opening
    fCtx.fillStyle = '#f8fafc';
    fCtx.beginPath();
    fCtx.ellipse(256, 372, 36, 8, 0, 0, Math.PI);
    fCtx.fill();

    // Subtle tooth separator lines
    fCtx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    fCtx.lineWidth = 1.2;
    [-18, -9, 0, 9, 18].forEach((x) => {
      fCtx.beginPath();
      fCtx.moveTo(256 + x, 368);
      fCtx.lineTo(256 + x, 376);
      fCtx.stroke();
    });

    // Full athletic lower lip
    const lowerLipGrad = fCtx.createLinearGradient(256, 372, 256, 400);
    lowerLipGrad.addColorStop(0, '#753b2d');
    lowerLipGrad.addColorStop(0.5, '#8c4636');
    lowerLipGrad.addColorStop(1, '#4a251b');
    fCtx.fillStyle = lowerLipGrad;
    fCtx.beginPath();
    fCtx.moveTo(206, 368);
    fCtx.quadraticCurveTo(256, 406, 306, 368);
    fCtx.quadraticCurveTo(256, 378, 206, 368);
    fCtx.fill();

    // Chin crease & definition
    fCtx.strokeStyle = 'rgba(50, 28, 16, 0.4)';
    fCtx.lineWidth = 3;
    fCtx.beginPath();
    fCtx.arc(256, 428, 24, 0.2, Math.PI - 0.2);
    fCtx.stroke();

    this.faceTexture = new THREE.CanvasTexture(fCanvas);
    this.faceTexture.colorSpace = THREE.SRGBColorSpace;

    // 2. Technical Breathable Mesh Jersey Fabric Texture (1024x1024)
    const jCanvas = document.createElement('canvas');
    jCanvas.width = 512;
    jCanvas.height = 512;
    const jCtx = jCanvas.getContext('2d')!;
    jCtx.fillStyle = '#ffffff';
    jCtx.fillRect(0, 0, 512, 512);

    // Micro-perforated athletic mesh dots
    jCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < 512; y += 8) {
      for (let x = 0; x < 512; x += 8) {
        const offset = (y % 16 === 0) ? 4 : 0;
        jCtx.beginPath();
        jCtx.arc(x + offset, y, 1.8, 0, Math.PI * 2);
        jCtx.fill();
      }
    }
    this.jerseyFabricTexture = new THREE.CanvasTexture(jCanvas);
    this.jerseyFabricTexture.wrapS = THREE.RepeatWrapping;
    this.jerseyFabricTexture.wrapT = THREE.RepeatWrapping;
    this.jerseyFabricTexture.repeat.set(4, 4);

    // 3. Engineered Flyknit Running Cleat Texture
    const kCanvas = document.createElement('canvas');
    kCanvas.width = 256;
    kCanvas.height = 256;
    const kCtx = kCanvas.getContext('2d')!;
    kCtx.fillStyle = '#ffffff';
    kCtx.fillRect(0, 0, 256, 256);
    kCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < 256; y += 4) {
      kCtx.fillRect(0, y, 256, 1.5);
    }
    this.sneakerKnitTexture = new THREE.CanvasTexture(kCanvas);
    this.sneakerKnitTexture.wrapS = THREE.RepeatWrapping;
    this.sneakerKnitTexture.wrapT = THREE.RepeatWrapping;
    this.sneakerKnitTexture.repeat.set(3, 3);
  }

  private initPBRMaterials() {
    // Realistic Sub-Dermal Athletic Skin
    this.skinMat = new THREE.MeshStandardMaterial({
      color: '#65412b',
      roughness: 0.44,
      metalness: 0.04,
    });

    // Technical Micro-Mesh Athletic Jersey
    this.jerseyMat = new THREE.MeshStandardMaterial({
      color: '#d90429',
      roughness: 0.52,
      metalness: 0.12,
      bumpMap: this.jerseyFabricTexture,
      bumpScale: 0.008,
    });

    // Compression Tailored Shorts
    this.shortsMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.50,
      metalness: 0.10,
    });

    // Micro-Fiber Braided Hair Material
    this.hairMat = new THREE.MeshStandardMaterial({
      color: '#100e0d',
      roughness: 0.82,
      metalness: 0.15,
    });

    // Aerodynamic Engineered Running Cleat Upper
    this.shoeUpperMat = new THREE.MeshStandardMaterial({
      color: '#ef233c',
      roughness: 0.35,
      metalness: 0.22,
      bumpMap: this.sneakerKnitTexture,
      bumpScale: 0.012,
    });

    // Multi-Density Foam Sole with Translucent Air Cushion Core
    this.shoeSoleMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.28,
      metalness: 0.15,
      emissive: '#00f5d4',
      emissiveIntensity: 0.4,
    });

    // Metallic Champion Gold Trim
    this.goldMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      metalness: 0.94,
      roughness: 0.18,
    });

    // Ribbed Compression Socks
    this.socksMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.65,
      metalness: 0.05,
    });
  }

  // ==========================================
  // BODY PART BUILDERS (ANATOMICAL ACCURACY)
  // ==========================================

  private buildPelvisAndShorts() {
    // 1. Anatomical Pelvis Core (Hips & Glutes)
    const pelvisGeo = new THREE.CylinderGeometry(0.20, 0.17, 0.20, 20);
    pelvisGeo.scale(1.18, 1.0, 0.88);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, this.skinMat);
    pelvisMesh.position.y = -0.02;
    this.pelvis.add(pelvisMesh);

    // 2. Athletic Compression Shorts (Tailored leg openings & realistic waistband)
    const shortsGeo = new THREE.CylinderGeometry(0.22, 0.235, 0.26, 24);
    shortsGeo.scale(1.19, 1.0, 0.90);
    this.shortsMesh = new THREE.Mesh(shortsGeo, this.shortsMat);
    this.shortsMesh.position.y = -0.05;
    this.shortsMesh.castShadow = true;
    this.shortsMesh.receiveShadow = true;
    this.pelvis.add(this.shortsMesh);

    // Left and Right Ergonomic Leg Cutouts
    [-0.11, 0.11].forEach((xOff, i) => {
      const legHemGeo = new THREE.CylinderGeometry(0.125, 0.13, 0.12, 18);
      const legHem = new THREE.Mesh(legHemGeo, this.shortsMat);
      legHem.position.set(xOff, -0.16, 0);
      legHem.castShadow = true;
      this.pelvis.add(legHem);

      // Gold / Cyan Aerodynamic Speed Piping
      const trimGeo = new THREE.BoxGeometry(0.014, 0.24, 0.035);
      const trim = new THREE.Mesh(trimGeo, this.goldMat);
      trim.position.set(i === 0 ? -0.245 : 0.245, -0.06, 0);
      if (i === 0) this.shortsTrimL = trim;
      else this.shortsTrimR = trim;
      this.pelvis.add(trim);
    });
  }

  private buildAthleticTorso() {
    // 1. Athletic V-Taper Torso (Broad Pectorals, Latissimus Dorsi, Trim Waist)
    const chestGeo = new THREE.CylinderGeometry(0.255, 0.185, 0.40, 24);
    chestGeo.scale(1.24, 1.0, 0.82);
    this.jerseyMesh = new THREE.Mesh(chestGeo, this.jerseyMat);
    this.jerseyMesh.position.y = 0.08;
    this.jerseyMesh.castShadow = true;
    this.jerseyMesh.receiveShadow = true;
    this.chest.add(this.jerseyMesh);

    // Sculpted Pectoral Muscle Contours
    const pecGeo = new THREE.SphereGeometry(0.11, 16, 12);
    pecGeo.scale(1.3, 0.9, 0.55);
    const leftPec = new THREE.Mesh(pecGeo, this.jerseyMat);
    leftPec.position.set(-0.11, 0.16, -0.11);
    const rightPec = new THREE.Mesh(pecGeo, this.jerseyMat);
    rightPec.position.set(0.11, 0.16, -0.11);
    this.chest.add(leftPec, rightPec);

    // Athletic Ribbed Collar with Contrast Trim
    const collarGeo = new THREE.TorusGeometry(0.125, 0.022, 10, 28);
    this.jerseyCollarMesh = new THREE.Mesh(collarGeo, this.goldMat);
    this.jerseyCollarMesh.rotation.x = Math.PI / 2.05;
    this.jerseyCollarMesh.position.set(0, 0.28, -0.02);
    this.chest.add(this.jerseyCollarMesh);

    // Number 7 Athletic Decals (Iconic Large Back + Chest Crest)
    const numTexBack = this.createJerseyNumberTexture('7', true);
    const numMatBack = new THREE.MeshBasicMaterial({
      map: numTexBack,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.numberDecalBack = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), numMatBack);
    this.numberDecalBack.position.set(0, 0.10, 0.17); // Facing rear +Z
    this.chest.add(this.numberDecalBack);

    const numTexFront = this.createJerseyNumberTexture('7', false);
    const numMatFront = new THREE.MeshBasicMaterial({
      map: numTexFront,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.numberDecalFront = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), numMatFront);
    this.numberDecalFront.position.set(-0.09, 0.14, -0.17); // Front chest crest -Z
    this.numberDecalFront.rotation.y = Math.PI;
    this.chest.add(this.numberDecalFront);

    // Gold Stream Sponsor / Crest Badge on right chest
    const crestGeo = new THREE.CircleGeometry(0.04, 16);
    this.crestDecal = new THREE.Mesh(crestGeo, this.goldMat);
    this.crestDecal.position.set(0.10, 0.14, -0.17);
    this.crestDecal.rotation.y = Math.PI;
    this.chest.add(this.crestDecal);
  }

  private buildRealisticHeadAndFace() {
    // 1. Tapered Muscular Athletic Neck
    const neckGeo = new THREE.CylinderGeometry(0.088, 0.10, 0.14, 20);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMat);
    neckMesh.position.y = 0.05;
    neckMesh.castShadow = true;
    this.neck.add(neckMesh);

    // Sternocleidomastoid & Trapezius slope
    const trapGeo = new THREE.ConeGeometry(0.18, 0.10, 16);
    trapGeo.scale(1.3, 0.7, 0.9);
    const trap = new THREE.Mesh(trapGeo, this.skinMat);
    trap.position.set(0, -0.02, 0.02);
    this.neck.add(trap);

    // 2. Sculpted Anatomical Cranium with Organic Contours
    const headGeo = new THREE.SphereGeometry(0.155, 32, 28);
    headGeo.scale(0.88, 1.08, 0.98);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.faceGroup.add(this.headMesh);

    // 3. Photorealistic High-Res Face Mapping Plate (Conformed over facial plane)
    const facePlateGeo = new THREE.PlaneGeometry(0.24, 0.28, 12, 12);
    // Curve vertices to wrap naturally around forehead, cheekbones, and chin
    const pos = facePlateGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const zCurve = -Math.cos((x / 0.12) * (Math.PI / 2.5)) * 0.045 - Math.sin((y / 0.14) * 0.4) * 0.02;
      pos.setZ(i, zCurve);
    }
    facePlateGeo.computeVertexNormals();

    const faceMat = new THREE.MeshStandardMaterial({
      map: this.faceTexture,
      roughness: 0.38,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.faceDecalMesh = new THREE.Mesh(facePlateGeo, faceMat);
    this.faceDecalMesh.position.set(0, -0.015, -0.138);
    this.faceDecalMesh.rotation.y = Math.PI; // Face looks towards -Z (camera front)
    this.faceGroup.add(this.faceDecalMesh);

    // 4. 3D Sculpted Anatomical Nose with curved nostrils
    const noseBridgeGeo = new THREE.CylinderGeometry(0.016, 0.024, 0.08, 12);
    noseBridgeGeo.rotateX(-Math.PI / 4.5);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, this.skinMat);
    noseBridge.position.set(0, -0.01, -0.158);
    this.faceGroup.add(noseBridge);

    const noseTipGeo = new THREE.SphereGeometry(0.024, 14, 14);
    noseTipGeo.scale(1.2, 0.9, 1.1);
    const noseTip = new THREE.Mesh(noseTipGeo, this.skinMat);
    noseTip.position.set(0, -0.035, -0.172);
    this.faceGroup.add(noseTip);

    // 5. 3D Sculpted Ears (Outer Helix, Antihelix, Concha, and Earlobe)
    const createEar = (isLeft: boolean): THREE.Group => {
      const earGroup = new THREE.Group();
      // Outer Helix rim
      const helixGeo = new THREE.TorusGeometry(0.038, 0.009, 8, 16, Math.PI * 1.5);
      const helix = new THREE.Mesh(helixGeo, this.skinMat);
      helix.rotation.y = isLeft ? -0.3 : 0.3;
      earGroup.add(helix);

      // Concha cup
      const conchaGeo = new THREE.SphereGeometry(0.022, 10, 10);
      conchaGeo.scale(0.8, 1.2, 0.4);
      const concha = new THREE.Mesh(conchaGeo, this.skinMat);
      concha.position.set(isLeft ? 0.005 : -0.005, 0, 0.005);
      earGroup.add(concha);

      // Earlobe
      const lobeGeo = new THREE.SphereGeometry(0.014, 8, 8);
      const lobe = new THREE.Mesh(lobeGeo, this.skinMat);
      lobe.position.set(0, -0.032, 0);
      earGroup.add(lobe);

      return earGroup;
    };

    this.leftEar = createEar(true);
    this.leftEar.position.set(-0.142, 0.01, -0.02);
    this.leftEar.rotation.y = -Math.PI / 2;

    this.rightEar = createEar(false);
    this.rightEar.position.set(0.142, 0.01, -0.02);
    this.rightEar.rotation.y = Math.PI / 2;

    this.faceGroup.add(this.leftEar, this.rightEar);
  }

  private buildRealisticHairstyle() {
    // 1. Tapered Scalp Base with Dark Micro-Fade Texture
    const scalpGeo = new THREE.SphereGeometry(0.162, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.62);
    scalpGeo.scale(0.89, 1.09, 0.99);
    const scalpMesh = new THREE.Mesh(scalpGeo, this.hairMat);
    this.hairGroup.add(scalpMesh);

    // 2. High-Density Dynamic Volumetric Dreadlocks / Curls with Natural Flow
    const dreadCount = 24;
    for (let i = 0; i < dreadCount; i++) {
      const angle = (i / dreadCount) * Math.PI * 2;
      const rad = 0.125 + (i % 3) * 0.015;
      const heightOff = 0.11 + ((i * 5) % 4) * 0.02;

      // Organic curved spline for each loc
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * rad, heightOff, Math.sin(angle) * rad),
        new THREE.Vector3(Math.cos(angle) * (rad + 0.04), heightOff + 0.05, Math.sin(angle) * (rad + 0.04)),
        new THREE.Vector3(Math.cos(angle) * (rad + 0.07), heightOff - 0.02, Math.sin(angle) * (rad + 0.07)),
        new THREE.Vector3(Math.cos(angle) * (rad + 0.08), heightOff - 0.09 - (i % 2) * 0.04, Math.sin(angle) * (rad + 0.08)),
      ]);

      const tubeGeo = new THREE.TubeGeometry(curve, 8, 0.020, 8, false);
      const dread = new THREE.Mesh(tubeGeo, this.hairMat);
      dread.castShadow = true;
      this.hairGroup.add(dread);
      this.dreadlocks.push({ mesh: dread, baseAngle: angle, restPos: dread.position.clone() });

      // Gold Drip Accents on select champion locs
      if (i % 4 === 0) {
        const ringGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 14);
        const ring = new THREE.Mesh(ringGeo, this.goldMat);
        ring.position.copy(curve.getPoint(0.65));
        this.hairGroup.add(ring);
      }
    }
  }

  private buildArm(isLeft: boolean) {
    const sideSign = isLeft ? -1 : 1;
    const parentClavicle = isLeft ? this.leftClavicle : this.rightClavicle;
    const parentShoulder = isLeft ? this.leftShoulder : this.rightShoulder;
    const parentElbow = isLeft ? this.leftElbow : this.rightElbow;
    const parentWrist = isLeft ? this.leftWrist : this.rightWrist;

    // 1. Clavicle Collarbone Ridge
    const clavicleGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.14, 12);
    clavicleGeo.rotateZ(sideSign * Math.PI / 2.3);
    const clavicle = new THREE.Mesh(clavicleGeo, this.skinMat);
    clavicle.position.set(sideSign * 0.06, 0, 0);
    parentClavicle.add(clavicle);

    // 2. Sculpted 3-Head Deltoid Muscle Cap
    const deltoidGeo = new THREE.SphereGeometry(0.088, 16, 14);
    deltoidGeo.scale(1.05, 1.25, 1.15);
    const deltoid = new THREE.Mesh(deltoidGeo, this.skinMat);
    deltoid.castShadow = true;
    parentShoulder.add(deltoid);
    if (isLeft) this.leftDeltoidMesh = deltoid;
    else this.rightDeltoidMesh = deltoid;

    // 3. Anatomical Upper Arm (Defined Biceps Brachii & Triceps Horseshoe)
    const upperArmGeo = new THREE.CylinderGeometry(0.066, 0.054, 0.27, 16);
    upperArmGeo.translate(0, -0.135, 0);
    const upperArm = new THREE.Mesh(upperArmGeo, this.skinMat);
    upperArm.castShadow = true;
    parentShoulder.add(upperArm);
    if (isLeft) this.leftUpperArmMesh = upperArm;
    else this.rightUpperArmMesh = upperArm;

    // Biceps muscle belly bulge on front
    const bicepPeakGeo = new THREE.SphereGeometry(0.052, 12, 10);
    bicepPeakGeo.scale(1.0, 1.6, 0.8);
    const bicepPeak = new THREE.Mesh(bicepPeakGeo, this.skinMat);
    bicepPeak.position.set(0, -0.12, -0.02);
    parentShoulder.add(bicepPeak);

    // 4. Forearm with Brachioradialis Muscle Taper & Bony Styloid Process
    const forearmGeo = new THREE.CylinderGeometry(0.056, 0.040, 0.26, 16);
    forearmGeo.translate(0, -0.13, 0);
    const forearm = new THREE.Mesh(forearmGeo, this.skinMat);
    forearm.castShadow = true;
    parentElbow.add(forearm);
    if (isLeft) this.leftForearmMesh = forearm;
    else this.rightForearmMesh = forearm;

    // 5. Anatomical 5-Finger Sprinter Hand
    const hand = this.createAnatomicalHand(isLeft);
    parentWrist.add(hand);
    if (isLeft) this.leftHand = hand;
    else this.rightHand = hand;
  }

  private createAnatomicalHand(isLeft: boolean): THREE.Group {
    const hand = new THREE.Group();
    const sideSign = isLeft ? -1 : 1;

    // Anatomical Palm with Thenar (Thumb) & Hypothenar (Pinky) Muscle Pads
    const palmGeo = new THREE.BoxGeometry(0.068, 0.078, 0.036);
    palmGeo.translate(0, -0.04, 0);
    const palm = new THREE.Mesh(palmGeo, this.skinMat);
    hand.add(palm);

    // 4 Curled Athletic Sprinter Fingers (Index, Middle, Ring, Pinky)
    const fingerLengths = [0.058, 0.064, 0.059, 0.048];
    for (let f = 0; f < 4; f++) {
      const x = (f - 1.5) * 0.016;
      const fl = fingerLengths[f];

      // Proximal + Distal articulated finger segment
      const fingerGeo = new THREE.CylinderGeometry(0.013, 0.010, fl, 10);
      fingerGeo.translate(0, -fl / 2, 0);
      const finger = new THREE.Mesh(fingerGeo, this.skinMat);
      finger.position.set(x, -0.078, -0.004);
      finger.rotation.x = 0.58 + f * 0.04; // Natural aerodynamic relaxed sprint curl
      hand.add(finger);
    }

    // Opposed Athletic Thumb (2 Phalanges with natural angle)
    const thumbGeo = new THREE.CylinderGeometry(0.015, 0.012, 0.045, 10);
    thumbGeo.translate(0, -0.022, 0);
    const thumb = new THREE.Mesh(thumbGeo, this.skinMat);
    thumb.position.set(sideSign * 0.038, -0.032, -0.016);
    thumb.rotation.z = sideSign * -0.55;
    thumb.rotation.x = 0.38;
    hand.add(thumb);

    return hand;
  }

  private buildLeg(isLeft: boolean) {
    const parentHip = isLeft ? this.leftHip : this.rightHip;
    const parentKnee = isLeft ? this.leftKnee : this.rightKnee;
    const parentAnkle = isLeft ? this.leftAnkle : this.rightAnkle;
    const parentFoot = isLeft ? this.leftFoot : this.rightFoot;

    // 1. Sprinter Quadriceps (Vastus Lateralis, Rectus Femoris & Teardrop Vastus Medialis)
    const thighGeo = new THREE.CylinderGeometry(0.118, 0.084, 0.44, 20);
    thighGeo.translate(0, -0.22, 0);
    const thigh = new THREE.Mesh(thighGeo, this.skinMat);
    thigh.castShadow = true;
    parentHip.add(thigh);
    if (isLeft) this.leftThighMesh = thigh;
    else this.rightThighMesh = thigh;

    // Teardrop Vastus Medialis muscle contour on inner knee
    const teardropGeo = new THREE.SphereGeometry(0.052, 12, 10);
    teardropGeo.scale(0.9, 1.5, 0.85);
    const teardrop = new THREE.Mesh(teardropGeo, this.skinMat);
    teardrop.position.set(isLeft ? 0.045 : -0.045, -0.36, -0.025);
    parentHip.add(teardrop);

    // 2. Sculpted Patella Kneecap & Tendon Insertion
    const patellaGeo = new THREE.SphereGeometry(0.046, 12, 12);
    patellaGeo.scale(1.0, 1.25, 0.7);
    const patella = new THREE.Mesh(patellaGeo, this.skinMat);
    patella.position.set(0, 0, -0.065);
    parentKnee.add(patella);
    if (isLeft) this.leftPatellaMesh = patella;
    else this.rightPatellaMesh = patella;

    // 3. Dual-Head Muscular Gastrocnemius Calf & Achilles Tendon
    const calfGeo = new THREE.CylinderGeometry(0.082, 0.050, 0.42, 20);
    calfGeo.translate(0, -0.21, 0);
    const calf = new THREE.Mesh(calfGeo, this.skinMat);
    calf.castShadow = true;
    parentKnee.add(calf);
    if (isLeft) this.leftCalfMesh = calf;
    else this.rightCalfMesh = calf;

    // Posterior calf muscle bulge
    const calfBulgeGeo = new THREE.SphereGeometry(0.058, 12, 12);
    calfBulgeGeo.scale(1.1, 1.8, 0.95);
    const calfBulge = new THREE.Mesh(calfBulgeGeo, this.skinMat);
    calfBulge.position.set(0, -0.16, 0.035);
    parentKnee.add(calfBulge);

    // 4. Pro Athletic Compression Sock with Elastic Ribbing
    const sockGeo = new THREE.CylinderGeometry(0.066, 0.053, 0.24, 18);
    sockGeo.translate(0, -0.28, 0);
    const sock = new THREE.Mesh(sockGeo, this.socksMat);
    sock.castShadow = true;
    parentKnee.add(sock);
    if (isLeft) this.leftSockMesh = sock;
    else this.rightSockMesh = sock;

    // 5. High-Performance Aerodynamic Running Cleat / Sneaker
    const shoe = this.createProRunningCleat();
    parentFoot.add(shoe.group);
    if (isLeft) {
      this.leftShoeUpper = shoe.upper;
      this.leftShoeSole = shoe.sole;
    } else {
      this.rightShoeUpper = shoe.upper;
      this.rightShoeSole = shoe.sole;
    }
  }

  private createProRunningCleat(): { group: THREE.Group; upper: THREE.Mesh; sole: THREE.Mesh } {
    const group = new THREE.Group();
    group.position.set(0, 0, -0.06);

    // 1. Ergonomic Rocker Sole with Toe Spring & Beveled Heel
    const soleGeo = new THREE.BoxGeometry(0.138, 0.052, 0.30);
    soleGeo.translate(0, -0.036, -0.02);
    const sole = new THREE.Mesh(soleGeo, this.shoeSoleMat);
    sole.castShadow = true;
    group.add(sole);

    // Dynamic curved toe spring tip
    const toeGeo = new THREE.ConeGeometry(0.065, 0.07, 14);
    toeGeo.rotateX(Math.PI / 2.3);
    const toe = new THREE.Mesh(toeGeo, this.shoeSoleMat);
    toe.position.set(0, -0.025, -0.17);
    group.add(toe);

    // 2. Sculpted Engineered Mesh Upper with Padded Achilles Notch
    const upperGeo = new THREE.BoxGeometry(0.126, 0.105, 0.28);
    upperGeo.translate(0, 0.042, -0.02);
    const upper = new THREE.Mesh(upperGeo, this.shoeUpperMat);
    upper.castShadow = true;
    group.add(upper);

    // Padded Ankle Collar & Tongue
    const collarGeo = new THREE.TorusGeometry(0.060, 0.018, 8, 16);
    const collar = new THREE.Mesh(collarGeo, this.shoeUpperMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.085, 0.03);
    group.add(collar);

    // 3. 3D Athletic Lacing Plate with Crossed Laces
    const lacesGeo = new THREE.BoxGeometry(0.076, 0.018, 0.13);
    lacesGeo.translate(0, 0.094, -0.035);
    const laces = new THREE.Mesh(lacesGeo, this.socksMat);
    group.add(laces);

    // 4. Aerodynamic Speed Swoosh / Gold Accents on Lateral Flanks
    const swooshGeo = new THREE.BoxGeometry(0.012, 0.026, 0.15);
    const swooshL = new THREE.Mesh(swooshGeo, this.goldMat);
    swooshL.position.set(-0.068, 0.038, -0.02);
    const swooshR = new THREE.Mesh(swooshGeo, this.goldMat);
    swooshR.position.set(0.068, 0.038, -0.02);
    group.add(swooshL, swooshR);

    return { group, upper, sole };
  }

  // ==========================================
  // ACCESSORIES, PROPS & AURAS
  // ==========================================

  private buildAccessories() {
    // 1. Pro Streamer Headset
    this.headsetGroup = new THREE.Group();
    const headbandGeo = new THREE.TorusGeometry(0.19, 0.022, 8, 20, Math.PI);
    const headband = new THREE.Mesh(headbandGeo, new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.3 }));
    headband.rotation.z = Math.PI;
    headband.position.y = 0.08;
    this.headsetGroup.add(headband);

    const cupGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
    const cupMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 0.8,
    });
    const leftCup = new THREE.Mesh(cupGeo, cupMat);
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.19, 0.02, 0);

    const rightCup = new THREE.Mesh(cupGeo, cupMat);
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.19, 0.02, 0);

    const micArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), new THREE.MeshStandardMaterial({ color: '#27272a' }));
    micArm.rotation.x = Math.PI / 3;
    micArm.position.set(-0.16, -0.04, -0.1);

    const micTip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1 }));
    micTip.position.set(-0.16, -0.1, -0.16);

    this.headsetGroup.add(leftCup, rightCup, micArm, micTip);
    this.headsetGroup.visible = false;
    this.head.add(this.headsetGroup);

    // 2. Heavy Cuban Link Gold Chain with Pendant
    this.chainGroup = new THREE.Group();
    const chainGeo = new THREE.TorusGeometry(0.16, 0.018, 8, 24);
    const chainMesh = new THREE.Mesh(chainGeo, this.goldMat);
    chainMesh.rotation.x = -Math.PI / 2.7;
    chainMesh.position.set(0, 0.16, -0.06);

    const pendantGeo = new THREE.BoxGeometry(0.08, 0.10, 0.02);
    const pendant = new THREE.Mesh(pendantGeo, this.goldMat);
    pendant.position.set(0, 0.04, -0.16);
    this.chainGroup.add(chainMesh, pendant);
    this.chainGroup.visible = false;
    this.chest.add(this.chainGroup);

    // 3. Cyber Speed Mirrored Shades
    this.shadesGroup = new THREE.Group();
    const visorGeo = new THREE.BoxGeometry(0.24, 0.052, 0.06);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: '#00f5d4',
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.2,
      reflectivity: 0.9,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.035, -0.155);
    this.shadesGroup.add(visor);
    this.shadesGroup.visible = false;
    this.head.add(this.shadesGroup);

    // 4. Gold Tournament Crown
    this.crownGroup = new THREE.Group();
    const crownGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.12, 6);
    const crown = new THREE.Mesh(crownGeo, this.goldMat);
    crown.position.y = 0.26;
    this.crownGroup.add(crown);
    this.crownGroup.visible = false;
    this.head.add(this.crownGroup);
  }

  private buildPowerUpAuras() {
    const shieldGeo = new THREE.IcosahedronGeometry(1.02, 2);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: '#00f5d4',
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.45,
      emissive: '#00f5d4',
      emissiveIntensity: 0.85,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 0.98;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    const magnetGeo = new THREE.TorusGeometry(0.82, 0.038, 8, 32);
    const magnetMat = new THREE.MeshStandardMaterial({
      color: '#ec4899',
      emissive: '#ec4899',
      emissiveIntensity: 1.5,
    });
    this.magnetAura = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetAura.rotation.x = Math.PI / 2;
    this.magnetAura.position.y = 0.98;
    this.magnetAura.visible = false;
    this.group.add(this.magnetAura);
  }

  private buildContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.80)');
    grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.38)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const geo = new THREE.PlaneGeometry(1.4, 1.4);
    geo.rotateX(-Math.PI / 2);
    this.shadowMesh = new THREE.Mesh(geo, this.shadowMat);
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);
  }

  private createJerseyNumberTexture(num: string, isBack: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    ctx.fillStyle = '#ffffff';
    ctx.font = isBack ? '900 160px Impact, sans-serif' : '900 80px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(num, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  public applySkin(skin: CharacterSkin, sneaker?: SneakerItem, accessory?: AccessoryItem) {
    this.skinMat.color.set(skin.skinTone);
    this.jerseyMat.color.set(skin.primaryColor);
    this.shortsMat.color.set(skin.secondaryColor);
    this.hairMat.color.set(skin.hairColor);

    if (sneaker) {
      this.shoeUpperMat.color.set(sneaker.color);
      this.shoeSoleMat.color.set(sneaker.soleColor);
      this.shoeSoleMat.emissive.set(sneaker.glowColor);
    }

    if (accessory) {
      this.headsetGroup.visible = accessory.type === 'headset';
      this.chainGroup.visible = accessory.type === 'chain';
      this.shadesGroup.visible = accessory.type === 'shades';
      this.crownGroup.visible = accessory.type === 'crown';
    }
  }

  // ==========================================
  // BIOMECHANICAL LOCOMOTION ENGINE
  // ==========================================

  public update(delta: number, speedRatio: number = 1.0) {
    this.animTime += delta;
    this.stateTimer += delta;

    // Power-up pulsing
    if (this.shieldMesh.visible) {
      this.shieldMesh.rotation.y += delta * 2.2;
      this.shieldMesh.rotation.z += delta * 1.5;
      const s = 1.0 + Math.sin(this.animTime * 8) * 0.05;
      this.shieldMesh.scale.set(s, s, s);
    }
    if (this.magnetAura.visible) {
      this.magnetAura.rotation.z += delta * 4;
      this.magnetAura.position.y = 0.98 + Math.sin(this.animTime * 10) * 0.12;
    }

    // Dynamic bank roll damping during lane turns
    this.group.rotation.z = THREE.MathUtils.damp(this.group.rotation.z, this.bankRoll, 14, delta);
    this.bankRoll = THREE.MathUtils.damp(this.bankRoll, 0, 7, delta);

    // Natural dreadlock hair inertia
    this.dreadlocks.forEach((d, i) => {
      d.mesh.rotation.x = Math.sin(this.animTime * 14 + i) * 0.12;
    });

    // Dynamic ground blob shadow positioning & opacity based on character elevation
    if (this.shadowMesh) {
      const groundOffset = -this.group.position.y + 0.02;
      this.shadowMesh.position.y = groundOffset;
      const jumpH = Math.max(0, this.group.position.y);
      const shadowScale = Math.max(0.45, 1.0 - jumpH * 0.22);
      this.shadowMesh.scale.set(shadowScale, 1, shadowScale);
      this.shadowMat.opacity = Math.max(0.12, 0.65 - jumpH * 0.2);
    }

    switch (this.currentState) {
      case 'idle':
        this.animateIdle(delta);
        break;
      case 'running':
        this.animateRun(delta, speedRatio, false);
        break;
      case 'sprinting':
        this.animateRun(delta, speedRatio * 1.35, true);
        break;
      case 'jumping':
        this.animateJump(delta);
        break;
      case 'landing':
        this.animateLanding(delta);
        break;
      case 'sliding':
        this.animateSlide(delta);
        break;
      case 'collision':
      case 'stumble':
        this.animateCollision(delta);
        break;
      case 'recovery':
        this.animateRecovery(delta);
        break;
      case 'celebrating':
        this.animateCelebrating(delta);
        break;
      case 'defeat':
        this.animateDefeat(delta);
        break;
    }
  }

  private animateIdle(delta: number) {
    const t = this.animTime * 2.8;

    // Breathing chest & natural relaxed weight shift
    this.pelvis.position.y = 0.98 + Math.sin(t) * 0.02;
    this.pelvis.position.x = THREE.MathUtils.damp(this.pelvis.position.x, 0, 8, delta);
    this.pelvis.rotation.z = THREE.MathUtils.damp(this.pelvis.rotation.z, 0, 8, delta);

    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, 0.03, 8, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, -0.02 + Math.sin(t) * 0.02, 8, delta);
    this.spineThoracic.rotation.y = THREE.MathUtils.damp(this.spineThoracic.rotation.y, 0, 8, delta);

    this.head.rotation.y = THREE.MathUtils.damp(this.head.rotation.y, Math.sin(t * 0.5) * 0.12, 6, delta);
    this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, -0.02, 6, delta);

    // Natural arm drape
    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, -0.08, 8, delta);
    this.leftShoulder.rotation.z = THREE.MathUtils.damp(this.leftShoulder.rotation.z, -0.16, 8, delta);
    this.leftElbow.rotation.x = THREE.MathUtils.damp(this.leftElbow.rotation.x, 0.32, 8, delta);

    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, -0.08, 8, delta);
    this.rightShoulder.rotation.z = THREE.MathUtils.damp(this.rightShoulder.rotation.z, 0.16, 8, delta);
    this.rightElbow.rotation.x = THREE.MathUtils.damp(this.rightElbow.rotation.x, 0.32, 8, delta);

    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, 0, 10, delta);
    this.leftKnee.rotation.x = THREE.MathUtils.damp(this.leftKnee.rotation.x, 0, 10, delta);
    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, 0, 10, delta);
    this.rightKnee.rotation.x = THREE.MathUtils.damp(this.rightKnee.rotation.x, 0, 10, delta);

    this.leftFoot.rotation.x = THREE.MathUtils.damp(this.leftFoot.rotation.x, 0, 10, delta);
    this.rightFoot.rotation.x = THREE.MathUtils.damp(this.rightFoot.rotation.x, 0, 10, delta);
  }

  /**
   * Biomechanically accurate running and sprinting stride kinematics.
   * Incorporates pelvic counter-rotation, thoracic torque, knee drive, and ankle plantarflexion.
   */
  private animateRun(delta: number, speedMult: number, isSprint: boolean) {
    const strideCadence = isSprint ? 22 : 16.5;
    this.stridePhase += delta * strideCadence * Math.min(speedMult, 1.8);
    const p = this.stridePhase;

    // 1. Kinetic forward lean (negative rotation around X)
    this.targetForwardTilt = isSprint ? -0.38 : -0.22;
    this.currentForwardTilt = THREE.MathUtils.damp(this.currentForwardTilt, this.targetForwardTilt, 10, delta);
    this.spineLumbar.rotation.x = this.currentForwardTilt * 0.6;
    this.spineThoracic.rotation.x = this.currentForwardTilt * 0.4;

    // 2. Vertical bounce & pelvic roll/twist
    const bounceAmp = isSprint ? 0.085 : 0.06;
    this.pelvis.position.y = 0.98 + Math.abs(Math.sin(p)) * bounceAmp;

    // Pelvis twists along Y and banks along Z with alternating leg load
    this.pelvis.rotation.y = Math.sin(p) * (isSprint ? 0.12 : 0.08);
    this.pelvis.rotation.z = Math.sin(p) * (isSprint ? 0.06 : 0.04);

    // 3. Thoracic counter-rotation (spine twists OPPOSITE to hips for angular momentum conservation)
    this.spineThoracic.rotation.y = -Math.sin(p) * (isSprint ? 0.16 : 0.11);
    this.head.rotation.y = THREE.MathUtils.damp(this.head.rotation.y, 0, 14, delta);

    // 4. Leg kinematics (Hip flexion/extension + Knee drive + Ankle rollover)
    const strideAmp = isSprint ? 1.15 : 0.90;
    const leftHipAngle = Math.sin(p) * strideAmp;
    const rightHipAngle = -Math.sin(p) * strideAmp;

    this.leftHip.rotation.x = leftHipAngle;
    this.rightHip.rotation.x = rightHipAngle;

    // Knee kinematics: Swing phase drives forward with high knee flexion,
    // stance phase compresses dynamically under weight to absorb shock
    const leftSwing = Math.sin(p) > 0;
    const leftKneeFlex = leftSwing 
      ? -Math.sin(p) * (isSprint ? 1.65 : 1.32) 
      : -0.12 - (1 + Math.cos(p)) * (isSprint ? 0.24 : 0.16);

    const rightSwing = Math.sin(p) < 0;
    const rightKneeFlex = rightSwing 
      ? -Math.abs(Math.sin(p)) * (isSprint ? 1.65 : 1.32) 
      : -0.12 - (1 - Math.cos(p)) * (isSprint ? 0.24 : 0.16);

    this.leftKnee.rotation.x = leftKneeFlex;
    this.rightKnee.rotation.x = rightKneeFlex;

    // Ankle flexion: toe points down during push-off and airborne swing, flattens on foot contact
    this.leftFoot.rotation.x = leftSwing ? 0.38 : -0.18;
    this.rightFoot.rotation.x = rightSwing ? 0.38 : -0.18;

    // 5. Powerful athletic arm drive
    const armAmp = isSprint ? 1.35 : 0.95;
    this.leftShoulder.rotation.x = -Math.sin(p) * armAmp; // Opposite arm to leg!
    this.leftShoulder.rotation.z = -0.18;
    this.leftElbow.rotation.x = 0.85 + Math.sin(p) * 0.45; // Elbow flexes on up-swing

    this.rightShoulder.rotation.x = Math.sin(p) * armAmp;
    this.rightShoulder.rotation.z = 0.18;
    this.rightElbow.rotation.x = 0.85 - Math.sin(p) * 0.45;

    // Face forward
    this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, 0, 14, delta);
  }

  private animateJump(delta: number) {
    // Airborne athletic leap: spine straightens, knees tuck slightly, arms drive up
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, -0.10, 12, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, 0.05, 12, delta);
    this.spineThoracic.rotation.y = THREE.MathUtils.damp(this.spineThoracic.rotation.y, 0, 12, delta);

    // Tuck knees up dynamically
    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, 0.75, 14, delta);
    this.leftKnee.rotation.x = THREE.MathUtils.damp(this.leftKnee.rotation.x, -1.25, 14, delta);
    this.leftFoot.rotation.x = THREE.MathUtils.damp(this.leftFoot.rotation.x, 0.45, 14, delta);

    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, 0.55, 14, delta);
    this.rightKnee.rotation.x = THREE.MathUtils.damp(this.rightKnee.rotation.x, -1.10, 14, delta);
    this.rightFoot.rotation.x = THREE.MathUtils.damp(this.rightFoot.rotation.x, 0.45, 14, delta);

    // Arms up and flared for aerodynamic stability
    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, -1.25, 12, delta);
    this.leftShoulder.rotation.z = THREE.MathUtils.damp(this.leftShoulder.rotation.z, -0.45, 12, delta);
    this.leftElbow.rotation.x = THREE.MathUtils.damp(this.leftElbow.rotation.x, 0.95, 12, delta);

    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, -1.25, 12, delta);
    this.rightShoulder.rotation.z = THREE.MathUtils.damp(this.rightShoulder.rotation.z, 0.45, 12, delta);
    this.rightElbow.rotation.x = THREE.MathUtils.damp(this.rightElbow.rotation.x, 0.95, 12, delta);
  }

  private animateLanding(delta: number) {
    this.landingTimer -= delta;
    // Shock absorption crouch
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.78, 18, delta);
    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, 0.65, 18, delta);
    this.leftKnee.rotation.x = THREE.MathUtils.damp(this.leftKnee.rotation.x, -1.35, 18, delta);
    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, 0.65, 18, delta);
    this.rightKnee.rotation.x = THREE.MathUtils.damp(this.rightKnee.rotation.x, -1.35, 18, delta);

    if (this.landingTimer <= 0) {
      this.currentState = 'running';
    }
  }

  private animateSlide(delta: number) {
    // Baseball / athletic forward slide: body drops low, back leans back, lead leg extended forward
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.38, 16, delta);
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, 0.45, 16, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, 0.35, 16, delta);

    // Lead leg stretches out forward flat
    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, 1.45, 16, delta);
    this.leftKnee.rotation.x = THREE.MathUtils.damp(this.leftKnee.rotation.x, -0.15, 16, delta);
    this.leftFoot.rotation.x = THREE.MathUtils.damp(this.leftFoot.rotation.x, 0.15, 16, delta);

    // Trailing leg tucks under body
    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, -0.65, 16, delta);
    this.rightKnee.rotation.x = THREE.MathUtils.damp(this.rightKnee.rotation.x, -1.85, 16, delta);
    this.rightFoot.rotation.x = THREE.MathUtils.damp(this.rightFoot.rotation.x, 0.65, 16, delta);

    // Arms brace back and out for balance
    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, 0.85, 16, delta);
    this.leftShoulder.rotation.z = THREE.MathUtils.damp(this.leftShoulder.rotation.z, -0.55, 16, delta);
    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, 0.85, 16, delta);
    this.rightShoulder.rotation.z = THREE.MathUtils.damp(this.rightShoulder.rotation.z, 0.55, 16, delta);
  }

  private animateCollision(delta: number) {
    // Violent backward impact reaction
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.65, 14, delta);
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, 0.75, 14, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, 0.55, 14, delta);
    this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, 0.65, 14, delta);

    // Flailing arms
    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, -1.6, 14, delta);
    this.leftShoulder.rotation.z = THREE.MathUtils.damp(this.leftShoulder.rotation.z, -0.85, 14, delta);
    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, -1.6, 14, delta);
    this.rightShoulder.rotation.z = THREE.MathUtils.damp(this.rightShoulder.rotation.z, 0.85, 14, delta);

    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, 0.95, 14, delta);
    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, -0.45, 14, delta);
  }

  private animateRecovery(delta: number) {
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.98, 10, delta);
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, -0.15, 10, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, -0.10, 10, delta);
  }

  private animateCelebrating(delta: number) {
    // Legendary SIUUU Champion Celebration Stance!
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.98, 12, delta);
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, 0.22, 12, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, -0.28, 12, delta); // Chest puffed out
    this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, -0.32, 12, delta); // Head tilted back roaring

    // Wide stable athletic champion stance
    this.leftHip.rotation.x = THREE.MathUtils.damp(this.leftHip.rotation.x, -0.10, 12, delta);
    this.leftHip.rotation.z = THREE.MathUtils.damp(this.leftHip.rotation.z, -0.28, 12, delta);
    this.leftKnee.rotation.x = THREE.MathUtils.damp(this.leftKnee.rotation.x, -0.25, 12, delta);

    this.rightHip.rotation.x = THREE.MathUtils.damp(this.rightHip.rotation.x, -0.10, 12, delta);
    this.rightHip.rotation.z = THREE.MathUtils.damp(this.rightHip.rotation.z, 0.28, 12, delta);
    this.rightKnee.rotation.x = THREE.MathUtils.damp(this.rightKnee.rotation.x, -0.25, 12, delta);

    // Arms flared back with clenched power fists!
    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, 0.95, 12, delta);
    this.leftShoulder.rotation.z = THREE.MathUtils.damp(this.leftShoulder.rotation.z, -0.75, 12, delta);
    this.leftElbow.rotation.x = THREE.MathUtils.damp(this.leftElbow.rotation.x, 0.65, 12, delta);

    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, 0.95, 12, delta);
    this.rightShoulder.rotation.z = THREE.MathUtils.damp(this.rightShoulder.rotation.z, 0.75, 12, delta);
    this.rightElbow.rotation.x = THREE.MathUtils.damp(this.rightElbow.rotation.x, 0.65, 12, delta);
  }

  private animateDefeat(delta: number) {
    this.pelvis.position.y = THREE.MathUtils.damp(this.pelvis.position.y, 0.42, 10, delta);
    this.spineLumbar.rotation.x = THREE.MathUtils.damp(this.spineLumbar.rotation.x, 0.65, 10, delta);
    this.spineThoracic.rotation.x = THREE.MathUtils.damp(this.spineThoracic.rotation.x, 0.45, 10, delta);
    this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, 0.60, 10, delta);

    this.leftShoulder.rotation.x = THREE.MathUtils.damp(this.leftShoulder.rotation.x, 0.4, 10, delta);
    this.rightShoulder.rotation.x = THREE.MathUtils.damp(this.rightShoulder.rotation.x, 0.4, 10, delta);
  }

  public triggerLaneChange(dir: 'left' | 'right') {
    this.bankRoll = dir === 'left' ? 0.32 : -0.32;
  }

  public triggerImpact() {
    this.currentState = 'collision';
    this.stateTimer = 0;
  }

  public triggerLanding() {
    this.currentState = 'landing';
    this.landingTimer = 0.16;
  }

  public triggerCelebration() {
    this.currentState = 'celebrating';
    this.stateTimer = 0;
  }

  public celebrate() {
    this.triggerCelebration();
  }
}
