import * as THREE from "three";

export function createStoreCinematicEvent(scene, interaction, overlay, story, storeEnv, stareSystem) {
  let eventTriggered = false;
  let dirtTextGroup = null;

  // 1. Setup the Bread Interaction
  storeEnv.interactables.forEach(item => {
      interaction.register(item, () => {
          if (!eventTriggered) {
              triggerSequence();
          }
      });
  });

  function triggerSequence() {
      eventTriggered = true;
      
      // Feedback UI
      overlay.setText("You picked up Bread. Something feels wrong.");
      overlay.setVisible(true);
      setTimeout(() => overlay.setVisible(false), 3000);

      // Trigger the Stare System
      stareSystem.triggerStareEvent((dialogue) => {
          story.showMemory(dialogue);
      });

      // Audio shift
      triggerDistortedAudio();

      // Spawn Next Objective Text Outside
      spawnDirtText();
  }

  function triggerDistortedAudio() {
      // Dispatch a custom event that the main audio system can pick up
      // Or handle a simplified low drone tone directly here for the cinematic
      try {
          const ctx = window.AudioContext ? new AudioContext() : null;
          if (!ctx) return;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = "sine";
          osc.frequency.setValueAtTime(40, ctx.currentTime); // Deep sub drone
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 5); // Slow fade in
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          
          // Add whispering
          // (Placeholder for actual audio file playback)
          console.log("[Audio] Whispering: 'not stitched...'");
      } catch (e) {
          // Ignore audio errors
      }
  }

  function spawnDirtText() {
      // Spawn text in the dirt outside the bungalow for the next objective
      dirtTextGroup = new THREE.Group();
      
      // A simple plane with text
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 512, 256);
      
      ctx.font = "bold 60px 'Courier New', monospace";
      ctx.fillStyle = "#3a2a1a"; // Dark dirt color
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // NOT mirrored, because it's meant to be read by the player as a clue
      ctx.fillText("KEY", 256, 80);
      ctx.fillText("MAIDEN HOME", 256, 160);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ 
          map: texture, 
          transparent: true, 
          opacity: 0.8,
          depthWrite: false 
      });

      const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 2), mat);
      textMesh.rotation.x = -Math.PI / 2;
      dirtTextGroup.add(textMesh);
      
      // Position somewhere between the store and the bungalow
      dirtTextGroup.position.set(10, 0.05, -5);
      scene.add(dirtTextGroup);
  }

  function update(camera) {
      if (dirtTextGroup) {
          // Fade out dirt text as player approaches
          const dist = camera.position.distanceTo(dirtTextGroup.position);
          if (dist < 8) {
              const opacity = Math.max(0, (dist - 2) / 6);
              dirtTextGroup.children[0].material.opacity = opacity * 0.8;
          }
      }
  }

  return { 
      update,
      isTriggered: () => eventTriggered
  };
}
