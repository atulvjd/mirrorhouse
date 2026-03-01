import * as THREE from "three";

export function createAtmosphere(scene) {
  const atmosphereGroup = new THREE.Group();
  atmosphereGroup.name = "cinematicAtmosphere";
  scene.add(atmosphereGroup);

  let time = 0;

  // --- 1. GLOBAL FOG ---
  // Overwriting scene fog with cinematic but lighter parameters for visibility
  scene.fog = new THREE.FogExp2(0x2a2f3a, 0.03);
  scene.background = new THREE.Color(0x2a2f3a);

  // --- 2. GLOBAL AMBIENT LIGHT ---
  // Soft grey-blue fill to prevent pitch black environments
  const ambient = new THREE.AmbientLight(0x4c5566, 0.4);
  scene.add(ambient);

  // --- 3. MOONLIGHT THROUGH WINDOW ---
  // Stronger pale blue light for cinematic contrast
  const moonLight = new THREE.DirectionalLight(0x9fb6d9, 1.2);
  moonLight.position.set(-5, 6, -3);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.bias = -0.0001;
  atmosphereGroup.add(moonLight);

  // --- 4. SECONDARY FILL LIGHTS ---
  // Subtle warm lights to gently illuminate dark corners
  const createFillLight = (x, y, z) => {
    const fill = new THREE.PointLight(0xd8cbb8, 0.25, 8);
    fill.position.set(x, y, z);
    atmosphereGroup.add(fill);
  };
  createFillLight(4, 1.5, 4);  // Near bookshelf
  createFillLight(0, 1.5, 0);  // Near table area

  // --- 5. WINDOW LIGHT BEAM ---
  const beamGeo = new THREE.ConeGeometry(2, 8, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x9fb6d9,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const lightBeam = new THREE.Mesh(beamGeo, beamMat);
  // Position it to align with the window directional light source
  lightBeam.position.set(-5, 4, -3);
  lightBeam.rotation.x = Math.PI * 0.25;
  lightBeam.rotation.z = Math.PI * 0.15;
  atmosphereGroup.add(lightBeam);

  // --- 6. FLOATING DUST PARTICLES ---
  const dustCount = 450;
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  const dustOffsets = new Float32Array(dustCount);

  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 10;
    dustPositions[i * 3 + 1] = Math.random() * 3;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    dustOffsets[i] = Math.random() * Math.PI * 2;
  }

  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 0.02,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
  atmosphereGroup.add(dustParticles);

  // --- 7. CANDLE LIGHT FLICKER ---
  const candleLights = [];
  const createFlickerLight = (x, y, z) => {
    const light = new THREE.PointLight(0xffaa44, 0.6, 5);
    light.position.set(x, y, z);
    light.castShadow = true;
    atmosphereGroup.add(light);
    candleLights.push({ light, base: 0.6, offset: Math.random() * 10 });
  };

  // Positions corresponding to table candles in furniture.js
  createFlickerLight(0.4, 0.95, 0.2);
  createFlickerLight(-0.3, 0.95, -0.1);

  // --- 8. WIND MOTION MESHES ---
  const windManagedMeshes = [];

  function update(delta) {
    time += delta;

    // Update Dust
    const posAttr = dustGeometry.attributes.position;
    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      const offset = dustOffsets[i];
      
      // Vertical drift
      posAttr.array[idx + 1] += Math.sin(time + offset) * 0.0003;
      // Horizontal drift
      posAttr.array[idx] += Math.sin(time * 0.5 + offset) * 0.0002;
      
      // Boundary check to keep dust in room
      if (posAttr.array[idx + 1] < 0) posAttr.array[idx + 1] = 3;
      if (posAttr.array[idx + 1] > 3) posAttr.array[idx + 1] = 0;
    }
    posAttr.needsUpdate = true;

    // Update Candle Flicker
    candleLights.forEach(cl => {
      cl.light.intensity = cl.base + Math.sin(time * 10 + cl.offset) * 0.15;
    });

    // Subtle wind-like movement
    atmosphereGroup.rotation.y = Math.sin(time * 0.2) * 0.005;
  }

  return {
    update,
  };
}
