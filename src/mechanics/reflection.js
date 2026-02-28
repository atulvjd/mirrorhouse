import * as THREE from "three";
import {
  triggerMirrorGlitchPulse,
  updateMirrorShader,
} from "../shaders/mirrorShader.js";

const MIRROR_CENTER = new THREE.Vector3(0, 1.8, -9);
const MIRROR_NORMAL = new THREE.Vector3(0, 0, 1);
const HISTORY_LENGTH = 240;
const DELAY_FRAMES = 20;
const VISIBLE_DISTANCE = 8;
const DRIFT_MIN_INTERVAL = 6;
const DRIFT_MAX_INTERVAL = 12;
const PAUSE_MIN_DURATION = 0.8;
const PAUSE_MAX_DURATION = 1.5;
const SLOW_DURATION = 2;
const LOOK_DURATION = 1.1;
const AUTONOMOUS_MIN_INTERVAL = 15;
const AUTONOMOUS_MAX_INTERVAL = 25;
const FREEZE_MIN_INTERVAL = 10;
const FREEZE_MAX_INTERVAL = 18;
const FREEZE_DURATION = 2;
const REVEAL_DURATION = 1;
const ENDING_WALK_DURATION = 3;
const INDEPENDENCE_MIN_INTERVAL = 30;
const INDEPENDENCE_MAX_INTERVAL = 60;
const INDEPENDENCE_MIN_DURATION = 1;
const INDEPENDENCE_MAX_DURATION = 2;
const INDEPENDENCE_MIN_DELAY_FRAMES = 60;
const INDEPENDENCE_MAX_DELAY_FRAMES = 120;

