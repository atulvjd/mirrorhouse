import * as THREE from "three";

export function createLighting(scene) {
  const lightingGroup = new THREE.Group();
  lightingGroup.name = "environmentLighting";

  const moonLight = new THREE.DirectionalLight(0xb7c8ea, 0.35);
  moonLight.position.set(10, 20, 10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.left = -40;
  moonLight.shadow.camera.right = 40;
  moonLight.shadow.camera.top = 40;
  moonLight.shadow.camera.bottom = -40;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 80;
  lightingGroup.add(moonLight);

  const lampStates = [];
  const lampPositions = [
    [-2.4, 4.3],
    [2.2, 2.3],
    [-1.9, -0.5],
    [2.05, -2.8],
    [-1.65, -5.3],
  ];

  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e2025,
    roughness: 0.82,
    metalness: 0.5,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a5a32,
    emissive: 0x8b6c2e,
    emissiveIntensity: 0.52,
    roughness: 0.38,
    metalness: 0.1,
  });

  for (let i = 0; i < lampPositions.length; i += 1) {
    const [x, z] = lampPositions[i];
    const lamp = new THREE.Group();

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.3, 12), metalMaterial);
    pole.position.y = 1.65;
    pole.castShadow = true;
    pole.receiveShadow = true;
    lamp.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), metalMaterial);
    arm.position.set(0.28, 3.22, 0);
    arm.castShadow = true;
    lamp.add(arm);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), glassMaterial);
    head.position.set(0.64, 2.95, 0);
    head.castShadow = true;
    lamp.add(head);

    const bulbLight = new THREE.PointLight(0xffd58a, 0.6, 10);
    bulbLight.position.set(0.64, 2.95, 0);
    bulbLight.castShadow = true;
    lamp.add(bulbLight);

    const lightVolume = new THREE.Mesh(
      new THREE.ConeGeometry(0.58, 2.5, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffd58a,
        transparent: true,
        opacity: 0.075,
        depthWrite: false,
      })
    );
    lightVolume.position.set(0.64, 1.75, 0);
    lightVolume.rotation.x = Math.PI;
    lamp.add(lightVolume);

    lamp.position.set(x, 0, z);
    lamp.rotation.y = randomBetween(-0.18, 0.18);
    lightingGroup.add(lamp);

    lampStates.push({
      light: bulbLight,
      volume: lightVolume.material,
      baseIntensity: 0.6,
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(5.5, 8.8),
    });
  }

  scene.add(lightingGroup);

  let time = 0;

  function update(delta) {
    time += delta;

    for (let i = 0; i < lampStates.length; i += 1) {
      const state = lampStates[i];
      const pulse = Math.sin(time * 0.8 + state.phase) * 0.045;
      const flutter =
        Math.sin(time * state.speed + state.phase * 1.9) * 0.06 +
        Math.sin(time * (state.speed * 1.7) + state.phase * 0.5) * 0.03;

      const intensity = Math.max(0.28, state.baseIntensity + pulse + flutter);
      state.light.intensity = intensity;
      state.volume.opacity = 0.06 + intensity * 0.032;
    }
  }

  return {
    object: lightingGroup,
    moonLight,
    update,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
