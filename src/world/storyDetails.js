import * as THREE from "three";

export function createStoryDetails(scene) {
  const detailsGroup = new THREE.Group();
  detailsGroup.name = "storyDetails";
  scene.add(detailsGroup);

  const textureLoader = new THREE.TextureLoader();

  // --- 1. CRACKED MIRROR ON WALL ---
  const mirrorGroup = new THREE.Group();
  const mirrorGeo = new THREE.PlaneGeometry(0.8, 1.2);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  const mirrorPlane = new THREE.Mesh(mirrorGeo, mirrorMat);
  
  // Frame for the cracked mirror
  const frameGeo = new THREE.BoxGeometry(0.9, 1.3, 0.05);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.8 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = -0.03;
  
  mirrorGroup.add(mirrorPlane);
  mirrorGroup.add(frame);
  mirrorGroup.position.set(-4.97, 1.6, 2);
  mirrorGroup.rotation.y = Math.PI / 2;
  detailsGroup.add(mirrorGroup);

  // --- 2. FAMILY PHOTO WALL ---
  const createPhoto = (x, y, z, ry, scale = 1) => {
    const photoGroup = new THREE.Group();
    const photoGeo = new THREE.PlaneGeometry(0.4 * scale, 0.5 * scale);
    const photoMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, // Placeholder for B&W photo
      roughness: 0.9,
    });
    const photo = new THREE.Mesh(photoGeo, photoMat);
    
    const frameGeo = new THREE.BoxGeometry(0.5 * scale, 0.6 * scale, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.02;
    
    photoGroup.add(photo);
    photoGroup.add(frame);
    photoGroup.position.set(x, y, z);
    photoGroup.rotation.y = ry;
    detailsGroup.add(photoGroup);
  };

  // Wall of photos (smiling but hollow eyes)
  createPhoto(4.97, 1.8, -1, -Math.PI / 2, 1.2); // Grandmother
  createPhoto(4.97, 1.7, -1.8, -Math.PI / 2, 0.8); // Wedding
  createPhoto(4.97, 2.2, -1.5, -Math.PI / 2, 0.9); // Childhood
  createPhoto(4.97, 1.3, -1.4, -Math.PI / 2, 1.0); // Family gathering

  // --- 3. PEELING WALLPAPER (Decals) ---
  const createPeelingWall = (x, y, z, ry, w, h) => {
    const peelGeo = new THREE.PlaneGeometry(w, h);
    const peelMat = new THREE.MeshStandardMaterial({
      color: 0x1a0505, // Darker underneath
      roughness: 1.0,
      transparent: true,
      opacity: 0.4,
    });
    const peel = new THREE.Mesh(peelGeo, peelMat);
    peel.position.set(x, y, z);
    peel.rotation.y = ry;
    detailsGroup.add(peel);
  };
  
  createPeelingWall(-4.98, 2.5, -3, Math.PI / 2, 0.5, 1.2);
  createPeelingWall(0, 1.2, -4.98, 0, 1.5, 0.8);

  // --- 4. HIDDEN WRITING ON WALL ---
  // Subtly scratched phrase: "DO NOT TRUST THE REFLECTION"
  // Using a group of small planes to simulate scratches if we don't have a texture
  const scratchMat = new THREE.MeshStandardMaterial({
    color: 0x330000,
    transparent: true,
    opacity: 0.5,
  });
  const writingGroup = new THREE.Group();
  // Placeholder for "Writing" - in a real game this would be a single transparent PNG
  const writingPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.2), scratchMat);
  writingGroup.add(writingPlane);
  writingGroup.position.set(3, 1.4, -4.98);
  detailsGroup.add(writingGroup);

  // --- 5. BASEMENT TRAPDOOR ---
  const doorGroup = new THREE.Group();
  const doorGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.95 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  
  const handleGeo = new THREE.TorusGeometry(0.06, 0.015, 8, 16, Math.PI);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.set(0.6, 0.03, 0);
  handle.rotation.x = -Math.PI / 2;
  
  doorGroup.add(door);
  doorGroup.add(handle);
  doorGroup.position.set(-3, 0.025, -2);
  detailsGroup.add(doorGroup);

  return detailsGroup;
}
