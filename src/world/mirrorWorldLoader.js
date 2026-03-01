import * as THREE from "three";
import { createBungalowInterior } from "./bungalowInterior.js";
import { createAtmosphere } from "./atmosphere.js";
import { createMirrorTown } from "./mirrorTownGenerator.js";
import { createNPCSystem } from "../systems/npcSystem.js";
import { createMirrorStoreEnvironment } from "./mirrorStoreEnvironment.js";
import { createNPCStareSystem } from "../systems/npcStareSystem.js";
import { createStoreCinematicEvent } from "../systems/storeCinematicEvent.js";

export function loadMirrorWorld(scene, camera, story, interaction, overlay) {
  // 1. Clear old environment
  const toRemove = [];
  scene.traverse(child => {
      if (child.name === "bungalowInterior" || child.name === "basementGroup" || child.name === "cinematicAtmosphere") {
          toRemove.push(child);
      }
  });
  toRemove.forEach(child => scene.remove(child));

  // 2. Load Mirrored Town & Normal NPCs
  const town = createMirrorTown(scene);
  const npcs = createNPCSystem(scene, story);

  // 3. Load Store, Store NPCs & Cinematic Event
  const store = createMirrorStoreEnvironment(scene);
  const stareSystem = createNPCStareSystem(scene, camera, store.doorPosition);
  const cinematic = createStoreCinematicEvent(scene, interaction, overlay, story, store, stareSystem);

  // 4. Load Inverted Bungalow
  const mirrorBungalow = createBungalowInterior(scene);
  mirrorBungalow.group.scale.x = -1;
  mirrorBungalow.group.name = "mirrorWorldBungalow";

  // 5. Mirror World Lighting & Atmosphere
  const mirrorAtmosphere = createAtmosphere(scene);
  scene.fog = new THREE.FogExp2(0x1a2530, 0.05);
  scene.background = new THREE.Color(0x1a2530);
  
  scene.children.forEach(child => {
      if (child.isAmbientLight) {
          child.color.setHex(0x3a4b66);
          child.intensity = 0.5;
      }
      if (child.isDirectionalLight) {
          child.color.setHex(0x7799ff);
          child.intensity = 0.8;
          child.position.x *= -1; 
      }
  });

  // 6. Position Player
  camera.position.set(0, 1.2, 0);
  camera.rotation.set(Math.PI / 2, 0, 0);
  
  let standingUp = true;
  let standProgress = 0;
  let time = 0;

  function update(delta) {
      time += delta;
      if (standingUp) {
          standProgress = Math.min(1, standProgress + delta * 0.3);
          const ease = 1 - Math.pow(1 - standProgress, 3);
          camera.position.y = THREE.MathUtils.lerp(1.2, 1.6, ease);
          camera.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, ease);
          if (standProgress >= 1) standingUp = false;
      }
      
      town.update(time);
      store.update(time);
      npcs.update(time, camera);
      stareSystem.update(delta);
      cinematic.update(camera);
      mirrorAtmosphere.update(delta);
  }

  // Allow interaction with town NPCs
  scene.traverse(node => {
      if (node.userData.isNPC) {
          interaction.register(node, () => node.userData.npcRef.interact());
      }
  });

  return { update };
}
