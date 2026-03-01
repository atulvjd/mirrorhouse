import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

export function createRenderer() {
  const container = document.getElementById("game");

  if (!container) {
    throw new Error("Game container '#game' was not found.");
  }

  // Create and configure the WebGL renderer.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4; // Corrected for maximum visibility
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Attach canvas to the game mount point.
  container.appendChild(renderer.domElement);

  // Post-processing setup
  const composer = new EffectComposer(renderer);
  
  const setupComposer = (scene, camera) => {
    composer.passes = []; // Clear existing passes
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Subtle Unreal Bloom for lantern glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.25, // strength
      0.5,  // radius
      0.8   // threshold
    );
    composer.addPass(bloomPass);

    // Film Grain for psychological texture
    const filmPass = new FilmPass(
      0.15, // noise intensity
      0,    // scanlines intensity
      0,    // scanlines count
      false // grayscale
    );
    composer.addPass(filmPass);

    // Custom Vignette Shader
    const vignetteShader = {
      uniforms: {
        "tDiffuse": { value: null },
        "offset": { value: 1.0 },
        "darkness": { value: 1.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float offset;
        uniform float darkness;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - 0.5) * 2.0;
          gl_FragColor = vec4(texel.rgb * mix(1.0, 1.0 - darkness, dot(uv, uv) * offset), texel.a);
        }
      `
    };
    const vignettePass = new ShaderPass(vignetteShader);
    composer.addPass(vignettePass);
  };

  // Keep renderer size synced with the browser window.
  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    renderer,
    composer,
    setupComposer
  };
}
