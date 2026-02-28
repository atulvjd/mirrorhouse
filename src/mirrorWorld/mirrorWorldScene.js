import * as THREE from "three";
import { createMirrorWorldTown } from "./mirrorWorldTown.js";
import { createMirrorWorldLighting } from "./mirrorWorldLighting.js";
import { createMirrorWorldSky } from "./mirrorWorldSky.js";
import { createMirrorWorldProps } from "./mirrorWorldProps.js";
import { createMirrorWorldShaders } from "./mirrorWorldShaders.js";
import { createCitizenSystem } from "./citizens/citizenSystem.js";
import { createVanishingMessageSystem } from "../systems/vanishingMessageSystem.js";

export function createMirrorWorldScene(camera) {
  const scene = new THREE.Scene();
  scene.name = "mirrorWorldScene";
  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.FogExp2(0x01010d, 0.035);

  const interior = createMirrorInterior(scene);
  const town = createMirrorWorldTown(scene);
  const lighting = createMirrorWorldLighting(scene);
  const sky = createMirrorWorldSky(scene);
  const props = createMirrorWorldProps(scene);
  const shaders = createMirrorWorldShaders(camera);
  const citizens = createCitizenSystem(scene);
  const vanishingMessages = createVanishingMessageSystem(scene);

  let townRevealed = false;
  let interiorPulse = 0;
  let insideStore = false;
  let productPicked = false;
  const storeAmbience = createStoreAmbience();

  function update(camera, delta) {
    sky.update(delta);
    lighting.update(delta, townRevealed);
    props.update(delta);
    interior.update(delta);
    shaders.update(delta);
    citizens.update(camera, delta);

    const storeArea = town.storeArea;
    const productArea = town.productArea;
    const insideNow = pointInZone(camera.position, storeArea);

    if (!townRevealed && camera.position.z > -13.2) {
      townRevealed = true;
      town.setVisible(true);
    }

    town.update(delta);

    if (townRevealed) {
      interiorPulse = Math.min(1, interiorPulse + delta * 0.5);
      interior.group.rotation.y = Math.sin(interiorPulse) * 0.01;
    }

    if (insideNow !== insideStore) {
      insideStore = insideNow;
      lighting.setStoreActive(insideStore);
      if (insideStore) {
        storeAmbience.start();
      } else {
        storeAmbience.stop();
      }
    }
  }

  return {
    scene,
    update,
    getStorePrompt() {
      if (!insideStore || productPicked) {
        return null;
      }
      const nearProduct = pointInZone(camera.position, town.productArea);
      return nearProduct ? "Press E to pick up food" : "Store is too quiet";
    },
    handleProductPickup() {
      const nearProduct = pointInZone(camera.position, town.productArea);
      if (!insideStore || productPicked || !nearProduct) {
        return false;
      }
      productPicked = true;
      citizens.focusAttention(camera.position);
      storeAmbience.playPickupTone();
      return true;
    },
    isInsideStore() {
      return insideStore;
    },
    resetStoreState() {
      productPicked = false;
    },
  };
}

function createStoreAmbience() {
  let started = false;
  let context = null;
  let gain = null;
  let osc = null;

  function start() {
    if (started) {
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    context = new AudioCtx();
    gain = context.createGain();
    gain.gain.value = 0.0005;
    gain.connect(context.destination);

    osc = context.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 68;
    osc.connect(gain);
    osc.start();

    started = true;
  }

  function stop() {
    if (!started || !gain) {
      return;
    }
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6);
    started = false;
  }

  function playPickupTone() {
    if (!context) {
      return;
    }
    const tone = context.createOscillator();
    const toneGain = context.createGain();
    tone.type = "sawtooth";
    tone.frequency.setValueAtTime(140, context.currentTime);
    tone.frequency.exponentialRampToValueAtTime(66, context.currentTime + 1.2);
    toneGain.gain.setValueAtTime(0.0001, context.currentTime);
    toneGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.08);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.5);
    tone.connect(toneGain);
    toneGain.connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + 1.4);
  }

  return {
    start,
    stop,
    playPickupTone,
  };
}
function pointInZone(position, zone) {
  return (
    position.x >= zone.minX &&
    position.x <= zone.maxX &&
    position.z >= zone.minZ &&
    position.z <= zone.maxZ
  );
}

function createMirrorInterior(scene) {
  const group = new THREE.Group();
  group.name = "mirrorInterior";

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x272937,
    roughness: 0.95,
    metalness: 0.02,
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x151210,
    roughness: 0.9,
    metalness: 0.04,
  });

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.12, 6.2),
    floorMaterial
  );
  floor.position.set(0, -2.85, -17.2);
  floor.castShadow = true;
  group.add(floor);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 3.2, 6.2),
    wallMaterial
  );
  leftWall.position.set(-2.8, -1.2, -17.2);
  leftWall.rotation.z = 0.03;
  group.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 2.8;
  rightWall.rotation.z = -0.03;
  group.add(rightWall);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 3.2, 0.2),
    wallMaterial
  );
  backWall.position.set(0, -1.2, -20.1);
  backWall.rotation.y = 0.1;
  group.add(backWall);

  const warpedFurniture = new THREE.Group();
  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.12, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x221912,
      roughness: 0.92,
      metalness: 0.03,
    })
  );
  bench.position.set(-0.4, -2.6, -18.4);
  bench.rotation.y = -0.18;
  warpedFurniture.add(bench);

  const oddCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.5, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x1a1011,
      roughness: 0.9,
      metalness: 0.05,
    })
  );
  oddCabinet.position.set(1.6, -1.3, -17.5);
  oddCabinet.rotation.y = 0.1;
  warpedFurniture.add(oddCabinet);

  group.add(warpedFurniture);
  scene.add(group);

  const states = [
    { object: warpedFurniture, phase: Math.random() * Math.PI * 2 },
  ];

  function update(delta) {
    for (const state of states) {
      state.object.rotation.z =
        Math.sin(Date.now() * 0.0006 + state.phase) * 0.012;
    }
  }

  return {
    group,
    update,
  };
}
    vanishingMessages.update(delta, camera.position);
