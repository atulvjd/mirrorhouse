import * as THREE from "three";
import { createMirrorController } from "../mechanics/mirror.js";

export function createHouse(story, options = {}) {
  const world = new THREE.Group();
  world.name = "houseRoom";

  const state = {
    time: 0,
    gateTriggered: false,
    gateOpenProgress: 0,
    gateSoundPlayed: false,
    gateSound: createGateCreakSound(),
    trees: [],
    fogCards: [],
    warmLights: [],
    gateLeftPivot: null,
    gateRightPivot: null,
    gateCenter: new THREE.Vector3(0, 1.8, 12),
  };

  createTerrain(world, state);
  createVictorianGate(world, state);
  createBungalow(world, state);
  createTownBackdrop(world);
  createTrees(world, state);
  createDecorElements(world);
  createLowFogCards(world, state);

  const mirror = createMirrorController(story, options.onMirrorInteract);
  world.add(mirror.mesh);
  addMirrorFrame(world, mirror.mesh);

  const memoryObject = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.55, 0.15),
    new THREE.MeshStandardMaterial({
      color: 0x4f4136,
      roughness: 0.82,
      metalness: 0.04,
      emissive: 0x0b0806,
    })
  );
  memoryObject.position.set(-1.6, 1.5, -5.2);
  memoryObject.castShadow = true;
  memoryObject.receiveShadow = true;
  world.add(memoryObject);

  world.userData.interactables = [
    {
      object: mirror.mesh,
      callback: () => {
        mirror.onInteract();
      },
    },
    {
      object: memoryObject,
      callback: () => {
        if (!story || story.isActive()) {
          return;
        }

        story.showMemory(
          [
            "Everyone smiled in the photos.",
            "But their eyes looked tired.",
            "Like they knew something I didn't.",
          ].join("\n")
        );
      },
    },
  ];

  world.userData.environmentUpdate = (camera, delta) => {
    state.time += delta;
    updateGate(state, camera, delta);
    updateTrees(state);
    updateFogCards(state);
    updateWarmLights(state, delta);
  };

  return world;
}

function createTerrain(world, state) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x181614,
      roughness: 1,
      metalness: 0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  world.add(ground);

  // Dead grass clumps and leaf patches.
  for (let i = 0; i < 130; i += 1) {
    const patch = new THREE.Mesh(
      new THREE.PlaneGeometry(randomBetween(0.25, 0.75), randomBetween(0.08, 0.2)),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x2a3025, 0.06),
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide,
      })
    );

    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = randomBetween(0, Math.PI * 2);
    patch.position.set(
      randomBetween(-30, 30),
      0.015,
      randomBetween(-30, 30)
    );
    patch.receiveShadow = true;
    world.add(patch);
  }

  for (let i = 0; i < 120; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.06, 0.16),
        0.01,
        randomBetween(0.03, 0.1)
      ),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x49382a, 0.07),
        roughness: 0.92,
        metalness: 0.01,
      })
    );
    leaf.position.set(
      randomBetween(-20, 20),
      0.012,
      randomBetween(-20, 20)
    );
    leaf.rotation.y = randomBetween(0, Math.PI * 2);
    leaf.rotation.x = randomBetween(-0.1, 0.1);
    leaf.rotation.z = randomBetween(-0.2, 0.2);
    leaf.receiveShadow = true;
    world.add(leaf);
  }

  // Winding stone path from gate to porch.
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x4d4f53,
    roughness: 0.95,
    metalness: 0.03,
  });

  const pathStoneCount = 28;
  for (let i = 0; i < pathStoneCount; i += 1) {
    const t = i / (pathStoneCount - 1);
    const z = THREE.MathUtils.lerp(11.2, -2.6, t);
    const x = Math.sin(t * Math.PI * 1.4) * 1.6;

    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.9, 1.5),
        randomBetween(0.05, 0.12),
        randomBetween(0.6, 1.2)
      ),
      stoneMaterial
    );
    stone.position.set(
      x + randomBetween(-0.25, 0.25),
      stone.geometry.parameters.height / 2,
      z + randomBetween(-0.2, 0.2)
    );
    stone.rotation.y = randomBetween(-0.2, 0.2);
    stone.castShadow = true;
    stone.receiveShadow = true;
    world.add(stone);
  }

  // Fence hints around property edge.
  const fenceMaterial = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.78,
    metalness: 0.35,
  });

  for (let x = -14; x <= 14; x += 1.6) {
    if (x > -3.6 && x < 3.6) {
      continue;
    }

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), fenceMaterial);
    post.position.set(x, 0.9, 12.3);
    post.castShadow = true;
    post.receiveShadow = true;
    world.add(post);
  }

  // Store warm lights contributed by terrain features.
  state.warmLights = state.warmLights || [];
}

