import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export function createPlayerControls(camera, renderer) {
  const controls = new PointerLockControls(camera, renderer.domElement);

  // Track input state for WASD movement.
  const input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const walkSpeed = 6;
  const acceleration = 60;
  const damping = 10;
  let time = 0;
  const initialCameraY = camera.position.y;

  function onKeyDown(event) {
    switch (event.code) {
      case "KeyW":
        input.forward = true;
        break;
      case "KeyS":
        input.backward = true;
        break;
      case "KeyA":
        input.left = true;
        break;
      case "KeyD":
        input.right = true;
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    switch (event.code) {
      case "KeyW":
        input.forward = false;
        break;
      case "KeyS":
        input.backward = false;
        break;
      case "KeyA":
        input.left = false;
        break;
      case "KeyD":
        input.right = false;
        break;
      default:
        break;
    }
  }

  function onClick() {
    if (!controls.isLocked) {
      controls.lock();
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  document.addEventListener("click", onClick);

  function update(delta) {
    if (!controls.isLocked) {
      return;
    }

    time += delta;

    // Apply damping so movement eases in and out instead of stepping per frame.
    const dampingFactor = Math.min(1, damping * delta);
    velocity.x -= velocity.x * dampingFactor;
    velocity.z -= velocity.z * dampingFactor;

    direction.set(
      Number(input.right) - Number(input.left),
      0,
      Number(input.forward) - Number(input.backward)
    );

    if (direction.lengthSq() > 0) {
      direction.normalize();
      velocity.x += direction.x * acceleration * delta;
      velocity.z += direction.z * acceleration * delta;
    }

    // Clamp horizontal velocity to the configured walk speed.
    const speed = Math.hypot(velocity.x, velocity.z);
    if (speed > walkSpeed) {
      const scale = walkSpeed / speed;
      velocity.x *= scale;
      velocity.z *= scale;
    }

    controls.moveRight(velocity.x * delta);
    controls.moveForward(velocity.z * delta);

    // --- CINEMATIC CAMERA BREATHING ---
    // Subtle vertical and horizontal sway
    const breathingSpeed = 1.2;
    const breathingAmount = 0.02;
    const movementMultiplier = speed > 0.1 ? 2.5 : 1.0; // Stronger when walking

    camera.position.y = initialCameraY + Math.sin(time * breathingSpeed) * breathingAmount * movementMultiplier;
    camera.rotation.z = Math.cos(time * breathingSpeed * 0.5) * 0.003 * movementMultiplier;
  }

  return {
    controls,
    update,
  };
}
