import * as THREE from "three";

export function createMirrorReflectionSystem(scene, mirrorPlane) {
  const reflectionGroup = new THREE.Group();
  reflectionGroup.name = "mirrorReflection";
  scene.add(reflectionGroup);

  // Simple avatar representing the player's reflection
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
  
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.4), bodyMat);
  body.position.y = 0.7;
  reflectionGroup.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.6;
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), headMat);
  headGroup.add(head);

  // "Smirk" feature (initially hidden or neutral)
  const mouthGeo = new THREE.BoxGeometry(0.2, 0.02, 0.05);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.1, 0.23);
  headGroup.add(mouth);
  
  reflectionGroup.add(headGroup);
  reflectionGroup.visible = false;

  let active = false;
  let phase = 0; // 0: off, 1: normal, 2: delay, 3: smirk, 4: tilt, 5: speak
  let phaseTimer = 0;
  
  const history = [];
  const HISTORY_MAX = 120;
  let currentDelayFrames = 0;
  
  const mirrorNormal = new THREE.Vector3(0, 1, 0); // Floor mirror faces UP
  const mirrorPos = mirrorPlane.position;

  function activate() {
    if (active) return;
    active = true;
    reflectionGroup.visible = true;
    phase = 1;
    phaseTimer = 0;
    currentDelayFrames = 0;
    mouth.scale.set(1, 1, 1);
    mouth.position.y = -0.1;
  }

  function update(camera, delta, onSpeak) {
    if (!active) return;
    
    phaseTimer += delta;
    
    // Store history for delay
    history.push({
      pos: camera.position.clone(),
      rot: camera.quaternion.clone()
    });
    if (history.length > HISTORY_MAX) history.shift();

    // Phase Progression
    if (phase === 1 && phaseTimer > 4.0) {
      phase = 2; // Micro delay
      phaseTimer = 0;
    } else if (phase === 2) {
      currentDelayFrames = Math.min(30, currentDelayFrames + delta * 5); // Ramp up to ~0.5s
      if (phaseTimer > 5.0) {
        phase = 3; // Smirk
        phaseTimer = 0;
      }
    } else if (phase === 3) {
      // Mouth forms a smirk
      mouth.scale.x = THREE.MathUtils.lerp(mouth.scale.x, 1.5, 2 * delta);
      mouth.position.y = THREE.MathUtils.lerp(mouth.position.y, -0.05, 2 * delta);
      mouth.rotation.z = THREE.MathUtils.lerp(mouth.rotation.z, 0.15, 2 * delta);
      if (phaseTimer > 4.0) {
        phase = 4; // Head Tilt
        phaseTimer = 0;
      }
    } else if (phase === 4) {
      if (phaseTimer > 3.0) {
        phase = 5; // Speak
        phaseTimer = 0;
        if (onSpeak) onSpeak();
      }
    }

    // Apply tracking
    let targetState = history[Math.max(0, history.length - 1 - Math.floor(currentDelayFrames))];
    if (!targetState) targetState = { pos: camera.position, rot: camera.quaternion };

    // Reflect position across the floor mirror (Y axis)
    const reflectedPos = targetState.pos.clone();
    reflectedPos.y = mirrorPos.y - (targetState.pos.y - mirrorPos.y);
    reflectionGroup.position.copy(reflectedPos);

    // Body rotation (face the camera roughly)
    const lookAtPos = camera.position.clone();
    lookAtPos.y = reflectionGroup.position.y; // Keep upright
    reflectionGroup.lookAt(lookAtPos);

    // Head control
    if (phase >= 4) {
      // Independent head tilt
      const targetLook = camera.position.clone();
      headGroup.lookAt(targetLook);
      headGroup.rotateZ(THREE.MathUtils.degToRad(15)); // Unsettling tilt
    } else {
      // Normal head tracking
      headGroup.lookAt(camera.position);
    }
  }

  return { activate, update, group: reflectionGroup };
}
