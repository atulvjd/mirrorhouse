import * as THREE from "three";

export function createDrawerSystem(drawerRoot, contentAnchor) {
  drawerRoot.userData.inspectType = "drawer";
  drawerRoot.userData.inspectPrompt = "Press E to inspect";

  const startPosition = drawerRoot.position.clone();
  const openPosition = startPosition.clone();
  openPosition.z += 0.44;

  let openRequested = false;
  let opened = false;
  let progress = 0;
  let soundPlayed = false;

  function open() {
    if (opened || openRequested) {
      return;
    }

    openRequested = true;
  }

  function update(delta) {
    if (!openRequested) {
      return;
    }

    const previous = progress;
    progress = THREE.MathUtils.clamp(progress + delta / 0.6, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    drawerRoot.position.lerpVectors(startPosition, openPosition, eased);

    if (!soundPlayed && progress > 0.05) {
      soundPlayed = true;
      playDrawerCreak();
    }

    if (previous < 1 && progress >= 1) {
      opened = true;
    }
  }

  return {
    open,
    update,
    isOpen() {
      return opened;
    },
    getInteractable() {
      return {
        object: drawerRoot,
        callback: open,
      };
    },
    getContentAnchor() {
      return contentAnchor;
    },
  };
}

function playDrawerCreak() {
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
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.52);

    filter.type = "bandpass";
    filter.frequency.value = 520;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.58);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.62);
  } catch {
    // Ignore audio startup failures in restricted contexts.
  }
}
