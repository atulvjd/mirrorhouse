import * as THREE from "three";

const GLITCH_COOLDOWN_MS = 15000;
const LIGHT_SPIKE_INTENSITY = 1.8;

export function createGlitchSystem(scene) {
  const pointLight =
    scene.userData.pointLight ||
    scene.children.find((child) => child instanceof THREE.PointLight);

  const cameraOffset = new THREE.Vector3();
  const desiredCameraOffset = new THREE.Vector3();
  const targetObjectPosition = new THREE.Vector3();
  const lightValue = new THREE.Vector3(pointLight?.intensity || 0, 0, 0);
  const lightTarget = new THREE.Vector3(lightValue.x, 0, 0);

  let activeGlitch = null;
  let lastGlitchTime = -Infinity;

  function trigger() {
    const now = performance.now();

    if (now - lastGlitchTime < GLITCH_COOLDOWN_MS) {
      return false;
    }

    const types = ["lightSpike", "cameraJump", "objectNudge"];
    const type = types[Math.floor(Math.random() * types.length)];
    const nextGlitch = createGlitch(type);

    if (!nextGlitch) {
      return false;
    }

    activeGlitch = nextGlitch;
    lastGlitchTime = now;
    return true;
  }

  function createGlitch(type) {
    if (type === "lightSpike") {
      return {
        type,
        duration: 0.3,
        elapsed: 0,
        baseIntensity: pointLight?.intensity || 0.8,
      };
    }

    if (type === "cameraJump") {
      return {
        type,
        duration: 0.15,
        elapsed: 0,
        jumpOffset: new THREE.Vector3(
          randomBetween(-0.03, 0.03),
          randomBetween(-0.03, 0.03),
          randomBetween(-0.03, 0.03)
        ),
      };
    }

    const nudgedMesh = pickRoomMesh();
    if (!nudgedMesh) {
      return {
        type: "lightSpike",
        duration: 0.3,
        elapsed: 0,
        baseIntensity: pointLight?.intensity || 0.8,
      };
    }

    const axis = Math.random() < 0.5 ? "x" : "z";
    const offset = new THREE.Vector3();
    offset[axis] = randomBetween(-0.05, 0.05);

    return {
      type: "objectNudge",
      duration: 0.5,
      elapsed: 0,
      mesh: nudgedMesh,
      basePosition: nudgedMesh.position.clone(),
      offset,
    };
  }

  function update(delta) {
    if (!activeGlitch) {
      settleCameraOffset(delta);
      return;
    }

    activeGlitch.elapsed += delta;
    const progress = THREE.MathUtils.clamp(
      activeGlitch.elapsed / activeGlitch.duration,
      0,
      1
    );

    if (activeGlitch.type === "lightSpike") {
      updateLightSpike(delta, progress);
    } else if (activeGlitch.type === "cameraJump") {
      updateCameraJump(delta, progress);
    } else {
      updateObjectNudge(delta, progress);
    }

    if (progress >= 1) {
      finishGlitch();
    }
  }

  function updateLightSpike(delta, progress) {
    if (!pointLight) {
      return;
    }

    const targetIntensity =
      progress < 0.35 ? LIGHT_SPIKE_INTENSITY : activeGlitch.baseIntensity;
    lightTarget.set(targetIntensity, 0, 0);
    lightValue.set(pointLight.intensity, 0, 0);
    lightValue.lerp(lightTarget, Math.min(1, 24 * delta));
    pointLight.intensity = lightValue.x;
  }

  function updateCameraJump(delta, progress) {
    const camera = scene.userData.activeCamera;
    if (!camera) {
      return;
    }

    // Remove previous frame offset, then apply current interpolated offset.
    camera.position.sub(cameraOffset);
    const blend = Math.sin(Math.PI * progress);
    desiredCameraOffset.copy(activeGlitch.jumpOffset).multiplyScalar(blend);
    cameraOffset.lerp(desiredCameraOffset, Math.min(1, 20 * delta));
    camera.position.add(cameraOffset);
  }

  function updateObjectNudge(delta, progress) {
    const { mesh, basePosition, offset } = activeGlitch;
    if (!mesh) {
      return;
    }

    const blend = Math.sin(Math.PI * progress);
    targetObjectPosition.copy(basePosition).addScaledVector(offset, blend);
    mesh.position.lerp(targetObjectPosition, Math.min(1, 16 * delta));
  }

  function settleCameraOffset(delta) {
    const camera = scene.userData.activeCamera;
    if (!camera) {
      cameraOffset.set(0, 0, 0);
      desiredCameraOffset.set(0, 0, 0);
      return;
    }

    if (cameraOffset.lengthSq() < 1e-8) {
      return;
    }

    camera.position.sub(cameraOffset);
    desiredCameraOffset.set(0, 0, 0);
    cameraOffset.lerp(desiredCameraOffset, Math.min(1, 18 * delta));
    camera.position.add(cameraOffset);
  }

  function finishGlitch() {
    if (activeGlitch?.type === "cameraJump") {
      const camera = scene.userData.activeCamera;
      if (camera) {
        camera.position.sub(cameraOffset);
        cameraOffset.lerp(new THREE.Vector3(0, 0, 0), 1);
        camera.position.add(cameraOffset);
      } else {
        cameraOffset.set(0, 0, 0);
      }
    } else if (activeGlitch?.type === "objectNudge" && activeGlitch.mesh) {
      activeGlitch.mesh.position.lerp(activeGlitch.basePosition, 1);
    }

    activeGlitch = null;
  }

  function pickRoomMesh() {
    const roomRoot = scene.getObjectByName("houseRoom");
    if (!roomRoot) {
      return null;
    }

    const meshes = [];
    roomRoot.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) {
        return;
      }

      if (obj.geometry.type === "PlaneGeometry") {
        return;
      }

      meshes.push(obj);
    });

    if (meshes.length === 0) {
      return null;
    }

    return meshes[Math.floor(Math.random() * meshes.length)];
  }

  return {
    trigger,
    update,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