export function createReflection(scene) {
  const reflectionRoot = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d6f73,
    roughness: 0.45,
    metalness: 0.2,
  });
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b8f95,
    roughness: 0.4,
    metalness: 0.12,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.35), bodyMaterial);
  body.position.y = 0.9;
  reflectionRoot.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), headMaterial);
  head.position.y = 1.7;
  reflectionRoot.add(head);

  reflectionRoot.visible = false;
  scene.add(reflectionRoot);

  const trackingAnchor = new THREE.Object3D();
  const cameraForward = new THREE.Vector3();
  const toMirror = new THREE.Vector3();
  const reflectedForward = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const finalPositionTarget = new THREE.Vector3();
  const finalQuaternionTarget = new THREE.Quaternion();
  const headTargetQuaternion = new THREE.Quaternion();
  const neutralHeadQuaternion = head.quaternion.clone();
  const autonomousHeadLookQuaternion = new THREE.Quaternion();
  const autonomousHeadTiltQuaternion = new THREE.Quaternion();
  const autonomousHeadTiltBlendedQuaternion = new THREE.Quaternion();
  const previousHeadRotation = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const history = [];

  let timeToNextDrift = randomBetween(DRIFT_MIN_INTERVAL, DRIFT_MAX_INTERVAL);
  let activeDrift = null;

  // Autonomous drift state.
  let autonomousTimer = randomBetween(AUTONOMOUS_MIN_INTERVAL, AUTONOMOUS_MAX_INTERVAL);
  let autonomousActive = false;
  let autonomousType = null;
  let autonomousDuration = 0;
  let autonomousElapsed = 0;

  let autonomousSideOffset = 0;
  let autonomousFrozenPosition = new THREE.Vector3();
  let autonomousFrozenQuaternion = new THREE.Quaternion();

  // Reflection independence state.
  let independenceState = "normal";
  let independenceTimer = randomBetween(
    INDEPENDENCE_MIN_INTERVAL,
    INDEPENDENCE_MAX_INTERVAL
  );
  let independenceDuration = 0;
  let independenceElapsed = 0;
  let independenceDelayFrames = 0;

  // Escalation controls.
  let extraDelayFrames = 0;
  let freezeEnabled = false;
  let reflectionFreezeTimer = randomBetween(FREEZE_MIN_INTERVAL, FREEZE_MAX_INTERVAL);
  let reflectionFreezeRemaining = 0;
  let reflectionFreezePosition = new THREE.Vector3();

  // Reveal event state.
  let revealActive = false;
  let revealTriggered = false;
  let revealElapsed = 0;
  let revealCompletePending = false;
  let revealStartPosition = new THREE.Vector3();
  let revealTargetPosition = new THREE.Vector3();
  let revealTargetQuaternion = new THREE.Quaternion();

  // Final ending override state (Stage 20).
  let endingSequenceState = "idle";
  let endingWalkElapsed = 0;
  let endingFrozenPosition = new THREE.Vector3();
  let endingFrozenQuaternion = new THREE.Quaternion();
  let endingWalkStartPosition = new THREE.Vector3();
  let endingWalkTargetPosition = new THREE.Vector3();
  let endingWalkTargetQuaternion = new THREE.Quaternion();

  function startDrift() {
    const driftTypes = ["pause", "slow", "look"];
    const type = driftTypes[Math.floor(Math.random() * driftTypes.length)];

    if (type === "pause") {
      activeDrift = {
        type,
        remaining: randomBetween(PAUSE_MIN_DURATION, PAUSE_MAX_DURATION),
        frozenPosition: reflectionRoot.position.clone(),
        frozenQuaternion: reflectionRoot.quaternion.clone(),
      };
    } else if (type === "slow") {
      activeDrift = {
        type,
        remaining: SLOW_DURATION,
      };
    } else {
      activeDrift = {
        type,
        remaining: LOOK_DURATION,
      };
    }

    timeToNextDrift = randomBetween(DRIFT_MIN_INTERVAL, DRIFT_MAX_INTERVAL);
  }

  function startAutonomousDrift() {
    const autonomousTypes = ["sideStep", "headTilt", "delayedHeadTracking"];

    autonomousType =
      autonomousTypes[Math.floor(Math.random() * autonomousTypes.length)];
    autonomousActive = true;
    autonomousElapsed = 0;
    triggerMirrorGlitchPulse(0.4);

    if (autonomousType === "sideStep") {
      autonomousDuration = randomBetween(1.2, 2);
      autonomousSideOffset = randomBetween(-0.35, 0.35);
      return;
    }

    if (autonomousType === "headTilt") {
      autonomousDuration = 1.5;
      const tiltDirection = Math.random() < 0.5 ? -1 : 1;
      const tiltAngle = THREE.MathUtils.degToRad(randomBetween(10, 18) * tiltDirection);
      autonomousHeadTiltQuaternion.setFromAxisAngle(zAxis, tiltAngle);
      return;
    }

    autonomousDuration = randomBetween(1.5, 3);
    autonomousFrozenPosition.copy(reflectionRoot.position);
    autonomousFrozenQuaternion.copy(reflectionRoot.quaternion);
  }

  function resetAutonomousDrift(resetTimer = true) {
    autonomousActive = false;
    autonomousType = null;
    autonomousDuration = 0;
    autonomousElapsed = 0;
    autonomousSideOffset = 0;

    if (resetTimer) {
      autonomousTimer = randomBetween(AUTONOMOUS_MIN_INTERVAL, AUTONOMOUS_MAX_INTERVAL);
    }
  }

  function setExtraDelay(frames) {
    extraDelayFrames = Math.max(0, Math.floor(frames || 0));
  }

  function setFreezeEnabled(enabled) {
    freezeEnabled = Boolean(enabled);

    if (!freezeEnabled) {
      reflectionFreezeRemaining = 0;
      reflectionFreezeTimer = randomBetween(FREEZE_MIN_INTERVAL, FREEZE_MAX_INTERVAL);
    }
  }

  function startIndependenceState() {
    const independentStates = ["delayed", "opposite", "independentLook"];
    independenceState =
      independentStates[Math.floor(Math.random() * independentStates.length)];
    independenceDuration = randomBetween(
      INDEPENDENCE_MIN_DURATION,
      INDEPENDENCE_MAX_DURATION
    );
    independenceElapsed = 0;
    independenceDelayFrames =
      independenceState === "delayed"
        ? Math.floor(
            randomBetween(
              INDEPENDENCE_MIN_DELAY_FRAMES,
              INDEPENDENCE_MAX_DELAY_FRAMES
            )
          )
        : 0;
  }

  function resetIndependenceState(resetTimer = true) {
    independenceState = "normal";
    independenceDuration = 0;
    independenceElapsed = 0;
    independenceDelayFrames = 0;

    if (resetTimer) {
      independenceTimer = randomBetween(
        INDEPENDENCE_MIN_INTERVAL,
        INDEPENDENCE_MAX_INTERVAL
      );
    }
  }

  function startReveal() {
    if (revealTriggered || revealActive) {
      return false;
    }

    revealTriggered = true;
    revealActive = true;
    revealElapsed = 0;

    activeDrift = null;
    resetAutonomousDrift(false);
    resetIndependenceState(false);
    reflectionFreezeRemaining = 0;

    revealStartPosition.copy(reflectionRoot.position);
    revealTargetPosition.copy(reflectionRoot.position);
    revealTargetPosition.z = Math.min(MIRROR_CENTER.z + 0.2, revealTargetPosition.z + 1.2);

    lookTarget.copy(reflectionRoot.position).add(new THREE.Vector3(0, 0, 1));
    trackingAnchor.position.copy(reflectionRoot.position);
    trackingAnchor.lookAt(lookTarget);
    revealTargetQuaternion.copy(trackingAnchor.quaternion);

    return true;
  }

  function startEndingSequence(camera) {
    if (endingSequenceState !== "idle") {
      return false;
    }

    activeDrift = null;
    resetAutonomousDrift(false);
    resetIndependenceState(false);
    reflectionFreezeRemaining = 0;
    revealActive = false;

    initializeEndingPose(camera);
    endingFrozenPosition.copy(reflectionRoot.position);
    endingFrozenQuaternion.copy(reflectionRoot.quaternion);
    endingSequenceState = "desync";
    endingWalkElapsed = 0;

    return true;
  }

  function setEndingSequenceState(nextState, camera) {
    if (endingSequenceState === nextState) {
      return;
    }

    if (nextState === "idle") {
      endingSequenceState = "idle";
      return;
    }

    if (endingSequenceState === "idle") {
      startEndingSequence(camera);
    }

    endingSequenceState = nextState;

    if (nextState === "desync") {
      initializeEndingPose(camera);
      endingFrozenPosition.copy(reflectionRoot.position);
      endingFrozenQuaternion.copy(reflectionRoot.quaternion);
      return;
    }

    if (nextState === "walkForward") {
      configureEndingWalk();
      return;
    }

    if (nextState === "disappear") {
      reflectionRoot.visible = false;
    }
  }

  function initializeEndingPose(camera) {
    if (!camera) {
      return;
    }

    camera.getWorldDirection(cameraForward);

    const baseDelayFrames = Math.max(
      0,
      DELAY_FRAMES + extraDelayFrames
    );
    const delayedIndex = Math.max(0, history.length - 1 - baseDelayFrames);
    const delayedFrame = history[delayedIndex] || null;
    const sourcePosition = delayedFrame ? delayedFrame.position : camera.position;
    const sourceForward = delayedFrame ? delayedFrame.forward : cameraForward;

    const reflectedX = sourcePosition.x;
    const reflectedZ =
      MIRROR_CENTER.z - (sourcePosition.z - MIRROR_CENTER.z);

    reflectionRoot.position.set(
      reflectedX,
      Math.max(0, sourcePosition.y - 1.6),
      Math.min(MIRROR_CENTER.z + 0.2, reflectedZ)
    );

    reflectedForward.copy(sourceForward).reflect(MIRROR_NORMAL);
    reflectedForward.y = 0;
    if (reflectedForward.lengthSq() === 0) {
      reflectedForward.set(0, 0, 1);
    }
    reflectedForward.normalize();

    trackingAnchor.position.copy(reflectionRoot.position);
    lookTarget.copy(reflectionRoot.position).add(reflectedForward);
    trackingAnchor.lookAt(lookTarget);
    reflectionRoot.quaternion.copy(trackingAnchor.quaternion);
  }

  function configureEndingWalk() {
    endingWalkElapsed = 0;
    endingWalkStartPosition.copy(reflectionRoot.position);
    endingWalkTargetPosition.copy(endingWalkStartPosition);
    endingWalkTargetPosition.z = MIRROR_CENTER.z + 0.2;

    trackingAnchor.position.copy(endingWalkStartPosition);
    lookTarget.copy(endingWalkStartPosition);
    lookTarget.z = endingWalkStartPosition.z + 1;
    trackingAnchor.lookAt(lookTarget);
    endingWalkTargetQuaternion.copy(trackingAnchor.quaternion);
  }

  function updateEndingSequenceOverride(delta) {
    if (endingSequenceState === "idle") {
      return;
    }

    if (endingSequenceState === "desync") {
      reflectionRoot.visible = true;
      reflectionRoot.position.lerp(endingFrozenPosition, 1 - Math.exp(-14 * delta));
      reflectionRoot.quaternion.slerp(
        endingFrozenQuaternion,
        1 - Math.exp(-14 * delta)
      );

      headTargetQuaternion.copy(neutralHeadQuaternion);
      head.quaternion.slerp(headTargetQuaternion, 1 - Math.exp(-8 * delta));
      return;
    }

    if (endingSequenceState === "walkForward") {
      reflectionRoot.visible = true;
      endingWalkElapsed = Math.min(ENDING_WALK_DURATION, endingWalkElapsed + delta);

      const progress = THREE.MathUtils.clamp(
        endingWalkElapsed / ENDING_WALK_DURATION,
        0,
        1
      );
      const smooth = progress * progress * (3 - 2 * progress);

      finalPositionTarget.lerpVectors(
        endingWalkStartPosition,
        endingWalkTargetPosition,
        smooth
      );
      finalPositionTarget.z = Math.min(MIRROR_CENTER.z + 0.2, finalPositionTarget.z);

      reflectionRoot.position.lerp(finalPositionTarget, 1 - Math.exp(-2.2 * delta));
      reflectionRoot.quaternion.slerp(
        endingWalkTargetQuaternion,
        1 - Math.exp(-2.8 * delta)
      );

      headTargetQuaternion.copy(neutralHeadQuaternion);
      head.quaternion.slerp(headTargetQuaternion, 1 - Math.exp(-7 * delta));
      return;
    }

    // disappear / behindReveal / fadeOut keep reflection hidden.
    reflectionRoot.visible = false;
    headTargetQuaternion.copy(neutralHeadQuaternion);
    head.quaternion.slerp(headTargetQuaternion, 1 - Math.exp(-8 * delta));
  }

  function consumeRevealComplete() {
    if (!revealCompletePending) {
      return false;
    }

    revealCompletePending = false;
    return true;
  }

  function updateReveal(delta) {
    revealElapsed += delta;
    const progress = THREE.MathUtils.clamp(revealElapsed / REVEAL_DURATION, 0, 1);

    finalPositionTarget.lerpVectors(revealStartPosition, revealTargetPosition, progress);
    finalPositionTarget.z = Math.min(MIRROR_CENTER.z + 0.2, finalPositionTarget.z);

    const revealPositionAlpha = 1 - Math.exp(-9 * delta);
    const revealRotationAlpha = 1 - Math.exp(-9 * delta);

    reflectionRoot.visible = true;
    reflectionRoot.position.lerp(finalPositionTarget, revealPositionAlpha);
    reflectionRoot.quaternion.slerp(revealTargetQuaternion, revealRotationAlpha);

    headTargetQuaternion.copy(neutralHeadQuaternion);
    head.quaternion.slerp(headTargetQuaternion, 1 - Math.exp(-8 * delta));

    if (progress >= 1) {
      revealActive = false;
      reflectionRoot.visible = false;
      revealCompletePending = true;
    }
  }

  function update(camera, delta = 1 / 60) {
    updateMirrorShader(delta);

    if (!camera) {
      reflectionRoot.visible = false;
      return;
    }

    if (endingSequenceState !== "idle") {
      updateEndingSequenceOverride(delta);
      return;
    }

    if (revealTriggered && !revealActive) {
      reflectionRoot.visible = false;
      return;
    }

    camera.getWorldDirection(cameraForward);
    history.push({
      position: camera.position.clone(),
      forward: cameraForward.clone(),
    });

    if (history.length > HISTORY_LENGTH) {
      history.shift();
    }

    if (history.length === 0) {
      reflectionRoot.visible = false;
      return;
    }

    if (revealActive) {
      updateReveal(delta);
      return;
    }

    toMirror.copy(MIRROR_CENTER).sub(camera.position);
    const withinDistance = toMirror.length() <= VISIBLE_DISTANCE;
    toMirror.normalize();
    const facingMirror = cameraForward.dot(toMirror) > 0.55;
    const visible = withinDistance && facingMirror;

    reflectionRoot.visible = visible;

    if (!visible) {
      activeDrift = null;
      if (autonomousActive) {
        resetAutonomousDrift(true);
      }
      if (independenceState !== "normal") {
        resetIndependenceState(true);
      }

      headTargetQuaternion.copy(neutralHeadQuaternion);
      head.quaternion.slerp(headTargetQuaternion, 1 - Math.exp(-10 * delta));
      return;
    }

    if (!activeDrift && !autonomousActive && independenceState === "normal") {
      timeToNextDrift -= delta;
      if (timeToNextDrift <= 0) {
        startDrift();
      }
    }

    if (!autonomousActive && independenceState === "normal") {
      autonomousTimer -= delta;
      if (autonomousTimer <= 0 && !activeDrift) {
        startAutonomousDrift();
      }
    }

    if (
      freezeEnabled &&
      reflectionFreezeRemaining <= 0 &&
      independenceState === "normal"
    ) {
      reflectionFreezeTimer -= delta;
      if (reflectionFreezeTimer <= 0) {
        reflectionFreezeRemaining = FREEZE_DURATION;
        reflectionFreezeTimer = randomBetween(FREEZE_MIN_INTERVAL, FREEZE_MAX_INTERVAL);
        reflectionFreezePosition.copy(reflectionRoot.position);
      }
    }

    if (
      independenceState === "normal" &&
      !activeDrift &&
      !autonomousActive &&
      reflectionFreezeRemaining <= 0
    ) {
      independenceTimer -= delta;
      if (independenceTimer <= 0) {
        startIndependenceState();
      }
    }

    if (independenceState !== "normal") {
      independenceElapsed += delta;
      if (independenceElapsed >= independenceDuration) {
        resetIndependenceState(true);
      }
    }

    const extraDelay = extraDelayFrames + (activeDrift?.type === "slow" ? 5 : 0);
    const delayFrames =
      DELAY_FRAMES +
      extraDelay +
      (independenceState === "delayed" ? independenceDelayFrames : 0);
    const delayedIndex = Math.max(0, history.length - 1 - delayFrames);
    const delayedFrame = history[delayedIndex];

    if (activeDrift?.type === "pause") {
      desiredPosition.copy(activeDrift.frozenPosition);
      trackingAnchor.quaternion.copy(activeDrift.frozenQuaternion);
    } else {
      const reflectedX = delayedFrame.position.x;
      const reflectedZ =
        MIRROR_CENTER.z - (delayedFrame.position.z - MIRROR_CENTER.z);
      desiredPosition.set(
        reflectedX,
        Math.max(0, delayedFrame.position.y - 1.6),
        Math.min(MIRROR_CENTER.z + 0.2, reflectedZ)
      );

      reflectedForward.copy(delayedFrame.forward).reflect(MIRROR_NORMAL);

      if (independenceState === "opposite") {
        desiredPosition.x = MIRROR_CENTER.x - (desiredPosition.x - MIRROR_CENTER.x);
        reflectedForward.x *= -1;
      }

      reflectedForward.y = 0;
      if (reflectedForward.lengthSq() === 0) {
        reflectedForward.set(0, 0, 1);
      }
      reflectedForward.normalize();

      trackingAnchor.position.copy(desiredPosition);
      lookTarget.copy(desiredPosition).add(reflectedForward);
      trackingAnchor.lookAt(lookTarget);
    }

    finalPositionTarget.copy(desiredPosition);
    finalQuaternionTarget.copy(trackingAnchor.quaternion);

    if (autonomousActive) {
      autonomousElapsed += delta;
      const autonomousProgress = THREE.MathUtils.clamp(
        autonomousElapsed / autonomousDuration,
        0,
        1
      );

      if (autonomousType === "sideStep") {
        // Smooth in/out offset so the move feels uncertain, not abrupt.
        const offsetBlend = Math.sin(Math.PI * autonomousProgress);
        finalPositionTarget.x += autonomousSideOffset * offsetBlend;
      } else if (autonomousType === "delayedHeadTracking") {
        // Hold body in place while head continues to track.
        finalPositionTarget.copy(autonomousFrozenPosition);
        finalQuaternionTarget.copy(autonomousFrozenQuaternion);
      }

      if (autonomousElapsed >= autonomousDuration) {
        resetAutonomousDrift(true);
      }
    }

    if (reflectionFreezeRemaining > 0) {
      reflectionFreezeRemaining -= delta;
      finalPositionTarget.copy(reflectionFreezePosition);
    }

    // Safety clamp: reflection must remain in front of mirror plane.
    finalPositionTarget.z = Math.min(MIRROR_CENTER.z + 0.2, finalPositionTarget.z);

    const followSpeed = activeDrift?.type === "slow" ? 2.8 : 8.5;
    const rotationSpeed = activeDrift?.type === "slow" ? 2.4 : 8;
    const followAlpha = 1 - Math.exp(-followSpeed * delta);
    const rotationAlpha = 1 - Math.exp(-rotationSpeed * delta);
    reflectionRoot.position.lerp(finalPositionTarget, followAlpha);
    reflectionRoot.quaternion.slerp(finalQuaternionTarget, rotationAlpha);

    if (activeDrift?.type === "look") {
      previousHeadRotation.copy(head.quaternion);
      head.lookAt(camera.position);
      headTargetQuaternion.copy(head.quaternion);
      head.quaternion.copy(previousHeadRotation);
    } else {
      headTargetQuaternion.copy(neutralHeadQuaternion);
    }

    if (autonomousActive && autonomousType === "headTilt") {
      const tiltProgress = THREE.MathUtils.clamp(
        autonomousElapsed / autonomousDuration,
        0,
        1
      );
      const tiltBlend = Math.sin(Math.PI * tiltProgress);
      autonomousHeadTiltBlendedQuaternion
        .copy(headTargetQuaternion)
        .multiply(autonomousHeadTiltQuaternion);
      headTargetQuaternion.slerp(autonomousHeadTiltBlendedQuaternion, tiltBlend);
    } else if (autonomousActive && autonomousType === "delayedHeadTracking") {
      previousHeadRotation.copy(head.quaternion);
      head.lookAt(camera.position);
      autonomousHeadLookQuaternion.copy(head.quaternion);
      head.quaternion.copy(previousHeadRotation);
      headTargetQuaternion.slerp(autonomousHeadLookQuaternion, 0.92);
    }

    if (independenceState === "independentLook") {
      previousHeadRotation.copy(head.quaternion);
      head.lookAt(camera.position);
      autonomousHeadLookQuaternion.copy(head.quaternion);
      head.quaternion.copy(previousHeadRotation);
      headTargetQuaternion.slerp(autonomousHeadLookQuaternion, 1);
    }

    const headAlpha = 1 - Math.exp(-7 * delta);
    head.quaternion.slerp(headTargetQuaternion, headAlpha);

    if (activeDrift) {
      activeDrift.remaining -= delta;
      if (activeDrift.remaining <= 0) {
        activeDrift = null;
      }
    }
  }

  return {
    update,
    setExtraDelay,
    setFreezeEnabled,
    startReveal,
    startEndingSequence,
    setEndingSequenceState,
    consumeRevealComplete,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
