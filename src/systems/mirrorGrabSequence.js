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
    
    // Lock the reflection target to jump at camera
    startPos.copy(reflectionGroup.position);
    targetPos.copy(camera.position); 
    
    // Start distortion audio
    playGlitchAudio();
  }

  function update(delta) {
    if (!active) return;
    elapsed += delta;
    
    // Lunge animation (fast ease in)
    const progress = Math.min(1, elapsed / 0.5); // 0.5 seconds to grab
    const ease = 1 - Math.pow(1 - progress, 4); // Quartic ease out
    
    reflectionGroup.position.lerpVectors(startPos, targetPos, ease);
    
    // Apply violent camera shake
    if (progress > 0.1) {
        camera.position.x += (Math.random() - 0.5) * 0.1;
        camera.position.y += (Math.random() - 0.5) * 0.1;
        camera.rotation.z += (Math.random() - 0.5) * 0.05;
    }

    // Trigger screen glitch via CSS
    if (Math.random() > 0.8) {
        document.body.style.filter = "hue-rotate(90deg) contrast(200%) invert(1)";
        setTimeout(() => document.body.style.filter = "none", 50);
    }

    if (progress >= 1 && active) {
        active = false;
        if (onGrabComplete) onGrabComplete();
    }
  }

  function playGlitchAudio() {
    console.log("[Audio] Sudden loud bass impact and glitch sound!");
  }

  return { trigger, update };
}
