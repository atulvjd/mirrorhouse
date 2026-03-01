import * as THREE from "three";

export function createFurniture(roomGroup) {
  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = "vintageFurniture";

  // Shared Materials for Performance
  const woodMat1 = new THREE.MeshStandardMaterial({ color: 0x7a5534, roughness: 0.8, metalness: 0.05 });
  const woodMat2 = new THREE.MeshStandardMaterial({ color: 0x5d4026, roughness: 0.9, metalness: 0.02 });
  const fabricRed = new THREE.MeshStandardMaterial({ color: 0x6b3c3c, roughness: 1.0 });
  const fabricBlue = new THREE.MeshStandardMaterial({ color: 0x4f5566, roughness: 1.0 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0x6b5b30, roughness: 0.3, metalness: 0.6 });
  const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2, metalness: 0.1 });

  const lights = [];

  // Helper to add lamps
  const createLamp = (x, y, z, parent) => {
    const lampGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.3), brassMat);
    lampGroup.add(base);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bulb.position.y = 0.2;
    lampGroup.add(bulb);
    
    const light = new THREE.PointLight(0xffcc88, 1.4, 10);
    light.position.y = 0.2;
    light.castShadow = true;
    lampGroup.add(light);
    
    lampGroup.position.set(x, y, z);
    parent.add(lampGroup);
    lights.push({ light, phase: Math.random() * Math.PI * 2 });
  };

  // --- 1. LIVING ROOM (-6 to 6, 2 to 10) ---
  const livingRoom = new THREE.Group();
  livingRoom.position.set(0, 0, 6);
  
  // Vintage Sofa
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.0), fabricRed);
  sofa.position.set(0, 0.4, 0);
  sofa.castShadow = true;
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.3), fabricRed);
  sofaBack.position.set(0, 1.0, -0.35);
  livingRoom.add(sofa, sofaBack);

  // Coffee Table
  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.8), woodMat1);
  coffeeTable.position.set(0, 0.2, 1.2);
  coffeeTable.castShadow = true;
  livingRoom.add(coffeeTable);

  // Old Armchair
  const armchair = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), fabricBlue);
  armchair.position.set(-2.5, 0.4, 0.5);
  armchair.rotation.y = Math.PI / 4;
  armchair.castShadow = true;
  livingRoom.add(armchair);

  // Fireplace
  const fireplace = new THREE.Group();
  const fpMantle = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.6), woodMat2);
  fpMantle.position.set(0, 0.75, -2.5);
  const fpHole = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.61), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  fpHole.position.set(0, 0.5, -2.5);
  fireplace.add(fpMantle, fpHole);
  livingRoom.add(fireplace);

  // Grandfather Clock
  const clock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.4), woodMat2);
  clock.position.set(3.5, 1.2, -2.5);
  clock.castShadow = true;
  livingRoom.add(clock);
  
  furnitureGroup.add(livingRoom);

  // --- 2. DINING ROOM (6 to 12, 2 to 10) ---
  const diningRoom = new THREE.Group();
  diningRoom.position.set(9, 0, 6);

  // Long Dining Table
  const dTable = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 1.2), woodMat1);
  dTable.position.set(0, 0.9, 0);
  dTable.castShadow = true;
  diningRoom.add(dTable);
  const dLegGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
  [[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]].forEach(pos => {
      const leg = new THREE.Mesh(dLegGeo, woodMat1);
      leg.position.set(pos[0], 0.45, pos[1]);
      diningRoom.add(leg);
  });

  // Chairs & Plates
  for (let i = 0; i < 3; i++) {
      const chair1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), woodMat2);
      chair1.position.set(-1.0 + i, 0.25, -0.8);
      diningRoom.add(chair1);
      
      const chair2 = chair1.clone();
      chair2.position.set(-1.0 + i, 0.25, 0.8);
      diningRoom.add(chair2);

      // Plates
      const plate1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), porcelainMat);
      plate1.position.set(-1.0 + i, 0.96, -0.3);
      diningRoom.add(plate1);

      const plate2 = plate1.clone();
      plate2.position.set(-1.0 + i, 0.96, 0.3);
      diningRoom.add(plate2);
  }

  // Candle Stand
  createLamp(0, 0.95, 0, diningRoom);
  
  furnitureGroup.add(diningRoom);

  // --- 3. BEDROOM (0 to 12, -10 to 2) ---
  const bedroom = new THREE.Group();
  bedroom.position.set(6, 0, -6);

  // Old Wooden Bed
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 3.0), woodMat1);
  bed.position.set(0, 0.25, 0);
  bed.castShadow = true;
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 2.8), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
  mattress.position.set(0, 0.6, 0);
  bedroom.add(bed, mattress);

  // Wardrobe
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.5, 0.8), woodMat2);
  wardrobe.position.set(-3.5, 1.25, -2);
  wardrobe.castShadow = true;
  bedroom.add(wardrobe);

  // Bedside Table & Lamp
  const bedside = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), woodMat1);
  bedside.position.set(-1.5, 0.3, -1);
  bedside.castShadow = true;
  bedroom.add(bedside);
  createLamp(-1.5, 0.6, -1, bedroom);

  furnitureGroup.add(bedroom);

  // --- 4. LIBRARY CORNER (-12 to -6, 2 to 10) ---
  const library = new THREE.Group();
  library.position.set(-9, 0, 6);

  const bookshelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.8, 0.6), woodMat2);
  bookshelf.position.set(0, 1.4, -2.5);
  bookshelf.castShadow = true;
  library.add(bookshelf);

  // Scattered Books
  const bookGeo = new THREE.BoxGeometry(0.2, 0.3, 0.05);
  const bookMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
  for (let i = 0; i < 15; i++) {
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set((Math.random() - 0.5) * 2, 0.15, (Math.random() - 0.5) * 2);
      book.rotation.x = Math.PI / 2;
      book.rotation.z = Math.random() * Math.PI;
      library.add(book);
  }

  // Reading Chair & Lamp
  const readingChair = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), fabricRed);
  readingChair.position.set(-1, 0.4, 0);
  readingChair.rotation.y = Math.PI / 6;
  library.add(readingChair);
  createLamp(1, 1.2, 0, library);

  furnitureGroup.add(library);

  // --- 5. DRAWER CABINET (Living Room corner) ---
  const cabinet = new THREE.Group();
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.5), woodMat2);
  cabBody.position.y = 0.45;
  cabinet.add(cabBody);

  const drawerTrack = new THREE.Group();
  drawerTrack.position.set(0, 0.7, 0.2); 
  const drawerFront = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.1), woodMat1);
  drawerTrack.add(drawerFront);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), brassMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.z = 0.06;
  drawerFront.add(handle);

  const contentAnchor = new THREE.Group();
  contentAnchor.position.set(0, 0.05, -0.2);
  drawerTrack.add(contentAnchor);
  cabinet.add(drawerTrack);

  cabinet.position.set(-4, 0, 2); // Near hallway
  cabinet.rotation.y = Math.PI / 2;
  furnitureGroup.add(cabinet);

  // --- 6. DECORATIONS ---
  // Paintings / Mirrors
  const paintingGeo = new THREE.BoxGeometry(1.2, 0.8, 0.05);
  const paintingMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const painting = new THREE.Mesh(paintingGeo, paintingMat);
  painting.position.set(0, 2.0, 9.9);
  furnitureGroup.add(painting);

  roomGroup.add(furnitureGroup);

  return {
    group: furnitureGroup,
    drawer: drawerTrack,
    drawerContentAnchor: contentAnchor,
    update: (time) => {
        // Flicker lamps using sine wave variation
        lights.forEach(l => {
            const flicker = Math.sin(time * 10 + l.phase) * 0.1 + Math.sin(time * 25) * 0.05;
            l.light.intensity = 1.4 + flicker;
        });
    }
  };
}