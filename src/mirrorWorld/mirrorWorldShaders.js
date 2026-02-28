import * as THREE from "three";

export function createMirrorWorldShaders(camera) {
  const uniforms = {
    time: { value: 0 },
    opacity: { value: 0.28 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float opacity;

      float rand(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        float wobble = sin(time * 1.7) * 0.002;
        uv.x += wobble + rand(uv + time) * 0.001;
        uv.y += cos(time * 1.3) * 0.0012;

        float aberr = sin(time * 5.1) * 0.004;
        float glitch = step(0.98, fract(time * 0.5)) * 0.015;
        float lens = sin(length(uv - vec2(0.5)) * 2.6);

        vec3 color = vec3(0.06, 0.02, 0.12);
        color.r += aberr + glitch;
        color.b += -aberr * 0.4;
        color *= 1.0 - lens * 0.2;

        gl_FragColor = vec4(color, opacity * (0.6 + lens * 0.4));
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  quad.renderOrder = 999;
  quad.position.set(0, 0, -0.5);
  camera.add(quad);

  function update(delta) {
    uniforms.time.value += delta;
    uniforms.opacity.value = 0.28 + 0.06 * Math.sin(uniforms.time.value * 0.9);
  }

  return {
    update,
  };
}
