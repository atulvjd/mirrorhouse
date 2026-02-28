import * as THREE from "three";

export function createMirrorWorldSky(scene) {
  const skyGroup = new THREE.Group();
  skyGroup.name = "mirrorWorldSky";

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(200, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x05040f,
      side: THREE.BackSide,
      fog: false,
    })
  );
  skyGroup.add(dome);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(4.5, 28, 18),
    new THREE.MeshBasicMaterial({
      color: 0xbf80ff,
      transparent: true,
      opacity: 0.18,
      fog: false,
    })
  );
  moon.position.set(16, 28, -28);
  skyGroup.add(moon);

  const cloudStates = [];
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0x241733,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 12; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 5),
      cloudMaterial.clone()
    );
    cloud.position.set(
      randomBetween(-90, 90),
      randomBetween(18, 32),
      randomBetween(-70, 40)
    );
    cloud.rotation.x = -Math.PI * 0.5;
    cloud.rotation.z = randomBetween(0, Math.PI * 2);
    skyGroup.add(cloud);

    cloudStates.push({
      mesh: cloud,
      speed: randomBetween(0.2, 0.5),
      phase: Math.random() * Math.PI * 2,
    });
  }

  scene.add(skyGroup);

  let time = 0;
  let lightningTimer = randomBetween(5, 12);
  let lightningIntensity = 0;

  function update(delta) {
    time += delta;
    for (const state of cloudStates) {
      state.mesh.position.x += state.speed * delta;
      if (state.mesh.position.x > 100) {
        state.mesh.position.x = -100;
      }
      state.mesh.material.opacity =
        0.18 + Math.sin(time * 0.45 + state.phase) * 0.03;
    }

    lightningTimer -= delta;
    if (lightningTimer <= 0) {
      lightningIntensity = 1;
      lightningTimer = randomBetween(6, 16);
    }

    if (lightningIntensity > 0) {
      const flicker = Math.sin(time * 60) * 0.1;
      moon.material.opacity =
        0.15 + lightningIntensity * 0.25 + flicker * 0.3;
      lightningIntensity = Math.max(0, lightningIntensity - delta * 2.8);
    } else {
      moon.material.opacity =
        0.15 + Math.sin(time * 0.3) * 0.005;
    }
  }

  return {
    group: skyGroup,
    update,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