function createVictorianGate(world, state) {
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0x55504a,
    roughness: 1,
    metalness: 0.04,
  });
  const ironMaterial = new THREE.MeshStandardMaterial({
    color: 0x16181b,
    roughness: 0.82,
    metalness: 0.42,
  });

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.8, 1.1), pillarMaterial);
  leftPillar.position.set(-3.3, 1.9, 12);
  leftPillar.rotation.z = -0.015;
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  world.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 3.3;
  rightPillar.rotation.z = 0.02;
  world.add(rightPillar);

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-0.2, 0, 12);
  const rightPivot = new THREE.Group();
  rightPivot.position.set(0.2, 0, 12);

  const leftLeaf = createGateLeaf(ironMaterial);
  leftLeaf.position.x = -2.4;
  leftPivot.add(leftLeaf);

  const rightLeaf = createGateLeaf(ironMaterial);
  rightLeaf.position.x = 2.4;
  rightLeaf.scale.x = -1;
  rightPivot.add(rightLeaf);

  world.add(leftPivot);
  world.add(rightPivot);
  state.gateLeftPivot = leftPivot;
  state.gateRightPivot = rightPivot;

  addGateLantern(world, state, -3.3, 3.5, 12.1);
  addGateLantern(world, state, 3.3, 3.5, 12.1);
}

function createGateLeaf(ironMaterial) {
  const leaf = new THREE.Group();

  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 0.08), ironMaterial);
  frame.position.y = 1.45;
  frame.castShadow = true;
  frame.receiveShadow = true;
  leaf.add(frame);

  for (let i = -4; i <= 4; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), ironMaterial);
    bar.position.set(i * 0.46, 1.45, 0.02);
    bar.castShadow = true;
    bar.receiveShadow = true;
    leaf.add(bar);
  }

  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.06, 8, 24, Math.PI), ironMaterial);
  arch.rotation.z = Math.PI;
  arch.position.set(0, 2.75, 0.03);
  arch.castShadow = true;
  leaf.add(arch);

  // Rust accents.
  for (let i = 0; i < 8; i += 1) {
    const rust = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.05, 0.01),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x4f2f20, 0.08),
        roughness: 1,
        metalness: 0,
      })
    );
    rust.position.set(
      randomBetween(-1.9, 1.9),
      randomBetween(0.4, 2.5),
      0.06
    );
    leaf.add(rust);
  }

  return leaf;
}

