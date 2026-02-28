import * as THREE from "three";

export function createShadowSystem(scene) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x050304,
    transparent: true,
    opacity: 0.45,
  });

  function createShadow() {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.32), material.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const position = mesh.position.clone();
    const target = mesh.position.clone();
    return { mesh, position, target };
  }

  function updateShadow(entry, delta) {
    entry.position.lerp(entry.target, Math.min(1, delta * 2.4));
    entry.mesh.position.copy(entry.position);
  }

  return {
    createShadow,
    updateShadow,
  };
}
