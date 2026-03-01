import * as THREE from "three";

export function createRenderer() {
  const container = document.getElementById("game");

  if (!container) {
    throw new Error("Game container '#game' was not found.");
  }

  // Create and configure the WebGL renderer.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Attach canvas to the game mount point.
  container.appendChild(renderer.domElement);

  // Keep renderer size synced with the browser window.
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}
