import * as THREE from 'three';
import type { BirdMascotId } from '../../shared/mascot-types.ts';

export interface BirdMaterials {
  armor: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  beak: THREE.MeshStandardMaterial;
  visor: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
  accentRed: THREE.MeshStandardMaterial;
}

/** Tak-çıkar 3D kafa soketi: Tavuk, Karga ve RoboBaykuş kafaları. */
export function buildBirdHead(mats: BirdMaterials, species: BirdMascotId): THREE.Group {
  const head = new THREE.Group();

  if (species === 'bird') {
    const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 1), mats.armor);
    cranium.scale.set(0.95, 1.05, 1.0);
    head.add(cranium);
    for (let i = 0; i < 3; i++) {
      const lobe = new THREE.Mesh(new THREE.DodecahedronGeometry(0.105 - i * 0.012, 0), mats.accentRed);
      lobe.position.set(0, 0.36 - i * 0.02, 0.08 - i * 0.13);
      lobe.scale.set(0.52, 1.2, 0.9);
      head.add(lobe);
    }
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 4), mats.beak);
    beak.position.set(0, -0.03, 0.42);
    beak.rotation.set(Math.PI * 0.52, Math.PI * 0.25, 0);
    head.add(beak);
    for (const side of [-1, 1] as const) {
      const wattle = new THREE.Mesh(new THREE.DodecahedronGeometry(0.068, 0), mats.accentRed);
      wattle.position.set(side * 0.055, -0.18, 0.32);
      wattle.scale.set(0.75, 1.35, 0.75);
      head.add(wattle);
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), mats.visor);
      sclera.position.set(side * 0.22, 0.07, 0.22);
      head.add(sclera);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mats.glow);
      pupil.position.set(side * 0.26, 0.07, 0.28);
      head.add(pupil);
    }
    return head;
  }

  if (species === 'raven') {
    const cranium = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mats.armor);
    cranium.scale.set(0.92, 0.92, 1.18);
    head.add(cranium);
    const upperBeak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.52, 5), mats.beak);
    upperBeak.position.set(0, -0.04, 0.53);
    upperBeak.rotation.set(Math.PI * 0.54, 0, 0);
    head.add(upperBeak);
    const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.36, 5), mats.darkMetal);
    lowerBeak.position.set(0, -0.11, 0.46);
    lowerBeak.rotation.set(Math.PI * 0.48, 0, 0);
    head.add(lowerBeak);
    for (const side of [-1, 1] as const) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), mats.glow);
      eye.position.set(side * 0.19, 0.06, 0.24);
      head.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), mats.darkMetal);
      pupil.position.set(side * 0.22, 0.06, 0.28);
      head.add(pupil);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.08), mats.darkMetal);
      brow.position.set(side * 0.19, 0.13, 0.25);
      brow.rotation.z = -side * 0.2;
      head.add(brow);
    }
    return head;
  }

  // RoboBaykuş ('owl')
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.43, 20, 16), mats.armor);
  cranium.scale.set(1.12, 0.96, 1.0);
  head.add(cranium);
  for (const side of [-1, 1] as const) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.36, 5), mats.darkMetal);
    tuft.position.set(side * 0.28, 0.35, -0.04);
    tuft.rotation.set(-0.25, 0, -side * 0.48);
    head.add(tuft);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.032, 10, 20), mats.chrome);
    ring.position.set(side * 0.175, 0.05, 0.36);
    head.add(ring);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), mats.visor);
    lens.position.set(side * 0.175, 0.05, 0.33);
    lens.scale.set(1, 1, 0.55);
    head.add(lens);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), mats.glow);
    pupil.position.set(side * 0.175, 0.05, 0.38);
    head.add(pupil);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 4), mats.beak);
  beak.position.set(0, -0.1, 0.42);
  beak.rotation.set(Math.PI * 0.68, Math.PI * 0.25, 0);
  head.add(beak);
  return head;
}
