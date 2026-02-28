import * as THREE from "three";
import { createCitizenModel } from "./citizenFactory.js";
import { createCitizenBehavior } from "./citizenBehavior.js";
import { createShadowSystem } from "./shadowSystem.js";
import { getRandomDialogue } from "./citizenDialogue.js";

const DEFAULT_SPAWN_POINTS = [
  new THREE.Vector3(-2.4, -2.75, -2.6),
  new THREE.Vector3(2.6, -2.75, -2.4),
  new THREE.Vector3(-4.8, -2.75, -4.4),
  new THREE.Vector3(4.8, -2.75, -4.1),
  new THREE.Vector3(0, -2.75, -6.2),
  new THREE.Vector3(-1.2, -2.75, -7.5),
];

export function createCitizenSystem(scene, spawnPoints = DEFAULT_SPAWN_POINTS) {
  const shadowSystem = createShadowSystem(scene);
  const citizens = [];

  const dialogueEl = document.createElement("div");
  dialogueEl.style.position = "fixed";
  dialogueEl.style.bottom = "18%";
  dialogueEl.style.left = "50%";
  dialogueEl.style.transform = "translateX(-50%)";
  dialogueEl.style.padding = "0.65rem 1.1rem";
  dialogueEl.style.background = "rgba(7, 7, 12, 0.6)";
  dialogueEl.style.border = "1px solid rgba(255, 255, 255, 0.3)";
  dialogueEl.style.color = "#f9f5ec";
  dialogueEl.style.fontFamily = "monospace";
  dialogueEl.style.fontSize = "0.95rem";
  dialogueEl.style.opacity = "0";
  dialogueEl.style.pointerEvents = "none";
  dialogueEl.style.transition = "opacity 0.3s ease";
  dialogueEl.style.zIndex = "60";
  document.body.appendChild(dialogueEl);

  let dialogueTimeout = null;

  for (const point of spawnPoints) {
    const model = createCitizenModel();
    model.group.position.copy(point);
    model.group.visible = true;
    scene.add(model.group);

    const shadow = shadowSystem.createShadow();
    shadow.position.copy(point);
    shadow.mesh.position.y = -2.88;

    const behavior = createCitizenBehavior(shadow, point);

    citizens.push({
      group: model.group,
      head: model.head,
      behavior,
      shadow,
      lastSpeakDelay: randomBetween(4, 8),
    });
  }

  function update(camera, delta) {
    const playerShadowNormal = true;

    for (const citizen of citizens) {
      citizen.behavior.update(
        citizen,
        camera,
        delta,
        (line, longerStare) => triggerDialogue(line, longerStare),
        playerShadowNormal,
        citizen.shadow
      );
      shadowSystem.updateShadow(citizen.shadow, delta);
      citizen.lastSpeakDelay -= delta;
      if (citizen.lastSpeakDelay <= 0) {
        speakLine(citizen);
        citizen.lastSpeakDelay = randomBetween(6, 14);
      }
    }
  }

  function triggerDialogue(text, longerStare) {
    if (!text) {
      return;
    }
    dialogueEl.textContent = text;
    dialogueEl.style.opacity = "1";
    if (dialogueTimeout) {
      clearTimeout(dialogueTimeout);
    }
    dialogueTimeout = window.setTimeout(() => {
      dialogueEl.style.opacity = "0";
    }, longerStare ? 3200 : 2200);
    playWhisper();
  }

  function speakLine(citizen) {
    const line = getRandomDialogue();
    triggerDialogue(line, false);
  }

  function playWhisper() {
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(randomBetween(280, 360), ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        randomBetween(180, 220),
        ctx.currentTime + 0.65
      );
      filter.type = "bandpass";
      filter.frequency.value = 420;
      filter.Q.value = 1.2;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.007, ctx.currentTime + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.33);
    } catch {
      // best effort
    }
  }

  return {
    update,
    focusAttention(position) {
      const dir = new THREE.Vector3();
      for (const citizen of citizens) {
        citizen.behavior.state = "stare";
        citizen.behavior.stareTimer = randomBetween(2.5, 4.6);
        citizen.shadow.target.copy(position);
        dir.subVectors(position, citizen.group.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.01) {
          dir.normalize();
          const quat = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            dir
          );
          citizen.head.quaternion.copy(quat);
        }
      }
    },
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
