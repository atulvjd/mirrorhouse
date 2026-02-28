import * as THREE from "three";

export function createDustParticles(scene, camera, bounds) {
  const count = 248;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const drifts = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const x = randomBetween(bounds.minX + 0.3, bounds.maxX - 0.3);
    const y = randomBetween(0.3, bounds.maxY - 0.45);
    const z = randomBetween(bounds.minZ + 0.3, bounds.maxZ - 0.3);

    const idx = i * 3;
    basePositions[idx] = x;
    basePositions[idx + 1] = y;
    basePositions[idx + 2] = z;

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;

    drifts[idx] = randomBetween(-0.035, 0.035);
    drifts[idx + 1] = randomBetween(-0.02, 0.03);
    drifts[idx + 2] = randomBetween(-0.035, 0.035);
    phases[i] = randomBetween(0, Math.PI * 2);
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xcab79a,
    size: 0.038,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "interiorDust";
  points.frustumCulled = false;
  scene.add(points);

  const prevCameraPosition = new THREE.Vector3().copy(camera.position);
  let time = 0;

  function update(delta) {
    time += delta;

    const dx = camera.position.x - prevCameraPosition.x;
    const dy = camera.position.y - prevCameraPosition.y;
    const dz = camera.position.z - prevCameraPosition.z;
    prevCameraPosition.copy(camera.position);

    const cameraInfluenceX = THREE.MathUtils.clamp(dx * 0.2, -0.03, 0.03);
    const cameraInfluenceY = THREE.MathUtils.clamp(dy * 0.15, -0.02, 0.02);
    const cameraInfluenceZ = THREE.MathUtils.clamp(dz * 0.2, -0.03, 0.03);

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      const phase = phases[i];
      const swayA = Math.sin(time * 0.42 + phase);
      const swayB = Math.cos(time * 0.35 + phase * 1.3);

      positions[idx] =
        basePositions[idx] +
        drifts[idx] * swayA +
        cameraInfluenceX;
      positions[idx + 1] =
        basePositions[idx + 1] +
        drifts[idx + 1] * swayB +
        cameraInfluenceY;
      positions[idx + 2] =
        basePositions[idx + 2] +
        drifts[idx + 2] * swayA +
        cameraInfluenceZ;
    }

    geometry.attributes.position.needsUpdate = true;
    material.opacity = 0.22 + Math.sin(time * 0.18) * 0.04;
  }

  return {
    points,
    update,
    setVisible(visible) {
      points.visible = visible;
    },
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
