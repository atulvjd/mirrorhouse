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
import { createBungalowInterior } from "./world/bungalowInterior.js";
import { createFurniture } from "./world/furniture.js";
import { createAtmosphere } from "./world/atmosphere.js";
import { createStoryDetails } from "./world/storyDetails.js";
import { createDrawerSystem } from "./interior/drawerSystem.js";
import { createPhotoSystem } from "./interior/photoSystem.js";
import { createLetterSystem } from "./interior/letterSystem.js";
import { createDustParticles } from "./interior/dustParticles.js";
import { createBasementEnvironment } from "./basement/basementEnvironment.js";
import { createBasementStaircase } from "./basement/staircase.js";
import { createFlashlightSystem } from "./basement/flashlightSystem.js";
import { createPowerCutEvent } from "./basement/powerCutEvent.js";
import { createCarpetSystem } from "./basement/carpetSystem.js";
import { createHiddenMirror } from "./basement/hiddenMirror.js";
import { createBasementSound } from "./basement/basementSound.js";
import { createMirrorReflectionSystem } from "./systems/mirrorReflectionSystem.js";
import { createMirrorGrabSequence } from "./systems/mirrorGrabSequence.js";
import { createMirrorTransitionSystem } from "./systems/mirrorTransitionSystem.js";
import { loadMirrorWorld } from "./world/mirrorWorldLoader.js";

