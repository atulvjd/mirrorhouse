import * as THREE from "three";

export function createRenderer() {
  const container = document.getElementById("game");

  if (!container) {
    throw new Error("Game container '#game' was not found.");
  }

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.0; // Very high for debug
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  container.appendChild(renderer.domElement);

  // Simplified: No post-processing for now to ensure visibility
  const setupComposer = () => {};

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer,
    composer: renderer, // Return renderer as composer so composer.render() works
    setupComposer
  };
}
