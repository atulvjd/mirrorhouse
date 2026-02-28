import * as THREE from "three";

export function createBasementStaircase(parentGroup) {
  const stairs = new THREE.Group();
  stairs.name = "basementStaircase";

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2b21,
    roughness: 0.91,
    metalness: 0.04,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d221a,
    roughness: 0.9,
    metalness: 0.07,
  });

  const startX = 3.35;
  const startZ = -9.1;
  const steps = 11;

  for (let i = 0; i < steps; i += 1) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(2.05, 0.22, 0.56),
      woodMaterial
    );
    step.position.set(
      startX,
      0.02 - i * 0.24,
      startZ - i * 0.58
    );
    step.rotation.y = -0.15;
    step.castShadow = true;
    step.receiveShadow = true;
    stairs.add(step);
  }

  const railLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 2.6, 6.9),
    railMaterial
  );
  railLeft.position.set(2.35, -0.98, -12.2);
  railLeft.rotation.y = -0.15;
  railLeft.castShadow = true;
  railLeft.receiveShadow = true;
  stairs.add(railLeft);

  const railRight = railLeft.clone();
  railRight.position.x = 4.33;
  stairs.add(railRight);

  const dimStairLight = new THREE.PointLight(0xffd8a8, 0.22, 4);
  dimStairLight.position.set(3.2, 0.95, -10.4);
  stairs.add(dimStairLight);

  parentGroup.add(stairs);

  let previousStepIndex = -1;

  function update(camera, delta, onStep) {
    const x = camera.position.x;
    const z = camera.position.z;

    const inStairChannel = x > 2.2 && x < 4.9 && z < -8.7 && z > -15.7;
    const inBasementZone = x > -6.8 && x < 6.8 && z < -14.8 && z > -24.2;
    let targetY = 1.6;

    if (inStairChannel) {
      const progress = THREE.MathUtils.clamp(((-z) - 8.9) / 6.8, 0, 1);
      targetY = 1.6 - progress * 3.9;
      const stepIndex = Math.floor(progress * 10);
      if (stepIndex !== previousStepIndex) {
        previousStepIndex = stepIndex;
        if (typeof onStep === "function") {
          onStep(stepIndex);
        }
      }
    } else if (inBasementZone) {
      targetY = -2.3;
      previousStepIndex = -1;
    } else {
      previousStepIndex = -1;
      targetY = camera.position.y < 0 ? -2.3 : 1.6;
      if (z > -12) {
        targetY = 1.6;
      }
    }

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY,
      Math.min(1, delta * 6.5)
    );

    return {
      inBasementZone,
      reachedBasementFloor: inBasementZone && camera.position.y < -2.0,
    };
  }

  return {
    group: stairs,
    stairLight: dimStairLight,
    update,
  };
}
