import * as THREE from "three";

export function createMirrorWorldLighting(scene) {
  const lightingGroup = new THREE.Group();
  lightingGroup.name = "mirrorWorldLighting";

  const ambient = new THREE.AmbientLight(0x050714, 0.18);
  lightingGroup.add(ambient);

  const accent = new THREE.DirectionalLight(0x4a62b8, 0.18);
  accent.position.set(-6, 8, -5);
  accent.castShadow = true;
  accent.shadow.mapSize.set(1024, 1024);
  accent.shadow.camera.near = 1;
  accent.shadow.camera.far = 30;
  lightingGroup.add(accent);

  const lampStates = [];
  const lampPositions = [
    [-2.8, -7.2],
    [2.5, -7.3],
    [-4.8, -4.9],
    [4.9, -4.5],
  ];

  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d0d0d,
    roughness: 0.95,
    metalness: 0.25,
  });

  for (const [x, z] of lampPositions) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.1, 3.2, 10),
      poleMaterial
    );
    pole.position.set(x, -1.2, z);
    pole.castShadow = true;
    lightingGroup.add(pole);

    const lamp = new THREE.PointLight(0xf8d18b, 0.42, 8);
    lamp.position.set(x, 0.9, z);
    lamp.castShadow = true;
    lightingGroup.add(lamp);

    lampStates.push({
      light: lamp,
      base: lamp.intensity,
      phase: Math.random() * Math.PI * 2,
    });
  }

  scene.add(lightingGroup);

  let time = 0;

  function update(delta, townVisible) {
    time += delta;

    const flickerScale = townVisible ? 1 : 0.6;
    for (const state of lampStates) {
      const pulse = Math.sin(time * 1.4 + state.phase) * 0.12;
      const flutter = Math.sin(time * 8.2 + state.phase * 0.6) * 0.08;
      const target = Math.max(0.1, (state.base + pulse + flutter) * flickerScale);
      state.light.intensity = THREE.MathUtils.lerp(
        state.light.intensity,
        target,
        Math.min(1, delta * 6)
      );
    }

    ambient.intensity = THREE.MathUtils.lerp(
      ambient.intensity,
      townVisible ? 0.22 : 0.08,
      Math.min(1, delta * 3)
    );
  }

  return {
    group: lightingGroup,
    update,
    setStoreActive(active) {
      const target = active ? 0.05 : 0.18;
      ambient.intensity = target;
    },
  };
}
