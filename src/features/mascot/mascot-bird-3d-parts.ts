import * as THREE from 'three';
import type { BirdMascotId } from '../../shared/mascot-types.ts';
import { buildBirdHead, type BirdMaterials } from './mascot-bird-3d-heads.ts';

export type { BirdMaterials };

export interface BirdRig {
  root: THREE.Group;
  body: THREE.Group;
  headSocket: THREE.Group;
  wingLeft: THREE.Group;
  wingRight: THREE.Group;
  tail: THREE.Group;
  talons: THREE.Group;
  materials: BirdMaterials;
}

export function getSpeciesIdleGlowHex(species: BirdMascotId): number {
  if (species === 'owl') return 0xfbbf24;
  if (species === 'raven') return 0xfef08a;
  return 0x111827;
}

export function createBirdMaterials(accentHex: string, species: BirdMascotId): BirdMaterials {
  const isChicken = species === 'bird';
  const isRaven = species === 'raven';
  const flat = isChicken || isRaven;
  const glowHex = getSpeciesIdleGlowHex(species);

  return {
    armor: new THREE.MeshStandardMaterial({
      color: isChicken ? 0xfefce8 : isRaven ? 0x1e2533 : new THREE.Color(accentHex),
      metalness: flat ? 0.08 : 0.58,
      roughness: flat ? 0.78 : 0.25,
      flatShading: flat,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: isChicken ? 0xe2e8f0 : isRaven ? 0x0f1420 : 0x131b2e,
      metalness: flat ? 0.12 : 0.74,
      roughness: flat ? 0.72 : 0.32,
      flatShading: flat,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: isChicken ? 0xf97316 : isRaven ? 0x475569 : 0xdbeafe,
      metalness: flat ? 0.1 : 0.86,
      roughness: flat ? 0.65 : 0.18,
      flatShading: flat,
    }),
    beak: new THREE.MeshStandardMaterial({
      color: isChicken ? 0xf59e0b : isRaven ? 0x334155 : 0xf59e0b,
      metalness: isRaven ? 0.25 : 0.15,
      roughness: 0.52,
      flatShading: flat,
    }),
    visor: new THREE.MeshStandardMaterial({
      color: isChicken ? 0xffffff : 0x050914,
      metalness: isChicken ? 0.05 : 0.88,
      roughness: isChicken ? 0.45 : 0.12,
    }),
    glow: new THREE.MeshStandardMaterial({
      color: glowHex,
      emissive: isChicken ? 0x000000 : glowHex,
      emissiveIntensity: isChicken ? 0 : isRaven ? 0.55 : 1.5,
      metalness: 0.15,
      roughness: 0.25,
    }),
    accentRed: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.06,
      roughness: 0.68,
      flatShading: true,
    }),
  };
}

function buildWing(mats: BirdMaterials, side: -1 | 1, species: BirdMascotId): THREE.Group {
  const pivot = new THREE.Group();
  if (species === 'bird') {
    // Low-poly kısa, komik çırpınan tavuk kanatları
    pivot.position.set(side * 0.48, 0.08, -0.02);
    const wing = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), mats.darkMetal);
    wing.scale.set(1.25, 0.42, 0.9);
    wing.position.set(side * 0.2, 0, 0);
    pivot.add(wing);
    return pivot;
  }

  pivot.position.set(side * (species === 'owl' ? 0.5 : 0.44), 0.12, -0.04);
  const span = species === 'raven' ? 0.72 : 0.54;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(span, 0.09, species === 'raven' ? 0.36 : 0.42), mats.armor);
  upper.position.set(side * (span * 0.46), 0, 0);
  upper.rotation.z = -side * 0.14;
  pivot.add(upper);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(species === 'raven' ? 0.6 : 0.46, 0.055, 0.28), mats.darkMetal);
  blade.position.set(side * (span + 0.12), -0.05, -0.05);
  blade.rotation.z = -side * (species === 'raven' ? 0.28 : 0.24);
  pivot.add(blade);

  if (species === 'owl') {
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.07), mats.glow);
    tip.position.set(side * (span + 0.04), 0.03, 0.13);
    tip.rotation.z = -side * 0.2;
    pivot.add(tip);
  }
  return pivot;
}

export function buildBirdRig(accentHex: string, species: BirdMascotId = 'bird'): BirdRig {
  const mats = createBirdMaterials(accentHex, species);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const torsoGeo = species === 'owl' ? new THREE.SphereGeometry(0.46, 22, 18) : new THREE.IcosahedronGeometry(0.48, 1);
  const torso = new THREE.Mesh(torsoGeo, mats.armor);
  if (species === 'bird') torso.scale.set(1.06, 1.02, 1.18);
  else if (species === 'raven') torso.scale.set(0.86, 0.98, 1.3);
  else torso.scale.set(1.14, 1.12, 1.05);
  body.add(torso);

  if (species === 'owl') {
    const chestPlate = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 14), mats.darkMetal);
    chestPlate.position.set(0, -0.04, 0.18);
    chestPlate.scale.set(0.92, 0.96, 0.85);
    body.add(chestPlate);
    const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.026, 10, 20), mats.chrome);
    coreRing.position.set(0, 0.03, 0.49);
    body.add(coreRing);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), mats.glow);
    core.position.set(0, 0.03, 0.47);
    body.add(core);
  }

  const wingLeft = buildWing(mats, -1, species);
  const wingRight = buildWing(mats, 1, species);
  body.add(wingLeft, wingRight);

  const tail = new THREE.Group();
  tail.position.set(0, species === 'bird' ? 0.1 : -0.2, -0.46);
  const tailCount = species === 'bird' ? 3 : 2;
  for (let i = 0; i < tailCount; i++) {
    const offset = (i - (tailCount - 1) / 2) * 0.16;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, species === 'raven' ? 0.58 : 0.36), mats.darkMetal);
    fin.position.set(offset, species === 'bird' ? 0.12 : -0.02, -0.18);
    fin.rotation.set(species === 'bird' ? 0.65 : -0.32, offset * 1.4, 0);
    tail.add(fin);
  }
  body.add(tail);

  const talons = new THREE.Group();
  talons.position.set(0, -0.45, 0.04);
  for (const side of [-1, 1] as const) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.28, 6), mats.chrome);
    leg.position.set(side * 0.15, -0.06, 0);
    talons.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.22), species === 'bird' ? mats.chrome : mats.darkMetal);
    foot.position.set(side * 0.15, -0.2, 0.05);
    talons.add(foot);
  }
  body.add(talons);

  const headSocket = new THREE.Group();
  headSocket.position.set(0, species === 'bird' ? 0.5 : 0.54, species === 'bird' ? 0.26 : 0.16);
  headSocket.add(buildBirdHead(mats, species));
  body.add(headSocket);

  return { root, body, headSocket, wingLeft, wingRight, tail, talons, materials: mats };
}