function createBungalow(world, state) {
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2f27,
    roughness: 0.88,
    metalness: 0.06,
  });
  const paintMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f6658,
    roughness: 0.94,
    metalness: 0.02,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1c1f,
    roughness: 0.9,
    metalness: 0.08,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(10, 4.4, 8), paintMaterial);
  base.position.set(0, 2.2, -6.2);
  base.castShadow = true;
  base.receiveShadow = true;
  world.add(base);

  // Vertical wooden trims for aged facade feel.
  for (let x = -4.6; x <= 4.6; x += 1.15) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.3, 0.12), woodMaterial);
    trim.position.set(x, 2.15, -2.18);
    trim.castShadow = true;
    trim.receiveShadow = true;
    world.add(trim);
  }

  // Roof slopes.
  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.3, 5), roofMaterial);
  roofLeft.position.set(0, 5.25, -7.45);
  roofLeft.rotation.x = 0.62;
  roofLeft.castShadow = true;
  roofLeft.receiveShadow = true;
  world.add(roofLeft);

  const roofRight = roofLeft.clone();
  roofRight.position.z = -4.95;
  roofRight.rotation.x = -0.62;
  world.add(roofRight);

  const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.16, 0.2), roofMaterial);
  roofRidge.position.set(0, 6.65, -6.2);
  roofRidge.castShadow = true;
  world.add(roofRidge);

  // Porch and balcony.
  const porch = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.28, 2.2), woodMaterial);
  porch.position.set(0, 0.14, -1.9);
  porch.castShadow = true;
  porch.receiveShadow = true;
  world.add(porch);

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 1.6), woodMaterial);
  balcony.position.set(0, 2.95, -2.05);
  balcony.castShadow = true;
  balcony.receiveShadow = true;
  world.add(balcony);

  addBalconyRail(world, woodMaterial);
  addWindows(world, state);
  addDoorAndPorchDetails(world, state);
  addIvy(world);
}

function addBalconyRail(world, material) {
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.08), material);
  topRail.position.set(0, 3.65, -1.32);
  topRail.castShadow = true;
  world.add(topRail);

  const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.08), material);
  bottomRail.position.set(0, 3.05, -1.32);
  bottomRail.castShadow = true;
  world.add(bottomRail);

  for (let x = -2.6; x <= 2.6; x += 0.38) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 0.06), material);
    bar.position.set(x, 3.35, -1.32);
    bar.castShadow = true;
    world.add(bar);
  }
}

function addWindows(world, state) {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a221e,
    roughness: 0.88,
    metalness: 0.05,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b4638,
    emissive: 0x4a3e1c,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.02,
  });

  const windowPositions = [
    [-2.8, 1.9, -2.16],
    [2.8, 1.9, -2.16],
    [-2.8, 3.15, -2.16],
    [2.8, 3.15, -2.16],
    [-4.98, 2.1, -6.6, Math.PI / 2],
    [4.98, 2.1, -6.6, Math.PI / 2],
  ];

  for (const [x, y, z, rotY = 0] of windowPositions) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), frameMaterial);
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    frame.castShadow = true;
    frame.receiveShadow = true;
    world.add(frame);

    const pane = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.86, 0.05), glassMaterial);
    pane.position.copy(frame.position);
    pane.position.z += rotY === 0 ? 0.03 : 0;
    pane.position.x += rotY !== 0 ? (x > 0 ? -0.03 : 0.03) : 0;
    pane.rotation.y = rotY;
    world.add(pane);

    const warmLeak = new THREE.PointLight(0xffcc88, 0.7, 7);
    warmLeak.position.copy(frame.position);
    warmLeak.position.y += 0.1;
    warmLeak.position.z += rotY === 0 ? -0.6 : 0;
    warmLeak.position.x += rotY !== 0 ? (x > 0 ? -0.6 : 0.6) : 0;
    world.add(warmLeak);
    state.warmLights.push({
      light: warmLeak,
      base: warmLeak.intensity,
      phase: randomBetween(0, Math.PI * 2),
    });
  }
}

