import * as THREE from "three";

export function createBungalowInterior(scene) {
  const bungalow = new THREE.Group();
  bungalow.name = "bungalowInterior";

  const textureLoader = new THREE.TextureLoader();

  // --- 1. MATERIALS (PBR Style) ---
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c, // Vintage beige
    roughness: 0.9,
    metalness: 0.02,
    name: "wallpaperMaterial"
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2b1d14, // Dark oak
    roughness: 0.8,
    metalness: 0.05,
    name: "woodFloorMaterial"
  });

  const walnutMat = new THREE.MeshStandardMaterial({
    color: 0x1a0f0a, // Dark walnut for beams/trims
    roughness: 0.7,
    metalness: 0.05
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.9
  });

  const maroonFabric = new THREE.MeshStandardMaterial({
    color: 0x3d0a0a, // Deep burgundy
    roughness: 1.0,
    metalness: 0
  });

  // --- 2. ROOM GEOMETRY (12x14x4.5) ---
  const width = 12;
  const length = 14;
  const height = 4.5;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  bungalow.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, length), new THREE.MeshStandardMaterial({ color: 0xdcdcdc, roughness: 0.9 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  ceiling.receiveShadow = true;
  bungalow.add(ceiling);

  // Walls
  const createWall = (w, h, x, y, z, ry = 0) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wall.position.set(x, y, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    wall.castShadow = true;
    bungalow.add(wall);
    return wall;
  };

  createWall(width, height, 0, height / 2, -length / 2); // Back Wall
  createWall(width, height, 0, height / 2, length / 2, Math.PI); // Front Wall
  createWall(length, height, -width / 2, height / 2, 0, Math.PI / 2); // Left Wall
  createWall(length, height, width / 2, height / 2, 0, -Math.PI / 2); // Right Wall

  // --- 3. ARCHITECTURAL DETAILS ---
  
  // Ceiling Beams
  for (let i = -width / 2 + 1; i < width / 2; i += 2) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, length), walnutMat);
    beam.position.set(i, height - 0.2, 0);
    beam.castShadow = true;
    bungalow.add(beam);
  }

  // Windows (Tall Victorian)
  const createWindow = (x, z, ry) => {
    const windowGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 3.5, 0.2), walnutMat);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.3), glassMat);
    glass.position.z = 0.05;
    windowGroup.add(frame, glass);
    windowGroup.position.set(x, 2.2, z);
    windowGroup.rotation.y = ry;
    bungalow.add(windowGroup);

    // Moonlight silhouette outside window
    const silhouette = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 5),
        new THREE.MeshBasicMaterial({ color: 0x050510, side: THREE.DoubleSide })
    );
    silhouette.position.set(x * 1.1, 2.2, z * 1.1);
    silhouette.rotation.y = ry;
    bungalow.add(silhouette);
  };
  createWindow(0, -length / 2 + 0.1, 0); // Window on back wall

  // Curtains
  const curtainLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.8, 0.1), maroonFabric);
  curtainLeft.position.set(-1.1, 2.2, -length / 2 + 0.3);
  bungalow.add(curtainLeft);

  const curtainRight = curtainLeft.clone();
  curtainRight.position.x = 1.1;
  bungalow.add(curtainRight);

  // --- 4. ROOM AREAS ---

  // Staircase Entrance (Visual Only)
  const stairGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.3), floorMat);
    step.position.set(0, i * 0.2, i * 0.3);
    stairGroup.add(step);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 2.5), walnutMat);
  rail.position.set(1, 1, 0.8);
  rail.rotation.x = 0.6;
  stairGroup.add(rail);
  stairGroup.position.set(4, 0.1, 4);
  stairGroup.rotation.y = -Math.PI / 2;
  bungalow.add(stairGroup);

  // Dining Area Corner
  const diningGroup = new THREE.Group();
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 32), walnutMat);
  table.position.y = 0.8;
  const tablecloth = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.02, 32), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1.0 }));
  tablecloth.position.y = 0.83;
  diningGroup.add(table, tablecloth);
  
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8), walnutMat);
  leg.position.y = 0.4;
  diningGroup.add(leg);

  diningGroup.position.set(-4, 0, 4);
  bungalow.add(diningGroup);

  // Basement Door
  const doorGroup = new THREE.Group();
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 0.1), floorMat);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
  handle.position.set(0.4, 0, 0.08);
  doorGroup.add(door, handle);
  doorGroup.position.set(width / 2 - 0.1, 1.2, -2);
  doorGroup.rotation.y = -Math.PI / 2;
  bungalow.add(doorGroup);

  // --- 5. RUGS & CARPET ---
  const persianRug = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 8),
    new THREE.MeshStandardMaterial({ color: 0x3d0000, roughness: 1.0 }) // Maroon Persian Rug placeholder
  );
  persianRug.rotation.x = -Math.PI / 2;
  persianRug.position.set(0, 0.01, 0);
  persianRug.receiveShadow = true;
  bungalow.add(persianRug);

  scene.add(bungalow);

  return {
    group: bungalow,
    bounds: {
        minX: -width / 2,
        maxX: width / 2,
        minZ: -length / 2,
        maxZ: length / 2,
        minY: 0,
        maxY: height
    }
  };
}
