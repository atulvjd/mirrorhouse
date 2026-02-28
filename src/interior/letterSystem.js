import * as THREE from "three";

const LETTER_TEXT = `Return the key.
Do not look at yourself in the basement mirror after midnight.
The surface is thinner than it appears.`;

export function createLetterSystem(drawerContentAnchor) {
  const group = new THREE.Group();
  group.name = "mysteriousLetter";
  drawerContentAnchor.add(group);

  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.014, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0xd8ccb4,
      roughness: 0.96,
      metalness: 0,
    })
  );
  paper.position.set(0.19, 0.02, -0.19);
  paper.rotation.y = randomBetween(-0.3, 0.3);
  paper.rotation.x = randomBetween(-0.1, 0.1);
  paper.castShadow = true;
  paper.receiveShadow = true;
  paper.userData.inspectType = "letter";
  paper.userData.inspectPrompt = "Press E to inspect";
  group.add(paper);

  const overlay = document.createElement("div");
  const panel = document.createElement("div");
  const text = document.createElement("p");

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.display = "none";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.background = "rgba(7, 6, 5, 0.68)";
  overlay.style.zIndex = "65";

  panel.style.width = "min(720px, 88vw)";
  panel.style.padding = "1.6rem 1.8rem";
  panel.style.border = "1px solid rgba(235, 220, 190, 0.22)";
  panel.style.background =
    "linear-gradient(160deg, rgba(44,34,27,0.88), rgba(22,18,15,0.93))";
  panel.style.boxShadow = "0 14px 38px rgba(0, 0, 0, 0.62)";
  panel.style.opacity = "0";
  panel.style.transform = "translateY(6px)";
  panel.style.transition = "opacity 0.65s ease, transform 0.65s ease";

  text.textContent = LETTER_TEXT;
  text.style.margin = "0";
  text.style.whiteSpace = "pre-line";
  text.style.color = "#ead9bc";
  text.style.fontFamily = "'Brush Script MT', 'Lucida Handwriting', cursive";
  text.style.fontSize = "clamp(24px, 3.2vw, 36px)";
  text.style.lineHeight = "1.3";
  text.style.letterSpacing = "0.02em";
  text.style.textShadow = "0 0 7px rgba(90, 70, 48, 0.35)";

  panel.appendChild(text);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  let active = false;

  function showLetter() {
    if (active) {
      return;
    }

    active = true;
    overlay.style.display = "flex";
    panel.style.opacity = "0";
    panel.style.transform = "translateY(6px)";

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    requestAnimationFrame(() => {
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0)";
    });
  }

  function closeLetter() {
    if (!active) {
      return;
    }

    active = false;
    panel.style.opacity = "0";
    panel.style.transform = "translateY(6px)";
    window.setTimeout(() => {
      if (!active) {
        overlay.style.display = "none";
      }
    }, 280);
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && active) {
      event.preventDefault();
      closeLetter();
    }
  });

  window.addEventListener(
    "click",
    (event) => {
      if (!active) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  return {
    group,
    interactables: [
      {
        object: paper,
        callback: showLetter,
      },
    ],
    isActive() {
      return active;
    },
    close: closeLetter,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