export function startGame() {
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
  
  // EMERGENCY LIGHT
  const emergencyLight = new THREE.DirectionalLight(0xffffff, 0.6);
  emergencyLight.position.set(0, 10, 0);
  scene.add(emergencyLight);
  
  const camera = createCamera();
  camera.position.set(0, 1.6, 12); 
  camera.lookAt(0, 1.6, 0);
  
  const reality = createRealityDistortion(scene, camera);
  const cameraEffects = createCameraEffects(camera);
  const hallucinations = createHallucinationSystem(scene, camera);
  const atmosphere = createAudioAtmosphere(camera);
  const audio = createAudioSystem(camera);
  const storyFragments = createStoryFragments();
  const objectives = createObjectiveSystem();
  const cinematicEvents = createCinematicEvents({ scene, storyFragments, objectives });
  const openingAmbient = createOpeningAmbientAudio();
  
  let interiorLoaded = false;
  let interiorActive = false;
  let interiorSystems = null;
  let mirrorWorldActive = false;
  let mirrorWorld = null;
  let basementUnlocked = false;
  let basementLoaded = false;
  let basementSystems = null;
  let basementPowerCutTriggered = false;
  
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
    sky?.object, ground?.object, gate?.object, exteriorBungalow?.object, garden?.object, environmentLighting?.object,
  ].filter(Boolean);

  const story = createStorySystem({ fragments: storyFragments });
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

  const mirrorEntity = createMirrorEntity(scene);
  reflection = createReflection(scene);
  const reflectionObject = scene.children.find(c => c.name === "reflectionGroup") || null;
  const reflectionHead = reflectionObject?.children.find(c => c.geometry?.type === "SphereGeometry") || null;
  const reflectionHeadTarget = new THREE.Quaternion();

  const movement = createPlayerControls(camera, renderer);
  const interaction = createInteractionSystem(camera, scene);
  const overlay = createInteractionOverlay();
  const clock = new THREE.Clock();
  const mirrorWorldPosition = new THREE.Vector3();
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
  endingOverlay.style.background = "black";
  endingOverlay.style.zIndex = "70";
  endingMessage.style.color = "white";
  endingMessage.style.fontFamily = "monospace";
  endingOverlay.appendChild(endingMessage);
  document.body.appendChild(endingOverlay);

  house.userData.interactables?.forEach(i => interaction.register(i.object, i.callback));

  function shouldEnterInterior() {
    return !interiorLoaded && !endingActive && !endingComplete &&
           Math.abs(camera.position.x) < 1.5 && camera.position.z < -4.0 && camera.position.z > -7.5;
  }

  function loadInterior() {
    if (interiorLoaded) return;
    const room = createBungalowInterior(scene);
    const furn = createFurniture(room.group);
    const atm = createAtmosphere(scene);
    createStoryDetails(scene);
    const fl = createFlashlightSystem(camera);
    const pc = createPowerCutEvent([atm.moonLight, ...scene.children.filter(c => c.isLight)], () => fl.enable());
    const ds = createDrawerSystem(furn.drawer, furn.drawerContentAnchor);
    const ps = createPhotoSystem(ds.getContentAnchor(), story);
    const ls = createLetterSystem(ds.getContentAnchor());
    const dp = createDustParticles(scene, camera, room.bounds);
    const il = createInteriorLighting(scene);

    interiorSystems = {
      room, furniture: furn, drawerSystem: ds, photoSystem: ps, letterSystem: ls, 
      dustParticles: dp, interiorLighting: il, cinematicAtmosphere: atm, flashlight: fl, powerCut: pc,
      update: (delta, locked) => {
        ds.update(delta); ps.update(delta); il.update(delta); dp.update(delta); atm.update(delta); fl.update(delta);
        if (basementSystems) {
            basementSystems.carpetSystem.update(delta);
            basementSystems.hiddenMirror.update(camera, delta);
            basementSystems.reflectionSys.update(camera, delta, () => basementSystems.grabSeq.trigger());
            basementSystems.grabSeq.update(delta);
            basementSystems.transitionSys.update(delta, camera);
        }
      }
    };

    interaction.register(ds.getInteractable().object, ds.getInteractable().callback);
    ps.interactables.forEach(i => interaction.register(i.object, i.callback));
    ls.interactables.forEach(i => interaction.register(i.object, i.callback));

    window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE' && interiorLoaded && !basementLoaded && basementUnlocked) loadBasement();
    });

    interiorLoaded = true;
    interiorActive = true;
    exteriorRoots.forEach(r => r.visible = false);
    camera.position.set(0, 1.6, -2);
  }

  function loadBasement() {
    if (basementLoaded || !interiorSystems) return;
    const env = createBasementEnvironment(scene);
    const staircase = createBasementStaircase(interiorSystems.interior);
    const sound = createBasementSound();
    const hm = createHiddenMirror(env.group);
    const rs = createMirrorReflectionSystem(scene, hm.mesh);
    const ts = createMirrorTransitionSystem();
    const gs = createMirrorGrabSequence(camera, rs.group, () => {
        ts.triggerTransition(() => {
            mirrorWorld = loadMirrorWorld(scene, camera, story, interaction, overlay);
            mirrorWorldActive = true;
        });
    });
    const cs = createCarpetSystem(env.group, () => {
      sound.triggerCarpetDrag(); hm.reveal(); sound.triggerMirrorRevealTone(); rs.activate();
    });

    basementSystems = { 
        env, staircase, sound, flashlightSystem: interiorSystems.flashlight, 
        powerCutEvent: interiorSystems.powerCut, carpetSystem: cs, hiddenMirror: hm, 
        reflectionSys: rs, grabSeq: gs, transitionSys: ts 
    };
    interaction.register(cs.object, cs.callback);
    basementLoaded = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mirrorWorldActive && mirrorWorld) {
        mirrorWorld.update(delta);
        renderer.render(scene, camera);
        return;
    }

    movement.update(delta);
    if (shouldEnterInterior()) loadInterior();
    
    const target = interaction.update();
    overlay.setVisible(Boolean(target));
    overlay.setText(target?.userData?.inspectPrompt || "Press E");

    if (interiorSystems) interiorSystems.update(delta, movement.controls.isLocked);
    else {
        sky?.update(delta); gate?.update(camera, delta); garden?.update(delta); environmentLighting?.update(delta);
    }

    if (reflection) reflection.update(camera, delta);
    renderer.render(scene, camera);
  }

  function getMirrorDistance() {
    if (!mirrorObject) return Infinity;
    mirrorObject.getWorldPosition(mirrorWorldPosition);
    return camera.position.distanceTo(mirrorWorldPosition);
  }

  function applyEscalationLevel() { /* logic */ }
  function startEndingSequence(trigger) { /* logic */ }
  function updateEndingSequence(delta) { /* logic */ }
  function detectAutonomousDriftSignature() { return false; }

  animate();
}

function registerHallucinationMeshes() {}
function createOpeningAmbientAudio() { return { start:()=>{}, update:()=>{} }; }
