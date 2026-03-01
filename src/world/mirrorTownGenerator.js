import * as THREE from "three";

export function createMirrorTown(scene) {
  const townGroup = new THREE.Group();
  townGroup.name = "mirrorTownGroup";

  // 1. Ground: Cobblestone
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, 
    roughness: 0.9,
    metalness: 0.1 
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  townGroup.add(ground);

  // 2. Building Generator with Mirrored Text
  const createMirroredBuilding = (x, z, w, h, d, color, label) => {
    const bGroup = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 })
    );
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    // Add Mirrored Shop Sign
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext("2d");
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = "bold 80px 'Courier New', monospace";
    ctx.fillStyle = "#ead9bc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // THE MIRROR RULE: Reverse the text
    const reversedLabel = label.split("").reverse().join("");
    ctx.fillText(reversedLabel, 256, 64);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.8, 0.8),
        new THREE.MeshBasicMaterial({ map: signTex })
    );
    sign.position.set(0, h * 0.7, d / 2 + 0.05);
    bGroup.add(sign);

    bGroup.position.set(x, 0, z);
    townGroup.add(bGroup);
  };

  // Populate Town key locations
  createMirroredBuilding(-15, -20, 8, 12, 8, 0x2a2a35, "BAKERY");
  createMirroredBuilding(15, -22, 10, 15, 10, 0x352a2a, "BOOKS");
  createMirroredBuilding(-20, 10, 12, 18, 12, 0x2a352a, "CLOTHING");
  createMirroredBuilding(25, 5, 8, 10, 6, 0x222222, "7-ELEVEN");
  
  // 3. Street Lamps (Flickering)
  const lampPositions = [
      [-10, -10], [10, -10], [-10, 10], [10, 10], [30, -5], [-30, -5]
  ];
  const lamps = [];
  lampPositions.forEach(pos => {
      const lampGroup = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 5), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      post.position.y = 2.5;
      lampGroup.add(post);

      const light = new THREE.PointLight(0xffddaa, 0.8, 15);
      light.position.set(0, 5, 0);
      lampGroup.add(light);
      
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xffddaa }));
      head.position.y = 5;
      lampGroup.add(head);

      lampGroup.position.set(pos[0], 0, pos[1]);
      townGroup.add(lampGroup);
      lamps.push({ light, offset: Math.random() * 10 });
  });

  // 4. Foggy Surroundings (Silhouettes)
  for (let i = 0; i < 20; i++) {
      const dist = 60 + Math.random() * 40;
      const angle = Math.random() * Math.PI * 2;
      const tree = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 1.5, 20),
          new THREE.MeshBasicMaterial({ color: 0x050505 })
      );
      tree.position.set(Math.cos(angle) * dist, 10, Math.sin(angle) * dist);
      townGroup.add(tree);
  }

  scene.add(townGroup);

  return {
    group: townGroup,
    update: (time) => {
        lamps.forEach(l => {
            l.light.intensity = 0.6 + Math.sin(time * 15 + l.offset) * 0.4;
        });
    }
  };
}
