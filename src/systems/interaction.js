import * as THREE from "three";

export function createInteractionSystem(camera, scene) {
  const raycaster = new THREE.Raycaster();
  const rayOrigin = new THREE.Vector2(0, 0);
  raycaster.far = 3;

  const interactables = [];
  const callbacks = new Map();
  const materialStates = new WeakMap();

  let currentTarget = null;

  function setMaterialHighlight(material, highlighted) {
    if (!material) {
      return;
    }

    if (!materialStates.has(material)) {
      materialStates.set(material, {
        hasEmissive:
          material.emissive instanceof THREE.Color &&
          typeof material.emissiveIntensity === "number",
        emissiveHex:
          material.emissive instanceof THREE.Color ? material.emissive.getHex() : null,
        emissiveIntensity:
          typeof material.emissiveIntensity === "number"
            ? material.emissiveIntensity
            : null,
      });
    }

    const state = materialStates.get(material);

    if (!state.hasEmissive) {
      return;
    }

    if (highlighted) {
      material.emissive.setHex(0x2b2b2b);
      material.emissiveIntensity = Math.max(state.emissiveIntensity, 0.55);
      return;
    }

    material.emissive.setHex(state.emissiveHex);
    material.emissiveIntensity = state.emissiveIntensity;
  }

  function setObjectHighlight(object, highlighted) {
    object.traverse((node) => {
      if (!node.isMesh || !node.material) {
        return;
      }

      if (Array.isArray(node.material)) {
        node.material.forEach((material) =>
          setMaterialHighlight(material, highlighted)
        );
        return;
      }

      setMaterialHighlight(node.material, highlighted);
    });
  }

  function findRegisteredObject(hitObject) {
    for (const candidate of interactables) {
      // Ignore stale registrations if an object is no longer in the scene.
      if (!scene.getObjectById(candidate.id)) {
        continue;
      }

      if (candidate === hitObject || candidate.getObjectById(hitObject.id)) {
        return candidate;
      }
    }

    return null;
  }

  function register(object, callback) {
    if (!object || typeof callback !== "function") {
      return;
    }

    if (!interactables.includes(object)) {
      interactables.push(object);
    }

    callbacks.set(object, callback);
  }

  function triggerInteraction() {
    if (!currentTarget) {
      return;
    }

    const callback = callbacks.get(currentTarget);

    if (callback) {
      callback();
    }
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyE" && !event.repeat) {
      triggerInteraction();
    }
  });

  function update() {
    raycaster.setFromCamera(rayOrigin, camera);
    const intersections = raycaster.intersectObjects(interactables, true);

    const nextTarget =
      intersections.length > 0
        ? findRegisteredObject(intersections[0].object)
        : null;

    if (nextTarget !== currentTarget) {
      if (currentTarget) {
        setObjectHighlight(currentTarget, false);
      }

      if (nextTarget) {
        setObjectHighlight(nextTarget, true);
      }

      currentTarget = nextTarget;
    }

    return currentTarget;
  }

  return {
    register,
    update,
  };
}
