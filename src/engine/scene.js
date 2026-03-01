import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export function createScene() {
  const scene = new THREE.Scene();

  // Step 7: Lighter Fog System - Adjusted for high visibility
  scene.background = new THREE.Color(0x9ea2aa);
  scene.fog = new THREE.Fog(0x9ea2aa, 30, 160);

  // Step 2: Boost Ambient Light - Significant increase
  const ambientLight = new THREE.AmbientLight(0xe6ded2, 1.4);
  scene.add(ambientLight);

  // Step 3: Hemisphere Sky Light - Atmospheric scattering
  const hemiLight = new THREE.HemisphereLight(0xaeb8c6, 0x6f6c66, 1.2);
  scene.add(hemiLight);

  // Step 1: Strong Moonlight Directional Light
  const moonLight = new THREE.DirectionalLight(0xcfd8ff, 2.5);
  moonLight.position.set(40, 80, 20);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.bias = -0.0002; // Softened shadows
  scene.add(moonLight);

  // Step 11: Environment Light Probe (Cool neutral night lighting)
  new RGBELoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    }
  );

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