function addDoorAndPorchDetails(world, state) {
  const wood = new THREE.MeshStandardMaterial({
    color: 0x3f3126,
    roughness: 0.86,
    metalness: 0.05,
  });

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 0.12), wood);
  door.position.set(0, 1.2, -2.14);
  door.castShadow = true;
  door.receiveShadow = true;
  world.add(door);

  const hangingLantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.32, 0.22),
    new THREE.MeshStandardMaterial({
      color: 0x29231e,
      emissive: 0x4a3a14,
      emissiveIntensity: 0.5,
      roughness: 0.7,
      metalness: 0.2,
    })
  );
  hangingLantern.position.set(1.3, 2.8, -1.5);
  world.add(hangingLantern);

  const porchLight = new THREE.PointLight(0xffcc88, 1.05, 10);
  porchLight.position.set(1.3, 2.6, -1.5);
  porchLight.castShadow = true;
  world.add(porchLight);
  state.warmLights.push({
    light: porchLight,
    base: porchLight.intensity,
    phase: randomBetween(0, Math.PI * 2),
  });

  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.03, 0.65),
    new THREE.MeshStandardMaterial({
      color: 0x2f2520,
      roughness: 1,
      metalness: 0,
    })
  );
  mat.position.set(0, 0.03, -0.95);
  mat.rotation.z = randomBetween(-0.08, 0.08);
  mat.receiveShadow = true;
  world.add(mat);

  const rockingChair = createRockingChair();
  rockingChair.position.set(-1.8, 0.04, -1.6);
  rockingChair.rotation.y = Math.PI * 0.18;
  world.add(rockingChair);

  for (let i = 0; i < 3; i += 1) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.28, 10),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x5a4030, 0.05),
        roughness: 0.9,
        metalness: 0.02,
      })
    );
    pot.position.set(-2.4 + i * 1.2, 0.14, -0.95 + randomBetween(-0.25, 0.15));
    pot.rotation.y = randomBetween(0, Math.PI * 2);
    pot.castShadow = true;
    pot.receiveShadow = true;
    world.add(pot);
  }
}

function createRockingChair() {
  const chair = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x3a2e24,
    roughness: 0.9,
    metalness: 0.03,
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.75), material);
  seat.position.y = 0.65;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.08), material);
  back.position.set(0, 1.05, -0.32);
  back.castShadow = true;
  back.receiveShadow = true;
  chair.add(back);

  const rockerGeo = new THREE.BoxGeometry(0.95, 0.08, 0.08);
  const leftRocker = new THREE.Mesh(rockerGeo, material);
  leftRocker.position.set(-0.28, 0.12, 0);
  leftRocker.rotation.z = -0.22;
  chair.add(leftRocker);

  const rightRocker = leftRocker.clone();
  rightRocker.position.x = 0.28;
  rightRocker.rotation.z = 0.22;
  chair.add(rightRocker);

  return chair;
}

function addIvy(world) {
  const ivyMaterial = new THREE.MeshStandardMaterial({
    color: 0x283523,
    roughness: 0.96,
    metalness: 0,
  });

  for (let i = 0; i < 12; i += 1) {
    const vine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, randomBetween(0.9, 1.8), 7),
      ivyMaterial
    );
    vine.position.set(
      randomBetween(-4.3, 4.3),
      randomBetween(1.2, 3.8),
      -2.05
    );
    vine.rotation.z = randomBetween(-0.45, 0.45);
    vine.rotation.x = randomBetween(-0.1, 0.1);
    vine.castShadow = true;
    world.add(vine);
  }
}

function createTownBackdrop(world) {
  const facadeMaterial = new THREE.MeshStandardMaterial({
    color: 0x23272f,
    roughness: 0.94,
    metalness: 0.04,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x171a20,
    roughness: 0.92,
    metalness: 0.05,
  });

  const facades = [
    { x: -20, z: -14, w: 8, h: 9, d: 7 },
    { x: 19, z: -15, w: 7, h: 8, d: 6 },
    { x: -24, z: 3, w: 6, h: 7.5, d: 6 },
    { x: 23, z: 4, w: 6, h: 7.8, d: 6 },
  ];

  for (const b of facades) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(b.w, b.h, b.d),
      facadeMaterial
    );
    body.position.set(b.x, b.h / 2, b.z);
    body.castShadow = true;
    body.receiveShadow = true;
    world.add(body);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(b.w * 0.65, 2.6, 4),
      roofMaterial
    );
    roof.position.set(b.x, b.h + 1.2, b.z);
    roof.rotation.y = Math.PI * 0.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    world.add(roof);
  }
}

