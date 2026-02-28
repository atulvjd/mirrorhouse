export function createPowerCutEvent(lights, onCut) {
  const targets = Array.isArray(lights) ? lights.filter(Boolean) : [];
  const previousIntensities = new Map();
  let triggered = false;

  for (let i = 0; i < targets.length; i += 1) {
    const light = targets[i];
    if (typeof light.intensity === "number") {
      previousIntensities.set(light, light.intensity);
    }
  }

  function trigger() {
    if (triggered) {
      return false;
    }

    triggered = true;

    for (let i = 0; i < targets.length; i += 1) {
      const light = targets[i];
      if (typeof light.intensity === "number") {
        light.intensity = 0;
      }
    }

    playPowerBuzz();

    if (typeof onCut === "function") {
      onCut();
    }

    return true;
  }

  function isTriggered() {
    return triggered;
  }

  return {
    trigger,
    isTriggered,
    previousIntensities,
  };
}

function playPowerBuzz() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(185, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.58);

    filter.type = "lowpass";
    filter.frequency.value = 420;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.62);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.66);
  } catch {
    // Best-effort audio cue only.
  }
}
