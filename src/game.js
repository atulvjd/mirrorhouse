import * as THREE from "three";
import { createRenderer } from "./engine/renderer.js";
import { createScene, createFlickerSystem } from "./engine/scene.js";
import { createCamera } from "./engine/camera.js";
import { createPlayerControls } from "./player/movement.js";
import { createHouse } from "./world/house.js";
import { createInteractionSystem } from "./systems/interaction.js";
import { createInteractionOverlay } from "./ui/overlay.js";
import { createStorySystem } from "./systems/story.js";
import { createStoryFragments } from "./systems/storyFragments.js";
import { createReflection } from "./mechanics/reflection.js";
import { createAudioSystem } from "./systems/audio.js";
import { createAudioAtmosphere } from "./systems/audioAtmosphere.js";
import { createGlitchSystem } from "./systems/glitch.js";
import { createMirrorEntity } from "./systems/entity.js";
import { triggerMirrorGlitchPulse } from "./shaders/mirrorShader.js";
import { createCameraEffects } from "./systems/cameraEffects.js";
import { createHallucinationSystem } from "./systems/hallucinationSystem.js";
import { createRealityDistortion } from "./systems/realityDistortion.js";
import { createCinematicEvents } from "./systems/cinematicEvents.js";
import { createObjectiveSystem } from "./systems/objectiveSystem.js";
import { createSky } from "./environment/sky.js";
import { createFog } from "./environment/fog.js";
import { createGate } from "./environment/gate.js";
import { createBungalow } from "./environment/bungalow.js";
import { createGarden } from "./environment/garden.js";
import { createLighting } from "./environment/lighting.js";
import { createGround } from "./environment/ground.js";
import { createInteriorLighting } from "./interior/lightingInterior.js";
import { createRoomInterior } from "./world/roomInterior.js";
import { createFurniture } from "./world/furniture.js";
import { createAtmosphere } from "./world/atmosphere.js";
import { createStoryDetails } from "./world/storyDetails.js";
import { createDrawerSystem } from "./interior/drawerSystem.js";
import { createPhotoSystem } from "./interior/photoSystem.js";
import { createLetterSystem } from "./interior/letterSystem.js";
import { createDustParticles } from "./interior/dustParticles.js";
import { createMirrorWorldScene } from "./mirrorWorld/mirrorWorldScene.js";
import { createBasementEnvironment } from "./basement/basementEnvironment.js";
import { createBasementStaircase } from "./basement/staircase.js";
import { createFlashlightSystem } from "./basement/flashlightSystem.js";
import { createPowerCutEvent } from "./basement/powerCutEvent.js";
import { createCarpetSystem } from "./basement/carpetSystem.js";
import { createHiddenMirror } from "./basement/hiddenMirror.js";
import { createBasementSound } from "./basement/basementSound.js";

