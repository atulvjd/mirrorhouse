import * as THREE from "three";

export function createRoomInterior(scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = "roomInterior";

  const createVintageMaterial = (color, roughness, metalness = 0.05) => {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
    });
  };

  // --- 1. FLOOR ---
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = createVintageMaterial(0x2b1d14, 0.85); // Dark oak
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // --- 2. WALLS ---
  const wallMat = createVintageMaterial(0xd2b48c, 0.9); // Warm vintage beige
  const wallHeight = 3;
  const wallWidth = 10;

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  backWall.position.set(0, wallHeight / 2, -5);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  roomGroup.add(backWall);

  const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  frontWall.position.set(0, wallHeight / 2, 5);
  frontWall.rotation.y = Math.PI;
  frontWall.receiveShadow = true;
  roomGroup.add(frontWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  leftWall.position.set(-5, wallHeight / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  roomGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(wallWidth, wallHeight), wallMat);
  rightWall.position.set(5, wallHeight / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  roomGroup.add(rightWall);

  // --- 3. MOLDINGS ---
  const baseboardMat = createVintageMaterial(0x2b1d14, 0.7, 0.1);
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
  createBaseboard(10, bbDepth, bbHeight, 0, -4.97); 
  createBaseboard(10, bbDepth, bbHeight, 0, 4.97);  
  createBaseboard(10, bbDepth, bbHeight, -4.97, 0, Math.PI / 2); 
  createBaseboard(10, bbDepth, bbHeight, 4.97, 0, Math.PI / 2);  

  // --- 4. CEILING ---
  const ceilingGeo = new THREE.PlaneGeometry(10, 10);
  const ceilingMat = createVintageMaterial(0xdcdcdc, 0.95);
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = wallHeight;
  ceiling.receiveShadow = true;
  roomGroup.add(ceiling);

  // --- 5. CEILING BEAMS ---
  const beamMat = createVintageMaterial(0x2b1d14, 0.8);
  for (let i = -4; i <= 4; i += 2) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 10), beamMat);
    beam.position.set(i, wallHeight - 0.15, 0);
    beam.castShadow = true;
    beam.receiveShadow = true;
    roomGroup.add(beam);
  }

  // --- 6. VINTAGE CARPET ---
  const carpetGeo = new THREE.PlaneGeometry(4, 6);
  const carpetMat = createVintageMaterial(0x3d0000, 1.0); 
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.01, 0);
  carpet.receiveShadow = true;
  roomGroup.add(carpet);

  // --- 7. DOOR FRAME ---
  const frameMat = createVintageMaterial(0x2b1d14, 0.7);
  const frameGroup = new THREE.Group();
  const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.2), frameMat);
  sideLeft.position.set(-0.7, 1.1, -4.9);
  const sideRight = sideLeft.clone();
  sideRight.position.x = 0.7;
  const topPiece = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.15, 0.2), frameMat);
  topPiece.position.set(0, 2.2, -4.9);
  frameGroup.add(sideLeft, sideRight, topPiece);
  frameGroup.children.forEach(part => {
    part.castShadow = true;
    part.receiveShadow = true;
  });
  roomGroup.add(frameGroup);

  scene.add(roomGroup);
  
  return {
    group: roomGroup,
    bounds: {
      minX: -5,
      maxX: 5,
      minZ: -5,
      maxZ: 5,
      minY: 0,
      maxY: 3,
    }
  };
}
