import * as THREE from "three";

const WHISPER_PATH = "/assets/audio/whisper.mp3";
const BASE_WHISPER_VOLUME = 0.15;
const WHISPER_COOLDOWN_MS = 12000;
const DISTANCE_FALLOFF_THRESHOLD = 8;

export function createAudioSystem(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const whisperSound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();

  let whisperReady = false;
  let lastWhisperTime = -Infinity;

  audioLoader.load(
    WHISPER_PATH,
    (buffer) => {
      whisperSound.setBuffer(buffer);
      whisperSound.setLoop(false);
      whisperSound.setVolume(BASE_WHISPER_VOLUME);
      whisperReady = true;
    },
    undefined,
    (error) => {
      console.warn("Whisper audio failed to load:", error);
    }
  );

  function resolveVolume(distanceToMirror) {
    if (!Number.isFinite(distanceToMirror) || distanceToMirror <= DISTANCE_FALLOFF_THRESHOLD) {
      return BASE_WHISPER_VOLUME;
    }

    // Keep attenuation subtle so the whisper remains audible but quieter.
    const attenuation = THREE.MathUtils.clamp(
      DISTANCE_FALLOFF_THRESHOLD / distanceToMirror,
      0.7,
      1
    );

    return BASE_WHISPER_VOLUME * attenuation;
  }

  function triggerWhisper(distanceToMirror = Infinity) {
    const now = performance.now();

    if (!whisperReady || !whisperSound.buffer) {
      return false;
    }

    if (now - lastWhisperTime < WHISPER_COOLDOWN_MS) {
      return false;
    }

    // Attempt to resume Web Audio context after user gesture-driven interactions.
    if (listener.context.state === "suspended") {
      listener.context.resume().catch(() => {});
    }

    if (whisperSound.isPlaying) {
      whisperSound.stop();
    }

    whisperSound.setVolume(resolveVolume(distanceToMirror));

    const randomStartLimit = whisperSound.buffer.duration * 0.8;
    whisperSound.offset = Math.random() * Math.max(0, randomStartLimit);
    whisperSound.play();

    lastWhisperTime = now;
    return true;
  }

  return {
    listener,
    triggerWhisper,
  };
}
