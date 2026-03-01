import * as THREE from "three";

export function createRoomInterior(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = "roomInterior";

  const textureLoader = new THREE.TextureLoader();

  // Helper for creating vintage materials with specific properties
  const createVintageMaterial = (color, roughness, metalness = 0.05) => {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
    });
  };

  // --- 1. FLOOR ---
  // Dark aged wood planks
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = createVintageMaterial(0x1a0f0a, 0.85); // Very dark brown
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // --- 2. WALLS ---
  // Victorian Wallpaper: Dark Burgundy/Faded Gold style
  const wallMat = createVintageMaterial(0x2b0a0a, 0.9); // Deep burgundy
  const wallHeight = 3;
  const wallWidth = 10;

  // Back Wall
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  backWall.position.set(0, wallHeight / 2, -5);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  roomGroup.add(backWall);

  // Front Wall (with opening for door later)
  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  frontWall.position.set(0, wallHeight / 2, 5);
  frontWall.rotation.y = Math.PI;
  frontWall.receiveShadow = true;
  roomGroup.add(frontWall);

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  leftWall.position.set(-5, wallHeight / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  rightWall.position.set(5, wallHeight / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // --- 3. MOLDINGS (Baseboards) ---
  const baseboardMat = createVintageMaterial(0x150c08, 0.7, 0.1); // Dark walnut
  const bbHeight = 0.15;
  const bbDepth = 0.05;

  const createBaseboard = (w, d, h, x, z, ry = 0) => {
    const bb = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseboardMat);
    bb.position.set(x, h / 2, z);
    bb.rotation.y = ry;
    bb.castShadow = true;
    bb.receiveShadow = true;
    roomGroup.add(bb);
  };

  createBaseboard(10, bbDepth, bbHeight, 0, -4.97); // Back
  createBaseboard(10, bbDepth, bbHeight, 0, 4.97);  // Front
  createBaseboard(10, bbDepth, bbHeight, -4.97, 0, Math.PI / 2); // Left
  createBaseboard(10, bbDepth, bbHeight, 4.97, 0, Math.PI / 2);  // Right

  // --- 4. CEILING ---
  const ceilingGeo = new THREE.PlaneGeometry(10, 10);
  const ceilingMat = createVintageMaterial(0xdcdcdc, 0.95); // Yellowed white aged plaster
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  ceiling.receiveShadow = true;
  roomGroup.add(ceiling);

  // --- 5. CEILING BEAMS ---
  const beamMat = createVintageMaterial(0x150c08, 0.8);
  for (let i = -4; i <= 4; i += 2) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 10), beamMat);
    beam.position.set(i, wallHeight - 0.15, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    roomGroup.add(beam);
  }

  // --- 6. VINTAGE CARPET ---
  // Persian Rug: Deep Red / Dark Gold
  const carpetGeo = new THREE.PlaneGeometry(4, 6);
  const carpetMat = createVintageMaterial(0x3d0000, 1.0); // Rough deep red
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.01, 0); // Slightly above floor
  carpet.receiveShadow = true;
  roomGroup.add(carpet);

  // --- 7. DOOR FRAME ---
  const frameMat = createVintageMaterial(0x1a0f0a, 0.7);
  const frameGroup = new THREE.Group();
  
  // Vertical sides
  const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.2), frameMat);
  sideLeft.position.set(-0.7, 1.1, -4.9);
  
  const sideRight = sideLeft.clone();
  sideRight.position.x = 0.7;
  
  // Top piece
  const topPiece = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.15, 0.2), frameMat);
  topPiece.position.set(0, 2.2, -4.9);

  frameGroup.add(sideLeft, sideRight, topPiece);
  frameGroup.children.forEach(part => {
    part.castShadow = true;
    part.receiveShadow = true;
  });
  roomGroup.add(frameGroup);

  scene.add(roomGroup);
  return roomGroup;
}
