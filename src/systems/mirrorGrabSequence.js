import * as THREE from "three";

export function createMirrorGrabSequence(camera, reflectionGroup, onGrabComplete) {
  let active = false;
  let elapsed = 0;
  
  const startPos = new THREE.Vector3();
  const targetPos = new THREE.Vector3();
  
  function trigger() {
    if (active) return;
    active = true;
    elapsed = 0;
    
    // Play "Finally" whisper spatial audio
    playWhisperAudio();
    
    // Lock the reflection target
    startPos.copy(reflectionGroup.position);
    targetPos.copy(camera.position); // Lunge at the player
    
    // Initial camera shake parameters can be triggered here if needed
  }

  function update(delta) {
    if (!active) return;
    elapsed += delta;
    
    // Lunge animation (fast ease in)
    const progress = Math.min(1, elapsed / 0.5); // 0.5 seconds to grab
    const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
    
    reflectionGroup.position.lerpVectors(startPos, targetPos, ease);
    
    // Apply camera shake
    if (progress > 0.1) {
        camera.position.x += (Math.random() - 0.5) * 0.05;
        camera.position.y += (Math.random() - 0.5) * 0.05;
    }

    if (progress >= 1 && active) {
        active = false;
        if (onGrabComplete) onGrabComplete();
    }
  }

  function playWhisperAudio() {
    // Placeholder for spatial audio "Finally"
    console.log("[Audio] Whisper: 'Finally.'");
  }

  return { trigger, update };
}
