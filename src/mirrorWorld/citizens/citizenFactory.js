import * as THREE from "three";

export function createCitizenModel() {
  const group = new THREE.Group();
  group.name = "mirrorCitizen";

  const torsoMaterial = new THREE.MeshStandardMaterial({
    color: randomTone([0x2b1f17, 0x3a2b1e, 0x221417]),
    roughness: 0.94,
    metalness: 0.06,
  });
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6d6db,
    roughness: 0.8,
    metalness: 0.1,
  });
  const clothMaterial = new THREE.MeshStandardMaterial({
    color: randomTone([0x274026, 0x523031, 0x2d2a3c]),
    roughness: 0.9,
    metalness: 0.02,
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.3, 0.4), torsoMaterial);
  torso.position.y = 0.65;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12), skinMaterial);
  head.position.y = 1.5;
  head.castShadow = true;
  group.add(head);

  const leftArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.96, 8),
    clothMaterial
  );
  leftArm.position.set(-0.55, 0.9, 0);
  leftArm.rotation.z = 1.3;
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.55;
  rightArm.rotation.z = -1.3;
  group.add(rightArm);

  const stitchGroup = new THREE.Group();
  stitchGroup.position.set(0, 1.4, 0.32);
  head.add(stitchGroup);
  createStitches(stitchGroup);

  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.08, 10, 32),
    clothMaterial
  );
  scarf.rotation.x = Math.PI * 0.45;
  scarf.position.set(0, 1.2, -0.1);
  head.add(scarf);

  return {
    group,
    head,
    torso,
  };
}

function createStitches(parent) {
  const stitchMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f7b6d,
    roughness: 0.9,
    metalness: 0.4,
  });
  const count = 7;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI / (count - 1)) * i - Math.PI * 0.5;
    const stitch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), stitchMaterial);
    stitch.position.set(Math.sin(angle) * 0.15, Math.cos(angle) * -0.02, 0);
    stitch.rotation.set(0, 0, angle * 0.9 + Math.PI * 0.5);
    stitch.castShadow = true;
    parent.add(stitch);
  }
}

function randomTone(options) {
  return options[Math.floor(Math.random() * options.length)];
}
