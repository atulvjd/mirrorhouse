import * as THREE from "three";

const BREATH_Y_AMPLITUDE = 0.015;
const BREATH_ROLL_AMPLITUDE = 0.002;
const MIRROR_PULSE_DURATION = 0.25;
const MAX_FEAR_SHAKE = 0.035;
const MAX_ENDING_SHAKE = 0.08;

export function createCameraEffects(camera) {
  let time = 0;
  let entityDistance = Infinity;
  let mirrorPulseTimer = 0;
  let endingActive = false;
  let endingIntensity = 0;
  let fearIntensity = 0;
  let rollOffset = 0;
  let appliedRollOffset = 0;

  const targetOffset = new THREE.Vector3();
  const currentOffset = new THREE.Vector3();
  const appliedOffset = new THREE.Vector3();

  function mapFearDistance(distance) {
    if (!Number.isFinite(distance) || distance > 6) {
      return 0;
    }

    if (distance > 4) {
      return THREE.MathUtils.mapLinear(distance, 6, 4, 0, 0.011);
    }

    if (distance > 2) {
      return THREE.MathUtils.mapLinear(distance, 4, 2, 0.011, 0.022);
    }

    return THREE.MathUtils.mapLinear(Math.max(distance, 0), 2, 0, 0.022, MAX_FEAR_SHAKE);
  }

  function update(delta = 1 / 60) {
    const safeDelta = Math.max(0, Math.min(delta, 0.1));

    // Remove the previously applied camera effect before computing a new frame.
    camera.position.sub(appliedOffset);
    camera.rotation.z -= appliedRollOffset;

    time += safeDelta;

    const breathY = Math.sin(time * 0.6) * BREATH_Y_AMPLITUDE;
    const breathX = Math.cos(time * 0.35) * 0.0035;
    const breathRoll = Math.sin(time * 0.3) * BREATH_ROLL_AMPLITUDE;

    const fearTarget = mapFearDistance(entityDistance);
    fearIntensity = THREE.MathUtils.lerp(
      fearIntensity,
      fearTarget,
      1 - Math.exp(-6 * safeDelta)
    );

    const fearNoiseX = Math.sin(time * 12.2) * 0.72 + Math.sin(time * 6.8 + 1.1) * 0.28;
    const fearNoiseY = Math.cos(time * 14.4 + 0.45) * 0.68 + Math.cos(time * 7.4) * 0.32;
    const fearNoiseRoll = Math.sin(time * 11.6 + 0.7);

    const fearX = fearNoiseX * fearIntensity;
    const fearY = fearNoiseY * fearIntensity * 0.8;
    const fearRoll = fearNoiseRoll * fearIntensity * 0.45;

    let pulseX = 0;
    let pulseY = 0;
    let pulseRoll = 0;

    if (mirrorPulseTimer > 0) {
      mirrorPulseTimer = Math.max(0, mirrorPulseTimer - safeDelta);
      const pulseProgress = mirrorPulseTimer / MIRROR_PULSE_DURATION;
      const pulseStrength = pulseProgress * pulseProgress;

      pulseX = Math.sin(time * 43.0) * 0.02 * pulseStrength;
      pulseY = Math.cos(time * 37.0 + 0.3) * 0.016 * pulseStrength;
      pulseRoll = Math.sin(time * 47.5) * 0.014 * pulseStrength;
    }

    if (endingActive) {
      endingIntensity = Math.min(1, endingIntensity + safeDelta * 0.45);
    } else {
      endingIntensity = Math.max(0, endingIntensity - safeDelta * 0.85);
    }

    const panicAmplitude = MAX_ENDING_SHAKE * endingIntensity;
    const panicX =
      (Math.sin(time * 24.0) * 0.7 + Math.sin(time * 39.0 + 1.6) * 0.3) *
      panicAmplitude;
    const panicY =
      (Math.cos(time * 29.0 + 0.9) * 0.65 + Math.sin(time * 33.0 + 2.2) * 0.35) *
      panicAmplitude *
      0.9;
    const panicRoll =
      (Math.sin(time * 31.0 + 0.2) * 0.8 + Math.cos(time * 44.0) * 0.2) *
      panicAmplitude *
      0.65;

    targetOffset.set(
      breathX + fearX + pulseX + panicX,
      breathY + fearY + pulseY + panicY,
      0
    );

    const maxCombinedOffset = MAX_ENDING_SHAKE;
    if (targetOffset.lengthSq() > maxCombinedOffset * maxCombinedOffset) {
      targetOffset.setLength(maxCombinedOffset);
    }

    currentOffset.lerp(targetOffset, 1 - Math.exp(-18 * safeDelta));

    const targetRoll = breathRoll + fearRoll + pulseRoll + panicRoll;
    rollOffset = THREE.MathUtils.lerp(
      rollOffset,
      targetRoll,
      1 - Math.exp(-16 * safeDelta)
    );

    camera.position.add(currentOffset);
    camera.rotation.z += rollOffset;

    appliedOffset.copy(currentOffset);
    appliedRollOffset = rollOffset;
  }

  function setEntityDistance(distance) {
    entityDistance = Number.isFinite(distance) ? distance : Infinity;
  }

  function triggerMirrorPulse() {
    mirrorPulseTimer = Math.max(mirrorPulseTimer, MIRROR_PULSE_DURATION);
  }

  function setEndingActive(active) {
    endingActive = Boolean(active);
  }

  return {
    update,
    setEntityDistance,
    triggerMirrorPulse,
    setEndingActive,
  };
}
