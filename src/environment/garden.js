import * as THREE from "three";

export function createGarden(scene) {
  const garden = new THREE.Group();
  garden.name = "environmentGarden";

  const treeStates = [];
  const bushStates = [];

  const treePositions = generateTreePositions(16);
  for (let i = 0; i < treePositions.length; i += 1) {
    const tree = createDeadTree();
    const pos = treePositions[i];
    tree.position.set(pos.x, 0, pos.z);
    tree.rotation.y = randomBetween(0, Math.PI * 2);
    tree.rotation.z = randomBetween(-0.02, 0.02);
    garden.add(tree);
    treeStates.push({
      object: tree,
      baseRotZ: tree.rotation.z,
      phase: randomBetween(0, Math.PI * 2),
      amplitude: randomBetween(0.005, 0.014),
    });
  }

  for (let i = 0; i < 32; i += 1) {
    const bush = createDryBush();
    bush.position.set(randomBetween(-18, 18), 0.03, randomBetween(-18, 18));
    bush.rotation.y = randomBetween(0, Math.PI * 2);
    bush.rotation.z = randomBetween(-0.08, 0.08);
    garden.add(bush);
    bushStates.push({
      object: bush,
      baseRotZ: bush.rotation.z,
      phase: randomBetween(0, Math.PI * 2),
      amplitude: randomBetween(0.004, 0.01),
    });
  }

  scene.add(garden);

  let time = 0;

  function update(delta) {
    time += delta;

    for (let i = 0; i < treeStates.length; i += 1) {
      const state = treeStates[i];
      const sway = Math.sin(time * 0.28 + state.phase) * state.amplitude;
      state.object.rotation.z = state.baseRotZ + sway;
    }

    for (let i = 0; i < bushStates.length; i += 1) {
      const state = bushStates[i];
      const sway = Math.sin(time * 0.46 + state.phase) * state.amplitude;
      state.object.rotation.z = state.baseRotZ + sway;
    }
  }

  return {
    object: garden,
    update,
  };
}

function createDeadTree() {
  const tree = new THREE.Group();

  const trunkHeight = randomBetween(5.8, 8.6);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.34, trunkHeight, 9),
    new THREE.MeshStandardMaterial({
      color: 0x28201b,
      roughness: 0.96,
      metalness: 0.02,
    })
  );
  trunk.position.y = trunkHeight * 0.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1a16,
    roughness: 0.97,
    metalness: 0.01,
  });

  for (let i = 0; i < 5; i += 1) {
    const length = randomBetween(1.8, 3.6);
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.1, length, 7),
      branchMaterial
    );
    branch.position.y = randomBetween(3.2, trunkHeight - 0.7);
    branch.position.x = randomBetween(-0.18, 0.18);
    branch.position.z = randomBetween(-0.18, 0.18);
    branch.rotation.x = randomBetween(-0.7, 0.7);
    branch.rotation.z = randomBetween(-1.05, 1.05);
    branch.castShadow = true;
    tree.add(branch);
  }

  return tree;
}

function createDryBush() {
  const bush = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x2f2d22,
    roughness: 1,
    metalness: 0,
  });

  for (let i = 0; i < 4; i += 1) {
    const twig = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.04, randomBetween(0.45, 0.9), 6),
      material
    );
    twig.position.y = randomBetween(0.18, 0.35);
    twig.rotation.x = randomBetween(-0.6, 0.6);
    twig.rotation.z = randomBetween(-0.9, 0.9);
    twig.castShadow = true;
    bush.add(twig);
  }

  return bush;
}

function generateTreePositions(count) {
  const positions = [];
  let placed = 0;

  while (placed < count) {
    const x = randomBetween(-22, 22);
    const z = randomBetween(-22, 18);

    if (Math.abs(x) < 3.5 && z < 8 && z > -12) {
      continue;
    }

    positions.push({ x, z });
    placed += 1;
  }

  return positions;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
