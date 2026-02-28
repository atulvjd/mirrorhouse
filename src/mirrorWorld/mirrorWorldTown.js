import * as THREE from "three";
import { createMirrorTextMesh } from "./text/mirrorTextSystem.js";

export function createMirrorWorldTown(scene) {
  const townGroup = new THREE.Group();
  townGroup.name = "mirrorWorldTown";
  townGroup.position.set(0, -2.75, -9.5);

  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 0.02, 4.6),
    new THREE.MeshStandardMaterial({
      color: 0x1a1b1c,
      roughness: 0.97,
      metalness: 0.02,
    })
  );
  walkway.position.set(0, 0.01, -2.65);
  walkway.receiveShadow = true;
  townGroup.add(walkway);

  const houses = [];
  const houseZ = -4.4;
  const houseSpacing = 4.8;

  const houseConfigs = [
    { x: -3.6, angle: -0.12, height: 3.6 },
    { x: 0, angle: 0.07, height: 3.3 },
    { x: 3.6, angle: -0.09, height: 3.9 },
  ];

  for (const config of houseConfigs) {
    const house = buildHouse(config.height);
    house.position.set(config.x, -2.4, houseZ);
    house.rotation.y = config.angle;
    house.scale.x = -1; // invert left/right
    townGroup.add(house);
    houses.push(house);
  }

  const treeStates = [];
  const treePositions = [
    [-4.8, -4.2],
    [4.8, -4.2],
    [-5.6, -1.8],
    [5.6, -1.1],
  ];

  for (const [x, z] of treePositions) {
    const tree = createTwistedTree();
    tree.position.set(x, -2.75, z);
    treeStates.push({
      object: tree,
      startZ: z,
      phase: Math.random() * Math.PI * 2,
      amp: randomBetween(0.012, 0.03),
    });
    townGroup.add(tree);
  }

  const store = createMirrorStore();
  townGroup.add(store.group);
  townGroup.visible = false;
  scene.add(townGroup);

  let time = 0;

  function update(delta) {
    time += delta;
    for (const state of treeStates) {
      const sway = Math.sin(time * 0.5 + state.phase) * state.amp;
      state.object.rotation.z = sway;
      state.object.position.z =
        state.startZ + Math.sin(time * 0.2 + state.phase) * 0.15;
    }
  }

    return {
      group: townGroup,
      setVisible(visible) {
        townGroup.visible = Boolean(visible);
      },
      update,
      storeArea: store.storeArea,
      productArea: store.productArea,
      interiorArea: store.interiorArea,
    };
  }

function createMirrorStore() {
  const group = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x18171b,
    roughness: 0.95,
    metalness: 0.1,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b2632,
    roughness: 0.3,
    metalness: 0.02,
    transparent: true,
    opacity: 0.65,
  });

  const storefront = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 1.1), baseMaterial);
  storefront.position.set(0, -2.2, -2.1);
  storefront.rotation.z = 0.04;
  storefront.castShadow = true;
  group.add(storefront);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.05), glassMaterial);
  door.position.set(0, -2.0, -1.55);
  group.add(door);

  const windowLeft = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.05), glassMaterial);
  windowLeft.position.set(-1.45, -2.0, -1.55);
  group.add(windowLeft);
  const windowRight = windowLeft.clone();
  windowRight.position.x = 1.45;
  group.add(windowRight);

  const sign = createMirrorTextMesh("FOOD MART", 3.2, 0.4, {
    fontSize: 68,
    background: "rgba(12, 8, 3, 0.7)",
    color: "#f4e3c2",
  });
  sign.position.set(0, -1.1, -1.55);
  group.add(sign);

  const shelf = new THREE.Group();
  shelf.position.set(0, -2.4, -2.55);
  for (let i = 0; i < 3; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.35), baseMaterial);
    plank.position.y = i * 0.25 + 0.05;
    plank.castShadow = true;
    shelf.add(plank);
  }

  const productNames = ["BREAD", "SODA", "MILK", "SNACK"];
  const labelStartX = -1.3;
  for (let i = 0; i < productNames.length; i += 1) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.MeshStandardMaterial({
        color: randomTone([0x37261d, 0x1c1c2a, 0x4b2c2f]),
        roughness: 0.9,
        metalness: 0.04,
      })
    );
    box.position.set(labelStartX + i * 0.7, 0.22, 0);
    box.castShadow = true;
    shelf.add(box);

    const label = createMirrorTextMesh(productNames[i], 0.4, 0.2, {
      fontSize: 36,
      background: "rgba(8,8,8,1)",
      color: "#f0e9d0",
      textureWidth: 256,
      textureHeight: 128,
    });
    label.position.set(box.position.x, 0.46, 0.18);
    label.rotation.x = -Math.PI * 0.17;
    shelf.add(label);
  }

  group.add(shelf);

  const storeArea = {
    minX: -2.2,
    maxX: 2.2,
    minZ: -3.4,
    maxZ: -1.3,
  };
  const productArea = {
    minX: -1.5,
    maxX: 1.5,
    minZ: -2.8,
    maxZ: -2.0,
  };
  const interiorArea = {
    minX: -2.8,
    maxX: 2.8,
    minZ: -4.3,
    maxZ: -1.1,
  };

  return {
    group,
    storeArea,
    productArea,
    interiorArea,
  };
}

