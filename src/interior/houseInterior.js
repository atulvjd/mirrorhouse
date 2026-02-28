import * as THREE from "three";

export function createHouseInterior(scene) {
  const interior = new THREE.Group();
  interior.name = "grandmotherInterior";

  const floorBoardMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f2218,
    roughness: 0.94,
    metalness: 0.03,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a6761,
    roughness: 0.96,
    metalness: 0.02,
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a221d,
    roughness: 0.92,
    metalness: 0.04,
  });
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x241b15,
    roughness: 0.95,
    metalness: 0.03,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2b20,
    roughness: 0.92,
    metalness: 0.04,
  });

  const floorY = 0.02;
  const wallHeight = 4.2;
  const ceilingY = wallHeight;
  const depthStart = -5.1;
  const depthEnd = -15.1;

  // Wooden plank floor.
  for (let x = -5; x < 5; x += 0.56) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.08, 10.1),
      floorBoardMaterial.clone()
    );
    plank.position.set(x + 0.27, floorY, -10.1 + randomBetween(-0.06, 0.06));
    plank.rotation.y = randomBetween(-0.015, 0.015);
    plank.material.color.offsetHSL(
      randomBetween(-0.01, 0.01),
      randomBetween(-0.02, 0.02),
      randomBetween(-0.08, 0.08)
    );
    plank.receiveShadow = true;
    plank.castShadow = true;
    interior.add(plank);
  }

  // Ceiling.
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 0.16, 10.3),
    ceilingMaterial
  );
  ceiling.position.set(0, ceilingY + 0.05, -10.1);
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  interior.add(ceiling);

  // Uneven beams.
  for (let z = depthStart - 0.4; z >= depthEnd + 0.4; z -= 1.55) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.28, 0.28),
      beamMaterial
    );
    beam.position.set(0, ceilingY - 0.2, z);
    beam.rotation.z = randomBetween(-0.03, 0.03);
    beam.rotation.x = randomBetween(-0.02, 0.02);
    beam.castShadow = true;
    beam.receiveShadow = true;
    interior.add(beam);
  }

  // Exterior perimeter walls.
  addWall(interior, wallMaterial, 10.2, wallHeight, 0.2, 0, wallHeight * 0.5, depthEnd);
  addWall(interior, wallMaterial, 0.2, wallHeight, 10.3, -5.1, wallHeight * 0.5, -10.1);
  addWall(interior, wallMaterial, 0.2, wallHeight, 10.3, 5.1, wallHeight * 0.5, -10.1);

  // Front wall segments with entrance opening.
  addWall(interior, wallMaterial, 3.95, wallHeight, 0.2, -3.12, wallHeight * 0.5, depthStart);
  addWall(interior, wallMaterial, 3.95, wallHeight, 0.2, 3.12, wallHeight * 0.5, depthStart);
  addWall(interior, wallMaterial, 2.3, 1.3, 0.2, 0, wallHeight - 0.65, depthStart);

  // Interior partitions: living room -> hallway -> bedroom/study.
  addWall(interior, wallMaterial, 3.95, wallHeight, 0.18, -3.1, wallHeight * 0.5, -10.35);
  addWall(interior, wallMaterial, 3.95, wallHeight, 0.18, 3.1, wallHeight * 0.5, -10.35);
  addWall(interior, wallMaterial, 0.18, wallHeight, 2.65, -1.1, wallHeight * 0.5, -13.65);
  addWall(interior, wallMaterial, 0.18, wallHeight, 2.65, 1.1, wallHeight * 0.5, -13.65);

  // Door trims and room trims.
  addTrim(interior, trimMaterial, 2.06, 0.12, 0.12, 0, 2.02, depthStart + 0.03);
  addTrim(interior, trimMaterial, 0.14, 2.5, 0.14, -1.02, 1.25, depthStart + 0.03);
  addTrim(interior, trimMaterial, 0.14, 2.5, 0.14, 1.02, 1.25, depthStart + 0.03);

  // Hallway floor runner.
  const hallwayRunner = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.03, 4.85),
    new THREE.MeshStandardMaterial({
      color: 0x2f2220,
      roughness: 0.98,
      metalness: 0.01,
    })
  );
  hallwayRunner.position.set(0, 0.08, -12.65);
  hallwayRunner.receiveShadow = true;
  interior.add(hallwayRunner);

  // Staircase entrance (base steps).
  const stairMaterial = new THREE.MeshStandardMaterial({
    color: 0x34261b,
    roughness: 0.91,
    metalness: 0.04,
  });
  for (let i = 0; i < 5; i += 1) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.2, 0.55),
      stairMaterial
    );
    step.position.set(3.45, 0.1 + i * 0.16, -9 + i * 0.46);
    step.rotation.y = -0.12;
    step.castShadow = true;
    step.receiveShadow = true;
    interior.add(step);
  }

  const stairRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.9, 2.9),
    trimMaterial
  );
  stairRail.position.set(2.55, 1.1, -8.1);
  stairRail.rotation.y = -0.12;
  stairRail.castShadow = true;
  stairRail.receiveShadow = true;
  interior.add(stairRail);

  // Room labels for module placement.
  const anchors = {
    livingRoom: new THREE.Vector3(-0.2, 0, -8.4),
    hallway: new THREE.Vector3(0, 0, -12.8),
    bedroom: new THREE.Vector3(-3.2, 0, -13.4),
    deskRoom: new THREE.Vector3(3.25, 0, -13.1),
    doorway: new THREE.Vector3(0, 1.6, -5.02),
  };

  const ambience = createInteriorAmbience();

  scene.add(interior);

  return {
    group: interior,
    anchors,
    bounds: {
      minX: -5.1,
      maxX: 5.1,
      minZ: -15.2,
      maxZ: -5.0,
      minY: 0,
      maxY: 4.3,
    },
    update(delta, shouldPlayAudio) {
      if (shouldPlayAudio) {
        ambience.start();
      }
      ambience.update(delta);
    },
    setVisible(visible) {
      interior.visible = visible;
    },
  };
}

