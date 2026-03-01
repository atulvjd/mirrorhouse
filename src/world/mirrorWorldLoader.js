import * as THREE from "three";
import { createBungalowInterior } from "./bungalowInterior.js";
import { createAtmosphere } from "./atmosphere.js";

export function loadMirrorWorld(scene, camera) {
  // 1. Clear old environment (simplified clear logic for the sequence)
  const toRemove = [];
  scene.traverse(child => {
      if (child.name === "bungalowInterior" || child.name === "basementGroup" || child.name === "cinematicAtmosphere") {
          toRemove.push(child);
      }
  });
  toRemove.forEach(child => scene.remove(child));

  // 2. Load Inverted Bungalow
  const mirrorBungalow = createBungalowInterior(scene);
  
  // INVERT THE WORLD (Scale X by -1)
  mirrorBungalow.group.scale.x = -1;
  mirrorBungalow.group.name = "mirrorWorldBungalow";

  // 3. Mirror World Lighting & Atmosphere
  const mirrorAtmosphere = createAtmosphere(scene);
  
  // Override fog to be colder and denser
  scene.fog = new THREE.FogExp2(0x1a2530, 0.05); // Deeper blue/grey
  scene.background = new THREE.Color(0x1a2530);
  
  // Make lighting unsettling (Blueish ambient)
  scene.children.forEach(child => {
      if (child.isAmbientLight) {
          child.color.setHex(0x3a4b66); // Cold blue
          child.intensity = 0.5;
      }
      if (child.isDirectionalLight) {
          child.color.setHex(0x7799ff); // Cold moon
          child.intensity = 0.8;
          // Shadows are delayed or inverted (we simulate by changing angle)
          child.position.x *= -1; 
      }
  });

  // 4. Position Player
  // Wake up in the living room
  camera.position.set(0, 1.2, 0); // Lying on floor
  camera.rotation.set(Math.PI / 2, 0, 0); // Looking up
  
  // Camera slowly stands up sequence
  let standingUp = true;
  let standProgress = 0;

  function update(delta) {
      if (standingUp) {
          standProgress = Math.min(1, standProgress + delta * 0.3);
          const ease = 1 - Math.pow(1 - standProgress, 3);
          camera.position.y = THREE.MathUtils.lerp(1.2, 1.6, ease);
          camera.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, ease);
          if (standProgress >= 1) standingUp = false;
      }
      
      mirrorAtmosphere.update(delta);
  }

  return { update };
}
