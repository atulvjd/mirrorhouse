import * as THREE from "three";
import { createMirrorShaderMaterial } from "../shaders/mirrorShader.js";

export function createHiddenMirror(parentGroup) {
  const group = new THREE.Group();
  group.name = "hiddenBasementMirror";
  parentGroup.add(group);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1715,
    roughness: 0.7,
    metalness: 0.45,
  });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 2.2), frameMaterial);
  frame.position.set(0, -2.77, -17.5);
  frame.receiveShadow = true;
  group.add(frame);

  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(2.95, 1.95),
    createMirrorShaderMaterial()
  );
  mirror.rotation.x = -Math.PI * 0.5;
  mirror.position.set(0, -2.74, -17.5);
  mirror.name = "basementHiddenMirror";
  group.add(mirror);

  // Keep it hidden until the carpet moves.
  group.visible = false;

  const mirrorCenter = new THREE.Vector3(0, -2.74, -17.5);
  const toMirror = new THREE.Vector3();
  const cameraForward = new THREE.Vector3();
  let revealed = false;
  let firstLookTriggered = false;
  let holdPending = false;

  function reveal() {
    if (revealed) {
      return;
    }

    revealed = true;
    group.visible = true;
  }

  function update(camera) {
    if (!revealed || firstLookTriggered || !camera) {
      return;
    }

    toMirror.copy(mirrorCenter).sub(camera.position);
    const distance = toMirror.length();
    if (distance > 4.6) {
      return;
    }

    toMirror.normalize();
    camera.getWorldDirection(cameraForward);
    const facing = cameraForward.dot(toMirror);
    if (facing < 0.84) {
      return;
    }

    firstLookTriggered = true;
    holdPending = true;
  }

  function consumeHoldRequest() {
    if (!holdPending) {
      return 0;
    }
    holdPending = false;
    return 1;
  }

  return {
    group,
    mirror,
    reveal,
    update,
    isRevealed() {
      return revealed;
    },
    consumeHoldRequest,
  };
}
