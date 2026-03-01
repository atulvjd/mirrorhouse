import * as THREE from "three";

export function createMirrorTown(scene) {
  const townGroup = new THREE.Group();
  townGroup.name = "mirrorTownGroup";

  // 1. Ground: Cobblestone - Updated for Color Clarity
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0xa8a39c, // Road: #a8a39c
    roughness: 0.45, 
    metalness: 0.15 
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  townGroup.add(ground);

  // Architecture Colors - Step 7: Color Clarity
  const wallColorVal = 0xc4bdb1; // Stone: #c4bdb1
  const woodColorVal = 0x6f5745; // Wood: #6f5745
  const roofColors = [0x3f3b3a, 0x4b4644];

  // 2. Building Generator with Mirrored Text
  const createMirroredBuilding = (x, z, w, h, d, label, isTall = false) => {
    const bGroup = new THREE.Group();
    const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
    
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColorVal, roughness: 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: woodColorVal, roughness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    const roof = new THREE.Mesh(
        new THREE.ConeGeometry(w * 0.7, h * 0.4, 4),
        new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9 })
    );
    roof.position.y = h + h * 0.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    bGroup.add(roof);

    // Glowing Windows
    const windowGeo = new THREE.PlaneGeometry(1, 1.5);
    const windowMat = new THREE.MeshStandardMaterial({
        color: 0xf7e2c4,
        emissive: 0xf7e2c4,
        emissiveIntensity: 1.2,
        roughness: 0.2
    });
    
    for (let wy = 3; wy < h - 2; wy += 4) {
        const winLeft = new THREE.Mesh(windowGeo, windowMat);
        winLeft.position.set(-w/4, wy, d/2 + 0.05);
        bGroup.add(winLeft);
        
        const winRight = new THREE.Mesh(windowGeo, windowMat);
        winRight.position.set(w/4, wy, d/2 + 0.05);
        bGroup.add(winRight);
    }

    if (label) {
        const signCanvas = document.createElement("canvas");
        signCanvas.width = 512;
        signCanvas.height = 128;
        const ctx = signCanvas.getContext("2d");
        ctx.fillStyle = "#2f2f2f";
        ctx.fillRect(0, 0, 512, 128);
        ctx.font = "bold 70px 'Courier New', monospace";
        ctx.fillStyle = "#ead9bc";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const reversedLabel = label.split("").reverse().join("");
        ctx.fillText(reversedLabel, 256, 64);

        const signTex = new THREE.CanvasTexture(signCanvas);
        // Using StandardMaterial for sign so it receives light
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(w * 0.8, 0.8),
            new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 })
        );
        sign.position.set(0, 3, d / 2 + 0.1);
        bGroup.add(sign);
    }

    bGroup.position.set(x, 0, z);
    townGroup.add(bGroup);
  };

  // Populate Town key locations
  createMirroredBuilding(-15, -20, 8, 12, 8, "BAKERY");
  createMirroredBuilding(15, -22, 10, 15, 10, "BOOKS");
  createMirroredBuilding(-20, 10, 12, 18, 12, "CLOTHING", true);
  createMirroredBuilding(25, 5, 8, 10, 6, "7-ELEVEN");
  createMirroredBuilding(0, 30, 15, 25, 15, "TOWN HALL", true);
  createMirroredBuilding(-30, -5, 10, 14, 10, "LIBRARY");

  // 3. Vintage Street Lamps (Victorian Iron)
  const lampPositions = [
      [-10, -10], [10, -10], [-10, 10], [10, 10], [30, -5], [-30, -5],
      [-5, -25], [5, 25], [-25, 15], [25, -15], [0, 15], [0, -15],
      [-20, -5], [20, 5], [-15, 5]
  ];
  
  const lamps = [];
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.8, metalness: 0.5 });
  
  lampPositions.forEach(pos => {
      const lampGroup = new THREE.Group();
      
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 4), darkMetal);
      post.position.y = 2;
      post.castShadow = true;
      lampGroup.add(post);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.05), darkMetal);
      arm.position.set(0.3, 3.8, 0);
      lampGroup.add(arm);

      const light = new THREE.PointLight(0xffd7a6, 4.5, 16, 2);
      light.position.set(0.6, 3.5, 0);
      light.castShadow = true;
      lampGroup.add(light);
      
      // God Rays from Street Lights
      const beamGeo = new THREE.ConeGeometry(0.8, 4, 16, 1, true);
      const beamMat = new THREE.MeshStandardMaterial({
          color: 0xffd9a8,
          transparent: true,
          opacity: 0.15,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
          emissive: 0xffd9a8,
          emissiveIntensity: 0.5
      });
      const lightBeam = new THREE.Mesh(beamGeo, beamMat);
      lightBeam.position.set(0.6, 1.5, 0);
      lightBeam.rotation.x = Math.PI;
      lampGroup.add(lightBeam);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0xffd7a6, emissive: 0xffd7a6 }));
      head.position.set(0.6, 3.5, 0);
      lampGroup.add(head);

      lampGroup.position.set(pos[0], 0, pos[1]);
      townGroup.add(lampGroup);
      lamps.push({ light, offset: Math.random() * 10 });
  });

  // 4. Props (Benches, Fountains, Mailboxes)
  const benchGeo = new THREE.BoxGeometry(2, 0.5, 0.8);
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
  
  const createBench = (x, z, ry) => {
      const bench = new THREE.Mesh(benchGeo, benchMat);
      bench.position.set(x, 0.25, z);
      bench.rotation.y = ry;
      bench.castShadow = true;
      townGroup.add(bench);
  };
  
  createBench(-8, -12, 0);
  createBench(8, 12, Math.PI);
  createBench(-12, 8, Math.PI / 2);

  // 5. Foggy Surroundings (Silhouettes)
  for (let i = 0; i < 30; i++) {
      const dist = 50 + Math.random() * 50;
      const angle = Math.random() * Math.PI * 2;
      const tree = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 1.5, 20),
          new THREE.MeshBasicMaterial({ color: 0x222533 })
      );
      tree.position.set(Math.cos(angle) * dist, 10, Math.sin(angle) * dist);
      townGroup.add(tree);
  }

  scene.add(townGroup);

  return {
    group: townGroup,
    update: (time) => {
        lamps.forEach(l => {
            l.light.intensity = 2.5 + Math.sin(time * 15 + l.offset) * 0.3;
        });
    }
  };
}