function addWall(group, material, width, height, depth, x, y, z) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
}

function addTrim(group, material, width, height, depth, x, y, z) {
  const trim = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  trim.position.set(x, y, z);
  trim.castShadow = true;
  trim.receiveShadow = true;
  group.add(trim);
}

function createInteriorAmbience() {
  let started = false;
  let context = null;
  let windGain = null;
  let creakGain = null;
  let tickGain = null;
  let creakTimer = randomBetween(4, 9);
  let clockTimer = randomBetween(0.6, 1.2);

  function start() {
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

    windGain = context.createGain();
    windGain.gain.value = 0.004;
    windGain.connect(context.destination);

    const windNoise = createNoise(context);
    const windFilter = context.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = 260;
    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windNoise.start();

    creakGain = context.createGain();
    creakGain.gain.value = 0.0001;
    creakGain.connect(context.destination);

    tickGain = context.createGain();
    tickGain.gain.value = 0.0001;
    tickGain.connect(context.destination);

    started = true;
  }

  function update(delta) {
    if (!started || !context) {
      return;
    }

    creakTimer -= delta;
    clockTimer -= delta;

    if (creakTimer <= 0) {
      playWoodCreak(context, creakGain);
      creakTimer = randomBetween(5, 11);
    }

    if (clockTimer <= 0) {
      playClockTick(context, tickGain);
      clockTimer = randomBetween(0.82, 1.25);
    }
  }

  return {
    start,
    update,
  };
}

function createNoise(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function playWoodCreak(context, gainNode) {
  const osc = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(randomBetween(120, 220), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(62, context.currentTime + 1.1);

  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.8;

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(gainNode);

  osc.start();
  osc.stop(context.currentTime + 1.3);
}

function playClockTick(context, gainNode) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  osc.type = "square";
  osc.frequency.value = randomBetween(1200, 1700);

  filter.type = "highpass";
  filter.frequency.value = 950;

  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.005, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(gainNode);

  osc.start();
  osc.stop(context.currentTime + 0.1);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
