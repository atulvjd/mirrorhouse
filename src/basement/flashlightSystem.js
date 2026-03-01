import * as THREE from "three";

export function createFlashlightSystem(camera) {
  // Flashlight properties: warm white, intensity 3.5, range 12, narrow angle, soft penumbra
  const flashlight = new THREE.SpotLight(0xfff4d6, 0, 12, Math.PI * 0.15, 0.8, 1);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(1024, 1024);
  
  const pivot = new THREE.Group();
  camera.add(pivot);
  pivot.add(flashlight);
  pivot.add(flashlight.target);
  flashlight.target.position.set(0, 0, -5);

  let enabled = false;
  let time = 0;
  let flickerTimer = 0;

  function enable() {
    enabled = true;
    flashlight.intensity = 3.5;
  }

  function update(delta) {
    if (!enabled) return;
    time += delta;
    flickerTimer -= delta;
    
    // Subtle hand shake
    pivot.position.y = Math.sin(time * 1.5) * 0.01;
    pivot.position.x = Math.cos(time * 1.2) * 0.008;
    
    // Tension flicker every few seconds
    if (flickerTimer <= 0) {
        if (Math.random() > 0.8) {
            flashlight.intensity = 1.0 + Math.random() * 1.5; // Drop intensity
        }
        if (Math.random() > 0.95) {
            flickerTimer = 3 + Math.random() * 5; // Schedule next flicker
        } else {
            flickerTimer = 0.1; // Quick successive flickers
        }
    } else {
        flashlight.intensity = THREE.MathUtils.lerp(flashlight.intensity, 3.5, delta * 5);
    }
  }

  return { enable, update, light: flashlight };
}