function createTrees(world, state) {
  const treePositions = [
    [-10, -8],
    [-13, -2],
    [-15, 6],
    [-8, 10],
    [10, -8],
    [13, -1],
    [15, 6],
    [8, 10],
    [-4, -12],
    [5, -13],
  ];

  for (const [x, z] of treePositions) {
    const tree = createTree();
    tree.position.set(x + randomBetween(-0.8, 0.8), 0, z + randomBetween(-0.8, 0.8));
    tree.rotation.y = randomBetween(0, Math.PI * 2);
    world.add(tree);

    state.trees.push({
      group: tree,
      phase: randomBetween(0, Math.PI * 2),
      amp: randomBetween(0.7, 1.2),
    });
  }
}

function createTree() {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.35, randomBetween(6.5, 8.8), 9),
    new THREE.MeshStandardMaterial({
      color: 0x28211b,
      roughness: 0.95,
      metalness: 0.02,
    })
  );
  trunk.position.y = trunk.geometry.parameters.height / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 4; i += 1) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.12, randomBetween(2.2, 3.8), 7),
      new THREE.MeshStandardMaterial({
        color: 0x221c18,
        roughness: 0.96,
        metalness: 0.02,
      })
    );
    branch.position.y = randomBetween(4, 6.4);
    branch.position.x = randomBetween(-0.2, 0.2);
    branch.position.z = randomBetween(-0.2, 0.2);
    branch.rotation.z = randomBetween(-1.1, 1.1);
    branch.rotation.x = randomBetween(-0.55, 0.55);
    branch.castShadow = true;
    tree.add(branch);
  }

  return tree;
}

function createDecorElements(world) {
  // Broken boards.
  for (let i = 0; i < 10; i += 1) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(randomBetween(0.8, 1.9), 0.06, randomBetween(0.1, 0.22)),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x3a2b1f, 0.1),
        roughness: 0.93,
        metalness: 0.02,
      })
    );
    board.position.set(
      randomBetween(-8, 8),
      0.04,
      randomBetween(-1, 13)
    );
    board.rotation.y = randomBetween(0, Math.PI * 2);
    board.rotation.x = randomBetween(-0.2, 0.2);
    board.rotation.z = randomBetween(-0.2, 0.2);
    board.castShadow = true;
    board.receiveShadow = true;
    world.add(board);
  }

  // Crates/books around porch and sides.
  for (let i = 0; i < 18; i += 1) {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.16, 0.55),
        randomBetween(0.06, 0.42),
        randomBetween(0.12, 0.5)
      ),
      new THREE.MeshStandardMaterial({
        color: varyColor(0x4b3a2c, 0.08),
        roughness: 0.9,
        metalness: 0.03,
      })
    );

    crate.position.set(
      randomBetween(-9, 9),
      crate.geometry.parameters.height / 2,
      randomBetween(-9, 8)
    );
    crate.rotation.y = randomBetween(0, Math.PI * 2);
    crate.rotation.z = randomBetween(-0.08, 0.08);
    crate.castShadow = true;
    crate.receiveShadow = true;
    world.add(crate);
  }
}

function createLowFogCards(world, state) {
  for (let i = 0; i < 12; i += 1) {
    const fog = new THREE.Mesh(
      new THREE.PlaneGeometry(randomBetween(6, 11), randomBetween(2.2, 3.8)),
      new THREE.MeshBasicMaterial({
        color: 0x70798a,
        transparent: true,
        opacity: randomBetween(0.06, 0.13),
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    fog.rotation.x = -Math.PI / 2;
    fog.position.set(
      randomBetween(-16, 16),
      randomBetween(0.12, 0.35),
      randomBetween(-16, 16)
    );
    world.add(fog);

    state.fogCards.push({
      mesh: fog,
      baseY: fog.position.y,
      phase: randomBetween(0, Math.PI * 2),
    });
  }
}

function addMirrorFrame(world, mirrorMesh) {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1b10,
    roughness: 0.83,
    metalness: 0.05,
  });

  const frameGroup = new THREE.Group();
  const frameZ = mirrorMesh.position.z + 0.05;

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.09), frameMaterial);
  left.position.set(-1.06, mirrorMesh.position.y, frameZ);
  frameGroup.add(left);

  const right = left.clone();
  right.position.x = 1.06;
  frameGroup.add(right);

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.09), frameMaterial);
  top.position.set(0, mirrorMesh.position.y + 1.58, frameZ);
  frameGroup.add(top);

  const bottom = top.clone();
  bottom.position.y = mirrorMesh.position.y - 1.58;
  frameGroup.add(bottom);

  for (const part of frameGroup.children) {
    part.castShadow = true;
    part.receiveShadow = true;
  }

  world.add(frameGroup);
}

