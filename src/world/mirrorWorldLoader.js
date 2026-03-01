import * as THREE from "three";
import { createBungalowInterior } from "./bungalowInterior.js";
import { createAtmosphere } from "./atmosphere.js";
import { createMirrorTown } from "./mirrorTownGenerator.js";
import { createNPCSystem } from "../systems/npcSystem.js";
import { createMirrorStoreEnvironment } from "./mirrorStoreEnvironment.js";
import { createNPCStareSystem } from "../systems/npcStareSystem.js";
import { createStoreCinematicEvent } from "../systems/storeCinematicEvent.js";
import { createVanishingMessageSystem } from "../systems/vanishingMessageSystem.js";
import { createPhotoClueSystem } from "../systems/photoClueSystem.js";
import { createObjectiveSystem } from "../systems/objectiveSystem.js";
import { createCityExplorationManager } from "../systems/cityExplorationManager.js";
import { createMaidenHome } from "./maidenHomeLocator.js";
import { createMemoryRecognitionTrigger } from "../systems/memoryRecognitionTrigger.js";
import { createFinalMirrorInteraction } from "../systems/finalMirrorInteraction.js";
import { createPlayerChoiceSystem } from "../systems/playerChoiceSystem.js";
import { createEndingSequenceManager } from "../systems/endingSequenceManager.js";

export function loadMirrorWorld(scene, camera, story, interaction, overlay) {
  // 1. Clear old environment
  const toRemove = [];
  scene.traverse(child => {
      if (child.name === "bungalowInterior" || child.name === "basementGroup" || child.name === "cinematicAtmosphere") {
          toRemove.push(child);
      }
  });
  toRemove.forEach(child => scene.remove(child));

  // 2. Load Core Mirror World
  const town = createMirrorTown(scene);
  const npcs = createNPCSystem(scene, story);
  const store = createMirrorStoreEnvironment(scene);
  const stareSystem = createNPCStareSystem(scene, camera, store.doorPosition);
  const cinematic = createStoreCinematicEvent(scene, interaction, overlay, story, store, stareSystem);
  const objectives = createObjectiveSystem();
  const cityManager = createCityExplorationManager(scene, camera);

  // 3. Load Inverted Bungalow Architecture
  const mirrorBungalow = createBungalowInterior(scene);
  mirrorBungalow.group.scale.x = -1;
  mirrorBungalow.group.name = "mirrorWorldBungalow";

  // 4. Vanishing Messages & Clue Systems
  const messages = createVanishingMessageSystem(scene, camera, () => {
      // Atmospheric reaction
      if (Math.random() > 0.5) scene.fog.density = 0.06;
      setTimeout(() => scene.fog.density = 0.05, 500);
  });

  const photoClues = createPhotoClueSystem(scene, story, interaction);
  mirrorBungalow.group.traverse(node => {
      if (node.isMesh && node.geometry.type === "BoxGeometry" && node.position.y < 1) {
          photoClues.setupTrunkClue(node);
      }
  });

  // 5. Dirt Text Clue (Outside)
  const dirtCanvas = document.createElement("canvas");
  dirtCanvas.width = 512;
  dirtCanvas.height = 128;
  const dCtx = dirtCanvas.getContext("2d");
  dCtx.font = "italic 60px 'Brush Script MT'";
  dCtx.fillStyle = "rgba(50, 40, 30, 0.8)";
  dCtx.textAlign = "center";
  dCtx.fillText("MAIDEN HOME", 256, 64);
  const dirtTex = new THREE.CanvasTexture(dirtCanvas);
  const dirtMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: dirtTex, transparent: true, opacity: 0.8, depthWrite: false }));
  dirtMesh.rotation.x = -Math.PI / 2;
  dirtMesh.position.set(0, 0.05, 10);
  scene.add(dirtMesh);

  // 6. The Maiden Home (Final Destination)
  const maidenHome = createMaidenHome(scene);
  const memoryTrigger = createMemoryRecognitionTrigger(camera, maidenHome, story);
  
  const endingManager = createEndingSequenceManager(scene, camera, overlay);
  const choiceSystem = createPlayerChoiceSystem(
      () => endingManager.triggerReturnEnding(),
      () => endingManager.triggerStayEnding()
  );
  
  const finalMirror = createFinalMirrorInteraction(scene, maidenHome.group, camera, interaction, () => {
      choiceSystem.show();
  });

  // 7. Mirror World Lighting & Atmosphere
  const mirrorAtmosphere = createAtmosphere(scene);
  scene.fog = new THREE.FogExp2(0x1a2530, 0.05);
  scene.background = new THREE.Color(0x1a2530);
  
  // 8. Position Player
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
      messages.update(delta);
      cityManager.update(delta, time);
      maidenHome.update(time, delta);
      memoryTrigger.update(delta);
      finalMirror.update(delta);
      endingManager.update(delta);
      mirrorAtmosphere.update(delta);

      dirtMesh.material.opacity = THREE.MathUtils.smoothstep(distToDirt, 2, 6) * 0.8;
  }

  return { 
      update,
      handleProductPickup: () => cinematic.isTriggered()
  };
}
