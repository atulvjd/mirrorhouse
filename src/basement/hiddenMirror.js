import * as THREE from "three";

export function createHiddenMirror(parentGroup) {
  const mirrorGeo = new THREE.PlaneGeometry(2.8, 2.8);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 1.5,
  });

  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.set(0, 0.01, 0);
  mirror.visible = true; // Floor mirror is physically there under carpet
  parentGroup.add(mirror);

  const frame = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.05, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
  );
  frame.position.y = -0.02;
  parentGroup.add(frame);

  let revealed = false;
  let rippleTime = 0;

  function reveal() {
    revealed = true;
  }

  function update(camera, delta) {
    if (!revealed) return;
    rippleTime += delta;
    
    // Logic for ripple shader or reflection brightness shifts would go here
    mirrorMat.emissive.setHex(0x111111);
    mirrorMat.emissiveIntensity = 0.1 + Math.sin(rippleTime * 2) * 0.05;
  }

  return {
    mesh: mirror,
    reveal,
    update
  };
}
