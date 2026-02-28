import * as THREE from "three";

export function createMirrorEntity(scene) {
  const entity = new THREE.Group();
  entity.visible = false;

  const material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 1,
    metalness: 0,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.35), material);
  body.position.y = 0.9;
  entity.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), material);
  head.position.y = 1.7;
  entity.add(head);

  scene.add(entity);

  const cameraForward = new THREE.Vector3();
  const vectorToEntity = new THREE.Vector3();
  const moveDirection = new THREE.Vector3();
  const moveTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const stalkLookTarget = new THREE.Vector3();
  const STALK_SPEED = 0.4;
  const CATCH_DISTANCE = 1.2;
  let active = false;

  function spawnBehindPlayer(camera) {
    if (!camera) {
      return;
    }

    if (!entity.parent) {
      scene.add(entity);
    }

    camera.getWorldDirection(cameraForward);
    entity.position.copy(camera.position).addScaledVector(cameraForward, -1.8);
    entity.position.y = Math.max(0, camera.position.y - 1.6);

    lookTarget.copy(camera.position);
    lookTarget.y = entity.position.y + 1.4;
    entity.lookAt(lookTarget);

    entity.visible = true;
    active = true;
  }

  function remove() {
    if (!active && !entity.parent) {
      return;
    }

    active = false;
    entity.visible = false;

    if (entity.parent) {
      entity.parent.remove(entity);
    }
  }

  function update(camera, delta = 1 / 60) {
    if (!active || !camera) {
      return {
        active: false,
        lookingTowardEntity: false,
        caught: false,
        distance: Infinity,
      };
    }

    camera.getWorldDirection(cameraForward);
    vectorToEntity.copy(entity.position).sub(camera.position);

    if (vectorToEntity.lengthSq() === 0) {
      return {
        active: true,
        lookingTowardEntity: true,
        caught: true,
        distance: 0,
      };
    }

    vectorToEntity.normalize();
    const lookingTowardEntity = cameraForward.dot(vectorToEntity) > 0.6;

    if (!lookingTowardEntity) {
      moveDirection.copy(camera.position).sub(entity.position);
      moveDirection.y = 0;

      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        moveTarget.copy(entity.position).addScaledVector(
          moveDirection,
          STALK_SPEED * delta
        );
        moveTarget.y = entity.position.y;
        entity.position.lerp(moveTarget, Math.min(1, 8 * delta));
      }
    }

    stalkLookTarget.copy(camera.position);
    stalkLookTarget.y = entity.position.y + 1.4;
    entity.lookAt(stalkLookTarget);

    const distance = entity.position.distanceTo(camera.position);
    const caught = distance < CATCH_DISTANCE;

    return {
      active: true,
      lookingTowardEntity,
      caught,
      distance,
    };
  }

  function isActive() {
    return active;
  }

  return {
    spawnBehindPlayer,
    update,
    remove,
    isActive,
  };
}