function addGateLantern(world, state, x, y, z) {
  const lanternBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.35, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0x2f2923,
      emissive: 0x523c16,
      emissiveIntensity: 0.45,
      roughness: 0.7,
      metalness: 0.22,
    })
  );
  lanternBody.position.set(x, y, z);
  world.add(lanternBody);

  const light = new THREE.PointLight(0xffcc88, 0.75, 8);
  light.position.set(x, y - 0.1, z);
  world.add(light);

  state.warmLights.push({
    light,
    base: light.intensity,
    phase: randomBetween(0, Math.PI * 2),
  });
}

function updateGate(state, camera, delta) {
  if (camera) {
    const distanceToGate = camera.position.distanceTo(state.gateCenter);
    if (distanceToGate < 8) {
      state.gateTriggered = true;
    }
  }

  const target = state.gateTriggered ? 1 : 0;
  state.gateOpenProgress = THREE.MathUtils.lerp(
    state.gateOpenProgress,
    target,
    Math.min(1, delta * 0.65)
  );

  const openAngle = state.gateOpenProgress * 1.08;
  if (state.gateLeftPivot) {
    state.gateLeftPivot.rotation.y = -openAngle;
  }
  if (state.gateRightPivot) {
    state.gateRightPivot.rotation.y = openAngle;
  }

  if (state.gateTriggered && !state.gateSoundPlayed && state.gateOpenProgress > 0.05) {
    state.gateSoundPlayed = true;
    state.gateSound.play();
  }
}

function updateTrees(state) {
  for (const tree of state.trees) {
    const sway = Math.sin(state.time * 0.38 + tree.phase) * 0.018 * tree.amp;
    tree.group.rotation.z = sway;
  }
}

function updateFogCards(state) {
  for (const fog of state.fogCards) {
    fog.mesh.position.y = fog.baseY + Math.sin(state.time * 0.4 + fog.phase) * 0.05;
    fog.mesh.position.x += Math.sin(state.time * 0.05 + fog.phase) * 0.0025;
    fog.mesh.position.z += Math.cos(state.time * 0.05 + fog.phase) * 0.002;
  }
}

function updateWarmLights(state, delta) {
  for (const entry of state.warmLights) {
    const pulse = 0.85 + Math.sin(state.time * 2.3 + entry.phase) * 0.08;
    const flutter =
      Math.sin(state.time * 17 + entry.phase * 0.73) * 0.04 +
      Math.sin(state.time * 11 + entry.phase * 1.21) * 0.03;
    const target = entry.base * (pulse + flutter);
    entry.light.intensity = THREE.MathUtils.lerp(
      entry.light.intensity,
      Math.max(0.05, target),
      Math.min(1, delta * 8)
    );
  }
}

function createGateCreakSound() {
  let fallbackUsed = false;
  const audio = new Audio("/assets/audio/gate_creak.mp3");
  audio.preload = "auto";
  audio.volume = 0.42;

  return {
    play() {
      if (!fallbackUsed) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          fallbackUsed = true;
          playFallbackCreak();
        });
        return;
      }
      playFallbackCreak();
    },
  };
}

function playFallbackCreak() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(185, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(62, ctx.currentTime + 1.2);

    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  } catch {
    // No-op fallback if WebAudio is unavailable.
  }
}

function varyColor(baseHex, amount) {
  const color = new THREE.Color(baseHex);
  color.offsetHSL(
    randomBetween(-amount, amount),
    randomBetween(-amount * 0.35, amount * 0.25),
    randomBetween(-amount, amount)
  );
  return color;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
