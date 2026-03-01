import * as THREE from "three";

export function createGate(scene) {
  const gate = new THREE.Group();
  gate.name = "environmentGate";

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3f58, // Gothic stone blue
    roughness: 0.95,
    metalness: 0.03,
  });
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f2333, // Deep dark iron
    roughness: 0.8,
    metalness: 0.6,
  });
  const rustMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c6f6f, // Aged reddish rust
    roughness: 1,
    metalness: 0,
  });

  const leftPillar = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 4.6, 1.25),
    stoneMaterial
  );
  leftPillar.position.set(-3.6, 2.3, 5.4);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  gate.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 3.6;
  rightPillar.rotation.z = 0.012;
  gate.add(rightPillar);

  const leftDoorPivot = new THREE.Group();
  leftDoorPivot.position.set(-0.16, 0, 5.4);
  const rightDoorPivot = new THREE.Group();
  rightDoorPivot.position.set(0.16, 0, 5.4);

  const leftDoor = createGateDoor(ironMaterial, rustMaterial);
  leftDoor.position.x = -1.52;
  leftDoorPivot.add(leftDoor);

  const rightDoor = createGateDoor(ironMaterial, rustMaterial);
  rightDoor.position.x = 1.52;
  rightDoor.scale.x = -1;
  rightDoorPivot.add(rightDoor);

  gate.add(leftDoorPivot);
  gate.add(rightDoorPivot);
  scene.add(gate);

  const gateCenter = new THREE.Vector3(0, 1.6, 6.3);
  let openProgress = 0;

  function update(camera, delta) {
    if (!camera) {
      return;
    }

    const distance = camera.position.distanceTo(gateCenter);
    const target = distance < 7 ? 1 : 0.15;
    openProgress = THREE.MathUtils.lerp(
      openProgress,
      target,
      Math.min(1, delta * 0.7)
    );

    leftDoorPivot.rotation.y = -0.26 - openProgress * 0.82;
    rightDoorPivot.rotation.y = 0.26 + openProgress * 0.82;
  }

  return {
    object: gate,
    update,
  };
}

function createGateDoor(ironMaterial, rustMaterial) {
  const door = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.95, 3.85, 0.08),
    ironMaterial
  );
  frame.position.y = 1.96;
  frame.castShadow = true;
  frame.receiveShadow = true;
  door.add(frame);

  for (let i = -5; i <= 5; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.55, 0.08), ironMaterial);
    bar.position.set(i * 0.255, 1.9, 0.03);
    bar.rotation.z = randomBetween(-0.03, 0.03);
    bar.castShadow = true;
    bar.receiveShadow = true;
    door.add(bar);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 8), ironMaterial);
    tip.position.set(bar.position.x, 3.73, 0.03);
    tip.castShadow = true;
    door.add(tip);
  }

  const crest = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.045, 7, 22, Math.PI),
    ironMaterial
  );
  crest.rotation.z = Math.PI;
  crest.position.set(0, 4.0, 0.03);
  door.add(crest);

  for (let i = 0; i < 9; i += 1) {
    const rustMark = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.05, 0.01),
      rustMaterial
    );
    rustMark.position.set(
      randomBetween(-1.2, 1.2),
      randomBetween(0.6, 3.4),
      0.07
    );
    rustMark.rotation.z = randomBetween(-0.2, 0.2);
    door.add(rustMark);
  }

  return door;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
