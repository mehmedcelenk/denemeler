import * as THREE from 'three';
import type { BirdMascotId } from '../../shared/mascot-types.ts';
import { buildBirdRig, getSpeciesIdleGlowHex, type BirdRig } from './mascot-bird-3d-parts.ts';

export interface Bird3DState {
  flying: boolean;
  landing: boolean;
  facing: 'left' | 'right';
  mood: 'idle' | 'welcome' | 'correct' | 'wrong';
  quirk: '' | 'ruffle' | 'tilt';
  bankDeg: number;
  flightProgress: number;
}

export interface Bird3DController {
  setState: (patch: Partial<Bird3DState>) => void;
  setSpecies: (species: BirdMascotId) => void;
  syncAccentColor: () => void;
  destroy: () => void;
}

const CANVAS_PX = 104;

function readAccentHex(): string {
  if (typeof window === 'undefined' || !document.body) return '#0284c7';
  const val = getComputedStyle(document.body).getPropertyValue('--brand-accent').trim();
  return val || '#0284c7';
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse(child => {
    if (child instanceof THREE.Mesh) child.geometry.dispose();
  });
}

/** Şeffaf WebGL tuval üzerinde gerçek 3D modüler Robokuş sahnesi kurar. */
export function mountRoboBird3D(hostEl: HTMLElement, initialSpecies: BirdMascotId = 'bird'): Bird3DController | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: false,
    });
  } catch (err) {
    console.warn('[mascot-bird-3d] WebGLRenderer oluşturulamadı:', err);
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(CANVAS_PX, CANVAS_PX, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const canvas = renderer.domElement;
  canvas.className = 'mascot-bird-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hostEl.innerHTML = '';
  hostEl.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 0.24, 3.55);
  camera.lookAt(0, 0.08, 0);

  // Üç noktalı stüdyo + kenar (rim) ışığı
  scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
  keyLight.position.set(2.4, 3.2, 3.0);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.45);
  rimLight.position.set(-2.6, 1.8, -2.2);
  scene.add(rimLight);

  let activeSpecies: BirdMascotId = initialSpecies;
  let rig: BirdRig = buildBirdRig(readAccentHex(), activeSpecies);
  scene.add(rig.root);

  const cur: Bird3DState = {
    flying: false,
    landing: false,
    facing: 'right',
    mood: 'idle',
    quirk: '',
    bankDeg: 0,
    flightProgress: 0,
  };

  function applySpeciesScale(): void {
    rig.root.scale.setScalar(activeSpecies === 'bird' ? 1.24 : 1.04);
  }
  applySpeciesScale();

  let idleYawOffset = 0;
  let idlePitchOffset = 0;
  let nextPoseShiftAt = performance.now() + 2600;
  let rafId: number | null = null;
  let destroyed = false;
  let lastAccentCheck = 0;

  function applyGlowColor(mood: Bird3DState['mood']): void {
    if (activeSpecies === 'bird') {
      rig.materials.glow.color.setHex(0x111827);
      rig.materials.glow.emissive.setHex(0x000000);
      rig.materials.glow.emissiveIntensity = 0;
      return;
    }
    const hex = mood === 'correct' ? 0x34d399 : mood === 'wrong' ? 0xfbbf24 : getSpeciesIdleGlowHex(activeSpecies);
    rig.materials.glow.color.setHex(hex);
    rig.materials.glow.emissive.setHex(hex);
    rig.materials.glow.emissiveIntensity = mood === 'idle' ? (activeSpecies === 'raven' ? 0.55 : 1.45) : 2.0;
  }

  function applyArmorAccent(): void {
    if (activeSpecies !== 'owl') return;
    rig.materials.armor.color.set(readAccentHex());
  }

  function animate(now: number): void {
    rafId = null;
    if (destroyed) return;
    if (document.hidden || !canvas.isConnected) {
      rafId = requestAnimationFrame(animate);
      return;
    }

    const t = now * 0.001;
    if (now - lastAccentCheck > 1500) {
      lastAccentCheck = now;
      applyArmorAccent();
    }

    // Boştayken sık ve belirgin 3D perspektif / yüzünü dönme değişimleri
    if (!cur.flying && cur.mood === 'idle' && now >= nextPoseShiftAt) {
      nextPoseShiftAt = now + 2200 + Math.random() * 2800;
      idleYawOffset = (Math.random() - 0.5) * 1.45;
      idlePitchOffset = (Math.random() - 0.5) * 0.44;
    }

    const dirSign = cur.facing === 'left' ? -1 : 1;
    rig.root.rotation.z += (0 - rig.root.rotation.z) * 0.18;

    if (cur.flying) {
      const p = cur.flightProgress;
      const arcMid = Math.sin(Math.PI * p);
      const flightYaw = dirSign * (0.95 - arcMid * 0.85);
      rig.root.rotation.y += (flightYaw - rig.root.rotation.y) * 0.14;

      const isChicken = activeSpecies === 'bird';
      const isRaven = activeSpecies === 'raven';
      const flapFreq = isChicken ? 38 : isRaven ? 11 : 21;
      const flapAmp = isChicken ? 0.96 : isRaven ? 0.74 : 0.84;
      const flap = Math.sin(t * flapFreq);
      rig.wingLeft.rotation.z = 0.22 + flap * flapAmp;
      rig.wingRight.rotation.z = -0.22 - flap * flapAmp;
      rig.wingLeft.rotation.x = isChicken ? Math.cos(t * flapFreq) * 0.35 : 0.2;
      rig.wingRight.rotation.x = isChicken ? Math.cos(t * flapFreq) * 0.35 : 0.2;

      const wobble = isChicken ? Math.sin(t * 17) * 0.28 : 0;
      const climbDivePitch = p > 0.82 ? -0.35 : Math.cos(Math.PI * p) * -0.42;
      rig.body.rotation.x += (climbDivePitch - rig.body.rotation.x) * 0.14;
      rig.body.rotation.z += (((-cur.bankDeg * Math.PI) / 180) * 0.55 + wobble - rig.body.rotation.z) * 0.16;
      rig.body.position.y = Math.sin(t * flapFreq) * (isChicken ? 0.11 : 0.06);
      rig.talons.rotation.x = isChicken ? Math.sin(t * 28) * 0.45 : 0.72;
      rig.headSocket.rotation.set(isChicken ? Math.sin(t * 24) * 0.22 : -climbDivePitch * 0.45, -flightYaw * 0.25, isChicken ? -wobble * 0.8 : 0);
    } else {
      const targetYaw = dirSign * 0.36 + idleYawOffset;
      rig.root.rotation.y += (targetYaw - rig.root.rotation.y) * 0.08;
      const breath = Math.sin(t * 2.4);
      const wingFold = cur.quirk === 'ruffle'
        ? Math.sin(t * 36) * 0.44
        : cur.mood === 'correct'
          ? 0.54 + Math.sin(t * 18) * 0.36
          : -0.68;
      rig.wingLeft.rotation.z += (-wingFold - rig.wingLeft.rotation.z) * 0.2;
      rig.wingRight.rotation.z += (wingFold - rig.wingRight.rotation.z) * 0.2;
      rig.wingLeft.rotation.x += (0 - rig.wingLeft.rotation.x) * 0.18;
      rig.wingRight.rotation.x += (0 - rig.wingRight.rotation.x) * 0.18;

      const targetPitch = cur.landing ? 0.22 : cur.mood === 'welcome' ? -0.15 : idlePitchOffset * 0.55;
      rig.body.rotation.x += (targetPitch - rig.body.rotation.x) * 0.1;
      const wrongShake = cur.mood === 'wrong' ? Math.sin(t * 34) * 0.22 : 0;
      rig.body.rotation.z += (wrongShake - rig.body.rotation.z) * 0.22;
      rig.body.position.y =
        cur.mood === 'correct' ? Math.abs(Math.sin(t * 12)) * 0.2 : cur.landing ? -0.08 : breath * 0.028;
      rig.talons.rotation.x += (0 - rig.talons.rotation.x) * 0.2;

      const headTilt = cur.quirk === 'tilt' ? 0.42 : 0;
      const headScan = cur.quirk === '' && cur.mood === 'idle' ? Math.sin(t * 1.15) * 0.28 + idleYawOffset * 0.45 : 0;
      rig.headSocket.rotation.z += (headTilt - rig.headSocket.rotation.z) * 0.14;
      rig.headSocket.rotation.y += (headScan - rig.headSocket.rotation.y) * 0.08;
      rig.headSocket.rotation.x += (idlePitchOffset * 0.7 - rig.headSocket.rotation.x) * 0.08;
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  return {
    setState(patch) {
      Object.assign(cur, patch);
      if (patch.mood !== undefined) applyGlowColor(cur.mood);
    },
    setSpecies(species) {
      if (species === activeSpecies) return;
      activeSpecies = species;
      const prevYaw = rig.root.rotation.y;
      scene.remove(rig.root);
      disposeObject(rig.root);
      Object.values(rig.materials).forEach(m => m.dispose());
      rig = buildBirdRig(readAccentHex(), species);
      applySpeciesScale();
      rig.root.rotation.y = prevYaw;
      scene.add(rig.root);
      applyGlowColor(cur.mood);
    },
    syncAccentColor() {
      applyArmorAccent();
    },
    destroy() {
      destroyed = true;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      disposeObject(rig.root);
      Object.values(rig.materials).forEach(m => m.dispose());
      renderer.dispose();
      canvas.remove();
    },
  };
}
