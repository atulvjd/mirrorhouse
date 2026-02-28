import * as THREE from "three";

export function createFlashlightSystem(camera) {
  const flashlightTarget = new THREE.Object3D();
  flashlightTarget.position.set(0.02, -0.04, -1);

  const flashlight = new THREE.SpotLight(
    0xf6e3be,
    0,
    22,
    THREE.MathUtils.degToRad(20),
    0.55,
    1.35
  );
  flashlight.position.set(0, 0, 0);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(1024, 1024);
  flashlight.shadow.camera.near = 0.1;
  flashlight.shadow.camera.far = 22;
  flashlight.shadow.focus = 0.7;
  flashlight.target = flashlightTarget;

  const fillLight = new THREE.PointLight(0xffe5bf, 0, 2.7);
  fillLight.position.set(0, -0.06, -0.15);

  camera.add(flashlight);
  camera.add(flashlightTarget);
  camera.add(fillLight);

  let enabled = false;
  let time = 0;
  let flickerTimer = randomBetween(2.8, 5.4);
  let flickerRemaining = 0;
  const baseIntensity = 1.65;
  const baseFill = 0.18;

  function enable() {
    enabled = true;
  }

  function disable() {
    enabled = false;
    flashlight.intensity = 0;
    fillLight.intensity = 0;
  }

  function update(delta) {
    if (!enabled) {
      flashlight.intensity = THREE.MathUtils.lerp(
        flashlight.intensity,
        0,
        Math.min(1, delta * 8)
      );
      fillLight.intensity = THREE.MathUtils.lerp(
        fillLight.intensity,
        0,
        Math.min(1, delta * 8)
      );
      return;
    }

    time += delta;
    flickerTimer -= delta;

    if (flickerTimer <= 0 && flickerRemaining <= 0) {
      flickerRemaining = randomBetween(0.08, 0.24);
      flickerTimer = randomBetween(2.8, 5.4);
    }

    if (flickerRemaining > 0) {
      flickerRemaining = Math.max(0, flickerRemaining - delta);
    }

    const jitterX =
      Math.sin(time * 13.4) * 0.02 +
      Math.sin(time * 7.1) * 0.01;
    const jitterY =
      Math.cos(time * 11.2) * 0.012 +
      Math.sin(time * 5.2) * 0.007;

    flashlightTarget.position.set(0.02 + jitterX, -0.04 + jitterY, -1);

    const flickerScale =
      flickerRemaining > 0
        ? randomBetween(0.62, 0.96)
        : 0.95 + Math.sin(time * 0.8) * 0.04;

    const targetIntensity = baseIntensity * flickerScale;
    const targetFill = baseFill * (0.75 + flickerScale * 0.4);

    flashlight.intensity = THREE.MathUtils.lerp(
      flashlight.intensity,
      targetIntensity,
      Math.min(1, delta * 11)
    );
    fillLight.intensity = THREE.MathUtils.lerp(
      fillLight.intensity,
      targetFill,
      Math.min(1, delta * 11)
    );
  }

  return {
    enable,
    disable,
    update,
    isEnabled() {
      return enabled;
    },
    light: flashlight,
    fillLight,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
