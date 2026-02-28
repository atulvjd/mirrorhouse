import * as THREE from "three";

export function createBungalow(scene) {
  const bungalow = new THREE.Group();
  bungalow.name = "environmentBungalow";

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x5e6164,
    roughness: 0.95,
    metalness: 0.03,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x352d28,
    roughness: 0.9,
    metalness: 0.05,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x31191b,
    roughness: 0.9,
    metalness: 0.06,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 8), wallMaterial);
  base.position.set(0, 2.4, -8.4);
  base.castShadow = true;
  base.receiveShadow = true;
  bungalow.add(base);

  // Aged vertical trims break up the facade.
  for (let x = -4.6; x <= 4.6; x += 1.18) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.7, 0.12), woodMaterial);
    trim.position.set(x, 2.35, -4.42);
    trim.rotation.z = randomBetween(-0.02, 0.02);
    trim.castShadow = true;
    trim.receiveShadow = true;
    bungalow.add(trim);
  }

  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(10.9, 0.26, 5.2), roofMaterial);
  roofLeft.position.set(0, 5.58, -9.82);
  roofLeft.rotation.x = 0.64;
  roofLeft.castShadow = true;
  roofLeft.receiveShadow = true;
  bungalow.add(roofLeft);

  const roofRight = roofLeft.clone();
  roofRight.position.z = -6.98;
  roofRight.rotation.x = -0.64;
  bungalow.add(roofRight);

  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.15, 0.22), roofMaterial);
  roofRidge.position.set(0, 6.98, -8.4);
  roofRidge.castShadow = true;
  bungalow.add(roofRidge);

  const porch = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 2.1), woodMaterial);
  porch.position.set(0, 0.12, -4.8);
  porch.castShadow = true;
  porch.receiveShadow = true;
  bungalow.add(porch);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6, 0.14, 1.5), woodMaterial);
  porchRoof.position.set(0, 2.95, -4.04);
  porchRoof.castShadow = true;
  porchRoof.receiveShadow = true;
  bungalow.add(porchRoof);

  const pillarGeometry = new THREE.BoxGeometry(0.2, 2.7, 0.2);
  const pillarOffsets = [-2.4, -0.8, 0.8, 2.4];
  for (let i = 0; i < pillarOffsets.length; i += 1) {
    const pillar = new THREE.Mesh(pillarGeometry, woodMaterial);
    pillar.position.set(pillarOffsets[i], 1.34, -4.04);
    pillar.rotation.z = randomBetween(-0.012, 0.012);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    bungalow.add(pillar);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.45, 0.11), woodMaterial);
  door.position.set(0, 1.24, -4.36);
  door.castShadow = true;
  door.receiveShadow = true;
  bungalow.add(door);

  const windowFrameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2520,
    roughness: 0.9,
    metalness: 0.04,
  });
  const windowPaneMaterial = new THREE.MeshStandardMaterial({
    color: 0x52493a,
    emissive: 0x5f4a22,
    emissiveIntensity: 0.28,
    roughness: 0.42,
    metalness: 0.03,
  });

  const windowPositions = [
    [-2.95, 1.95, -4.38],
    [2.95, 1.95, -4.38],
    [-2.95, 3.15, -4.38],
    [2.95, 3.15, -4.38],
  ];

  for (let i = 0; i < windowPositions.length; i += 1) {
    const [x, y, z] = windowPositions[i];
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.1, 0.08),
      windowFrameMaterial
    );
    frame.position.set(x, y, z);
    frame.castShadow = true;
    frame.receiveShadow = true;
    bungalow.add(frame);

    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(1.14, 0.84, 0.05),
      windowPaneMaterial
    );
    pane.position.set(x, y, z + 0.03);
    bungalow.add(pane);

    const brokenBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.05, 0.08),
      windowFrameMaterial
    );
    brokenBeam.position.set(
      x + randomBetween(-0.24, 0.24),
      y + randomBetween(-0.06, 0.06),
      z + 0.05
    );
    brokenBeam.rotation.z = randomBetween(-0.34, 0.34);
    brokenBeam.castShadow = true;
    bungalow.add(brokenBeam);
  }

  // Cracked support beams around porch.
  for (let i = 0; i < 6; i += 1) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(randomBetween(0.8, 1.4), 0.08, 0.08),
      woodMaterial
    );
    beam.position.set(
      randomBetween(-2.8, 2.8),
      randomBetween(0.7, 2.6),
      -4.28
    );
    beam.rotation.z = randomBetween(-0.35, 0.35);
    beam.rotation.x = randomBetween(-0.05, 0.05);
    beam.castShadow = true;
    bungalow.add(beam);
  }

  bungalow.rotation.y = 0.02;
  scene.add(bungalow);

  return {
    object: bungalow,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
