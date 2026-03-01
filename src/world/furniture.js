import * as THREE from "three";

export function createFurniture(roomGroup) {
  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = "vintageFurniture";

  const createAgedMaterial = (color, roughness = 0.8, metalness = 0.05) => {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
    });
  };

  const darkWalnut = createAgedMaterial(0x1a0f0a, 0.4); 
  const agedWood = createAgedMaterial(0x2b1d14, 0.9);   
  const brassMat = createAgedMaterial(0x6b5b30, 0.3, 0.6); 

  // --- 1. ANTIQUE WOODEN TABLE ---
  const table = new THREE.Group();
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 1), darkWalnut);
  tableTop.position.y = 0.75;
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  table.add(tableTop);

  const legGeo = new THREE.BoxGeometry(0.08, 0.75, 0.08);
  const legPositions = [
    [-0.9, 0.375, -0.4], [0.9, 0.375, -0.4],
    [-0.9, 0.375, 0.4], [0.9, 0.375, 0.4]
  ];
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, darkWalnut);
    leg.position.set(...pos);
    leg.castShadow = true;
    leg.receiveShadow = true;
    table.add(leg);
  });
  table.position.set(0, 0, 0); 
  furnitureGroup.add(table);

  // --- 2. VINTAGE DRAWER CABINET ---
  const cabinet = new THREE.Group();
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.5), agedWood);
  cabBody.position.y = 0.45;
  cabBody.castShadow = true;
  cabBody.receiveShadow = true;
  cabinet.add(cabBody);

  // Functional Drawer for the Story System
  const drawerTrack = new THREE.Group();
  drawerTrack.position.set(0, 0.7, 0.2); 
  
  const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.1), agedWood);
  drawerFront.castShadow = true;
  drawerFront.receiveShadow = true;
  drawerTrack.add(drawerFront);

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), brassMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.z = 0.06;
  drawerFront.add(handle);

  const contentAnchor = new THREE.Group();
  contentAnchor.position.set(0, 0.05, -0.2);
  drawerTrack.add(contentAnchor);
  cabinet.add(drawerTrack);

  cabinet.position.set(-3.5, 0, -4.5);
  furnitureGroup.add(cabinet);

  // --- 3. FAMILY PHOTO FRAMES ---
  const photoInteractables = [];
  const createFrame = (x, y, z, ry = 0) => {
    const frameGroup = new THREE.Group();
    const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), agedWood);
    frameGroup.add(frameBorder);
    
    const photoGeo = new THREE.PlaneGeometry(0.4, 0.5);
    const photoMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    photo.position.z = 0.03;
    frameGroup.add(photo);
    
    frameGroup.position.set(x, y, z);
    frameGroup.rotation.y = ry;
    return frameGroup;
  };

  const photo1 = createFrame(-3.5, 1.8, -4.95); 
  const photo2 = createFrame(-2.8, 1.8, -4.95);
  const photo3 = createFrame(-4.2, 1.8, -4.95);
  furnitureGroup.add(photo1, photo2, photo3);

  // --- 4. CANDLE HOLDERS ---
  const createCandle = (x, z) => {
    const candleGroup = new THREE.Group();
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.2, 12), brassMat);
    candleGroup.add(holder);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.9 }));
    wax.position.y = 0.15;
    candleGroup.add(wax);
    candleGroup.position.set(x, 0.8, z);
    return candleGroup;
  };
  table.add(createCandle(0.4, 0.2));
  table.add(createCandle(-0.3, -0.1));

  // --- 5. GRANDFATHER CLOCK ---
  const clock = new THREE.Group();
  const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.4), agedWood);
  clockBody.position.y = 1.2;
  clockBody.castShadow = true;
  clockBody.receiveShadow = true;
  clock.add(clockBody);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 }));
  face.position.set(0, 1.9, 0.21);
  clock.add(face);
  const handMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const hourHand = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.1), handMat);
  hourHand.position.set(0, 1.9, 0.22);
  hourHand.rotation.z = Math.PI * (11/6 + 58/360); 
  clock.add(hourHand);
  const minuteHand = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.15), handMat);
  minuteHand.position.set(0, 1.9, 0.22);
  minuteHand.rotation.z = Math.PI * (58/30);
  clock.add(minuteHand);
  clock.position.set(4.2, 0, -4.5);
  furnitureGroup.add(clock);

  // --- 6. BOOKSHELF ---
  const shelf = new THREE.Group();
  const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.4), agedWood);
  shelfFrame.position.y = 1.1;
  shelf.add(shelfFrame);
  for (let i = 0; i < 4; i++) {
    const level = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.35), agedWood);
    level.position.y = 0.4 + i * 0.5;
    shelf.add(level);
    for (let j = 0; j < 5; j++) {
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.25), new THREE.MeshStandardMaterial({ color: [0x223322, 0x332222, 0x111111][j%3] }));
      book.position.set(-0.4 + j * 0.2, 0.58 + i * 0.5, 0.05);
      book.rotation.z = (Math.random() - 0.5) * 0.3;
      shelf.add(book);
    }
  }
  shelf.position.set(4.2, 0, 4.2);
  shelf.rotation.y = -Math.PI / 4;
  furnitureGroup.add(shelf);

  // --- 7. VINTAGE TRUNK ---
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.6), createAgedMaterial(0x3d0a0a, 0.9));
  trunk.position.set(-3.8, 0.3, 3.5);
  trunk.rotation.y = Math.PI / 6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  furnitureGroup.add(trunk);

  roomGroup.add(furnitureGroup);

  return {
    group: furnitureGroup,
    drawer: drawerTrack,
    drawerContentAnchor: contentAnchor,
    photoInteractables: [] // We'll populate this if needed
  };
}
