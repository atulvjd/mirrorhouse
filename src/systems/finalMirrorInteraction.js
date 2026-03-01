import * as THREE from "three";

export function createFinalMirrorInteraction(scene, maidenHomeGroup, camera, interaction, onDialogueEnd) {
  // --- 1. THE STANDING MIRROR ---
  const mirrorGroup = new THREE.Group();
  
  // Antique Frame
  const frameGeo = new THREE.BoxGeometry(2.2, 4.2, 0.2);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.y = 2.1;
  mirrorGroup.add(frame);

  // Cracked Mirror Surface with Ripple
  const surfaceGeo = new THREE.PlaneGeometry(2.0, 4.0, 32, 32);
  const surfaceMat = new THREE.MeshStandardMaterial({ 
      color: 0x8899aa, 
      metalness: 1.0, 
      roughness: 0.1,
      envMapIntensity: 2.0
  });
  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.position.set(0, 2.1, 0.11);
  surface.userData.inspectPrompt = "Look into the mirror";
  mirrorGroup.add(surface);

  mirrorGroup.position.set(0, 0, 0); // Center of Maiden Home
  maidenHomeGroup.add(mirrorGroup);

  // --- 2. REFLECTION ENTITY ---
  // Normal initially
  const reflection = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.7), new THREE.MeshStandardMaterial({ color: 0x444444 }));
  body.position.y = 0.85;
  reflection.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  head.position.y = 1.8;
  reflection.add(head);

  // Smirk
  const smileGeo = new THREE.TorusGeometry(0.12, 0.015, 8, 16, Math.PI);
  const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const smile = new THREE.Mesh(smileGeo, smileMat);
  smile.position.set(0, 1.75, 0.28);
  smile.rotation.x = Math.PI; // Upward (normal) initially
  reflection.add(smile);

  // Calculate mirrored position (assuming mirror faces Z)
  reflection.position.copy(mirrorGroup.position);
  reflection.position.z += 2; // Behind mirror
  maidenHomeGroup.add(reflection);

  let active = false;
  let time = 0;
  let rippling = false;

  // --- 3. INTERACTION & DIALOGUE ---
  interaction.register(surface, () => {
      if (active) return;
      active = true;
      rippling = true;

      // Lock player (disable movement in game.js via custom event or just let narrative take over)
      document.exitPointerLock();

      const lines = [
          "You don't belong here.",
          "You still believe your world is real.",
          "This world is honest.",
          "Your world hides behind smiles."
      ];

      // Unsettling transformation of reflection
      smile.rotation.x = 0; // Flip to stitched
      
      let currentLine = 0;
      const interval = setInterval(() => {
          if (currentLine < lines.length) {
              // Custom text overlay for reflection speech
              showReflectionSubtitle(lines[currentLine]);
              currentLine++;
          } else {
              clearInterval(interval);
              setTimeout(() => {
                  if (onDialogueEnd) onDialogueEnd();
              }, 2000);
          }
      }, 3500);
  });

  function showReflectionSubtitle(text) {
      // Create a temporary un-obtrusive subtitle element
      const sub = document.createElement("div");
      sub.textContent = text;
      sub.style.position = "fixed";
      sub.style.bottom = "15%";
      sub.style.left = "50%";
      sub.style.transform = "translateX(-50%)";
      sub.style.color = "#aaa";
      sub.style.fontFamily = "'Courier New', monospace";
      sub.style.fontSize = "24px";
      sub.style.letterSpacing = "2px";
      sub.style.opacity = "0";
      sub.style.transition = "opacity 1s ease";
      sub.style.zIndex = "80";
      document.body.appendChild(sub);

      requestAnimationFrame(() => sub.style.opacity = "1");
      setTimeout(() => {
          sub.style.opacity = "0";
          setTimeout(() => document.body.removeChild(sub), 1000);
      }, 3000);
  }

  function update(delta) {
      if (rippling) {
          time += delta;
          // Deform vertices of the mirror surface
          const positions = surface.geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const y = positions[i+1];
              // Sine wave ripple based on distance from center
              const dist = Math.sqrt(x*x + y*y);
              positions[i+2] = Math.sin(dist * 10 - time * 5) * 0.05;
          }
          surface.geometry.attributes.position.needsUpdate = true;
      }
      
      if (!active) {
          // Normal mirroring
          const mirrorPos = new THREE.Vector3();
          mirrorGroup.getWorldPosition(mirrorPos);
          
          reflection.position.x = camera.position.x;
          // Invert Z distance across mirror
          const zDist = camera.position.z - mirrorPos.z;
          reflection.position.z = mirrorPos.z - zDist;
          reflection.position.y = 0;

          // Head looks at player
          head.lookAt(camera.position);
      } else {
          // Reflection acts independently, stares at player
          reflection.position.set(0, 0, 1.5);
          head.lookAt(camera.position);
          head.rotation.z = Math.sin(time) * 0.05; // Slight eerie tilt
      }
  }

  return { update };
}
