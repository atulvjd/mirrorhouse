import * as THREE from "three";

export function createBasementEnvironment(scene) {
  const group = new THREE.Group();
  group.name = "basementGroup";
  group.position.set(0, -5.5, -10); // Located deep below the living room

  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x333333, 
    roughness: 0.9,
    metalness: 0.1 
  });
  
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, 
    roughness: 1.0 
  });

  // 1. Concrete Room
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const createWall = (w, h, x, y, z, ry = 0) => {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    wall.position.set(x, y, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    group.add(wall);
  };

  createWall(12, 5, 0, 2.5, -6); // Back
  createWall(12, 5, -6, 2.5, 0, Math.PI / 2); // Left
  createWall(12, 5, 6, 2.5, 0, -Math.PI / 2); // Right

  // 2. Exposed Pipes & Beams
  for (let i = -5; i < 6; i += 3) {
    const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 12),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 4.8, i);
    group.add(pipe);
  }

  // 3. Storage Boxes
  const boxGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(-4 + Math.random() * 8, 0.3, -4 + Math.random() * 8);
      box.rotation.y = Math.random() * Math.PI;
      box.castShadow = true;
      group.add(box);
  }

  // 4. Subtle Basement Fog
  const weakAmbient = new THREE.PointLight(0x445566, 0.1, 15);
  weakAmbient.position.set(0, 4, 0);
  group.add(weakAmbient);

  scene.add(group);

  return { group, weakAmbient, inspectables: [] };
}
