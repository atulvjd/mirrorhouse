import * as THREE from "three";

export function createCarpetSystem(parentGroup, onMoved) {
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 3.2),
    new THREE.MeshStandardMaterial({
      color: 0x4a1820,
      roughness: 0.95,
      metalness: 0.01,
      side: THREE.DoubleSide,
    })
  );
  carpet.rotation.x = -Math.PI * 0.5;
  carpet.position.set(0, -2.72, -17.5);
  carpet.receiveShadow = true;
  carpet.userData.inspectType = "carpet";
  carpet.userData.inspectPrompt = "Press E to move carpet";
  parentGroup.add(carpet);

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d1014,
    roughness: 0.98,
    metalness: 0,
  });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(4.45, 0.03, 3.15), edgeMaterial);
  edge.position.copy(carpet.position);
  edge.position.y -= 0.015;
  edge.receiveShadow = true;
  parentGroup.add(edge);

  const startPosition = carpet.position.clone();
  const endPosition = startPosition.clone();
  endPosition.x += 2.9;
  endPosition.z += 0.35;
  const startEdgePosition = edge.position.clone();
  const endEdgePosition = startEdgePosition.clone();
  endEdgePosition.x += 2.9;
  endEdgePosition.z += 0.35;

  let moving = false;
  let moved = false;
  let progress = 0;

  function move() {
    if (moved || moving) {
      return;
    }
    moving = true;
  }

  function update(delta) {
    if (!moving) {
      return;
    }

    progress = THREE.MathUtils.clamp(progress + delta / 1, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);

    carpet.position.lerpVectors(startPosition, endPosition, eased);
    edge.position.lerpVectors(startEdgePosition, endEdgePosition, eased);
    carpet.rotation.z = -eased * 0.08;
    edge.rotation.z = carpet.rotation.z;

    if (progress >= 1) {
      moving = false;
      moved = true;
      carpet.userData.inspectPrompt = "";
      if (typeof onMoved === "function") {
        onMoved();
      }
    }
  }

  return {
    carpet,
    update,
    isMoved() {
      return moved;
    },
    getInteractable() {
      return {
        object: carpet,
        callback: move,
      };
    },
  };
}
