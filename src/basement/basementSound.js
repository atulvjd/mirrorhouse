export function createBasementSound() {
  let started = false;
  let context = null;
  let windGain = null;
  let dripTimer = randomBetween(1.6, 4.2);
  let creakTimer = randomBetween(4.8, 8.5);
  let stepCooldown = 0;

  function ensureStarted() {
    if (started) {
      if (context?.state === "suspended") {
        context.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    context = new AudioCtx();
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    windGain = context.createGain();
    windGain.gain.value = 0.005;
    windGain.connect(context.destination);

    const noiseSource = createNoiseSource(context);
    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 260;
    noiseSource.connect(lowpass);
    lowpass.connect(windGain);
    noiseSource.start();

    started = true;
  }

  function start() {
    ensureStarted();
  }

  function update(delta) {
    if (!started || !context) {
      return;
    }

    dripTimer -= delta;
    creakTimer -= delta;
    stepCooldown = Math.max(0, stepCooldown - delta);

    if (dripTimer <= 0) {
      playDrip(context);
      dripTimer = randomBetween(1.9, 4.8);
    }

    if (creakTimer <= 0) {
      playCeilingCreak(context);
      creakTimer = randomBetween(5.5, 10.5);
    }
  }

  function triggerStepCreak() {
    if (!started || !context || stepCooldown > 0) {
      return;
    }
    stepCooldown = 0.15;
    playStepCreak(context);
  }

  function triggerCarpetDrag() {
    if (!started || !context) {
      return;
    }

    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(170, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(68, context.currentTime + 1.1);
    filter.type = "bandpass";
    filter.frequency.value = 260;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 1.25);
  }

  function triggerMirrorRevealTone() {
    if (!started || !context) {
      return;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(82, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, context.currentTime + 1.8);
    filter.type = "lowpass";
    filter.frequency.value = 220;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.022, context.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.9);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 2);
  }

  function triggerPowerBuzz() {
    if (!started || !context) {
      return;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(48, context.currentTime + 0.55);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.024, context.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.62);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.66);
  }

  return {
    start,
    update,
    triggerStepCreak,
    triggerPowerBuzz,
    triggerCarpetDrag,
    triggerMirrorRevealTone,
  };
}

function createNoiseSource(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function playDrip(context) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(randomBetween(780, 1100), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(250, context.currentTime + 0.18);
  filter.type = "highpass";
  filter.frequency.value = 500;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.009, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.21);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.22);
}

function playCeilingCreak(context) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(randomBetween(130, 210), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(72, context.currentTime + 0.95);
  filter.type = "bandpass";
  filter.frequency.value = 350;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.07);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 1.05);
}

function playStepCreak(context) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(randomBetween(200, 280), context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(95, context.currentTime + 0.32);
  filter.type = "bandpass";
  filter.frequency.value = 420;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.012, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.38);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
