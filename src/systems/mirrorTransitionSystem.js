import * as THREE from "three";

export function createMirrorTransitionSystem() {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "black";
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "100";
  overlay.style.transition = "opacity 3s ease-in"; // Slow 3s fade to black
  document.body.appendChild(overlay);

  let transitioning = false;
  let elapsed = 0;

  function triggerTransition(onComplete) {
    if (transitioning) return;
    transitioning = true;
    
    // Activate screen distort effects
    document.body.style.transition = "filter 3s ease";
    document.body.style.filter = "hue-rotate(180deg) contrast(150%) blur(4px) invert(0.8)";
    
    // Audio echoing effect
    console.log("[Audio] Deep echoing reverb building up...");

    // Fade to black over 3 seconds
    setTimeout(() => {
        overlay.style.opacity = "1";
    }, 100);
    
    setTimeout(() => {
        // Reset effects and trigger next scene
        document.body.style.transition = "none";
        document.body.style.filter = "none";
        
        if (onComplete) onComplete();
        
        // Fade back in to mirror world
        setTimeout(() => {
            overlay.style.transition = "opacity 2s ease-out";
            overlay.style.opacity = "0";
            transitioning = false;
        }, 1000);
    }, 3100);
  }

  function update(delta, camera) {
    if (!transitioning) return;
    elapsed += delta;
    
    // Pulled into the mirror feeling
    camera.rotation.z += delta * 3; // Fast dizzy spin
    camera.position.y -= delta * 1.5; // Falling sensation
    
    // Screen shake pulsing
    if (Math.sin(elapsed * 20) > 0.5) {
        camera.position.x += (Math.random() - 0.5) * 0.2;
    }
  }

  return { triggerTransition, update };
}
