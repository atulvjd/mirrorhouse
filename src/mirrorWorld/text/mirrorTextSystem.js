import * as THREE from "three";
import { mirrorText } from "./mirrorTextGenerator.js";
import { createMirrorTextMaterial } from "./mirrorTextMaterial.js";

export function createMirrorTextMesh(text, width = 1.4, height = 0.32, options = {}) {
  const mirrored = mirrorText(text);
  const material = createMirrorTextMaterial(mirrored, {
    width: options.textureWidth || 512,
    height: options.textureHeight || 256,
    color: options.color,
    background: options.background,
    fontSize: options.fontSize || 64,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.renderOrder = options.order || 5;
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  return mesh;
}
