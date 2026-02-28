import * as THREE from "three";

export function createFurniture(interiorGroup, anchors) {
  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = "interiorFurniture";

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1f,
    roughness: 0.9,
    metalness: 0.05,
  });
  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2119,
    roughness: 0.92,
    metalness: 0.05,
  });
  const fadedMaterial = new THREE.MeshStandardMaterial({
    color: 0x59493a,
    roughness: 0.94,
    metalness: 0.03,
  });

  const desk = createDesk(woodMaterial, darkWoodMaterial);
  desk.group.position.copy(anchors.deskRoom);
  desk.group.position.x -= 0.35;
  desk.group.position.z += 0.7;
  desk.group.rotation.y = Math.PI * 0.83;
  desk.group.rotation.z = -0.01;
  furnitureGroup.add(desk.group);

  const chair = createChair(woodMaterial);
  chair.position.copy(anchors.deskRoom);
  chair.position.x += 0.9;
  chair.position.z += 1.2;
  chair.rotation.y = Math.PI * 1.45;
  chair.rotation.z = 0.02;
  furnitureGroup.add(chair);

  const cabinet = createCabinet(darkWoodMaterial, fadedMaterial);
  cabinet.position.copy(anchors.livingRoom);
  cabinet.position.x -= 3.2;
  cabinet.position.z -= 0.6;
  cabinet.rotation.y = Math.PI * 0.47;
  cabinet.rotation.z = -0.01;
  furnitureGroup.add(cabinet);

  const bookshelf = createBookshelf(woodMaterial);
  bookshelf.position.copy(anchors.bedroom);
  bookshelf.position.x -= 1.05;
  bookshelf.position.z += 1.15;
  bookshelf.rotation.y = Math.PI * 0.06;
  bookshelf.rotation.z = 0.015;
  furnitureGroup.add(bookshelf);

  const photoTable = createPhotoTable(woodMaterial, fadedMaterial);
  photoTable.position.copy(anchors.livingRoom);
  photoTable.position.x += 2.4;
  photoTable.position.z -= 0.95;
  photoTable.rotation.y = Math.PI * 0.19;
  photoTable.rotation.z = -0.012;
  furnitureGroup.add(photoTable);

  interiorGroup.add(furnitureGroup);

  return {
    group: furnitureGroup,
    drawer: desk.drawer,
    drawerContentAnchor: desk.contentAnchor,
    photoTable,
  };
}

function createDesk(mainMaterial, detailMaterial) {
  const group = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 1.1), mainMaterial);
  top.position.set(0, 0.82, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const legGeometry = new THREE.BoxGeometry(0.12, 0.8, 0.12);
  const legOffsets = [
    [-0.95, 0.4, -0.44],
    [0.95, 0.4, -0.44],
    [-0.95, 0.4, 0.44],
    [0.95, 0.4, 0.44],
  ];
  for (let i = 0; i < legOffsets.length; i += 1) {
    const [x, y, z] = legOffsets[i];
    const leg = new THREE.Mesh(legGeometry, detailMaterial);
    leg.position.set(x, y, z);
    leg.rotation.z = randomBetween(-0.01, 0.01);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  }

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.56, 0.86), detailMaterial);
  body.position.set(-0.43, 0.56, 0.02);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Drawer assembly with separate sliding front.
  const drawerTrack = new THREE.Group();
  drawerTrack.position.set(-0.43, 0.62, 0.37);

  const drawerFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.24, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x473325,
      roughness: 0.9,
      metalness: 0.04,
    })
  );
  drawerFront.position.set(0, 0, 0);
  drawerFront.castShadow = true;
  drawerFront.receiveShadow = true;
  drawerTrack.add(drawerFront);

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8),
    new THREE.MeshStandardMaterial({
      color: 0x53473c,
      roughness: 0.7,
      metalness: 0.35,
    })
  );
  handle.rotation.z = Math.PI * 0.5;
  handle.position.set(0, 0, 0.07);
  drawerFront.add(handle);

  const drawerInterior = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.2, 0.78),
    new THREE.MeshStandardMaterial({
      color: 0x251b13,
      roughness: 0.95,
      metalness: 0.02,
    })
  );
  drawerInterior.position.set(0, 0, -0.34);
  drawerInterior.castShadow = true;
  drawerInterior.receiveShadow = true;
  drawerTrack.add(drawerInterior);

  const contentAnchor = new THREE.Group();
  contentAnchor.position.set(0, 0.12, -0.26);
  drawerTrack.add(contentAnchor);

  group.add(drawerTrack);

  return {
    group,
    drawer: drawerTrack,
    contentAnchor,
  };
}

