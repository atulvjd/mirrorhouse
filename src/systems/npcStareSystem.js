import * as THREE from "three";

export function createNPCStareSystem(scene, camera, storeDoorPosition) {
  const storeNPCs = [];
  
  // NPC creation logic tailored for the store interior
  function spawnStoreNPC(x, z, role) {
    const npcGroup = new THREE.Group();
    
    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.7), bodyMat);
    body.position.y = 0.85;
    npcGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
    head.position.y = 1.8;
    npcGroup.add(head);

    // Stitched Upside-Down Smile
    const smileGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 1.75, 0.28);
    smile.rotation.x = 0; // Downward
    npcGroup.add(smile);
    
    // Stitch marks
    for (let i = 0; i < 5; i++) {
        const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.01), smileMat);
        const angle = (i / 4) * Math.PI;
        stitch.position.set(Math.cos(angle) * 0.12, 1.75 + Math.sin(angle) * 0.05, 0.29);
        npcGroup.add(stitch);
    }

    npcGroup.position.set(x, 0, z);
    scene.add(npcGroup);

    const npc = {
        group: npcGroup,
        role: role,
        basePos: new THREE.Vector3(x, 0, z),
        lookTarget: new THREE.Vector3(x, 0, z + 1), // Default looking forward
        state: "idle" // idle, staring, approaching, stopped
    };
    
    storeNPCs.push(npc);
  }

  // Populate store NPCs (positions relative to world, store is at 25, 0, 5)
  // Cashier
  spawnStoreNPC(27.5, 2.5, "cashier");
  // Customer 1
  spawnStoreNPC(23, 5, "customer1");
  // Customer 2
  spawnStoreNPC(26, 7, "customer2");

  let starePhase = 0; 
  // 0: Normal, 1: Turning to stare, 2: Staring, 3: Spoken, 4: Approaching
  
  let phaseTimer = 0;
  
  function triggerStareEvent(onSpeak) {
      if (starePhase > 0) return;
      starePhase = 1;
      phaseTimer = 0;
      
      // Assign initial delays to stagger their turning
      storeNPCs.forEach((npc, index) => {
          npc.state = "turning";
          npc.turnDelay = index * 1.5; // Staggered turning
      });
      
      setTimeout(() => {
          if(onSpeak) onSpeak("You do not belong.");
          starePhase = 3;
      }, 6000); // Speak after 6 seconds of staring
  }

  function update(delta) {
      if (starePhase === 0) {
          // Normal idle behavior
          storeNPCs.forEach(npc => {
              if (npc.role === "cashier") {
                  npc.group.lookAt(25, 0, 5); // Look at center of store
              }
              // Add slight random sway for idles
          });
          return;
      }

      phaseTimer += delta;

      // Distance to door
      const distToDoor = camera.position.distanceTo(storeDoorPosition);
      const playerEscaped = distToDoor < 3; // Close to or outside the door

      if (starePhase === 1) {
          // Slowly turn towards player
          let allTurned = true;
          storeNPCs.forEach(npc => {
              if (phaseTimer > npc.turnDelay) {
                  // Smooth lookAt interpolation
                  const targetRot = new THREE.Quaternion().setFromRotationMatrix(
                      new THREE.Matrix4().lookAt(npc.group.position, camera.position, new THREE.Vector3(0,1,0))
                  );
                  npc.group.quaternion.slerp(targetRot, delta * 1.5);
              } else {
                  allTurned = false;
              }
          });
          if (allTurned && phaseTimer > 5) {
              starePhase = 2; // All staring
          }
      }

      if (starePhase >= 3) {
          // Escalation: Slowly walk towards player, unless escaped
          storeNPCs.forEach(npc => {
              // Always stare
              const targetRot = new THREE.Quaternion().setFromRotationMatrix(
                  new THREE.Matrix4().lookAt(npc.group.position, camera.position, new THREE.Vector3(0,1,0))
              );
              npc.group.quaternion.slerp(targetRot, delta * 5);

              if (!playerEscaped) {
                  // Move towards player slowly
                  const dir = new THREE.Vector3().subVectors(camera.position, npc.group.position);
                  dir.y = 0;
                  dir.normalize();
                  
                  // Keep a minimum distance
                  if (npc.group.position.distanceTo(camera.position) > 2.0) {
                      npc.group.position.addScaledVector(dir, delta * 0.8);
                  }
              }
          });
      }
  }

  return { triggerStareEvent, update, npcs: storeNPCs };
}