export function startGame() {
  // Initialize the core Three.js objects.
  const renderer = createRenderer();
  const scene = createScene();
  const sky = createSky(scene);
  createFog(scene);
  const ground = createGround(scene);
  const gate = createGate(scene);
  const exteriorBungalow = createBungalow(scene);
  const garden = createGarden(scene);
  const environmentLighting = createLighting(scene);
  const flicker = createFlickerSystem(scene);
  const glitch = createGlitchSystem(scene);
  const camera = createCamera();
  camera.position.set(0, 1.6, 8);
  camera.lookAt(0, 2.2, -8);
  renderer.shadowMap.enabled = true;
  const reality = createRealityDistortion(scene, camera);
  const cameraEffects = createCameraEffects(camera);
  const hallucinations = createHallucinationSystem(scene, camera);
  const atmosphere = createAudioAtmosphere(camera);
  const audio = createAudioSystem(camera);
  const storyFragments = createStoryFragments();
  const objectives = createObjectiveSystem();
  const cinematicEvents = createCinematicEvents({
    scene,
    storyFragments,
    objectives,
  });
  const openingAmbient = createOpeningAmbientAudio();
  let interiorLoaded = false;
  let interiorActive = false;
  let interiorSystems = null;
  let mirrorWorldPending = false;
  let mirrorWorldActive = false;
  let mirrorWorld = null;
  let basementUnlocked = false;
  let basementLoaded = false;
  let basementSystems = null;
  let basementMirrorHoldRemaining = 0;
  let basementPowerCutTriggered = false;
  const exteriorBackground = scene.background;
  const exteriorFog = scene.fog;

  let forcedMirrorLookRemaining = 0;
  let mirrorObject = null;
  let mirrorInteractionCount = 0;
  let reflection = null;
  let endingActive = false;
  let endingComplete = false;
  let endingSequenceState = "idle";
  let endingStateElapsed = 0;
  let endingPulseElapsed = 0;
  let endingEntitySpawned = false;
  const endingLockedQuaternion = new THREE.Quaternion();
  let endingLookLocked = false;
  const ENDING_DESYNC_DURATION = 2;
  const ENDING_WALK_DURATION = 3;
  const ENDING_DISAPPEAR_DURATION = 0.35;
  const ENDING_BEHIND_REVEAL_DURATION = 1;
  const ENDING_FADE_DURATION = 3;
  const exteriorRoots = [
    sky.object,
    ground.object,
    gate.object,
    exteriorBungalow.object,
    garden.object,
    environmentLighting.object,
  ];

  const story = createStorySystem({ fragments: storyFragments });
  objectives.setObjective("Explore grandmother's bungalow");

  const house = createHouse(story, {
    onMirrorInteract: () => {
      mirrorInteractionCount += 1;
      forcedMirrorLookRemaining = 2;
      audio.triggerWhisper(getMirrorDistance());
      atmosphere.triggerMirrorDistortion();
      cameraEffects.triggerMirrorPulse();
      glitch.trigger();
      applyEscalationLevel();
    },
  });
  scene.add(house);
  exteriorRoots.push(house);
  if (scene.userData.pointLight) {
    reality.registerLight(scene.userData.pointLight);
  }
  if (environmentLighting.moonLight) {
    reality.registerLight(environmentLighting.moonLight);
  }
  const ambientLight =
    scene.children.find((child) => child.isAmbientLight) || null;
  if (ambientLight) {
    reality.registerLight(ambientLight);
  }

  registerHallucinationMeshes(house, hallucinations);

  mirrorObject = house.getObjectByName("mirror") || null;
  const reflectionSceneIndex = scene.children.length;
  reflection = createReflection(scene);
  const reflectionObject = scene.children[reflectionSceneIndex] || null;
  const mirrorEntity = createMirrorEntity(scene);
  const reflectionHead =
    reflectionObject?.children.find(
      (child) => child.isMesh && child.geometry?.type === "SphereGeometry"
    ) || null;
  const reflectionHeadTarget = new THREE.Quaternion();

  const movement = createPlayerControls(camera, renderer);
  const interaction = createInteractionSystem(camera, scene);
  const overlay = createInteractionOverlay();
  const clock = new THREE.Clock();
  const mirrorWorldPosition = new THREE.Vector3();
  const headEuler = new THREE.Euler();
  const reflectionPrevPosition = new THREE.Vector3();
  const reflectionPrevHeadQuaternion = new THREE.Quaternion();
  const cameraPositionHistory = [];
  const maxCameraHistory = 48;
  let hasReflectionPreviousFrame = false;
  let autonomousSignatureActive = false;
  const endingOverlay = document.createElement("div");
  const endingMessage = document.createElement("div");

  endingOverlay.style.position = "fixed";
  endingOverlay.style.inset = "0";
  endingOverlay.style.display = "none";
  endingOverlay.style.alignItems = "center";
  endingOverlay.style.justifyContent = "center";
  endingOverlay.style.background = "rgba(0, 0, 0, 0)";
  endingOverlay.style.pointerEvents = "none";
  endingOverlay.style.zIndex = "70";

  endingMessage.textContent = "YOU WERE NEVER ALONE";
  endingMessage.style.color = "#f4f4f4";
  endingMessage.style.fontFamily = "monospace";
  endingMessage.style.fontSize = "clamp(22px, 4vw, 44px)";
  endingMessage.style.letterSpacing = "0.14em";
  endingMessage.style.opacity = "0";
  endingMessage.style.transition = "opacity 0.5s ease";
  endingMessage.style.textAlign = "center";

  endingOverlay.appendChild(endingMessage);
  document.body.appendChild(endingOverlay);

  const interactables = house.userData.interactables || [];
  for (const { object, callback } of interactables) {
    interaction.register(object, callback);
  }

  function shouldEnterInterior() {
    if (interiorLoaded || endingActive || endingComplete) {
      return false;
    }

    const nearDoor =
      Math.abs(camera.position.x) < 1.25 &&
      camera.position.z < -4.7 &&
      camera.position.z > -7.2 &&
      camera.position.y < 2.6;

    return nearDoor;
  }

  function disableExteriorRendering() {
    for (let i = 0; i < exteriorRoots.length; i += 1) {
      const root = exteriorRoots[i];
      if (root) {
        root.visible = false;
      }
    }

    scene.background = new THREE.Color(0x0b0908);
    scene.fog = new THREE.FogExp2(0x0f0d0c, 0.09);
  }

  function loadInterior() {
    if (interiorLoaded) {
      return;
    }

    const interiorRoom = createRoomInterior(scene);
    const furniture = createFurniture(interiorRoom.group);
    const cinematicAtmosphere = createAtmosphere(scene);
    createStoryDetails(scene);
    
    const drawerSystem = createDrawerSystem(
      furniture.drawer,
      furniture.drawerContentAnchor
    );
    const photoSystem = createPhotoSystem(drawerSystem.getContentAnchor(), story);
    const letterSystem = createLetterSystem(drawerSystem.getContentAnchor());
    const dustParticles = createDustParticles(scene, camera, interiorRoom.bounds);
    const interiorLighting = createInteriorLighting(scene);

    interiorSystems = {
      interior: interiorRoom.group,
      furniture,
      drawerSystem,
      photoSystem,
      letterSystem,
      dustParticles,
      interiorLighting,
      cinematicAtmosphere,
      update: (delta, locked) => {
        drawerSystem.update(delta);
        photoSystem.update(delta);
        interiorLighting.update(delta);
        dustParticles.update(delta);
        cinematicAtmosphere.update(delta);
      }
    };

    const drawerInteractable = drawerSystem.getInteractable();
    interaction.register(drawerInteractable.object, drawerInteractable.callback);

    for (let i = 0; i < photoSystem.interactables.length; i += 1) {
      const entry = photoSystem.interactables[i];
      interaction.register(entry.object, entry.callback);
    }

    for (let i = 0; i < letterSystem.interactables.length; i += 1) {
      const entry = letterSystem.interactables[i];
      interaction.register(entry.object, entry.callback);
    }

    registerHallucinationMeshes(interiorRoom.group, hallucinations);
    registerHallucinationMeshes(furniture.group, hallucinations);

    interiorLoaded = true;
    interiorActive = true;
    disableExteriorRendering();

    camera.position.set(0, 1.6, -2); // Adjusted for the 10x10 room
    camera.lookAt(0, 1.62, -10.2);
  }

  function shouldLoadBasement() {
    return interiorLoaded && basementUnlocked && !basementLoaded;
  }

  function loadBasement() {
    if (basementLoaded || !interiorSystems) {
      return;
    }

    const basementEnvironment = createBasementEnvironment(scene);
    const staircase = createBasementStaircase(interiorSystems.interior);
    const basementSound = createBasementSound();
    const flashlightSystem = createFlashlightSystem(camera);
    const hiddenMirror = createHiddenMirror(basementEnvironment.group);
    const carpetSystem = createCarpetSystem(basementEnvironment.group, () => {
      basementSound.triggerCarpetDrag();
      hiddenMirror.reveal();
      basementSound.triggerMirrorRevealTone();
    });

    const globalLights = [];
    scene.traverse((node) => {
      if (node.isLight) {
        globalLights.push(node);
      }
    });

    const lightsToCut = Array.from(
      new Set([
        ...globalLights,
      interiorSystems.interiorLighting.ambient,
      interiorSystems.interiorLighting.moonLight,
      staircase.stairLight,
      basementEnvironment.weakAmbient,
      ...interiorSystems.interiorLighting.pointLights,
      ])
    );

    const powerCutEvent = createPowerCutEvent(lightsToCut, () => {
      basementSound.start();
      flashlightSystem.enable();
      basementSound.triggerPowerBuzz();
    });

    basementSystems = {
      basementEnvironment,
      staircase,
      sound: basementSound,
      flashlightSystem,
      powerCutEvent,
      carpetSystem,
      hiddenMirror,
    };

    const carpetInteractable = carpetSystem.getInteractable();
    interaction.register(carpetInteractable.object, carpetInteractable.callback);

    for (let i = 0; i < basementEnvironment.inspectables.length; i += 1) {
      const inspectable = basementEnvironment.inspectables[i];
      interaction.register(inspectable.object, () => {
        if (story.isActive()) {
          return;
        }
        story.showMemory(inspectable.text);
      });
    }

    registerHallucinationMeshes(basementEnvironment.group, hallucinations);
    basementLoaded = true;
  }

  // Keep camera projection aligned with viewport changes.
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  window.addEventListener("keydown", (event) => {
    if (
      mirrorWorldActive &&
      mirrorWorld &&
      event.code === "KeyE" &&
      mirrorWorld.handleProductPickup()
    ) {
      overlay.setText("They stare at you.");
      overlay.setVisible(true);
    }
  });

  // Run the base render loop.
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const letterActive = interiorSystems?.letterSystem?.isActive() || false;
    if (letterActive) {
      basementUnlocked = true;
      cinematicEvents.triggerBasementSequence();
    }
    if (shouldLoadBasement()) {
      loadBasement();
    }

    if (basementMirrorHoldRemaining > 0) {
      basementMirrorHoldRemaining = Math.max(
        0,
        basementMirrorHoldRemaining - delta
      );
    }

    if (mirrorWorldPending && !mirrorWorldActive) {
      enterMirrorWorld();
    }

    if (mirrorWorldActive && mirrorWorld) {
      movement.update(delta);
      mirrorWorld.update(camera, delta);
      const prompt = mirrorWorld.getStorePrompt();
      overlay.setText(prompt || "");
      overlay.setVisible(Boolean(prompt));
      renderer.render(mirrorWorld.scene, camera);
      return;
    }

    if (
      endingActive ||
      endingComplete ||
      story.isActive() ||
      letterActive ||
      basementMirrorHoldRemaining > 0
    ) {
      overlay.setVisible(false);
    } else {
      movement.update(delta);

      if (shouldEnterInterior()) {
        loadInterior();
      }

      const target = interaction.update();
      const promptText =
        target?.userData?.inspectPrompt ||
        (target?.userData?.inspectType
          ? "Press E to inspect"
          : "Press E to interact");
      overlay.setText(promptText);
      overlay.setVisible(Boolean(target));
    }

    if (movement.controls.isLocked && !interiorActive) {
      openingAmbient.start();
    }
    if (!interiorActive) {
      openingAmbient.update(delta);
      sky.update(delta);
      gate.update(camera, delta);
      garden.update(delta);
      environmentLighting.update(delta);

      const environmentUpdate = house.userData.environmentUpdate;
      if (typeof environmentUpdate === "function") {
        environmentUpdate(camera, delta);
      }
    } else if (interiorSystems) {
      interiorSystems.update(delta, movement.controls.isLocked);
    }

    if (basementLoaded && basementSystems) {
      const stairState = basementSystems.staircase.update(
        camera,
        delta,
        () => {
          basementSystems.sound.start();
          basementSystems.sound.triggerStepCreak();
        }
      );

      if (stairState.inBasementZone || basementPowerCutTriggered) {
        basementSystems.sound.start();
      }

      if (stairState.reachedBasementFloor && !basementPowerCutTriggered) {
        basementPowerCutTriggered = basementSystems.powerCutEvent.trigger();
      }

      basementSystems.sound.update(delta);
      basementSystems.flashlightSystem.update(delta);
      basementSystems.carpetSystem.update(delta);
      basementSystems.hiddenMirror.update(camera, delta);

      const holdDuration = basementSystems.hiddenMirror.consumeHoldRequest();
      if (holdDuration > 0) {
        basementMirrorHoldRemaining = Math.max(
          basementMirrorHoldRemaining,
          holdDuration
        );
      }
    }

    reflection.update(camera, delta);
    atmosphere.update(delta);

    if (mirrorEntity.isActive() && !endingActive && !endingComplete) {
      const entityState = mirrorEntity.update(camera, delta);
      atmosphere.setEntityDistance(entityState.distance);
      cameraEffects.setEntityDistance(entityState.distance);
      if (entityState.caught) {
        startEndingSequence("entityCatch");
      }
    } else {
      atmosphere.setEntityDistance(Infinity);
      cameraEffects.setEntityDistance(Infinity);
    }

    cameraPositionHistory.push(camera.position.clone());
    if (cameraPositionHistory.length > maxCameraHistory) {
      cameraPositionHistory.shift();
    }

    const reflectionVisible = Boolean(reflectionObject?.visible);
    const autonomousSignature =
      endingSequenceState === "idle" && !endingComplete
        ? detectAutonomousDriftSignature(reflectionVisible, delta)
        : false;

    if (autonomousSignature && !autonomousSignatureActive) {
      audio.triggerWhisper(getMirrorDistance());
      atmosphere.triggerMirrorDistortion();
      cameraEffects.triggerMirrorPulse();
      glitch.trigger();
    }

    autonomousSignatureActive = reflectionVisible && autonomousSignature;

    if (
      forcedMirrorLookRemaining > 0 &&
      reflectionHead &&
      reflectionObject?.visible &&
      !endingActive &&
      !endingComplete
    ) {
      forcedMirrorLookRemaining -= delta;
      const currentHeadRotation = reflectionHead.quaternion.clone();
      reflectionHead.lookAt(camera.position);
      reflectionHeadTarget.copy(reflectionHead.quaternion);
      reflectionHead.quaternion.copy(currentHeadRotation);
      reflectionHead.quaternion.slerp(
        reflectionHeadTarget,
        Math.min(1, 6 * delta)
      );
    }

    scene.userData.activeCamera = camera;
    scene.userData.reflectionVisible = reflectionVisible;

    if (endingActive) {
      updateEndingSequence(delta);
    }

    if (!basementPowerCutTriggered) {
      glitch.update(delta);
      flicker.update(delta);
      reality.update(delta);
    }
    cameraEffects.update(delta);
    cinematicEvents.update(delta, mirrorWorldActive);
    hallucinations.update(delta);
    renderer.render(scene, camera);
  }

  function getMirrorDistance() {
    if (!mirrorObject) {
      return Infinity;
    }

    mirrorObject.getWorldPosition(mirrorWorldPosition);
    return camera.position.distanceTo(mirrorWorldPosition);
  }

  function detectAutonomousDriftSignature(reflectionVisible, delta) {
    if (!reflectionVisible || !reflectionObject || !reflectionHead) {
      hasReflectionPreviousFrame = false;
      return false;
    }

    const cameraSample20 =
      cameraPositionHistory[Math.max(0, cameraPositionHistory.length - 1 - 20)];
    const cameraSample25 =
      cameraPositionHistory[Math.max(0, cameraPositionHistory.length - 1 - 25)];

    const expectedX20 = cameraSample20 ? cameraSample20.x : reflectionObject.position.x;
    const expectedX25 = cameraSample25 ? cameraSample25.x : reflectionObject.position.x;
    const xOffsetFromExpected = Math.min(
      Math.abs(reflectionObject.position.x - expectedX20),
      Math.abs(reflectionObject.position.x - expectedX25)
    );

    const sideStepSignature =
      xOffsetFromExpected > 0.12 && xOffsetFromExpected < 0.5;

    headEuler.setFromQuaternion(reflectionHead.quaternion, "YXZ");
    const headTiltSignature =
      Math.abs(headEuler.z) > THREE.MathUtils.degToRad(8);

    let delayedHeadTrackingSignature = false;
    if (hasReflectionPreviousFrame && forcedMirrorLookRemaining <= 0) {
      const bodyTravel = reflectionObject.position.distanceTo(reflectionPrevPosition);
      const headTurnDelta = reflectionHead.quaternion.angleTo(
        reflectionPrevHeadQuaternion
      );
      delayedHeadTrackingSignature =
        bodyTravel < 0.0035 && headTurnDelta > Math.max(0.008, delta * 0.2);
    }

    reflectionPrevPosition.copy(reflectionObject.position);
    reflectionPrevHeadQuaternion.copy(reflectionHead.quaternion);
    hasReflectionPreviousFrame = true;

    return sideStepSignature || headTiltSignature || delayedHeadTrackingSignature;
  }

  function applyEscalationLevel() {
    const hallucinationLevel =
      mirrorInteractionCount <= 2
        ? 0
        : mirrorInteractionCount <= 4
          ? 1
          : mirrorInteractionCount <= 6
            ? 2
            : 3;
    hallucinations.setIntensity(hallucinationLevel);

    if (!reflection) {
      return;
    }

    if (mirrorInteractionCount <= 2) {
      reflection.setExtraDelay(0);
      reflection.setFreezeEnabled(false);
      return;
    }

    if (mirrorInteractionCount <= 4) {
      reflection.setExtraDelay(10);
      reflection.setFreezeEnabled(false);
      return;
    }

    if (mirrorInteractionCount <= 6) {
      reflection.setExtraDelay(10);
      reflection.setFreezeEnabled(true);
      return;
    }

    reflection.setExtraDelay(10);
    reflection.setFreezeEnabled(true);

    startEndingSequence("finalMirrorInteraction");
  }

  function startEndingSequence(trigger) {
    if (endingActive || endingComplete) {
      return;
    }

    if (story.isActive()) {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape" }));
    }
    if (interiorSystems?.letterSystem?.isActive()) {
      interiorSystems.letterSystem.close();
    }

    if (!movement.controls.isLocked) {
      movement.controls.lock();
    }

    if (mirrorEntity.isActive()) {
      mirrorEntity.remove();
    }

    endingActive = true;
    endingSequenceState = "idle";
    endingStateElapsed = 0;
    endingPulseElapsed = 0;
    endingEntitySpawned = false;
    endingLookLocked = false;
    forcedMirrorLookRemaining = 0;
    cameraEffects.setEndingActive(true);
    endingOverlay.style.display = "flex";
    endingOverlay.style.background = "rgba(0, 0, 0, 0)";
    endingMessage.style.opacity = "0";

    if (mirrorObject) {
      mirrorObject.visible = true;
    }

    reflection.startEndingSequence(camera);
    setEndingSequenceState("desync");

    if (trigger === "finalMirrorInteraction") {
      atmosphere.triggerMirrorDistortion();
      cameraEffects.triggerMirrorPulse();
      reality.triggerRealityPulse();
      cinematicEvents.triggerMirrorTransition();
    }
  }

  function setEndingSequenceState(nextState) {
    if (endingSequenceState === nextState) {
      return;
    }

    endingSequenceState = nextState;
    endingStateElapsed = 0;
    endingPulseElapsed = 0;
    reflection.setEndingSequenceState(nextState, camera);

    if (nextState === "disappear") {
      if (mirrorObject) {
        mirrorObject.visible = false;
      }
      return;
    }

    if (nextState === "behindReveal") {
      if (!endingEntitySpawned) {
        mirrorEntity.spawnBehindPlayer(camera);
        endingEntitySpawned = true;
      }
      endingLockedQuaternion.copy(camera.quaternion);
      endingLookLocked = true;
      return;
    }

    if (nextState === "fadeOut") {
      endingLookLocked = false;
    }
  }

  function updateEndingSequence(delta) {
    endingStateElapsed += delta;
    endingPulseElapsed -= delta;

    const pointLight = scene.userData.pointLight || null;

    if (endingSequenceState === "desync") {
      if (endingPulseElapsed <= 0) {
        triggerMirrorGlitchPulse(0.18);
        cameraEffects.triggerMirrorPulse();
        atmosphere.triggerMirrorDistortion();
        endingPulseElapsed = 0.33;
      }

      if (pointLight) {
        const targetIntensity = 0.3 + Math.abs(Math.sin(endingStateElapsed * 9)) * 0.35;
        pointLight.intensity = THREE.MathUtils.lerp(
          pointLight.intensity,
          targetIntensity,
          Math.min(1, 10 * delta)
        );
      }

      if (endingStateElapsed >= ENDING_DESYNC_DURATION) {
        setEndingSequenceState("walkForward");
      }
      return;
    }

    if (endingSequenceState === "walkForward") {
      if (endingPulseElapsed <= 0) {
        triggerMirrorGlitchPulse(0.24);
        cameraEffects.triggerMirrorPulse();
        atmosphere.triggerMirrorDistortion();
        reality.triggerRealityPulse();
        glitch.trigger();
        endingPulseElapsed = 0.14;
      }

      if (pointLight) {
        const targetIntensity = 0.12 + Math.abs(Math.sin(endingStateElapsed * 24)) * 1.35;
        pointLight.intensity = THREE.MathUtils.lerp(
          pointLight.intensity,
          targetIntensity,
          Math.min(1, 16 * delta)
        );
      }

      if (endingStateElapsed >= ENDING_WALK_DURATION) {
        setEndingSequenceState("disappear");
      }
      return;
    }

    if (endingSequenceState === "disappear") {
      if (endingPulseElapsed <= 0) {
        triggerMirrorGlitchPulse(0.36);
        cameraEffects.triggerMirrorPulse();
        endingPulseElapsed = 0.11;
      }

      if (pointLight) {
        pointLight.intensity = THREE.MathUtils.lerp(
          pointLight.intensity,
          0.05,
          Math.min(1, 14 * delta)
        );
      }

      if (endingStateElapsed >= ENDING_DISAPPEAR_DURATION) {
        setEndingSequenceState("behindReveal");
      }
      return;
    }

    if (endingSequenceState === "behindReveal") {
      if (endingLookLocked) {
        camera.quaternion.slerp(endingLockedQuaternion, 1);
      }

      if (pointLight) {
        pointLight.intensity = THREE.MathUtils.lerp(
          pointLight.intensity,
          0.1,
          Math.min(1, 8 * delta)
        );
      }

      if (endingStateElapsed >= ENDING_BEHIND_REVEAL_DURATION) {
        setEndingSequenceState("fadeOut");
      }
      return;
    }

    if (endingSequenceState !== "fadeOut") {
      return;
    }

    const progress = THREE.MathUtils.clamp(
      endingStateElapsed / ENDING_FADE_DURATION,
      0,
      1
    );

    if (endingPulseElapsed <= 0) {
      triggerMirrorGlitchPulse(0.11 + (1 - progress) * 0.14);
      cameraEffects.triggerMirrorPulse();
      endingPulseElapsed = 0.18;
    }

    endingOverlay.style.background = `rgba(0, 0, 0, ${progress.toFixed(3)})`;

    if (progress >= 1 && !endingComplete) {
      endingActive = false;
      endingComplete = true;
      cameraEffects.setEndingActive(false);
      endingMessage.style.opacity = "1";
      prepareMirrorWorld();
    }
  }

  function prepareMirrorWorld() {
    if (mirrorWorldActive || mirrorWorldPending) {
      return;
    }

    mirrorWorldPending = true;
  }

  function enterMirrorWorld() {
    if (mirrorWorldActive || !mirrorWorldPending) {
      return;
    }

    mirrorWorld = createMirrorWorldScene(camera);
    mirrorWorldActive = true;
    mirrorWorldPending = false;

    endingOverlay.style.display = "none";
    overlay.setVisible(false);

    movement.controls.getObject().position.set(0, -2.3, -17.4);
    movement.controls.getObject().quaternion.set(0, 0, 0, 1);
    camera.position.set(0, -2.3, -17.4);
    camera.lookAt(0, -2.3, -15.2);

    if (!movement.controls.isLocked) {
      movement.controls.lock();
    }
    cinematicEvents.completeMirrorTransition();
  }

  animate();
}

