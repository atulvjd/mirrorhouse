import * as THREE from "three";

export function createBungalowInterior(scene) {
  const bungalow = new THREE.Group();
  bungalow.name = "bungalowInterior";

  // --- 1. MATERIALS (PBR Style) ---
  const wallMat1 = new THREE.MeshStandardMaterial({
    color: 0xc7c3b4, // Faded Victorian floral
    roughness: 0.95,
    metalness: 0.02,
    bumpScale: 0.02,
  });
  const wallMat2 = new THREE.MeshStandardMaterial({
    color: 0xb8b1a3, // Cracked paint
    roughness: 0.9,
    metalness: 0.02,
  });
  const wallMat3 = new THREE.MeshStandardMaterial({
    color: 0xa49d8f, // Wooden wall panels
    roughness: 0.85,
    metalness: 0.05,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x6b4a2d, // Aged wooden flooring
    roughness: 0.85,
    metalness: 0.05,
    bumpScale: 0.05,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xe4e1d8, // Ceiling paint
    roughness: 0.95,
  });

  const beamMat = new THREE.MeshStandardMaterial({
    color: 0x5a3d26, // Wooden beams
    roughness: 0.8,
  });

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x4a3523, // Old wooden door
    roughness: 0.9,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8899aa,
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.9,
  });

  const curtainMat = new THREE.MeshStandardMaterial({
    color: 0x6a4f5a, // Dusty curtains
    roughness: 1.0,
    side: THREE.DoubleSide,
  });

  // --- 2. ROOM GEOMETRY (Large Open Layout with Partitions) ---
  const width = 24;
  const length = 24;
  const height = 4.5;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  bungalow.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, length), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  ceiling.receiveShadow = true;
  bungalow.add(ceiling);

  // Outer Walls
  const createWall = (w, h, x, y, z, ry, mat) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    wall.position.set(x, y, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    wall.castShadow = true;
    bungalow.add(wall);
    return wall;
  };

  createWall(width, height, 0, height / 2, -length / 2, 0, wallMat1); // Back Wall
  createWall(width, height, 0, height / 2, length / 2, Math.PI, wallMat1); // Front Wall
  createWall(length, height, -width / 2, height / 2, 0, Math.PI / 2, wallMat2); // Left Wall
  createWall(length, height, width / 2, height / 2, 0, -Math.PI / 2, wallMat2); // Right Wall

  // Interior Partitions
  createWall(10, height, -2, height / 2, 0, 0, wallMat3); // Separates living room & bedroom
  createWall(8, height, 4, height / 2, -4, Math.PI / 2, wallMat3); // Separates dining & bedroom

  // --- 3. CEILING BEAMS ---
  for (let z = -length / 2 + 2; z < length / 2; z += 3) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, 0.3), beamMat);
    beam.position.set(0, height - 0.15, z);
    beam.castShadow = true;
    bungalow.add(beam);
  }
  
  // Crown molding
  const molding1 = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, 0.2), beamMat);
  molding1.position.set(0, height - 0.1, -length / 2 + 0.1);
  bungalow.add(molding1);

  // --- 4. ARCHITECTURAL FEATURES ---
  
  // Windows (Living Room & Dining Room)
  const createWindow = (x, z, ry) => {
    const windowGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.5, 0.2), beamMat);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.3), glassMat);
    glass.position.z = 0.05;
    windowGroup.add(frame, glass);
    
    // Curtains
    const cLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.8, 0.1), curtainMat);
    cLeft.position.set(-1.0, 0, 0.15);
    cLeft.name = "curtain"; // For wind animation
    
    const cRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.8, 0.1), curtainMat);
    cRight.position.set(1.0, 0, 0.15);
    cRight.name = "curtain";

    windowGroup.add(cLeft, cRight);
    windowGroup.position.set(x, 2.2, z);
    windowGroup.rotation.y = ry;
    bungalow.add(windowGroup);

    // Moonlight Beam
    const beamGeo = new THREE.ConeGeometry(2, 10, 16, 1, true);
    const beamMatLight = new THREE.MeshBasicMaterial({
      color: 0x9fb3ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const lightBeam = new THREE.Mesh(beamGeo, beamMatLight);
    lightBeam.position.set(0, -2, 4);
    lightBeam.rotation.x = Math.PI / 3;
    windowGroup.add(lightBeam);
  };
  
  createWindow(-6, length / 2 - 0.1, Math.PI); // Living Room Window
  createWindow(6, length / 2 - 0.1, Math.PI);  // Dining Room Window
  createWindow(-width / 2 + 0.1, -6, Math.PI / 2); // Library Window

  // Staircase (Staircase Hallway area)
  const stairGroup = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.4), floorMat);
    step.position.set(0, i * 0.2, i * 0.4);
    step.castShadow = true;
    step.receiveShadow = true;
    stairGroup.add(step);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 5), beamMat);
  rail.position.set(1.4, 1.2, 2.2);
  rail.rotation.x = 0.45;
  stairGroup.add(rail);
  stairGroup.position.set(-9, 0.1, 8);
  bungalow.add(stairGroup);

  // Basement Door (Basement Door Area)
  const doorGroup = new THREE.Group();
  const bDoor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.1), doorMat);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 }));
  handle.position.set(0.6, 0, 0.08);
  bDoor.add(handle);
  bDoor.castShadow = true;
  doorGroup.add(bDoor);
  doorGroup.position.set(-11.9, 1.2, -8);
  doorGroup.rotation.y = Math.PI / 2;
  
  // Invisible interaction volume for basement door
  const doorTrigger = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), new THREE.MeshBasicMaterial({visible: false}));
  doorTrigger.position.set(0, 0, 1);
  doorTrigger.userData.inspectPrompt = "Open basement door";
  doorTrigger.userData.inspectType = "basement_door";
  doorGroup.add(doorTrigger);
  
  bungalow.add(doorGroup);

  scene.add(bungalow);

  return {
    group: bungalow,
    doorTrigger,
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
