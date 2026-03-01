import * as THREE from "three";

const PHOTO_NAMES = [
  "Childhood Photo",
  "Wedding Photo",
  "Grandmother with her son",
  "Grandmother with daughter-in-law",
];

export function createPhotoSystem(drawerContentAnchor, story) {
  const group = new THREE.Group();
  group.name = "familyPhotos";
  drawerContentAnchor.add(group);

  const photoStates = [];
  const interactables = [];

  for (let i = 0; i < PHOTO_NAMES.length; i += 1) {
    const material = createPhotoMaterial(randomTint());
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.21), material);

    const row = Math.floor(i / 2);
    const col = i % 2;
    photo.position.set(
      -0.1 + col * 0.2 + randomBetween(-0.02, 0.02),
      0.02 + row * 0.01,
      -0.1 - row * 0.1 + randomBetween(-0.02, 0.01)
    );
    photo.rotation.x = -Math.PI * 0.5;
    photo.rotation.z = randomBetween(-0.26, 0.26);
    photo.userData.inspectType = "photo";
    photo.userData.inspectPrompt = "Press E to inspect";
    group.add(photo);

    const state = {
      mesh: photo,
      material,
      inspectPulse: 0,
      label: PHOTO_NAMES[i],
    };
    photoStates.push(state);

    interactables.push({
      object: photo,
      callback: () => inspectPhoto(state, story),
    });
  }

  let elapsed = 0;

  function update(delta) {
    elapsed += delta;
    for (let i = 0; i < photoStates.length; i += 1) {
      const state = photoStates[i];
      state.inspectPulse = Math.max(0, state.inspectPulse - delta * 0.45);
      state.material.uniforms.uInspect.value = 0.15 + state.inspectPulse * 0.85;
      state.material.uniforms.uTime.value = elapsed;
    }
  }

  return {
    group,
    interactables,
    update,
  };
}

function inspectPhoto(state, story) {
  state.inspectPulse = 1;

  if (!story || story.isActive()) {
    return;
  }

  story.showMemory(
    `${state.label}\n\nThey are all smiling...\nBut their eyes look incredibly tired.\nThe smiles look slightly forced.`
  );
}

function createPhotoMaterial(tint) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTone: { value: tint },
      uInspect: { value: 0.15 },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uTone;
      uniform float uInspect;
      uniform float uTime;
      varying vec2 vUv;

      float circle(vec2 uv, vec2 center, float radius) {
        return smoothstep(radius, radius - 0.02, distance(uv, center));
      }

      void main() {
        vec2 uv = vUv;
        float grain = (sin(uv.x * 90.0 + uTime * 0.6) + cos(uv.y * 80.0 - uTime * 0.45)) * 0.015;

        vec3 base = mix(vec3(0.26, 0.20, 0.16), vec3(0.58, 0.49, 0.34), uv.y);
        base *= uTone;

        float face = circle(uv, vec2(0.5, 0.58), 0.22);
        base = mix(base, base + vec3(0.09, 0.07, 0.04), face * 0.8);

        float leftEye = circle(uv, vec2(0.43, 0.63), 0.03);
        float rightEye = circle(uv, vec2(0.57, 0.63), 0.03);
        base = mix(base, vec3(0.16, 0.12, 0.1), (leftEye + rightEye) * 0.9);

        float leftDarkCircle = circle(uv, vec2(0.43, 0.60), 0.055);
        float rightDarkCircle = circle(uv, vec2(0.57, 0.60), 0.055);
        float eyeFatigue = (leftDarkCircle + rightDarkCircle) * (0.32 + uInspect * 0.45);
        base -= vec3(eyeFatigue * 0.3, eyeFatigue * 0.2, eyeFatigue * 0.16);

        float smile = smoothstep(0.016, 0.002, abs((uv.y - 0.52) - (uv.x - 0.5) * (uv.x - 0.5) * 0.8));
        base += vec3(0.03, 0.02, 0.01) * smile;

        float vignette = smoothstep(0.78, 0.28, distance(uv, vec2(0.5)));
        base *= vignette;
        base += grain;

        gl_FragColor = vec4(base, 1.0);
      }
    `,
  });
}

function randomTint() {
  const base = new THREE.Color(0xe7d7b3);
  base.offsetHSL(
    randomBetween(-0.02, 0.02),
    randomBetween(-0.08, 0.04),
    randomBetween(-0.12, 0.05)
  );
  return base;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
