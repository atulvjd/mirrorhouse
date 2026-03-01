import * as THREE from "three";

export function createSky(scene) {
  const skyGroup = new THREE.Group();
  skyGroup.name = "environmentSky";

  // Step 3: Cinematic Moonlit Sky
  // Sky Dome with Gradient-like material
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(250, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0c0e1a, // Deep dark purple top
      side: THREE.BackSide,
      fog: false,
    })
  );
  skyGroup.add(skyDome);

  // Horizon Glow
  const horizon = new THREE.Mesh(
    new THREE.CylinderGeometry(250, 250, 100, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x2a304a, // Horizon purple-blue
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide,
      fog: false
    })
  );
  horizon.position.y = -20;
  skyGroup.add(horizon);

  // Large Moon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x9fb3ff, // Pale blue moonlight
      transparent: true,
      opacity: 0.8,
      fog: false,
    })
  );
  moon.position.set(-40, 60, -120); // Positioned behind the bungalow for silhouettes
  skyGroup.add(moon);

  const primaryStars = createStarLayer(1200, 180, 240, 0xbed0ff, 0.8, 0.4);
  skyGroup.add(primaryStars.points);

  // Subtle moving clouds
  const cloudGroup = new THREE.Group();
  const cloudGeometry = new THREE.PlaneGeometry(30, 15);
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a2130,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const cloudStates = [];

  for (let i = 0; i < 15; i += 1) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
    cloud.position.set(
      randomBetween(-120, 120),
      randomBetween(40, 80),
      randomBetween(-150, 50)
    );
    cloud.rotation.x = -Math.PI * 0.5;
    const scale = randomBetween(1.0, 2.5);
    cloud.scale.set(scale, scale * 0.6, 1);
    cloudGroup.add(cloud);

    cloudStates.push({
      mesh: cloud,
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(0.5, 1.2),
    });
  }

  skyGroup.add(cloudGroup);
  scene.add(skyGroup);

  let time = 0;

  function update(delta) {
    time += delta;

    primaryStars.points.rotation.y += 0.0001 * delta * 60;
    moon.material.opacity = 0.75 + Math.sin(time * 0.2) * 0.05;

    for (let i = 0; i < cloudStates.length; i += 1) {
      const state = cloudStates[i];
      state.mesh.position.x += state.speed * delta;
      if (state.mesh.position.x > 150) state.mesh.position.x = -150;
      state.mesh.material.opacity = 0.1 + Math.sin(time * 0.3 + state.phase) * 0.04;
    }
  }

  return {
    object: skyGroup,
    update,
  };
}

function createStarLayer(count, minRadius, maxRadius, color, size, opacity) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const theta = randomBetween(0, Math.PI * 2);
    const phi = randomBetween(0.15, Math.PI * 0.48);
    const radius = randomBetween(minRadius, maxRadius);
    const sinPhi = Math.sin(phi);

    positions[i * 3] = radius * sinPhi * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * sinPhi * Math.sin(theta);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: false,
  });

  return {
    points: new THREE.Points(geometry, material),
    material,
    baseOpacity: opacity,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
