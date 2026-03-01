import * as THREE from "three";

export function createBasementEnvironment(scene) {
  const group = new THREE.Group();
  group.name = "basementGroup";
  group.position.set(0, -6, -8); // Deep below

  const width = 14;
  const length = 16;
  const height = 3.5;

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x7d7a74, // Aged concrete
    roughness: 0.85,
    metalness: 0.1 
  });
  
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x6f6a63, // Aged stone
    roughness: 0.9,
    metalness: 0.05
  });

  // 1. Concrete Room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, length), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, length), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const createWall = (w, h, x, y, z, ry = 0) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wall.position.set(x, y, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    wall.castShadow = true;
    group.add(wall);
  };

  createWall(width, height, 0, height / 2, -length / 2); // Back
  createWall(width, height, 0, height / 2, length / 2, Math.PI); // Front
  createWall(length, height, -width / 2, height / 2, 0, Math.PI / 2); // Left
  createWall(length, height, width / 2, height / 2, 0, -Math.PI / 2); // Right

  // 2. Props & Objects
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  const clothMat = new THREE.MeshStandardMaterial({ color: 0xbdb8ad, roughness: 1.0, side: THREE.DoubleSide });

  // Wooden Crates
  for (let i = 0; i < 8; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), woodMat);
      box.position.set(-5 + Math.random() * 3, 0.4, -6 + Math.random() * 3);
      box.rotation.y = Math.random() * Math.PI;
      box.castShadow = true;
      group.add(box);
  }

  // Covered Furniture
  const coveredGroup = new THREE.Group();
  const form = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), new THREE.MeshBasicMaterial({visible: false}));
  form.position.y = 0.75;
  const cloth = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.6, 16), clothMat);
  cloth.position.y = 0.8;
  cloth.scale.z = 0.8;
  cloth.name = "clothCover";
  coveredGroup.add(form, cloth);
  coveredGroup.position.set(4, 0, -4);
  coveredGroup.castShadow = true;
  group.add(coveredGroup);

  // Dusty Shelves
  const shelf = new THREE.Group();
  const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.5), woodMat);
  shelfFrame.position.set(0, 1.25, 0);
  shelfFrame.castShadow = true;
  shelf.add(shelfFrame);
  shelf.position.set(-6.5, 0, 2);
  shelf.rotation.y = Math.PI / 2;
  group.add(shelf);

  // 3. Subtle Ambient Light
  const ambient = new THREE.AmbientLight(0x202228, 0.25);
  group.add(ambient);

  scene.add(group);

  let time = 0;

  function update(delta) {
      time += delta;
      // Physics sway on cloth
      cloth.rotation.z = Math.sin(time * 0.5) * 0.02;
  }

  return { group, update, inspectables: [] };
}
