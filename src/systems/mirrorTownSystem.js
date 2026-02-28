import * as THREE from "three";
import { createCitizenSystem } from "../mirrorWorld/citizens/citizenSystem.js";

const HOUSE_COUNT = 18;
const MAIDEN_RADIUS = 3;

export function createMirrorTown(scene) {
  const group = new THREE.Group();
  group.name = "mirrorTownSystem";
  group.position.set(0, -2.75, -9.5);
  group.scale.x = -1; // flipped world

  const walkway = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.04, 6),
    new THREE.MeshStandardMaterial({
      color: 0x14131b,
      roughness: 0.96,
      metalness: 0.02,
    })
  );
  walkway.position.set(0, 0, -2.8);
  walkway.receiveShadow = true;
  group.add(walkway);

  const geometry = new THREE.BoxGeometry(1.8, 2.8, 1.3);
  const material = new THREE.MeshStandardMaterial({ color: 0x1c1921 });
  const mesh = new THREE.InstancedMesh(geometry, material, HOUSE_COUNT);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(HOUSE_COUNT * 3),
    3
  );
  group.add(mesh);

  const positions = generateHousePositions(HOUSE_COUNT);
  const color = new THREE.Color();
  let maidenIndex = Math.floor(Math.random() * HOUSE_COUNT);
  const maidenLocation = positions[maidenIndex];

  for (let i = 0; i < HOUSE_COUNT; i += 1) {
    const pos = positions[i];
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(pos.x, pos.y, pos.z);
    mesh.setMatrixAt(i, matrix);

    if (i === maidenIndex) {
      color.set(0xd4879c);
    } else {
      color.set(randomTone());
    }
    mesh.instanceColor.setXYZ(i, color.r, color.g, color.b);
  }

  mesh.instanceColor.needsUpdate = true;

  const npcSpawnPoints = generateNPCPoints(12);
  const citizens = createCitizenSystem(scene, npcSpawnPoints);

  const watchers = [];

  let listeners = [];
  let maidenTriggered = false;

  function update(delta, playerPosition) {
    const pos = playerPosition;
    const distance = pos.distanceTo(maidenLocation);
    if (distance < MAIDEN_RADIUS && !maidenTriggered) {
      maidenTriggered = true;
      listeners.forEach((fn) => fn());
      citizens.focusAttention(pos);
      watchers.push(true);
    }
    citizens.update(playerPosition, delta);
  }

  function onMaidenApproach(callback) {
    if (typeof callback === "function") {
      listeners.push(callback);
    }
  }

  function getMaidenHomeLocation() {
    return maidenLocation.clone();
  }

  function triggerNPCStare() {
    listeners.forEach((fn) => fn());
  }

  return {
    group,
    update,
    onMaidenApproach,
    getMaidenHomeLocation,
    triggerNPCStare,
  };
}

function generateHousePositions(count) {
  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / 6);
    const offset = (i % 6) - 2.5;
    positions.push(
      new THREE.Vector3(
        offset * 1.7 + Math.sin(i * 0.27),
        0,
        -4 - row * 2.1 + Math.cos(i * 0.5) * 0.4
      )
    );
  }
  return positions;
}

function generateNPCPoints(count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    points.push(
      new THREE.Vector3(
        randomBetween(-5.2, 5.2),
        -2.75,
        randomBetween(-3.5, -11.5)
      )
    );
  }
  return points;
}

function randomTone() {
  const palette = [0x1e1c28, 0x2b242e, 0x27212a, 0x1a0f14, 0x2f2832];
  const color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
  color.offsetHSL(randomBetween(-0.08, 0.05), randomBetween(-0.05, 0.05), randomBetween(-0.05, 0.05));
  return color;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
