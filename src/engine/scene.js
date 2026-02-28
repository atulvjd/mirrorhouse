import * as THREE from "three";

export function createScene() {
  // Cinematic opening palette: cold moonlight and dense blue-grey fog.
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1018);
  scene.fog = new THREE.FogExp2(0x6a7284, 0.035);

  const ambientLight = new THREE.AmbientLight(0x7d879c, 0.26);
  const hemisphereLight = new THREE.HemisphereLight(0x8a96ac, 0x161312, 0.24);

  const moonLight = new THREE.DirectionalLight(0x9ab3d7, 0.95);
  moonLight.position.set(14, 20, 10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.left = -40;
  moonLight.shadow.camera.right = 40;
  moonLight.shadow.camera.top = 40;
  moonLight.shadow.camera.bottom = -40;
  moonLight.shadow.camera.near = 1;
  moonLight.shadow.camera.far = 80;

  // Kept as the main controllable point light for flicker/distortion systems.
  const pointLight = new THREE.PointLight(0xffcc88, 0.95, 34);
  pointLight.name = "roomPointLight";
  pointLight.position.set(0, 3.4, -2.4);
  pointLight.castShadow = true;

  scene.add(ambientLight);
  scene.add(hemisphereLight);
  scene.add(moonLight);
  scene.add(pointLight);
  scene.userData.pointLight = pointLight;
  scene.userData.moonLight = moonLight;

  return scene;
}

export function createFlickerSystem(scene) {
  const pointLight =
    scene.userData.pointLight ||
    scene.children.find((child) => child instanceof THREE.PointLight);

  const shakeOffset = new THREE.Vector3();
  let timeToNextFlicker = randomBetween(8, 15);
  let flickerRemaining = 0;
  let flickerActive = false;
  let normalTargetIntensity = randomBetween(0.6, 0.8);
  let shakeAmplitude = 0;

  if (pointLight) {
    pointLight.intensity = normalTargetIntensity;
  }

  function clearShake(camera) {
    if (!camera) {
      return;
    }

    camera.position.sub(shakeOffset);
    shakeOffset.set(0, 0, 0);
  }

  function applyShake(camera, amplitude) {
    if (!camera) {
      return;
    }

    camera.position.sub(shakeOffset);
    shakeOffset.set(
      randomBetween(-amplitude, amplitude),
      randomBetween(-amplitude, amplitude),
      0
    );
    camera.position.add(shakeOffset);
  }

  function update(delta) {
    if (!pointLight) {
      return;
    }

    const reflectionVisible = Boolean(scene.userData.reflectionVisible);
    const camera = scene.userData.activeCamera || null;

    if (!reflectionVisible) {
      flickerActive = false;
      flickerRemaining = 0;
      shakeAmplitude = THREE.MathUtils.lerp(shakeAmplitude, 0, Math.min(1, 12 * delta));
      clearShake(camera);
      pointLight.intensity = THREE.MathUtils.lerp(
        pointLight.intensity,
        normalTargetIntensity,
        Math.min(1, 6 * delta)
      );
      return;
    }

    if (!flickerActive) {
      timeToNextFlicker -= delta;
      pointLight.intensity = THREE.MathUtils.lerp(
        pointLight.intensity,
        normalTargetIntensity,
        Math.min(1, 7 * delta)
      );

      shakeAmplitude = THREE.MathUtils.lerp(shakeAmplitude, 0, Math.min(1, 10 * delta));
      if (shakeAmplitude > 0.0005) {
        applyShake(camera, shakeAmplitude * 0.35);
      } else {
        clearShake(camera);
      }

      if (timeToNextFlicker <= 0) {
        flickerActive = true;
        flickerRemaining = randomBetween(0.2, 0.6);
      }
      return;
    }

    flickerRemaining -= delta;

    const flickerTargetIntensity = randomBetween(0.2, 0.4);
    pointLight.intensity = THREE.MathUtils.lerp(
      pointLight.intensity,
      flickerTargetIntensity,
      Math.min(1, 25 * delta)
    );

    const targetShakeAmplitude = randomBetween(0.01, 0.03);
    shakeAmplitude = THREE.MathUtils.lerp(
      shakeAmplitude,
      targetShakeAmplitude,
      Math.min(1, 14 * delta)
    );
    applyShake(camera, shakeAmplitude);

    if (flickerRemaining <= 0) {
      flickerActive = false;
      timeToNextFlicker = randomBetween(8, 15);
      normalTargetIntensity = randomBetween(0.6, 0.8);
    }
  }

  return {
    update,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
