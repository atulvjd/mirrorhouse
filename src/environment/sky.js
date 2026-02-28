import * as THREE from "three";

export function createSky(scene) {
  const skyGroup = new THREE.Group();
  skyGroup.name = "environmentSky";

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(200, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0a0d14,
      side: THREE.BackSide,
      fog: false,
    })
  );
  skyGroup.add(skyDome);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0xc5d3ef,
      transparent: true,
      opacity: 0.14,
      fog: false,
    })
  );
  moon.position.set(-52, 56, -110);
  skyGroup.add(moon);

  const primaryStars = createStarLayer(900, 176, 194, 0xbed0ff, 0.9, 0.33);
  const secondaryStars = createStarLayer(520, 165, 188, 0xe8eeff, 0.6, 0.2);
  skyGroup.add(primaryStars.points);
  skyGroup.add(secondaryStars.points);

  const cloudGroup = new THREE.Group();
  const cloudGeometry = new THREE.PlaneGeometry(18, 9);
  const cloudMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a2130,
    transparent: true,
    opacity: 0.085,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const cloudStates = [];

  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
    cloud.position.set(
      randomBetween(-85, 85),
      randomBetween(36, 72),
      randomBetween(-95, 70)
    );
    cloud.rotation.x = -Math.PI * 0.5;
    cloud.rotation.z = randomBetween(0, Math.PI * 2);
    const scale = randomBetween(0.7, 1.45);
    cloud.scale.set(scale, scale * randomBetween(0.8, 1.2), 1);
    cloud.renderOrder = -2;
    cloudGroup.add(cloud);

    cloudStates.push({
      mesh: cloud,
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(0.35, 0.7),
      baseY: cloud.position.y,
    });
  }

  skyGroup.add(cloudGroup);
  scene.add(skyGroup);

  let time = 0;
  const moonStartY = moon.position.y;
  const primaryRot = 0.00035;
  const secondaryRot = -0.00022;

  function update(delta) {
    time += delta;

    primaryStars.material.opacity =
      primaryStars.baseOpacity + Math.sin(time * 0.47) * 0.05;
    secondaryStars.material.opacity =
      secondaryStars.baseOpacity + Math.sin(time * 0.71 + 1.2) * 0.045;

    primaryStars.points.rotation.y += primaryRot * delta * 60;
    secondaryStars.points.rotation.y += secondaryRot * delta * 60;

    moon.position.y = moonStartY + Math.sin(time * 0.03) * 1.15;
    moon.material.opacity = 0.13 + Math.sin(time * 0.14) * 0.015;

    for (let i = 0; i < cloudStates.length; i += 1) {
      const state = cloudStates[i];
      const drift = state.speed * delta;
      state.mesh.position.x += drift;
      if (state.mesh.position.x > 90) {
        state.mesh.position.x = -90;
      }

      state.mesh.position.y = state.baseY + Math.sin(time * 0.12 + state.phase) * 0.45;
      state.mesh.material.opacity = 0.08 + Math.sin(time * 0.2 + state.phase) * 0.018;
    }
  }

  return {
    object: skyGroup,
    update,
    setVisible(visible) {
      skyGroup.visible = visible;
    },
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
