import * as THREE from "three";

const WHISPERS = [
  "You still smile the right way.",
  "Your grandmother knew.",
  "You don't belong here.",
  "The mirror remembers.",
];

function createStitchedMouth(material) {
  const mouth = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const stitch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.25, 6),
      material
    );
    stitch.rotation.x = Math.PI / 2;
    stitch.position.set((i - 2.5) * 0.14, 0, 0.08);
    mouth.add(stitch);
  }
  return mouth;
}

export function createNpcSystem(scene, camera, storyFragments) {
  const npcRoot = new THREE.Group();
  npcRoot.name = "npcSystem";

  const states = [];
  const basePositions = [
    [4.5, -2.4],
    [-4.2, -0.4],
    [3.6, 1.8],
    [-3.4, 2.4],
    [2.2, 4.5],
    [-2.6, 5.6],
  ];

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x423a34,
    roughness: 0.92,
    metalness: 0.03,
  });
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0e7dd,
    roughness: 0.9,
    metalness: 0,
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: "rgba(0,0,0,0.25)",
  });

  for (let i = 0; i < basePositions.length; i += 1) {
    const [x, z] = basePositions[i];
    const npc = createNpc(bodyMaterial, headMaterial, shadowMaterial);
    npc.root.position.set(x + randomBetween(-0.4, 0.4), 0, z + randomBetween(-0.3, 0.3));
    npc.root.rotation.y = randomBetween(-0.2, 0.2);
    npcRoot.add(npc.root);
    states.push({
      ...npc,
      shadowTarget: npc.shadow.position.clone(),
      shadowTimer: 0,
      whisperCooldown: randomBetween(3, 6),
      whisperPhase: randomBetween(0, Math.PI),
    });
  }

  scene.add(npcRoot);

  function update(delta) {
    for (let i = 0; i < states.length; i += 1) {
      const state = states[i];
      state.shadowTimer += delta;

      if (state.shadowTimer >= 5) {
        state.shadowTarget.copy(getRandomAnchor(state.shadow.position));
        state.shadowTimer = 0;
      }

      state.shadow.position.lerp(state.shadowTarget, Math.min(1, delta * 0.4));
      state.root.position.lerp(state.shadow.position, Math.min(1, delta * 0.6));

      const distanceToPlayer = state.root.position.distanceTo(camera.position);
      if (distanceToPlayer < 4 && state.whisperCooldown <= 0) {
        const whisper = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
        storyFragments?.showFragment(whisper, 2800);
        state.whisperCooldown = randomBetween(3.5, 7);
      } else {
        state.whisperCooldown -= delta;
      }

      if (camera.position.distanceTo(state.root.position) < 2.2) {
        state.root.lookAt(camera.position.x, state.root.position.y, camera.position.z);
      }
    }
  }

  function getRandomAnchor(reference) {
    const radius = 5;
    const theta = randomBetween(0, Math.PI * 2);
    return new THREE.Vector3(
      reference.x + Math.cos(theta) * randomBetween(1.4, radius),
      0,
      reference.z + Math.sin(theta) * randomBetween(1, radius)
    );
  }

  return {
    group: npcRoot,
    update,
  };
}

function createNpc(bodyMaterial, headMaterial, shadowMaterial) {
  const group = new THREE.Group();
  group.name = "npc";

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.35), bodyMaterial);
  body.position.y = 0.85;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), headMaterial);
  head.position.y = 1.75;
  head.castShadow = true;
  group.add(head);

  const mouth = createStitchedMouth(bodyMaterial);
  mouth.position.set(0, 1.63, 0.25);
  head.add(mouth);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  shadow.position.z = 0;
  group.add(shadow);

  return {
    root: group,
    shadow,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
