import * as THREE from "three";

const LOOK_DOT_THRESHOLD = 0.6;
const TRIGGER_CHANCE_PER_SECOND = [0, 0.002, 0.006, 0.012];
const DISAPPEAR_PROFILES = {
  1: { micro: 0.9, displacement: 0.095, disappear: 0.005 },
  2: { micro: 0.78, displacement: 0.19, disappear: 0.03 },
  3: { micro: 0.65, displacement: 0.27, disappear: 0.08 },
};

export function createHallucinationSystem(scene, camera) {
  const entries = [];
  const objectSet = new WeakSet();

  // Reused temp values to keep update allocation-free.
  const cameraForward = new THREE.Vector3();
  const vectorToObject = new THREE.Vector3();

  let intensity = 0;

  function register(object) {
    if (!object || objectSet.has(object)) {
      return;
    }

    objectSet.add(object);
    entries.push({
      object,
      state: "idle",
      hallucinated: false,
      hiddenElapsed: 0,
      hiddenMinDuration: 0,
      hiddenMaxDuration: 0,
      moveElapsed: 0,
      moveDuration: 0,
      targetHallucinated: false,
      originalPosition: object.position.clone(),
      originalRotation: new THREE.Vector3(
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      ),
      fromPosition: object.position.clone(),
      toPosition: object.position.clone(),
      fromRotation: new THREE.Vector3(
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      ),
      toRotation: new THREE.Vector3(
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      ),
      reappearPosition: object.position.clone(),
      reappearRotation: new THREE.Vector3(
        object.rotation.x,
        object.rotation.y,
        object.rotation.z
      ),
      reappearShift: false,
    });
  }

  function setIntensity(level) {
    intensity = THREE.MathUtils.clamp(Math.floor(level), 0, 3);
  }

  function update(delta = 1 / 60) {
    if (intensity === 0 || entries.length === 0 || !camera) {
      // Still process active transitions so objects can restore naturally.
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (entry.state === "moving") {
          updateMovement(entry, delta);
        } else if (entry.state === "hidden") {
          updateHidden(entry, delta, false);
        }
      }
      return;
    }

    camera.getWorldDirection(cameraForward);
    const triggerChance = TRIGGER_CHANCE_PER_SECOND[intensity] * delta;

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];

      if (!entry.object || (!entry.object.parent && entry.object !== scene)) {
        continue;
      }

      const lookingAtObject = isLookingAt(entry.object, cameraForward);

      if (entry.state === "moving") {
        updateMovement(entry, delta);

        if (lookingAtObject && entry.targetHallucinated) {
          startRestore(entry);
        }
        continue;
      }

      if (entry.state === "hidden") {
        updateHidden(entry, delta, lookingAtObject);
        continue;
      }

      if (lookingAtObject) {
        if (entry.hallucinated) {
          startRestore(entry);
        }
        continue;
      }

      if (entry.hallucinated || !entry.object.visible) {
        continue;
      }

      if (Math.random() < triggerChance) {
        triggerHallucination(entry);
      }
    }
  }

  function isLookingAt(object, forward) {
    vectorToObject.copy(object.position).sub(camera.position);
    const distanceSq = vectorToObject.lengthSq();

    if (distanceSq < 1e-8) {
      return true;
    }

    vectorToObject.multiplyScalar(1 / Math.sqrt(distanceSq));
    return forward.dot(vectorToObject) > LOOK_DOT_THRESHOLD;
  }

  function triggerHallucination(entry) {
    const profile = DISAPPEAR_PROFILES[intensity] || DISAPPEAR_PROFILES[1];
    const pick = Math.random();

    if (pick < profile.micro) {
      triggerMicroShift(entry);
      return;
    }

    if (pick < profile.micro + profile.displacement) {
      triggerDisplacement(entry);
      return;
    }

    triggerDisappear(entry);
  }

  function triggerMicroShift(entry) {
    const angle = randomBetween(0, Math.PI * 2);
    const radius = randomBetween(0.1, 0.5);
    const xOffset = Math.cos(angle) * radius;
    const zOffset = Math.sin(angle) * radius;

    entry.toPosition.copy(entry.originalPosition);
    entry.toPosition.x += xOffset;
    entry.toPosition.z += zOffset;

    entry.toRotation.copy(entry.originalRotation);
    entry.toRotation.y += THREE.MathUtils.degToRad(
      randomBetween(-10, 10)
    );
    entry.toRotation.z += THREE.MathUtils.degToRad(
      randomBetween(-5, 5)
    );

    startMovement(entry, randomBetween(1, 3), true);
  }

  function triggerDisplacement(entry) {
    const angle = randomBetween(0, Math.PI * 2);
    const radius = randomBetween(0.5, 1.5);
    const xOffset = Math.cos(angle) * radius;
    const zOffset = Math.sin(angle) * radius;

    entry.toPosition.copy(entry.originalPosition);
    entry.toPosition.x += xOffset;
    entry.toPosition.z += zOffset;

    entry.toRotation.copy(entry.originalRotation);
    entry.toRotation.y += THREE.MathUtils.degToRad(
      randomBetween(-8, 8)
    );

    startMovement(entry, randomBetween(1.2, 3), true);
  }

  function triggerDisappear(entry) {
    entry.state = "hidden";
    entry.hiddenElapsed = 0;
    entry.hiddenMinDuration = randomBetween(1.2, 3);
    entry.hiddenMaxDuration = randomBetween(3.5, 6.5);
    entry.reappearShift = Math.random() < 0.6;

    entry.reappearPosition.copy(entry.originalPosition);
    entry.reappearRotation.copy(entry.originalRotation);

    if (entry.reappearShift) {
      const angle = randomBetween(0, Math.PI * 2);
      const radius = randomBetween(0.1, 0.5);
      entry.reappearPosition.x += Math.cos(angle) * radius;
      entry.reappearPosition.z += Math.sin(angle) * radius;
      entry.reappearRotation.y += THREE.MathUtils.degToRad(
        randomBetween(-6, 6)
      );
    }

    entry.object.visible = false;
    entry.hallucinated = true;
  }

  function updateHidden(entry, delta, lookingAtObject) {
    entry.hiddenElapsed += delta;

    const readyToReturn =
      entry.hiddenElapsed >= entry.hiddenMaxDuration ||
      (lookingAtObject && entry.hiddenElapsed >= entry.hiddenMinDuration);

    if (!readyToReturn) {
      return;
    }

    entry.object.visible = true;
    entry.object.position.copy(entry.reappearPosition);
    entry.object.rotation.set(
      entry.reappearRotation.x,
      entry.reappearRotation.y,
      entry.reappearRotation.z
    );

    entry.state = "idle";
    entry.hallucinated = entry.reappearShift;
  }

  function startMovement(entry, duration, targetHallucinated) {
    entry.state = "moving";
    entry.moveElapsed = 0;
    entry.moveDuration = duration;
    entry.targetHallucinated = targetHallucinated;

    entry.fromPosition.copy(entry.object.position);
    entry.fromRotation.set(
      entry.object.rotation.x,
      entry.object.rotation.y,
      entry.object.rotation.z
    );
  }

  function startRestore(entry) {
    entry.toPosition.copy(entry.originalPosition);
    entry.toRotation.copy(entry.originalRotation);
    startMovement(entry, randomBetween(1, 2.5), false);
  }

  function updateMovement(entry, delta) {
    entry.moveElapsed += delta;
    const progress = THREE.MathUtils.clamp(
      entry.moveElapsed / Math.max(0.001, entry.moveDuration),
      0,
      1
    );
    const smooth = progress * progress * (3 - 2 * progress);

    entry.object.position.lerpVectors(entry.fromPosition, entry.toPosition, smooth);
    entry.object.rotation.set(
      THREE.MathUtils.lerp(entry.fromRotation.x, entry.toRotation.x, smooth),
      THREE.MathUtils.lerp(entry.fromRotation.y, entry.toRotation.y, smooth),
      THREE.MathUtils.lerp(entry.fromRotation.z, entry.toRotation.z, smooth)
    );

    if (progress >= 1) {
      entry.state = "idle";
      entry.hallucinated = entry.targetHallucinated;
    }
  }

  return {
    update,
    register,
    setIntensity,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