function registerHallucinationMeshes(root, hallucinations) {
  root.traverse((object) => {
    if (!object.isMesh || object.name === "mirror" || !object.geometry) {
      return;
    }

    if (!object.geometry.boundingBox) {
      object.geometry.computeBoundingBox();
    }

    const box = object.geometry.boundingBox;
    if (!box) {
      return;
    }

    const sizeX = box.max.x - box.min.x;
    const sizeY = box.max.y - box.min.y;
    const sizeZ = box.max.z - box.min.z;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);

    if (maxSize > 3) {
      return;
    }

    hallucinations.register(object);
  });
}

function createOpeningAmbientAudio() {
  let started = false;
  let context = null;
  let windGain = null;
  let treeGain = null;
  let insectsGain = null;
  let metalGain = null;
  let windLfo = null;
  let treeLfo = null;
  let insectsTimer = randomBetween(3, 8);
  let metalTimer = randomBetween(8, 16);

  function ensureStarted() {
    if (started) {
      if (context?.state === "suspended") {
        context.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    context = new AudioCtx();
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const wind = createNoiseLayer(context, {
      gain: 0.022,
      lowpass: 520,
      highpass: 35,
    });
    windGain = wind.gain;

    const trees = createNoiseLayer(context, {
      gain: 0.012,
      lowpass: 360,
      highpass: 90,
    });
    treeGain = trees.gain;

    insectsGain = context.createGain();
    insectsGain.gain.value = 0.0001;
    insectsGain.connect(context.destination);

    metalGain = context.createGain();
    metalGain.gain.value = 0.0001;
    metalGain.connect(context.destination);

    windLfo = context.createOscillator();
    const windLfoGain = context.createGain();
    windLfo.type = "sine";
    windLfo.frequency.value = 0.07;
    windLfoGain.gain.value = 0.009;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windGain.gain);
    windLfo.start();

    treeLfo = context.createOscillator();
    const treeLfoGain = context.createGain();
    treeLfo.type = "triangle";
    treeLfo.frequency.value = 0.12;
    treeLfoGain.gain.value = 0.005;
    treeLfo.connect(treeLfoGain);
    treeLfoGain.connect(treeGain.gain);
    treeLfo.start();

    started = true;
  }

  function start() {
    ensureStarted();
  }

  function update(delta) {
    if (!started || !context) {
      return;
    }

    insectsTimer -= delta;
    metalTimer -= delta;

    if (insectsTimer <= 0) {
      playInsectChirp(context, insectsGain);
      insectsTimer = randomBetween(3, 9);
    }

    if (metalTimer <= 0) {
      playMetalClank(context, metalGain);
      metalTimer = randomBetween(9, 18);
    }
  }

  return {
    start,
    update,
  };
}

function createNoiseLayer(context, config) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = config.highpass;

  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = config.lowpass;

  const gain = context.createGain();
  gain.gain.value = config.gain;

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(context.destination);

  source.start();

  return {
    gain,
  };
}

function playInsectChirp(context, insectsGain) {
  const osc = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(randomBetween(2600, 3400), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    randomBetween(1200, 1900),
    context.currentTime + 0.18
  );

  filter.type = "bandpass";
  filter.frequency.value = 2300;
  filter.Q.value = 5;

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.012, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(insectsGain);

  osc.start();
  osc.stop(context.currentTime + 0.22);
}

function playMetalClank(context, metalGain) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(randomBetween(290, 410), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, context.currentTime + 0.9);

  filter.type = "bandpass";
  filter.frequency.value = 700;
  filter.Q.value = 1.1;

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.03, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.95);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(metalGain);

  osc.start();
  osc.stop(context.currentTime + 1);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
