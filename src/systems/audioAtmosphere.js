import * as THREE from "three";

const AMBIENT_BASE_VOLUME = 0.08;
const AMBIENT_MOD_DEPTH = 0.015;

const DISTANT_WHISPER_BASE_VOLUME = 0.05;
const DISTANT_WHISPER_MIN_TIMER = 15;
const DISTANT_WHISPER_MAX_TIMER = 40;

const DISTANT_EVENT_MIN_TIMER = 20;
const DISTANT_EVENT_MAX_TIMER = 60;

const MIRROR_DISTORT_VOLUME = 0.15;

export function createAudioAtmosphere(camera) {
  const listener = findOrCreateListener(camera);
  const loader = new THREE.AudioLoader();

  const ambientSound = new THREE.Audio(listener);
  const distantWhisperSound = new THREE.Audio(listener);
  const heartbeatSound = new THREE.Audio(listener);
  const mirrorDistortSound = new THREE.Audio(listener);
  const distantEventSound = new THREE.Audio(listener);

  const distantEventBuffers = [];

  let ambientReady = false;
  let whisperReady = false;
  let heartbeatReady = false;
  let mirrorDistortReady = false;

  let elapsed = 0;
  let entityDistance = Infinity;
  let whisperTimer = randomBetween(
    DISTANT_WHISPER_MIN_TIMER,
    DISTANT_WHISPER_MAX_TIMER
  );
  let distantEventTimer = randomBetween(
    DISTANT_EVENT_MIN_TIMER,
    DISTANT_EVENT_MAX_TIMER
  );

  const whisperPanner = createStereoPannerNode(listener, distantWhisperSound);

  loadLoopedSound(loader, "/assets/audio/ambient_room.mp3", ambientSound, () => {
    ambientSound.setVolume(AMBIENT_BASE_VOLUME);
    ambientReady = true;
    playIfReady(ambientSound, listener);
  });

  loadOneShot(loader, "/assets/audio/distant_whisper.mp3", distantWhisperSound, () => {
    whisperReady = true;
  });

  loadLoopedSound(loader, "/assets/audio/heartbeat.mp3", heartbeatSound, () => {
    heartbeatSound.setVolume(0);
    heartbeatReady = true;
    playIfReady(heartbeatSound, listener);
  });

  loadOneShot(loader, "/assets/audio/mirror_distort.mp3", mirrorDistortSound, () => {
    mirrorDistortReady = true;
  });

  loadOneShot(loader, "/assets/audio/creak1.mp3", distantEventSound, () => {
    distantEventBuffers.push(distantEventSound.buffer);
  });
  loadBuffer(loader, "/assets/audio/creak2.mp3", (buffer) => {
    distantEventBuffers.push(buffer);
  });
  loadBuffer(loader, "/assets/audio/soft_hit.mp3", (buffer) => {
    distantEventBuffers.push(buffer);
  });

  function update(delta) {
    elapsed += delta;

    if (ambientReady) {
      const ambientVolume =
        AMBIENT_BASE_VOLUME + Math.sin(elapsed * 0.15) * AMBIENT_MOD_DEPTH;
      ambientSound.setVolume(Math.max(0, ambientVolume));
      playIfReady(ambientSound, listener);
    }

    if (heartbeatReady) {
      const heartbeatTarget = resolveHeartbeatVolume(entityDistance);
      const nextVolume = THREE.MathUtils.lerp(
        heartbeatSound.getVolume(),
        heartbeatTarget,
        Math.min(1, 3.5 * delta)
      );
      heartbeatSound.setVolume(nextVolume);
      playIfReady(heartbeatSound, listener);
    }

    whisperTimer -= delta;
    if (whisperTimer <= 0) {
      triggerDistantWhisper();
      whisperTimer = randomBetween(
        DISTANT_WHISPER_MIN_TIMER,
        DISTANT_WHISPER_MAX_TIMER
      );
    }

    distantEventTimer -= delta;
    if (distantEventTimer <= 0) {
      triggerDistantEvent();
      distantEventTimer = randomBetween(
        DISTANT_EVENT_MIN_TIMER,
        DISTANT_EVENT_MAX_TIMER
      );
    }
  }

  function triggerMirrorDistortion() {
    if (!mirrorDistortReady || !mirrorDistortSound.buffer) {
      return false;
    }

    if (mirrorDistortSound.isPlaying) {
      mirrorDistortSound.stop();
    }

    resumeIfSuspended(listener);
    mirrorDistortSound.setPlaybackRate(randomBetween(0.96, 1.05));
    mirrorDistortSound.setVolume(MIRROR_DISTORT_VOLUME);
    mirrorDistortSound.offset = Math.random() * (mirrorDistortSound.buffer.duration * 0.7);
    mirrorDistortSound.play();
    return true;
  }

  function triggerDistantEvent() {
    if (distantEventBuffers.length === 0 || distantEventSound.isPlaying) {
      return false;
    }

    const buffer =
      distantEventBuffers[Math.floor(Math.random() * distantEventBuffers.length)];

    if (!buffer) {
      return false;
    }

    distantEventSound.setBuffer(buffer);
    distantEventSound.setLoop(false);
    distantEventSound.setVolume(randomBetween(0.04, 0.07));
    distantEventSound.setPlaybackRate(randomBetween(0.96, 1.04));
    distantEventSound.offset = Math.random() * Math.max(0, buffer.duration * 0.5);
    resumeIfSuspended(listener);
    distantEventSound.play();
    return true;
  }

  function triggerDistantWhisper() {
    if (!whisperReady || !distantWhisperSound.buffer || distantWhisperSound.isPlaying) {
      return false;
    }

    distantWhisperSound.setVolume(DISTANT_WHISPER_BASE_VOLUME);
    distantWhisperSound.setPlaybackRate(randomBetween(0.94, 1.06));
    distantWhisperSound.offset =
      Math.random() * Math.max(0, distantWhisperSound.buffer.duration * 0.65);

    if (whisperPanner) {
      whisperPanner.pan.value = randomBetween(-0.35, 0.35);
    }

    resumeIfSuspended(listener);
    distantWhisperSound.play();
    return true;
  }

  function setEntityDistance(distance) {
    entityDistance = Number.isFinite(distance) ? Math.max(0, distance) : Infinity;
  }

  return {
    update,
    triggerMirrorDistortion,
    triggerDistantEvent,
    setEntityDistance,
  };
}

