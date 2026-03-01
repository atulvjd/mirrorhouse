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

  // Vintage Clothing Colors
  const clothColors = [0x3a3a3a, 0x4f4a45, 0x2b2b2b, 0x4a3a3a];

  function spawnNPC(x, z, behavior = "normal") {
    const npcGroup = new THREE.Group();
    
    // Pale Skin
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
    
    // 1. Character Body (Vintage Clothing)
    const clothColor = clothColors[Math.floor(Math.random() * clothColors.length)];
    const bodyMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.9 });
    
    // Coat/Dress
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4), bodyMat);
    body.position.y = 0.7;
    npcGroup.add(body);

    // Hat (optional)
    if (Math.random() > 0.5) {
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05), bodyMat);
        hatBrim.position.y = 1.95;
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3), bodyMat);
        hatTop.position.y = 2.1;
        npcGroup.add(hatBrim, hatTop);
    }

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
    head.position.y = 1.65;
    
    // Exaggerated Eye Shadows
    const eyeShadowGeo = new THREE.PlaneGeometry(0.1, 0.05);
    const eyeShadowMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.6 });
    const eyeL = new THREE.Mesh(eyeShadowGeo, eyeShadowMat);
    eyeL.position.set(-0.1, 0.05, 0.23);
    const eyeR = new THREE.Mesh(eyeShadowGeo, eyeShadowMat);
    eyeR.position.set(0.1, 0.05, 0.23);
    head.add(eyeL, eyeR);

    npcGroup.add(head);

    // Stitched Upside-Down Smile
    const smileGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 1.6, 0.23);
    smile.rotation.x = 0; // Downward
    npcGroup.add(smile);

    // Stitch Marks
    for (let i = 0; i < 5; i++) {
        const stitch = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, 0.01), smileMat);
        const angle = (i / 4) * Math.PI;
        stitch.position.set(Math.cos(angle) * 0.12, 1.6 + Math.sin(angle) * 0.05, 0.24);
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
      velocity: new THREE.Vector3(0.02, 0, 0.02),
      dialogue: DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)],
      behavior: behavior,
      laughTimer: Math.random() * 10,
      
      update: (time, camera) => {
        // Shadow leads, NPC follows
        shadow.position.add(npc.velocity);
        
        // Boundaries: Walk in circles or back and forth
        if (shadow.position.distanceTo(new THREE.Vector3(x, 0, z)) > 15) {
            npc.velocity.multiplyScalar(-1);
        }

        // NPC follows shadow with delay
        npcGroup.position.lerp(shadow.position, 0.05);
        
        const distToPlayer = npcGroup.position.distanceTo(camera.position);

        if (distToPlayer < 6) {
            // Uncomfortable Staring
            npcGroup.lookAt(camera.position);
            
            // Random Laughing Behavior
            if (npc.behavior === "laugher") {
                npc.laughTimer -= 0.016; // approx delta
                if (npc.laughTimer < 0) {
                    // console.log("NPC laughs unnervingly...");
                    npc.laughTimer = 5 + Math.random() * 10;
                }
            }
        } else {
            // Face the movement direction
            if (npc.behavior === "backwards") {
                // Look opposite of movement
                const lookDir = shadow.position.clone().sub(npc.velocity);
                npcGroup.lookAt(lookDir);
            } else {
                npcGroup.lookAt(shadow.position.clone().add(npc.velocity));
            }
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

  // Initial Population with varied behaviors
  spawnNPC(-5, -5, "normal");
  spawnNPC(15, -10, "backwards");
  spawnNPC(-10, 15, "laugher");
  spawnNPC(20, 20, "normal");
  spawnNPC(0, 25, "backwards");

  return {
    npcs,
    update: (time, camera) => npcs.forEach(n => n.update(time, camera))
  };
}
