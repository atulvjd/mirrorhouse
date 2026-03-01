import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export function createScene() {
  const scene = new THREE.Scene();

  // Dark vintage atmosphere: fog and background
  scene.background = new THREE.Color(0x0c0e12);
  scene.fog = new THREE.FogExp2(0x0c0e12, 0.035);

  // 1. Ambient Light - Very subtle bluish gray fill to prevent pitch black.
  const ambientLight = new THREE.AmbientLight(0x404855, 0.35);
  scene.add(ambientLight);

  // 2. Main Overhead Lamp - Dim warm vintage tungsten.
  const pointLight = new THREE.PointLight(0xffd6a5, 1.2, 12);
  pointLight.name = "roomPointLight";
  pointLight.position.set(0, 2.6, 0);
  pointLight.castShadow = true;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.bias = -0.0002;
  scene.add(pointLight);

  // 3. Window Moonlight - Cold blue directional light.
  const moonLight = new THREE.DirectionalLight(0x8fb6ff, 0.5);
  moonLight.position.set(5, 6, 3);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  scene.add(moonLight);

  // 4. HDRI Environment Map - For realistic reflections.
  // Using a placeholder HDRI from a public repository for vintage indoor feel.
  new RGBELoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",
    (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
    }
  );

  // Store lights for external systems (flicker, distortion, etc.)
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
