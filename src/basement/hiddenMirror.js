import * as THREE from "three";

export function createHiddenMirror(parentGroup) {
  // Dimensions: 1.4m wide, 2.4m long
  const mirrorGeo = new THREE.PlaneGeometry(1.4, 2.4, 64, 64);
  
  // Custom Shader Material for realistic but slightly unnatural reflections
  const mirrorMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xffffff) },
      uDistortionIntensity: { value: 0.0 } // Increases during the grab sequence
    },
    vertexShader: `
      uniform float uTime;
      uniform float uDistortionIntensity;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Very faint ripple shader on surface
        float dist = distance(uv, vec2(0.5));
        pos.z += sin(dist * 20.0 - uTime * 2.0) * 0.01 * (1.0 + uDistortionIntensity * 50.0);
        
        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDistortionIntensity;
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      // Simulating a slightly unnatural "perfect" reflection tone
      void main() {
        vec2 uv = vUv;
        
        // Chromatic aberration offset
        float offset = 0.002 * (1.0 + uDistortionIntensity * 10.0);
        
        // Procedural noise for minimal distortion
        float noise = fract(sin(dot(uv + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453) * 0.05;
        
        // Simulating the reflection brightness slightly stronger than real world
        vec3 col = vec3(0.1, 0.12, 0.15) + noise * uDistortionIntensity; // Base tone
        
        // Add artificial brightness
        col += vec3(0.05, 0.06, 0.08);

        // Edge vignette to blend with frame
        float edge = smoothstep(0.5, 0.45, distance(uv, vec2(0.5)));
        
        gl_FragColor = vec4(col * edge, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.set(0, 0.01, 0);
  parentGroup.add(mirror);

  // Victorian antique frame
  const frameGroup = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ 
      color: 0x9b7a48, // Antique gold/bronze
      roughness: 0.6,
      metalness: 0.8,
      bumpScale: 0.05
  });

  const frameWidth = 1.6;
  const frameLength = 2.6;
  const thickness = 0.1;

  // Frame pieces
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(thickness, frameLength, 0.05), frameMat);
  fLeft.position.set(-frameWidth/2 + thickness/2, 0, 0);
  
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(thickness, frameLength, 0.05), frameMat);
  fRight.position.set(frameWidth/2 - thickness/2, 0, 0);
  
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, thickness, 0.05), frameMat);
  fTop.position.set(0, frameLength/2 - thickness/2, 0);
  
  const fBottom = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, thickness, 0.05), frameMat);
  fBottom.position.set(0, -frameLength/2 + thickness/2, 0);

  frameGroup.add(fLeft, fRight, fTop, fBottom);
  frameGroup.rotation.x = -Math.PI / 2;
  frameGroup.position.set(0, 0.015, 0);
  parentGroup.add(frameGroup);

  let revealed = false;
  let time = 0;
  let liquidMode = false;

  function reveal() {
    revealed = true;
  }
  
  function triggerLiquidDistortion() {
      liquidMode = true;
  }

  function update(camera, delta) {
    if (!revealed) return;
    time += delta;
    
    mirrorMat.uniforms.uTime.value = time;
    
    if (liquidMode) {
        mirrorMat.uniforms.uDistortionIntensity.value = THREE.MathUtils.lerp(
            mirrorMat.uniforms.uDistortionIntensity.value, 
            1.0, 
            delta * 2.0
        );
    }
  }

  return {
    mesh: mirror,
    reveal,
    update,
    triggerLiquidDistortion
  };
}
