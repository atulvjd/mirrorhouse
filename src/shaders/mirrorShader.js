import * as THREE from "three";

let mirrorMaterial = null;
let shaderTime = 0;
let glitchIntensity = 0;

export function createMirrorShaderMaterial() {
  if (mirrorMaterial) {
    return mirrorMaterial;
  }

  const baseTexture = createMirrorTexture();

  mirrorMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: shaderTime },
      glitchIntensity: { value: glitchIntensity },
      mirrorTexture: { value: baseTexture },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float glitchIntensity;

      void main() {
        vUv = uv;

        vec3 transformed = position;
        float wavePrimary = sin(position.y * 8.0 + time * 2.0) * 0.01;
        float waveSecondary = cos(position.x * 6.0 + time * 1.5) * 0.004;

        transformed.x += wavePrimary * (1.0 + glitchIntensity * 1.5);
        transformed.y += waveSecondary * (0.6 + glitchIntensity);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float glitchIntensity;
      uniform sampler2D mirrorTexture;

      vec2 clampUv(vec2 uv) {
        return clamp(uv, vec2(0.001), vec2(0.999));
      }

      void main() {
        float pulse = 0.5 + 0.5 * sin(time * 18.0);
        float dynamicGlitch = glitchIntensity * (0.55 + 0.45 * pulse);

        vec2 uv = vUv;
        float waveX = sin(uv.y * 20.0 + time * 1.9) * (0.0015 + dynamicGlitch * 0.005);
        float waveY = cos(uv.x * 12.0 + time * 1.4) * (0.0008 + dynamicGlitch * 0.0025);
        uv += vec2(waveX, waveY);

        float rgbShift = 0.002 + dynamicGlitch * 0.006;
        float jitter = sin(uv.y * 120.0 + time * 35.0) * dynamicGlitch * 0.002;

        vec3 color;
        color.r = texture2D(mirrorTexture, clampUv(uv + vec2(rgbShift + jitter, 0.0))).r;
        color.g = texture2D(mirrorTexture, clampUv(uv)).g;
        color.b = texture2D(mirrorTexture, clampUv(uv - vec2(rgbShift - jitter, 0.0))).b;

        float vignette = smoothstep(1.2, 0.2, distance(vUv, vec2(0.5)));
        color *= mix(0.6, 1.0, vignette);
        color *= 0.75;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  return mirrorMaterial;
}

export function triggerMirrorGlitchPulse(amount = 0.35) {
  glitchIntensity = Math.min(1, glitchIntensity + amount);

  if (mirrorMaterial) {
    mirrorMaterial.uniforms.glitchIntensity.value = glitchIntensity;
  }
}

export function updateMirrorShader(delta = 1 / 60) {
  shaderTime += delta;
  glitchIntensity = Math.max(0, glitchIntensity - delta * 0.55);

  if (!mirrorMaterial) {
    return;
  }

  mirrorMaterial.uniforms.time.value = shaderTime;
  mirrorMaterial.uniforms.glitchIntensity.value = glitchIntensity;
}

function createMirrorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const fallback = new THREE.DataTexture(
      new Uint8Array([32, 36, 44, 255]),
      1,
      1,
      THREE.RGBAFormat
    );
    fallback.needsUpdate = true;
    return fallback;
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#3b434f");
  gradient.addColorStop(0.55, "#262b34");
  gradient.addColorStop(1, "#12151a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add very subtle texture noise so the mirror has a living surface.
  for (let i = 0; i < 1400; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const alpha = Math.random() * 0.08;

    ctx.fillStyle = `rgba(210, 220, 255, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  for (let i = 0; i < 22; i += 1) {
    const y = Math.random() * canvas.height;
    const alpha = Math.random() * 0.04;
    ctx.fillStyle = `rgba(190, 205, 255, ${alpha})`;
    ctx.fillRect(0, y, canvas.width, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  return texture;
}
