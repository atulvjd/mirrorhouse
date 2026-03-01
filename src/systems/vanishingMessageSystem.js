import * as THREE from "three";

export function createVanishingMessageSystem(scene, camera, onMessageDissolve) {
  const messages = [];
  const FADE_START = 4.0;
  const FADE_END = 1.8;

  function createTextTexture(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    
    // Chalk/Dust Style
    ctx.clearRect(0, 0, 1024, 256);
    ctx.font = "italic 80px 'Brush Script MT', 'Lucida Handwriting', cursive";
    ctx.fillStyle = "rgba(220, 220, 220, 0.7)";
    ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
    ctx.shadowBlur = 15;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add some "dust" noise to the text
    const words = text.split(" ");
    ctx.fillText(text, 512, 128);
    
    for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.fillRect(Math.random() * 1024, Math.random() * 256, 2, 2);
    }

    return new THREE.CanvasTexture(canvas);
  }

  function addMessage(text, x, y, z, ry = 0) {
    const texture = createTextTexture(text);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    scene.add(mesh);

    messages.push({
      mesh,
      material,
      text,
      wasVisible: false
    });
  }

  // Populate fragments of: "THE KEY TO YOUR WORLD IS IN HER MAIDEN HOME"
  // Positions tuned for the mirrored bungalow (width 12, length 14, height 4.5)
  addMessage("THE KEY...", 0, 2.5, -6.9); // Back Wall
  addMessage("TO YOUR...", -5.9, 2.2, 2, Math.PI / 2); // Left Wall
  addMessage("WORLD...", 5.9, 2.8, -3, -Math.PI / 2); // Right Wall
  addMessage("MAIDEN...", 3, 1.8, 6.9, Math.PI); // Front Wall
  addMessage("HOME...", -4, 2.5, -2, -Math.PI / 2); // Near basement area

  function update(delta) {
    messages.forEach(msg => {
      const dist = camera.position.distanceTo(msg.mesh.position);
      
      let targetOpacity = 0.7;
      if (dist < FADE_START) {
        // Fade out as player gets closer
        targetOpacity = THREE.MathUtils.smoothstep(dist, FADE_END, FADE_START) * 0.7;
      }

      const prevOpacity = msg.material.opacity;
      msg.material.opacity = THREE.MathUtils.lerp(msg.material.opacity, targetOpacity, 0.05);

      // Trigger atmospheric reaction when it disappears
      if (prevOpacity > 0.1 && msg.material.opacity <= 0.1 && !msg.dissolving) {
          if (onMessageDissolve) onMessageDissolve();
          msg.dissolving = true;
          setTimeout(() => msg.dissolving = false, 2000);
      }

      // Floating shimmer
      msg.mesh.position.y += Math.sin(Date.now() * 0.001 + messages.indexOf(msg)) * 0.0005;
    });
  }

  return { update };
}
