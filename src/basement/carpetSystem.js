import * as THREE from "three";

export function createCarpetSystem(parentGroup, onReveal) {
  const carpetGeo = new THREE.BoxGeometry(4.0, 0.04, 6.0); // Large 4x6 size
  const carpetMat = new THREE.MeshStandardMaterial({ 
    color: 0x6a1f2b, // Maroon
    roughness: 1.0 
  });
  
  const carpet = new THREE.Mesh(carpetGeo, carpetMat);
  carpet.position.set(0, 0.03, 0);
  carpet.castShadow = true;
  carpet.receiveShadow = true;
  carpet.userData.inspectType = "carpet";
  carpet.userData.inspectPrompt = "Move the carpet";
  parentGroup.add(carpet);

  let sliding = false;
  let progress = 0;
  const startPos = carpet.position.clone();
  const endPos = new THREE.Vector3(4.0, 0.03, 0); // Slide aside

  function slide() {
    if (sliding || progress >= 1) return;
    sliding = true;
    if (onReveal) onReveal();
  }

  function update(delta) {
    if (!sliding || progress >= 1) return;
    
    // 2-second animation
    progress = Math.min(1, progress + delta * 0.5); 
    const ease = 1 - Math.pow(1 - progress, 3);
    
    carpet.position.lerpVectors(startPos, endPos, ease);
    // Subtle wrinkle effect via rotation
    carpet.rotation.z = Math.sin(progress * Math.PI) * 0.05;
  }

  return {
    object: carpet,
    callback: slide,
    update,
    isSliding: () => sliding
  };
}