function buildHouse(height) {
  const house = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x23272f,
    roughness: 0.92,
    metalness: 0.08,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x191b25,
    roughness: 0.9,
    metalness: 0.04,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f0809,
    roughness: 0.95,
    metalness: 0.02,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, height, 1.8),
    baseMaterial
  );
  body.position.y = -2.75 + height * 0.5 + 0.1;
  body.castShadow = true;
  body.receiveShadow = true;
  body.rotation.z = randomBetween(-0.02, 0.02);
  house.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 1.2, 4),
    roofMaterial
  );
  roof.position.y = body.position.y + height * 0.5 - 0.2;
  roof.rotation.y = Math.PI * 0.25;
  roof.castShadow = true;
  house.add(roof);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x161821,
    emissive: 0x2c1b27,
    emissiveIntensity: 0.12,
    roughness: 0.85,
    metalness: 0.05,
  });

  for (let i = 0; i < 2; i += 1) {
    const window = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.74, 0.08),
      windowMaterial
    );
    window.position.set(-0.5 + i * 1.0, body.position.y, 0.95);
    window.rotation.y = randomBetween(-0.08, 0.08);
    window.castShadow = true;
    house.add(window);
  }

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.2, 0.08),
    trimMaterial
  );
  door.position.set(0, body.position.y - 0.3, 0.95);
  door.castShadow = true;
  door.scale.y = randomBetween(0.98, 1.02);
  door.rotation.z = randomBetween(-0.03, 0.03);
  house.add(door);

  const fence = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 0.08),
    trimMaterial
  );
  fence.position.set(0, -2.1, 1.6);
  fence.rotation.z = randomBetween(-0.04, 0.04);
  fence.castShadow = true;
  house.add(fence);

  return house;
}

function createTwistedTree() {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.2, randomBetween(3.2, 4.1), 9),
    new THREE.MeshStandardMaterial({
      color: 0x120f0d,
      roughness: 0.94,
      metalness: 0.02,
    })
  );
  trunk.castShadow = true;
  tree.add(trunk);

  for (let i = 0; i < 3; i += 1) {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.06, randomBetween(1.2, 2.3), 6),
      new THREE.MeshStandardMaterial({
        color: 0x101314,
        roughness: 0.96,
        metalness: 0.01,
      })
    );
    branch.position.y = 1.4 + i * 0.4;
    branch.position.x = randomBetween(-0.2, 0.2);
    branch.rotation.z = randomBetween(-1.2, 1.2);
    branch.castShadow = true;
    tree.add(branch);
  }

  return tree;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
