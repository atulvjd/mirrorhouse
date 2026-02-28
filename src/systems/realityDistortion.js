import * as THREE from "three";
import { triggerMirrorGlitchPulse } from "../shaders/mirrorShader.js";

const FLICKER_MIN_INTERVAL = 15;
const FLICKER_MAX_INTERVAL = 40;
const PULSE_MIN_INTERVAL = 60;
const PULSE_MAX_INTERVAL = 120;
const SHADOW_MIN_DURATION = 0.5;
const SHADOW_MAX_DURATION = 2;

export function createRealityDistortion(scene, camera) {
  const lights = [];
  const shadowEntries = [];

  const cameraPulseOffset = new THREE.Vector3();
  const appliedCameraPulseOffset = new THREE.Vector3();

  let time = 0;
  let flickerTimer = randomBetween(FLICKER_MIN_INTERVAL, FLICKER_MAX_INTERVAL);
  let pulseTimer = randomBetween(PULSE_MIN_INTERVAL, PULSE_MAX_INTERVAL);
  let activePulseDuration = 0;

  let flickerActive = false;
  let flickerRemaining = 0;
  let flickerBurstTimer = 0;
  let flickerBurstValue = 1;
  let flickerStrength = 0.18;

  let shadowActive = false;
  let shadowRemaining = 0;
  let shadowDuration = 0;
  let shadowTimer = randomBetween(18, 42);
  let shadowStrength = 0;

  let pulseDuration = 0;
  let pulseElapsed = 0;
  let appliedCameraRoll = 0;

  function registerLight(light) {
    if (!light || !light.isLight) {
      return;
    }

    for (let i = 0; i < lights.length; i += 1) {
      if (lights[i].light === light) {
        return;
      }
    }

    lights.push({
      light,
      baseIntensity: light.intensity,
      baseX: light.position.x,
      baseY: light.position.y,
      baseZ: light.position.z,
      phaseA: randomBetween(0, Math.PI * 2),
      phaseB: randomBetween(0, Math.PI * 2),
    });

    if (light.shadow) {
      shadowEntries.push({
        light,
        baseShadowBias: light.shadow.bias || 0,
      });
    }
  }

  function triggerRealityPulse() {
    pulseDuration = randomBetween(0.22, 0.42);
    activePulseDuration = pulseDuration;
    pulseElapsed = 0;

    triggerMirrorGlitchPulse(0.28);
    startShadowDistortion(randomBetween(0.5, 1.3), randomBetween(0.35, 0.8));
  }

  function update(delta = 1 / 60) {
    const safeDelta = Math.max(0, Math.min(delta, 0.1));
    time += safeDelta;

    clearPreviousCameraPulse();

    updateFlickerState(safeDelta);
    updateShadowState(safeDelta);
    updatePulseState(safeDelta);

    const subtleOscillation = 1 + Math.sin(time * 0.45) * 0.03;
    let flickerFactor = 1;
    let pulseFactor = 1;

    if (flickerActive) {
      flickerRemaining -= safeDelta;
      flickerBurstTimer -= safeDelta;

      if (flickerBurstTimer <= 0) {
        flickerBurstTimer = randomBetween(0.04, 0.12);
        flickerBurstValue = randomBetween(0.35, 1);
      }

      flickerFactor = 1 - flickerStrength * (1 - flickerBurstValue);

      if (flickerRemaining <= 0) {
        flickerActive = false;
      }
    }

    if (activePulseDuration > 0) {
      activePulseDuration = Math.max(0, activePulseDuration - safeDelta);
      pulseElapsed += safeDelta;

      const pulseT = THREE.MathUtils.clamp(
        pulseElapsed / Math.max(0.001, pulseDuration),
        0,
        1
      );
      const envelope = Math.sin(Math.PI * pulseT);
      pulseFactor = 1 + envelope * 0.55;

      applyCameraPulse(envelope);
    }

    for (let i = 0; i < lights.length; i += 1) {
      const entry = lights[i];
      const light = entry.light;

      if (!light) {
        continue;
      }

      const minFactor = 0.2;
      const targetIntensity =
        entry.baseIntensity * subtleOscillation * flickerFactor * pulseFactor;

      light.intensity = Math.max(entry.baseIntensity * minFactor, targetIntensity);

      if (shadowActive) {
        const shadowT =
          1 - THREE.MathUtils.clamp(shadowRemaining / Math.max(0.001, shadowDuration), 0, 1);
        const shadowEnvelope = Math.sin(Math.PI * shadowT);
        const motionScale = shadowStrength * shadowEnvelope;

        light.position.x =
          entry.baseX + Math.sin(time * 2.8 + entry.phaseA) * 0.06 * motionScale;
        light.position.z =
          entry.baseZ + Math.cos(time * 3.2 + entry.phaseB) * 0.06 * motionScale;
        light.position.y = entry.baseY;
      } else {
        light.position.x = entry.baseX;
        light.position.y = entry.baseY;
        light.position.z = entry.baseZ;
      }
    }

    for (let i = 0; i < shadowEntries.length; i += 1) {
      const entry = shadowEntries[i];
      const light = entry.light;

      if (!light || !light.shadow) {
        continue;
      }

      if (shadowActive) {
        const shadowT =
          1 - THREE.MathUtils.clamp(shadowRemaining / Math.max(0.001, shadowDuration), 0, 1);
        const shadowEnvelope = Math.sin(Math.PI * shadowT);
        light.shadow.bias =
          entry.baseShadowBias + Math.sin(time * 19 + i) * 0.0012 * shadowStrength * shadowEnvelope;
      } else {
        light.shadow.bias = entry.baseShadowBias;
      }
    }
  }

  function clearPreviousCameraPulse() {
    if (!camera) {
      return;
    }

    camera.position.sub(appliedCameraPulseOffset);
    camera.rotation.z -= appliedCameraRoll;
    appliedCameraPulseOffset.set(0, 0, 0);
    appliedCameraRoll = 0;
  }

  function applyCameraPulse(envelope) {
    if (!camera) {
      return;
    }

    const amplitude = 0.028 * envelope;
    cameraPulseOffset.set(
      Math.sin(time * 41) * amplitude,
      Math.cos(time * 37 + 0.4) * amplitude * 0.75,
      0
    );

    const roll = Math.sin(time * 33 + 0.7) * 0.014 * envelope;

    camera.position.add(cameraPulseOffset);
    camera.rotation.z += roll;

    appliedCameraPulseOffset.copy(cameraPulseOffset);
    appliedCameraRoll = roll;
  }

  function updateFlickerState(delta) {
    if (flickerActive) {
      return;
    }

    flickerTimer -= delta;
    if (flickerTimer > 0) {
      return;
    }

    flickerActive = true;
    flickerRemaining = randomBetween(0.25, 0.9);
    flickerBurstTimer = 0;
    flickerBurstValue = 1;
    flickerStrength = randomBetween(0.18, 0.52);
    flickerTimer = randomBetween(FLICKER_MIN_INTERVAL, FLICKER_MAX_INTERVAL);

    if (!shadowActive && Math.random() < 0.65) {
      startShadowDistortion(
        randomBetween(SHADOW_MIN_DURATION, SHADOW_MAX_DURATION),
        randomBetween(0.35, 0.9)
      );
    }
  }

  function updateShadowState(delta) {
    if (shadowActive) {
      shadowRemaining -= delta;
      if (shadowRemaining <= 0) {
        shadowActive = false;
        shadowRemaining = 0;
      }
      return;
    }

    shadowTimer -= delta;
    if (shadowTimer <= 0) {
      startShadowDistortion(
        randomBetween(SHADOW_MIN_DURATION, SHADOW_MAX_DURATION),
        randomBetween(0.3, 0.7)
      );
      shadowTimer = randomBetween(20, 45);
    }
  }

  function updatePulseState(delta) {
    if (activePulseDuration > 0) {
      return;
    }

    pulseTimer -= delta;
    if (pulseTimer <= 0) {
      triggerRealityPulse();
      pulseTimer = randomBetween(PULSE_MIN_INTERVAL, PULSE_MAX_INTERVAL);
    }
  }

  function startShadowDistortion(duration, strength) {
    shadowActive = true;
    shadowDuration = duration;
    shadowRemaining = duration;
    shadowStrength = strength;
  }

  return {
    update,
    registerLight,
    triggerRealityPulse,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
