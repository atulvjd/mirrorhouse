import * as THREE from "three";

export function createMirrorReflectionSystem(scene, mirrorPlane) {
  const reflectionGroup = new THREE.Group();
  reflectionGroup.name = "mirrorReflection";
  scene.add(reflectionGroup);

  // Avatar representing the player's reflection
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
  
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.3), bodyMat);
  body.position.y = 0.75;
  reflectionGroup.add(body);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.65;
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), headMat);
  headGroup.add(head);

  // Smirk feature
  const mouthGeo = new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI);
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.05, 0.2);
  mouth.rotation.x = Math.PI; // Upward normal smile
  headGroup.add(mouth);
  
  reflectionGroup.add(headGroup);
  reflectionGroup.visible = false;

  let active = false;
  let phase = 0; // 0: off, 1: calm, 2: smirk, 3: speak muffled, 4: speak clearly
  let phaseTimer = 0;
  
  const history = [];
  const HISTORY_MAX = 60;
  
  const mirrorPos = mirrorPlane.position;

  function activate() {
    if (active) return;
    active = true;
    reflectionGroup.visible = true;
    phase = 1;
    phaseTimer = 0;
    mouth.scale.set(0.5, 0.5, 1); // Neutral/calm
  }

  function update(camera, delta, onSpeak) {
    if (!active) return;
    
    phaseTimer += delta;
    
    history.push({
      pos: camera.position.clone(),
      rot: camera.quaternion.clone()
    });
    if (history.length > HISTORY_MAX) history.shift();

    // Phase Progression
    if (phase === 1 && phaseTimer > 3.0) {
      phase = 2; // Evil smirk
      phaseTimer = 0;
    } else if (phase === 2) {
      // Mouth widens into an evil smirk
      mouth.scale.x = THREE.MathUtils.lerp(mouth.scale.x, 1.8, 1.5 * delta);
      mouth.scale.y = THREE.MathUtils.lerp(mouth.scale.y, 1.5, 1.5 * delta);
      
      if (phaseTimer > 4.0) {
        phase = 3; // Muffled speak
        phaseTimer = 0;
        playMuffledAudio();
      }
    } else if (phase === 3) {
      // Wait for player to step closer instinctively
      const dist = camera.position.distanceTo(reflectionGroup.position);
      if (dist < 4.0 || phaseTimer > 5.0) {
          phase = 4; // Speak clearly
          phaseTimer = 0;
          playClearAudio();
          setTimeout(() => {
              if (onSpeak) onSpeak();
          }, 1500); // Trigger grab after saying "Finally"
      }
    }

    let targetState = history[Math.max(0, history.length - 1 - 10)]; // Slight delay
    if (!targetState) targetState = { pos: camera.position, rot: camera.quaternion };

    // Reflect position across floor mirror
    const reflectedPos = targetState.pos.clone();
    reflectedPos.y = mirrorPos.y - (targetState.pos.y - mirrorPos.y);
    reflectionGroup.position.copy(reflectedPos);

    // Reflection stays calm, looks at player
    const lookAtPos = camera.position.clone();
    lookAtPos.y = reflectionGroup.position.y;
    reflectionGroup.lookAt(lookAtPos);
    headGroup.lookAt(camera.position);
  }

  function playMuffledAudio() {
      console.log("[Audio] Muffled, distorted whisper from mirror...");
  }

  function playClearAudio() {
      console.log("[Audio] Clear Whisper: 'Finally.'");
  }

  return { activate, update, group: reflectionGroup };
}
