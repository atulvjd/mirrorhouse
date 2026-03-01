import * as THREE from "three";

export function createMirroredProduct(label, colorHex, width, height, depth) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  
  // Base color
  const colorStr = "#" + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = colorStr;
  ctx.fillRect(0, 0, 256, 128);
  
  // Add some vintage grime
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for(let i=0; i<50; i++) {
      ctx.fillRect(Math.random()*256, Math.random()*128, Math.random()*10, Math.random()*10);
  }

  ctx.font = "bold 36px 'Courier New', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // THE MIRROR RULE: Reverse the text
  const reversedLabel = label.split("").reverse().join("");
  
  // Actually draw the text mirrored
  ctx.scale(-1, 1);
  ctx.fillText(reversedLabel, -128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  
  const baseMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });
  const frontMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });

  const materials = [
    baseMat, // right
    baseMat, // left
    baseMat, // top
    baseMat, // bottom
    frontMat, // front
    baseMat  // back
  ];

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
