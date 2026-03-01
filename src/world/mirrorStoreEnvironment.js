import * as THREE from "three";
import { createMirroredProduct } from "./mirroredProductGenerator.js";

export function createMirrorStoreEnvironment(scene) {
  const storeGroup = new THREE.Group();
  storeGroup.name = "mirrorStoreGroup";
  storeGroup.position.set(25, 0, 5); // Position from mirrorTownGenerator

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2e24, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a5a, roughness: 0.8 }); // dim vintage walls
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.3, metalness: 0.8 });

  // Store Architecture (Interior and Exterior)
  const width = 10;
  const height = 6;
  const depth = 8;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  storeGroup.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  storeGroup.add(ceiling);

  // Walls
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  storeGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  storeGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), wallMat);
  rightWall.position.set(width / 2, height / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  storeGroup.add(rightWall);

  // Front Wall (Glass Window & Door)
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(3, height, 0.2), woodMat);
  frontLeft.position.set(-3.5, height / 2, depth / 2);
  storeGroup.add(frontLeft);

  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(3, height, 0.2), woodMat);
  frontRight.position.set(3.5, height / 2, depth / 2);
  storeGroup.add(frontRight);

  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.2), woodMat);
  frontTop.position.set(0, height - 1, depth / 2);
  storeGroup.add(frontTop);

  const glassWindow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), glassMat);
  glassWindow.position.set(-3.5, 2, depth / 2 + 0.05); // slightly outside
  storeGroup.add(glassWindow);

  // Open Doorway
  const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.2), woodMat);
  doorFrameTop.position.set(0, 4, depth / 2);
  storeGroup.add(doorFrameTop);

  // Flickering Neon Sign (Mirrored)
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512;
  signCanvas.height = 128;
  const ctx = signCanvas.getContext("2d");
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = "bold 60px 'Courier New', monospace";
  ctx.fillStyle = "#ff5555"; // Neon Red
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 20;
  
  ctx.scale(-1, 1);
  ctx.fillText("SRUOH 42 NEPO", -256, 64);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const neonSignMat = new THREE.MeshBasicMaterial({ map: signTex });
  const neonSign = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), neonSignMat);
  neonSign.position.set(0, height + 0.5, depth / 2 + 0.1);
  storeGroup.add(neonSign);

  const neonLight = new THREE.PointLight(0xff5555, 1, 10);
  neonLight.position.set(0, height + 0.5, depth / 2 + 0.5);
  storeGroup.add(neonLight);

  // Interior Shelves
  const createShelf = (x, z, ry) => {
      const shelfGroup = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.6), woodMat);
      frame.position.y = 1.5;
      shelfGroup.add(frame);
      
      for(let i=1; i<4; i++) {
          const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.8), woodMat);
          board.position.y = i * 0.8;
          shelfGroup.add(board);
      }
      shelfGroup.position.set(x, 0, z);
      shelfGroup.rotation.y = ry;
      storeGroup.add(shelfGroup);
      return shelfGroup;
  };

  const shelf1 = createShelf(-2.5, 0, 0);
  const shelf2 = createShelf(2.5, 0, 0);

  // Cashier Counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1), woodMat);
  counter.position.set(2.5, 0.6, -2.5);
  storeGroup.add(counter);

  // Products
  const products = [];
  
  // Bread (Interactable)
  const bread = createMirroredProduct("BREAD", 0xaa6633, 0.4, 0.2, 0.2);
  bread.position.set(-3.5, 2.45, 0);
  bread.userData.inspectType = "food";
  bread.userData.inspectPrompt = "Take Bread";
  products.push(bread);
  storeGroup.add(bread);

  // Other products (decor)
  const milk = createMirroredProduct("MILK", 0xeeeeee, 0.2, 0.4, 0.2);
  milk.position.set(-2, 1.65, 0);
  storeGroup.add(milk);

  const soup = createMirroredProduct("SOUP", 0x882222, 0.2, 0.3, 0.2);
  soup.position.set(-3, 0.85, 0);
  storeGroup.add(soup);

  const cereal = createMirroredProduct("CEREAL", 0x222288, 0.3, 0.5, 0.1);
  cereal.position.set(2, 2.45, 0);
  storeGroup.add(cereal);

  // Interior Lights
  const interiorLight1 = new THREE.PointLight(0xffddaa, 0.8, 12);
  interiorLight1.position.set(-2, height - 0.5, 0);
  storeGroup.add(interiorLight1);
  
  const interiorLight2 = new THREE.PointLight(0xffddaa, 0.8, 12);
  interiorLight2.position.set(2, height - 0.5, -2);
  storeGroup.add(interiorLight2);

  scene.add(storeGroup);

  return {
      group: storeGroup,
      interactables: products,
      doorPosition: new THREE.Vector3(25, 0, 9), // World position of exit
      update: (time) => {
          // Neon flicker
          if (Math.random() > 0.95) {
              neonLight.intensity = Math.random() * 0.5;
              neonSignMat.color.setHex(0x551111);
          } else {
              neonLight.intensity = THREE.MathUtils.lerp(neonLight.intensity, 1, 0.2);
              neonSignMat.color.setHex(0xffffff);
          }
          
          // Interior flicker
          interiorLight1.intensity = 0.8 + Math.sin(time * 8) * 0.05;
          interiorLight2.intensity = 0.8 + Math.cos(time * 7) * 0.05;
      }
  };
}
