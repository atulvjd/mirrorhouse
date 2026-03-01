import * as THREE from "three";

export function createCityExplorationManager(scene, camera) {
  // Add volumetric-like fog elements for streets
  const fogParticles = [];
  const fogGeo = new THREE.PlaneGeometry(10, 10);
  const fogMat = new THREE.MeshBasicMaterial({
    color: 0x3a4b66,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < 20; i++) {
    const p = new THREE.Mesh(fogGeo, fogMat);
    p.position.set((Math.random() - 0.5) * 60, 2, (Math.random() - 0.5) * 60);
    p.rotation.y = Math.random() * Math.PI;
    scene.add(p);
    fogParticles.push({ mesh: p, speed: 0.2 + Math.random() * 0.3 });
  }

  // Audio system (simulated via Web Audio API or placeholders)
  let audioContext = null;
  let windGain = null;
  let bellGain = null;
  let bellTimer = 10;
  
  function initAudio() {
      try {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          windGain = audioContext.createGain();
          windGain.gain.value = 0.05;
          windGain.connect(audioContext.destination);
          
          bellGain = audioContext.createGain();
          bellGain.gain.value = 0.0;
          bellGain.connect(audioContext.destination);
          
          // Generate simple wind noise
          const bufferSize = audioContext.sampleRate * 2;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
              data[i] = (Math.random() * 2 - 1) * 0.5;
          }
          const noiseSource = audioContext.createBufferSource();
          noiseSource.buffer = buffer;
          noiseSource.loop = true;
          
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;
          
          noiseSource.connect(filter);
          filter.connect(windGain);
          noiseSource.start();
      } catch (e) {
          // Audio setup failed
      }
  }

  function playBell() {
      if (!audioContext) return;
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 3);
      
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);
      
      osc.connect(gain);
      gain.connect(bellGain);
      osc.start();
      osc.stop(audioContext.currentTime + 3);
  }

  // Init audio on first update (to satisfy browser autoplay rules)
  let audioInitialized = false;

  function update(delta, time) {
      if (!audioInitialized) {
          initAudio();
          audioInitialized = true;
      }
      
      // Update street fog
      fogParticles.forEach(p => {
          p.mesh.position.x += p.speed * delta;
          if (p.mesh.position.x > 30) p.mesh.position.x = -30;
          p.mesh.lookAt(camera.position); // Billboard effect
      });

      // Ambient bells
      bellTimer -= delta;
      if (bellTimer <= 0) {
          playBell();
          bellTimer = 20 + Math.random() * 20; // Every 20-40 seconds
      }
  }

  return { update };
}
