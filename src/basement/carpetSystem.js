import * as THREE from "three";

export function createCarpetSystem(parentGroup, onReveal) {
  const carpetGeo = new THREE.BoxGeometry(3.5, 0.04, 3.5);
  const carpetMat = new THREE.MeshStandardMaterial({ 
    color: 0x4d0000, 
    roughness: 1.0 
  });
  
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.position.set(0, 0.03, 0);
  carpet.castShadow = true;
  carpet.receiveShadow = true;
  carpet.userData.inspectPrompt = "Something is under this. Press E to pull.";
  parentGroup.add(carpet);

  let sliding = false;
  let progress = 0;
  const startPos = carpet.position.clone();
  const endPos = new THREE.Vector3(3.5, 0.03, 0);

  function slide() {
    if (sliding || progress >= 1) return;
    sliding = true;
    if (onReveal) onReveal();
  }

  function update(delta) {
    if (!sliding || progress >= 1) return;
    
    progress = Math.min(1, progress + delta * 0.8);
    carpet.position.lerpVectors(startPos, endPos, progress);
    carpet.rotation.z = Math.sin(progress * Math.PI) * 0.05;
  }

  return {
    object: carpet,
    callback: slide,
    update,
    isSliding: () => sliding
  };
}
