import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export function createScene() {
  const scene = new THREE.Scene();

  // Step 2: Atmospheric Fog - Lightened for visibility
  scene.background = new THREE.Color(0x8b8b92);
  scene.fog = new THREE.FogExp2(0x8b8b92, 0.004);

  // Step 1: Global Ambient Light - Strong fill to prevent black areas
  const ambientLight = new THREE.AmbientLight(0xd6cdbf, 1.0);
  scene.add(ambientLight);

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
