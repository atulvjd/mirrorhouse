import * as THREE from "three";

export function createNPCSystem(scene, story) {
  const npcs = [];
  const DIALOGUES = [
    "You look different.",
    "You do not belong here.",
    "Your face isn't stitched.",
    "You should leave.",
    "Shadows don't lie.",
    "Is it real over there?"
  ];

  function spawnNPC(x, z) {
    const npcGroup = new THREE.Group();
    
    // 1. Character Body (Vintage/Pale)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.7), bodyMat);
    body.position.y = 0.85;
    npcGroup.add(body);

    // 2. Stitched Upside-Down Smile
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), bodyMat);
    head.position.y = 1.8;
    npcGroup.add(head);

    const smileGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 1.75, 0.28);
    // Mirror World: Smiles curve DOWN
    smile.rotation.x = 0; 
    npcGroup.add(smile);

    // Stitch Marks
    for (let i = 0; i < 5; i++) {
        const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.01), smileMat);
        const angle = (i / 4) * Math.PI;
        stitch.position.set(Math.cos(angle) * 0.12, 1.75 + Math.sin(angle) * 0.05, 0.29);
        npcGroup.add(stitch);
    }

    // 3. Shadow Entity (Reversed Physics: Shadow Leads)
    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    scene.add(shadow);

    const npc = {
      group: npcGroup,
      shadow: shadow,
      targetPos: new THREE.Vector3(x + 5, 0, z + 5),
      velocity: new THREE.Vector3(0.015, 0, 0.015),
      dialogue: DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)],
      lastTurn: 0,
      
      update: (time, camera) => {
        // Shadow leads, NPC follows
        shadow.position.add(npc.velocity);
        
        // Boundaries: Walk in circles or back and forth
        if (shadow.position.distanceTo(new THREE.Vector3(x, 0, z)) > 10) {
            npc.velocity.multiplyScalar(-1);
        }

        // NPC follows shadow with delay
        npcGroup.position.lerp(shadow.position, 0.03);
        
        // Face the movement direction
        npcGroup.lookAt(shadow.position.clone().add(npc.velocity));

        // Look at player if close
        const distToPlayer = npcGroup.position.distanceTo(camera.position);
        if (distToPlayer < 5) {
            npcGroup.lookAt(camera.position);
            // Stare slightly longer
        }
      },

      interact: () => {
          if (story) story.showMemory(npc.dialogue);
      }
    };

    npcGroup.position.set(x, 0, z);
    shadow.position.set(x + 1, 0, z + 1);
    npcGroup.userData.isNPC = true;
    npcGroup.userData.npcRef = npc;
    npcGroup.userData.inspectPrompt = "Talk";

    npcs.push(npc);
    scene.add(npcGroup);
  }

  // Initial Population
  spawnNPC(-5, -5);
  spawnNPC(15, -10);
  spawnNPC(-10, 15);
  spawnNPC(20, 20);

  return {
    npcs,
    update: (time, camera) => npcs.forEach(n => n.update(time, camera))
  };
}
