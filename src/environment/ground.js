import * as THREE from "three";

export function createGround(scene) {
  const groundGroup = new THREE.Group();
  groundGroup.name = "environmentGround";

  const mudMaterial = new THREE.MeshStandardMaterial({
    color: 0x171512,
    roughness: 1,
    metalness: 0,
  });
  const wetPatchMaterial = new THREE.MeshStandardMaterial({
    color: 0x11100f,
    roughness: 0.58,
    metalness: 0.02,
  });
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2a28,
    roughness: 0.92,
    metalness: 0.04,
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mudMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  groundGroup.add(ground);

  for (let i = 0; i < 70; i += 1) {
    const patch = new THREE.Mesh(
      new THREE.CylinderGeometry(
        randomBetween(0.28, 1.35),
        randomBetween(0.28, 1.35),
        randomBetween(0.01, 0.03),
        12
      ),
      wetPatchMaterial
    );
    patch.position.set(
      randomBetween(-28, 28),
      randomBetween(0.004, 0.015),
      randomBetween(-28, 28)
    );
    patch.rotation.y = randomBetween(0, Math.PI * 2);
    patch.receiveShadow = true;
    groundGroup.add(patch);
  }

  for (let i = 0; i < 46; i += 1) {
    const t = i / 45;
    const z = THREE.MathUtils.lerp(6.5, -7.4, t);
    const x = Math.sin(t * Math.PI * 1.3) * 1.4;

    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.8, 1.4),
        randomBetween(0.05, 0.12),
        randomBetween(0.45, 1.05)
      ),
      pathMaterial
    );
    stone.position.set(
      x + randomBetween(-0.24, 0.24),
      stone.geometry.parameters.height * 0.5,
      z + randomBetween(-0.26, 0.26)
    );
    stone.rotation.y = randomBetween(-0.25, 0.25);
    stone.rotation.x = randomBetween(-0.05, 0.05);
    stone.castShadow = true;
    stone.receiveShadow = true;
    groundGroup.add(stone);
  }

  scene.add(groundGroup);

  return {
    object: groundGroup,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
