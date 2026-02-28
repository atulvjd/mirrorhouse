import * as THREE from "three";

export function createBasementEnvironment(scene) {
  const basement = new THREE.Group();
  basement.name = "basementEnvironment";

  const floorY = -2.82;
  const roomCenterZ = -17.3;
  const roomWidth = 14;
  const roomDepth = 14;
  const roomHeight = 3.8;

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b3b39,
    roughness: 0.97,
    metalness: 0.02,
  });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x434746,
    roughness: 0.95,
    metalness: 0.03,
  });
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b2d21,
    roughness: 0.9,
    metalness: 0.05,
  });
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: 0x46514b,
    roughness: 0.84,
    metalness: 0.4,
  });

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(roomWidth, 0.18, roomDepth),
    concreteMaterial
  );
  floor.position.set(0, floorY, roomCenterZ);
  floor.receiveShadow = true;
  basement.add(floor);

  addWall(basement, stoneMaterial, roomWidth, roomHeight, 0.22, 0, floorY + roomHeight * 0.5, roomCenterZ - roomDepth * 0.5);
  addWall(basement, stoneMaterial, roomWidth, roomHeight, 0.22, 0, floorY + roomHeight * 0.5, roomCenterZ + roomDepth * 0.5);
  addWall(basement, stoneMaterial, 0.22, roomHeight, roomDepth, -roomWidth * 0.5, floorY + roomHeight * 0.5, roomCenterZ);
  addWall(basement, stoneMaterial, 0.22, roomHeight, roomDepth, roomWidth * 0.5, floorY + roomHeight * 0.5, roomCenterZ);

  const weakAmbient = new THREE.AmbientLight(0x6b6f66, 0.08);
  basement.add(weakAmbient);

  const inspectables = [];

  // Floor stains.
  for (let i = 0; i < 18; i += 1) {
    const stain = new THREE.Mesh(
      new THREE.CylinderGeometry(
        randomBetween(0.3, 1.0),
        randomBetween(0.3, 1.0),
        randomBetween(0.01, 0.03),
        14
      ),
      new THREE.MeshStandardMaterial({
        color: randomTone([0x2a2928, 0x33322f, 0x2f3128]),
        roughness: randomBetween(0.78, 0.98),
        metalness: 0.02,
      })
    );
    stain.position.set(
      randomBetween(-6, 6),
      floorY + 0.06,
      randomBetween(roomCenterZ - 5.5, roomCenterZ + 5.5)
    );
    stain.rotation.y = randomBetween(0, Math.PI * 2);
    stain.receiveShadow = true;
    basement.add(stain);
  }

  // Wooden supports.
  for (let x = -5; x <= 5; x += 2.5) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, roomHeight - 0.2, 0.28),
      beamMaterial
    );
    post.position.set(x, floorY + (roomHeight - 0.2) * 0.5, roomCenterZ - 0.9);
    post.rotation.z = randomBetween(-0.025, 0.025);
    post.castShadow = true;
    post.receiveShadow = true;
    basement.add(post);
  }

  // Rusty pipe runs.
  const pipes = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 10.5, 12),
      pipeMaterial
    );
    pipe.rotation.z = Math.PI * 0.5;
    pipe.position.set(
      -2.6 + i * 1.35,
      floorY + roomHeight - 0.45 + randomBetween(-0.1, 0.12),
      roomCenterZ - 4.65 + randomBetween(-0.06, 0.06)
    );
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    pipes.add(pipe);

    const rust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.086, randomBetween(0.14, 0.28), 10),
      new THREE.MeshStandardMaterial({
        color: 0x5c3927,
        roughness: 1,
        metalness: 0,
      })
    );
    rust.rotation.z = Math.PI * 0.5;
    rust.position.copy(pipe.position);
    rust.position.x += randomBetween(-4.2, 4.2);
    pipes.add(rust);
  }
  basement.add(pipes);
  pipes.userData.inspectType = "inspect";
  pipes.userData.inspectPrompt = "Press E to inspect";
  inspectables.push({
    object: pipes,
    text: "The pipes are warm.\nWater shouldn't be running down here.",
  });

  // Old shelves and boxes.
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a332b,
    roughness: 0.92,
    metalness: 0.05,
  });
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0x4b4034,
    roughness: 0.9,
    metalness: 0.02,
  });

  const shelf = createShelf(shelfMaterial);
  shelf.position.set(-5.6, floorY + 1.3, roomCenterZ + 1.7);
  shelf.rotation.y = Math.PI * 0.5;
  basement.add(shelf);
  shelf.userData.inspectType = "inspect";
  shelf.userData.inspectPrompt = "Press E to inspect";
  inspectables.push({
    object: shelf,
    text: "Rot and mildew.\nNothing useful, just old jars and dust.",
  });

  const crateCluster = new THREE.Group();
  for (let i = 0; i < 11; i += 1) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.35, 1.0),
        randomBetween(0.22, 0.75),
        randomBetween(0.35, 1.0)
      ),
      boxMaterial
    );
    box.position.set(
      randomBetween(-4.8, -1.6),
      floorY + box.geometry.parameters.height * 0.5,
      randomBetween(roomCenterZ - 3.5, roomCenterZ + 3.8)
    );
    box.rotation.y = randomBetween(0, Math.PI * 2);
    box.rotation.z = randomBetween(-0.07, 0.07);
    box.castShadow = true;
    box.receiveShadow = true;
    crateCluster.add(box);
  }
  basement.add(crateCluster);
  crateCluster.userData.inspectType = "inspect";
  crateCluster.userData.inspectPrompt = "Press E to inspect";
  inspectables.push({
    object: crateCluster,
    text: "Broken boxes.\nSomeone searched these long ago.",
  });

  const wallPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0x2e3a31,
      roughness: 1,
      metalness: 0,
    })
  );
  wallPatch.position.set(6.88, floorY + 1.7, roomCenterZ - 0.8);
  wallPatch.rotation.y = -Math.PI * 0.5;
  basement.add(wallPatch);
  wallPatch.userData.inspectType = "inspect";
  wallPatch.userData.inspectPrompt = "Press E to inspect";
  inspectables.push({
    object: wallPatch,
    text: "Damp stains climb the wall like fingerprints.",
  });

  scene.add(basement);

  return {
    group: basement,
    weakAmbient,
    inspectables,
    floorY,
    roomCenterZ,
    setVisible(visible) {
      basement.visible = visible;
    },
  };
}

function createShelf(material) {
  const shelf = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.5, 0.5), material);
  frame.castShadow = true;
  frame.receiveShadow = true;
  shelf.add(frame);

  for (let i = 0; i < 4; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.08, 0.44), material);
    plank.position.y = -0.95 + i * 0.58;
    plank.castShadow = true;
    plank.receiveShadow = true;
    shelf.add(plank);
  }

  for (let i = 0; i < 16; i += 1) {
    const jar = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.08, 0.18),
        randomBetween(0.12, 0.35),
        randomBetween(0.08, 0.18)
      ),
      new THREE.MeshStandardMaterial({
        color: randomTone([0x4f4b43, 0x5b563f, 0x3f4a46]),
        roughness: 0.82,
        metalness: 0.08,
      })
    );
    jar.position.set(
      randomBetween(-1.12, 1.12),
      randomBetween(-0.9, 0.9),
      randomBetween(-0.16, 0.16)
    );
    jar.castShadow = true;
    shelf.add(jar);
  }

  return shelf;
}

function addWall(group, material, w, h, d, x, y, z) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
}

function randomTone(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
