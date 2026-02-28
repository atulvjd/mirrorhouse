import * as THREE from "three";

export function createInteriorLighting(scene) {
  const group = new THREE.Group();
  group.name = "interiorLighting";

  const ambient = new THREE.AmbientLight(0x8f8372, 0.15);
  group.add(ambient);

  const moonLight = new THREE.DirectionalLight(0x95aed6, 0.22);
  moonLight.position.set(-4, 4.8, -3.4);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.left = -8;
  moonLight.shadow.camera.right = 8;
  moonLight.shadow.camera.top = 8;
  moonLight.shadow.camera.bottom = -8;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 20;
  group.add(moonLight);

  const lampStates = [];
  const lampPositions = [
    [-2.6, 2.2, -8.4],
    [0, 2.15, -12.4],
    [2.7, 2.1, -13.3],
  ];

  for (let i = 0; i < lampPositions.length; i += 1) {
    const [x, y, z] = lampPositions[i];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0x3f3528,
        emissive: 0x9b7642,
        emissiveIntensity: 0.9,
        roughness: 0.8,
        metalness: 0.14,
      })
    );
    bulb.position.set(x, y, z);
    bulb.castShadow = true;
    group.add(bulb);

    const light = new THREE.PointLight(0xffd8a8, randomBetween(0.34, 0.48), 8);
    light.position.copy(bulb.position);
    light.castShadow = true;
    group.add(light);

    lampStates.push({
      light,
      base: light.intensity,
      phase: randomBetween(0, Math.PI * 2),
      speed: randomBetween(6, 10),
    });
  }

  scene.add(group);

  let time = 0;

  function update(delta) {
    time += delta;

    for (let i = 0; i < lampStates.length; i += 1) {
      const state = lampStates[i];
      const pulse = Math.sin(time * 0.9 + state.phase) * 0.04;
      const flutter =
        Math.sin(time * state.speed + state.phase * 1.3) * 0.05 +
        Math.sin(time * (state.speed * 1.6) + state.phase * 0.52) * 0.02;
      const target = Math.max(0.15, state.base + pulse + flutter);
      state.light.intensity = THREE.MathUtils.lerp(
        state.light.intensity,
        target,
        Math.min(1, delta * 8)
      );
    }
  }

  return {
    group,
    ambient,
    moonLight,
    update,
    setVisible(visible) {
      group.visible = visible;
    },
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
