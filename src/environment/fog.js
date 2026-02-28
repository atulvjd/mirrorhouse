import * as THREE from "three";

export function createFog(scene) {
  scene.background = new THREE.Color(0x0a0d14);
  scene.fog = new THREE.FogExp2(0x0b0e14, 0.06);
}
