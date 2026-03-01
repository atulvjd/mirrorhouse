import * as THREE from "three";

export function createMemoryRecognitionTrigger(camera, maidenHome, story) {
  let triggered = false;
  let gateOpening = false;
  let gateProgress = 0;

  function trigger() {
      if (triggered) return;
      triggered = true;

      // Screen flicker (placeholder via CSS filter)
      document.body.style.filter = "invert(1) contrast(150%)";
      setTimeout(() => { document.body.style.filter = "none"; }, 150);
      setTimeout(() => { document.body.style.filter = "invert(1)"; }, 300);
      setTimeout(() => { document.body.style.filter = "none"; }, 400);

      // Memory audio & whisper
      // (Placeholder for actual audio)
      console.log("[Audio] Grandmother laughing echo...");
      
      story.showMemory("You finally remembered.");

      // Start gate animation after delay
      setTimeout(() => {
          gateOpening = true;
          console.log("[Audio] Iron hinge creaking...");
      }, 2000);
  }

  function update(delta) {
      if (!triggered) {
          if (camera.position.distanceTo(maidenHome.triggerPosition) < 4.0) {
              trigger();
          }
      }

      if (gateOpening && gateProgress < 1) {
          gateProgress += delta * 0.3; // Slow open
          // Gate opens inwards
          maidenHome.gateGroup.rotation.y = THREE.MathUtils.lerp(0, Math.PI / 2.2, gateProgress);
      }
  }

  return { update };
}
