import * as THREE from "three";
import { createRenderer } from "./engine/renderer.js";
import { createScene } from "./engine/scene.js";
import { createCamera } from "./engine/camera.js";
import { createPlayerControls } from "./player/movement.js";
import { createHouse } from "./world/house.js";
import { createInteractionSystem } from "./systems/interaction.js";
import { createInteractionOverlay } from "./ui/overlay.js";
import { createStorySystem } from "./systems/story.js";
import { createStoryFragments } from "./systems/storyFragments.js";
import { createReflection } from "./mechanics/reflection.js";
import { createSky } from "./environment/sky.js";
import { createLighting } from "./environment/lighting.js";
import { createGround } from "./environment/ground.js";
import { createBungalow } from "./environment/bungalow.js";
import { createBungalowInterior } from "./world/bungalowInterior.js";
import { createFurniture } from "./world/furniture.js";
import { createAtmosphere } from "./world/atmosphere.js";
import { createStoryDetails } from "./world/storyDetails.js";
import { createFlashlightSystem } from "./basement/flashlightSystem.js";
import { createPowerCutEvent } from "./basement/powerCutEvent.js";
import { createDrawerSystem } from "./interior/drawerSystem.js";
import { createPhotoSystem } from "./interior/photoSystem.js";
import { createLetterSystem } from "./interior/letterSystem.js";
import { createDustParticles } from "./interior/dustParticles.js";
import { createInteriorLighting } from "./interior/lightingInterior.js";
import { createBasementEnvironment } from "./basement/basementEnvironment.js";
import { createBasementStaircase } from "./basement/staircase.js";
import { createBasementSound } from "./basement/basementSound.js";
import { createHiddenMirror } from "./basement/hiddenMirror.js";
import { createMirrorReflectionSystem } from "./systems/mirrorReflectionSystem.js";
import { createMirrorGrabSequence } from "./systems/mirrorGrabSequence.js";
import { createMirrorTransitionSystem } from "./systems/mirrorTransitionSystem.js";
import { loadMirrorWorld } from "./world/mirrorWorldLoader.js";

export function startGame() {
  const { renderer, composer, setupComposer } = createRenderer();
  const scene = createScene();
  
  // High Visibility Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(10, 20, 10);
  scene.add(sun);

  const sky = createSky(scene);
  const ground = createGround(scene);
  const bungalow = createBungalow(scene);
  const lighting = createLighting(scene);

  const camera = createCamera();
  camera.position.set(0, 1.7, 15); // Eye level, slightly back
  
  const storyFragments = createStoryFragments();
  const story = createStorySystem({ fragments: storyFragments });
  const house = createHouse(story, {});
  scene.add(house);

  const reflection = createReflection(scene);
  const movement = createPlayerControls(camera, renderer);
  const interaction = createInteractionSystem(camera, scene);
  const overlay = createInteractionOverlay();
  const clock = new THREE.Clock();

  let interiorLoaded = false;
  let interiorActive = false;
  let interiorSystems = null;
  let mirrorWorldActive = false;
  let mirrorWorld = null;
  let basementUnlocked = true; // For testing
  let basementLoaded = false;
  let basementSystems = null;

  const exteriorRoots = [sky.object, ground.object, bungalow.object, lighting.object, house].filter(Boolean);

  function shouldEnterInterior() {
    if (interiorLoaded) return false;
    // Near the bungalow door
    return Math.abs(camera.position.x) < 2.0 && camera.position.z < -3.5 && camera.position.z > -6.0;
  }

  function loadInterior() {
    if (interiorLoaded) return;
    const room = createBungalowInterior(scene);
    const furn = createFurniture(room.group);
    const atm = createAtmosphere(scene);
    createStoryDetails(scene);
    
    const fl = createFlashlightSystem(camera);
    const pc = createPowerCutEvent([atm.moonLight], () => fl.enable());
    const ds = createDrawerSystem(furn.drawer, furn.drawerContentAnchor);
    const ps = createPhotoSystem(ds.getContentAnchor(), story);
    const ls = createLetterSystem(ds.getContentAnchor());
    const dp = createDustParticles(scene, camera, room.bounds);
    const il = createInteriorLighting(scene);

    interiorSystems = {
      room, furniture: furn, drawerSystem: ds, photoSystem: ps, letterSystem: ls, 
      dustParticles: dp, interiorLighting: il, cinematicAtmosphere: atm, flashlight: fl, powerCut: pc,
      update: (delta) => {
        ds.update(delta); ps.update(delta); il.update(delta); dp.update(delta); atm.update(delta); fl.update(delta);
        if (furn.update) furn.update(clock.elapsedTime);
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
    camera.position.set(0, 1.7, 0); // Position inside the room
  }

  function loadBasement() {
    if (basementLoaded || !interiorSystems) return;
    const env = createBasementEnvironment(scene);
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
      hm.reveal(); rs.activate();
    });

    basementSystems = { 
        env, carpetSystem: cs, hiddenMirror: hm, 
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
    } else {
        movement.update(delta);
        if (shouldEnterInterior()) loadInterior();
        
        if (!interiorActive) {
            sky?.update(delta); 
            lighting?.update(delta);
        } else if (interiorSystems) {
            interiorSystems.update(delta);
        }
    }

    interaction.update();
    if (reflection && typeof reflection.update === 'function') reflection.update(camera, delta);
    
    renderer.render(scene, camera);
  }

  animate();
}

function createAtmosphereAudio() { return { update: ()=>{} }; }
function registerHallucinationMeshes() {}
function createOpeningAmbientAudio() { return { start:()=>{}, update:()=>{} }; }
