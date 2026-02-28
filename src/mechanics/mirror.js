import * as THREE from "three";
import {
  createMirrorShaderMaterial,
  triggerMirrorGlitchPulse,
} from "../shaders/mirrorShader.js";

const MIRROR_MESSAGE = [
  "The reflection doesn't match your movement.",
  "It watches you.",
].join("\n");
const MIRROR_COOLDOWN_MS = 10000;

export function createMirrorController(story, onReflectionReact) {
  const mirrorMaterial = createMirrorShaderMaterial();

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), mirrorMaterial);
  mesh.position.set(0, 1.8, -9);
  mesh.name = "mirror";
  let lastInteractionTime = -Infinity;

  function onInteract() {
    const now = performance.now();
    if (now - lastInteractionTime < MIRROR_COOLDOWN_MS) {
      return;
    }

    if (story?.isActive?.()) {
      return;
    }

    lastInteractionTime = now;
    triggerMirrorGlitchPulse(0.55);

    if (typeof onReflectionReact === "function") {
      onReflectionReact();
    }

    if (story?.showMemory) {
      story.showMemory(MIRROR_MESSAGE);
    }
  }

  return {
    mesh,
    onInteract,
  };
}
