import * as THREE from "three";
import { getRandomDialogue } from "./citizenDialogue.js";

export function createCitizenBehavior(shadowEntry, anchor) {
  const behavior = {
    state: "wandering",
    target: new THREE.Vector3(),
    stareTimer: 0,
    followTimer: 0,
    idleTimer: randomBetween(1.2, 3.1),
    anchor: anchor.clone(),
    speed: randomBetween(0.8, 1.1),
    lastDialogue: "",
  };

  chooseNewTarget(behavior);

  function update(
    citizen,
    camera,
    delta,
    onSpeak,
    playerShadowFeelsNormal,
    shadowEntry
  ) {
    const citizenPos = citizen.group.position;
    const shadowPos = shadowEntry.position;

    const distanceToPlayer = camera.position.distanceTo(citizenPos);

    if (distanceToPlayer < 3.5 && behavior.state !== "stare") {
      behavior.state = "stare";
      behavior.stareTimer = randomBetween(2, 4);
      speak(onSpeak, playerShadowFeelsNormal);
    }

    if (
      playerShadowFeelsNormal &&
      behavior.state === "wandering" &&
      distanceToPlayer < 4.2 &&
      Math.random() < 0.22
    ) {
      behavior.state = "follow";
      behavior.followTimer = randomBetween(2, 4);
    }

    if (behavior.state === "stare") {
      behavior.stareTimer -= delta;
      lookAtPlayer(citizen.head, citizenPos, camera.position, delta);
      if (behavior.stareTimer <= 0) {
        behavior.state = "wandering";
        chooseNewTarget(behavior);
      }
    } else {
    if (behavior.state === "follow") {
      followPlayer(shadowPos, camera.position, delta);
      behavior.followTimer -= delta;
      if (behavior.followTimer <= 0) {
        behavior.state = "wandering";
        chooseNewTarget(behavior);
      }
    } else {
      movementUpdate(citizen, shadowPos, behavior, delta);
    }
      lookAtPlayer(citizen.head, citizenPos, shadowPos, delta);
      behavior.idleTimer -= delta;
      if (behavior.idleTimer <= 0) {
        chooseNewTarget(behavior);
      }
    }

    if (behavior.state === "follow" && playerShadowFeelsNormal) {
      behavior.target.copy(camera.position);
      behavior.target.y = anchor.y;
    }

    shadowEntry.target.copy(behavior.target);
  }

  function followPlayer(shadowPos, playerPosition, delta) {
    behavior.target.copy(playerPosition);
    shadowPos.lerp(playerPosition, Math.min(1, delta * 1.5));
  }

  function speak(onSpeak, longerStare) {
    if (typeof onSpeak !== "function") {
      return;
    }
    const line = getRandomDialogue();
    onSpeak(line, longerStare);
    behavior.lastDialogue = line;
  }

  function movementUpdate(citizen, shadowPos, behavior, delta) {
    const target = behavior.target;
    const distance = shadowPos.distanceTo(target);
    if (distance < 0.17) {
      behavior.state = "idle";
      behavior.idleTimer = randomBetween(1, 3);
      return;
    }

    shadowPos.lerp(target, Math.min(1, delta * 1.8));
    citizen.group.position.lerp(shadowPos, Math.min(1, delta * behavior.speed * 0.65));
    behavior.state = "wandering";
  }

  return {
    update,
  };
}

function chooseNewTarget(behavior) {
  const { anchor, target } = behavior;
  target.copy(anchor);
  target.x += randomBetween(-3.2, 3.2);
  target.z += randomBetween(-5.0, -2.0);
}

function lookAtPlayer(head, position, target, delta) {
  const direction = new THREE.Vector3().subVectors(target, position);
  direction.y = 0;
  if (direction.lengthSq() === 0) {
    return;
  }
  direction.normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    direction
  );
  head.quaternion.slerp(quat, Math.min(1, delta * 2.5));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
