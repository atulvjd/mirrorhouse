import * as THREE from "three";
import { mirrorText } from "../mirrorWorld/text/mirrorTextGenerator.js";

const MESSAGE_MAP = [
  "The key is not here.",
  "You are not meant to stay.",
  "Your grandmother tried to warn you.",
  "The mirror world reflects the past.",
  "The key lies in the maiden home.",
  "The house with orchids remembers.",
];

export function createVanishingMessageSystem(scene) {
  const group = new THREE.Group();
  group.name = "vanishingMessages";
  scene.add(group);

  const messages = [];
  let finalTriggered = false;
  let finalElement = null;

  function createMessage(text, position) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.42),
      new THREE.MeshBasicMaterial({
        color: 0xded4bd,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    plane.position.copy(position);
    plane.lookAt(position.clone().add(new THREE.Vector3(0, 0, 1)));
    plane.rotateY(Math.PI);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 15, 15, 0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f1e1d2";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(mirrorText(text.toUpperCase()), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.35),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        depthTest: false,
      })
    );
    decal.position.copy(position).add(new THREE.Vector3(0, 0, 0.01));
    decal.lookAt(position.clone().add(new THREE.Vector3(0, 0, 1)));
    decal.rotateY(Math.PI);
    group.add(plane);
    group.add(decal);

    const dust = createDust(decal.position);

    messages.push({
      text,
      plane,
      decal,
      dust,
      fade: 0,
      state: "visible",
      triggered: false,
    });
  }

  function update(delta, playerPosition) {
    for (const message of messages) {
      if (message.state !== "visible") {
        continue;
      }

      const distance = message.plane.position.distanceTo(playerPosition);
      if (distance < 2) {
        message.triggered = true;
      }

      if (message.triggered) {
        message.fade += delta / 0.6;
        const alpha = Math.max(0, 1 - message.fade);
        message.plane.material.opacity = alpha;
        message.decal.material.opacity = alpha * 0.95;
        updateDust(message.dust, delta);

        if (message.fade >= 1) {
          message.state = "vanished";
          message.plane.visible = false;
          message.decal.visible = false;
          message.dust.visible = false;
        }
      }
    }

    if (allVanished() && !finalTriggered) {
      finalTriggered = true;
      triggerFinalMessage();
    }
  }

  function allVanished() {
    return messages.every((entry) => entry.state === "vanished");
  }

  function triggerFinalMessage() {
    playWhisper();
    finalElement = document.createElement("div");
    finalElement.textContent = "Find the house with orchids.";
    Object.assign(finalElement.style, {
      position: "fixed",
      inset: "auto",
      top: "24%",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "0.8rem 1.2rem",
      background: "rgba(10, 10, 12, 0.85)",
      color: "#f9f4e5",
      fontFamily: "Georgia, 'Times New Roman', serif",
      letterSpacing: "0.08em",
      border: "2px solid rgba(255,255,255,0.2)",
      opacity: "0",
      transition: "opacity 1s ease",
      zIndex: "65",
    });
    document.body.appendChild(finalElement);
    requestAnimationFrame(() => {
      finalElement.style.opacity = "1";
    });
    setTimeout(() => {
      finalElement.style.opacity = "0";
      setTimeout(() => finalElement.remove(), 1100);
    }, 4200);
  }

  function createDust(origin) {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      positions[idx] = origin.x + (Math.random() - 0.5) * 0.4;
      positions[idx + 1] = origin.y + Math.random() * 0.2;
      positions[idx + 2] = origin.z + (Math.random() - 0.5) * 0.1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xf4ece1,
      transparent: true,
      opacity: 0,
    });
    const points = new THREE.Points(geometry, material);
    points.visible = false;
    group.add(points);
    return points;
  }

  function updateDust(points, delta) {
    if (!points || points.material.opacity > 0.4) {
      points.visible = true;
    }
    points.material.opacity = Math.min(0.45, points.material.opacity + delta * 0.6);
    const positions = points.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += delta * 0.04;
    }
    points.geometry.attributes.position.needsUpdate = true;
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(55, ctx.currentTime + 1.8);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.015, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.7);
    } catch {
      // fallback not critical
    }
  }

  MESSAGE_MAP.forEach((value, index) => {
    const position = new THREE.Vector3(1.2 - index * 0.7, -1.7, -17.4 - index * 0.6);
    createMessage(value, position);
  });

  return {
    update,
  };
}