function findOrCreateListener(camera) {
  for (const child of camera.children) {
    if (child instanceof THREE.AudioListener) {
      return child;
    }
  }

  const listener = new THREE.AudioListener();
  camera.add(listener);
  return listener;
}

function loadLoopedSound(loader, path, audio, onLoad) {
  loader.load(
    path,
    (buffer) => {
      audio.setBuffer(buffer);
      audio.setLoop(true);
      onLoad();
    },
    undefined,
    (error) => {
      console.warn(`Failed to load looped audio: ${path}`, error);
    }
  );
}

function loadOneShot(loader, path, audio, onLoad) {
  loader.load(
    path,
    (buffer) => {
      audio.setBuffer(buffer);
      audio.setLoop(false);
      onLoad();
    },
    undefined,
    (error) => {
      console.warn(`Failed to load one-shot audio: ${path}`, error);
    }
  );
}

function loadBuffer(loader, path, onLoad) {
  loader.load(
    path,
    (buffer) => {
      onLoad(buffer);
    },
    undefined,
    (error) => {
      console.warn(`Failed to load audio buffer: ${path}`, error);
    }
  );
}

function playIfReady(audio, listener) {
  if (!audio.buffer || audio.isPlaying) {
    return;
  }

  resumeIfSuspended(listener);
  audio.play();
}

function resumeIfSuspended(listener) {
  if (listener.context.state === "suspended") {
    listener.context.resume().catch(() => {});
  }
}

function resolveHeartbeatVolume(distance) {
  if (distance > 6) {
    return 0;
  }

  if (distance > 4) {
    return 0.05;
  }

  if (distance > 2) {
    return 0.12;
  }

  return 0.2;
}

function createStereoPannerNode(listener, audio) {
  const context = listener.context;
  if (typeof context.createStereoPanner !== "function") {
    return null;
  }

  const panner = context.createStereoPanner();
  audio.setFilter(panner);
  return panner;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
