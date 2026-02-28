import * as THREE from "three";

export function createMirrorTextMaterial(text, options = {}) {
  const width = options.width || 512;
  const height = options.height || 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.MeshBasicMaterial({ color: 0xffffff });
  }

  ctx.fillStyle = options.background || "rgba(30, 26, 22, 0.6)";
  ctx.fillRect(0, 0, width, height);

  // Add cracked texture.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  for (let i = 0; i < 12; i += 1) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = options.color || "#e8e1c6";
  ctx.font = `${options.fontSize || 48}px "Courier New", monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.92,
  });
}
