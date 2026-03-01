import * as THREE from "three";

export function createFlashlightSystem(camera) {
  const flashlight = new THREE.SpotLight(0xffffff, 0, 25, Math.PI * 0.18, 0.4, 1);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(1024, 1024);
  
  const pivot = new THREE.Group();
  camera.add(pivot);
  pivot.add(flashlight);
  pivot.add(flashlight.target);
  flashlight.target.position.set(0, 0, -5);

  let enabled = false;
  let time = 0;

  function enable() {
    enabled = true;
    flashlight.intensity = 2.5;
  }

  function update(delta) {
    if (!enabled) return;
    time += delta;
    
    pivot.position.y = Math.sin(time * 1.5) * 0.015;
    pivot.position.x = Math.cos(time * 1.2) * 0.01;
    
    if (Math.random() > 0.992) {
        flashlight.intensity = 0.8 + Math.random() * 1.8;
    } else {
        flashlight.intensity = THREE.MathUtils.lerp(flashlight.intensity, 2.5, 0.15);
    }
  }

  return { enable, update, light: flashlight };
}
