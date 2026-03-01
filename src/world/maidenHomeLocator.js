import * as THREE from "three";

export function createMaidenHome(scene) {
  const homeGroup = new THREE.Group();
  homeGroup.name = "maidenHome";

  // Position it in a specific part of the city
  const homePosition = new THREE.Vector3(-30, 0, 30);
  homeGroup.position.copy(homePosition);

  // --- 1. EXTERIOR ---
  const pinkWallMat = new THREE.MeshStandardMaterial({
      color: 0xaa7788, // Faded, cracked pink
      roughness: 0.95
  });
  const houseBody = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 8), pinkWallMat);
  houseBody.position.y = 4;
  houseBody.castShadow = true;
  houseBody.receiveShadow = true;
  homeGroup.add(houseBody);

  const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 4, 4), roofMat);
  roof.position.y = 10;
  roof.rotation.y = Math.PI / 4;
  homeGroup.add(roof);

  // --- 2. THE IRON GATE ---
  const gateGroup = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.5 });
  
  // Left gate post
  const postLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), ironMat);
  postLeft.position.set(-2, 1.5, 6);
  homeGroup.add(postLeft);
  
  // Right gate post
  const postRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), ironMat);
  postRight.position.set(2, 1.5, 6);
  homeGroup.add(postRight);

  // The actual moving gate
  const gateDoor = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.1), ironMat);
  gateDoor.position.set(1.75, 1.25, 0); // Offset for hinge pivot
  gateGroup.position.set(-1.75, 0, 6); // Hinge position
  gateGroup.add(gateDoor);
  homeGroup.add(gateGroup);

  // --- 3. ORCHIDS & BLOSSOMS ---
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x446644, side: THREE.DoubleSide });
  const blossomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  
  // Vines on wall
  for (let i = 0; i < 20; i++) {
      const vine = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), leafMat);
      vine.position.set(-5.1, 1 + Math.random() * 6, -3 + Math.random() * 6);
      vine.rotation.y = -Math.PI / 2;
      vine.rotation.z = Math.random() * Math.PI;
      homeGroup.add(vine);
  }

  // Blossom tree outside
  const treeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 5), new THREE.MeshStandardMaterial({ color: 0x2b1d14 }));
  treeBody.position.set(-6, 2.5, 8);
  homeGroup.add(treeBody);
  
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), blossomMat);
  leaves.position.set(-6, 5, 8);
  homeGroup.add(leaves);

  // --- 4. FALLING PETALS SYSTEM ---
  const petalGeo = new THREE.PlaneGeometry(0.1, 0.1);
  const petals = [];
  for (let i = 0; i < 30; i++) {
      const p = new THREE.Mesh(petalGeo, blossomMat);
      p.position.set(-6 + (Math.random() - 0.5) * 6, Math.random() * 6, 8 + (Math.random() - 0.5) * 6);
      homeGroup.add(p);
      petals.push(p);
  }

  // Dim lantern
  const lanternLight = new THREE.PointLight(0xffcc88, 0.8, 10);
  lanternLight.position.set(2.5, 3, 6);
  homeGroup.add(lanternLight);

  scene.add(homeGroup);

  function update(time, delta) {
      // Gentle wind on vines and tree
      leaves.rotation.z = Math.sin(time) * 0.05;
      
      // Falling petals
      petals.forEach(p => {
          p.position.y -= delta * 0.5;
          p.position.x += Math.sin(time + p.position.y) * delta * 0.5;
          p.rotation.x += delta;
          p.rotation.y += delta;
          if (p.position.y < 0) {
              p.position.y = 6;
              p.position.x = -6 + (Math.random() - 0.5) * 6;
          }
      });
  }

  return {
      group: homeGroup,
      gateGroup: gateGroup,
      triggerPosition: new THREE.Vector3(homePosition.x, 0, homePosition.z + 8),
      interiorPosition: new THREE.Vector3(homePosition.x, 0, homePosition.z),
      update
  };
}