function createChair(material) {
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.09, 0.66), material);
  seat.position.y = 0.53;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.08), material);
  back.position.set(0, 0.95, -0.29);
  back.castShadow = true;
  back.receiveShadow = true;
  chair.add(back);

  const legGeometry = new THREE.BoxGeometry(0.08, 0.52, 0.08);
  for (let x = -0.26; x <= 0.26; x += 0.52) {
    for (let z = -0.23; z <= 0.23; z += 0.46) {
      const leg = new THREE.Mesh(legGeometry, material);
      leg.position.set(x, 0.26, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      chair.add(leg);
    }
  }

  return chair;
}

function createCabinet(mainMaterial, panelMaterial) {
  const cabinet = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.62), mainMaterial);
  body.position.y = 1.1;
  body.castShadow = true;
  body.receiveShadow = true;
  cabinet.add(body);

  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.8, 0.04), panelMaterial);
  leftDoor.position.set(-0.36, 1.08, 0.33);
  leftDoor.rotation.y = randomBetween(-0.05, 0.03);
  leftDoor.castShadow = true;
  cabinet.add(leftDoor);

  const rightDoor = leftDoor.clone();
  rightDoor.position.x = 0.36;
  rightDoor.rotation.y = randomBetween(-0.02, 0.06);
  cabinet.add(rightDoor);

  return cabinet;
}

function createBookshelf(material) {
  const shelf = new THREE.Group();

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 0.52), material);
  frame.position.y = 1.25;
  frame.castShadow = true;
  frame.receiveShadow = true;
  shelf.add(frame);

  const shelfBoardGeometry = new THREE.BoxGeometry(1.28, 0.08, 0.45);
  for (let i = 0; i < 4; i += 1) {
    const board = new THREE.Mesh(shelfBoardGeometry, material);
    board.position.set(0, 0.5 + i * 0.52, 0);
    board.castShadow = true;
    board.receiveShadow = true;
    shelf.add(board);
  }

  // Sparse old books.
  for (let i = 0; i < 18; i += 1) {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(
        randomBetween(0.05, 0.12),
        randomBetween(0.2, 0.35),
        randomBetween(0.22, 0.34)
      ),
      new THREE.MeshStandardMaterial({
        color: randomBookTone(),
        roughness: 0.92,
        metalness: 0.02,
      })
    );
    book.position.set(
      randomBetween(-0.52, 0.52),
      randomBetween(0.32, 2.06),
      randomBetween(-0.11, 0.11)
    );
    book.rotation.z = randomBetween(-0.15, 0.15);
    book.castShadow = true;
    shelf.add(book);
  }

  return shelf;
}

function createPhotoTable(mainMaterial, accentMaterial) {
  const table = new THREE.Group();

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.95), mainMaterial);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  table.add(top);

  for (let x = -0.72; x <= 0.72; x += 1.44) {
    for (let z = -0.34; z <= 0.34; z += 0.68) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.74, 0.11), accentMaterial);
      leg.position.set(x, 0.37, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      table.add(leg);
    }
  }

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.52, 0.05),
    new THREE.MeshStandardMaterial({
      color: 0x4b3729,
      roughness: 0.86,
      metalness: 0.08,
    })
  );
  frame.position.set(-0.46, 1.03, -0.1);
  frame.rotation.y = -0.2;
  frame.castShadow = true;
  table.add(frame);

  return table;
}

function randomBookTone() {
  const tones = [0x3c2f2a, 0x4a3d33, 0x2e2a39, 0x473227, 0x3c3b2e];
  return tones[Math.floor(Math.random() * tones.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
