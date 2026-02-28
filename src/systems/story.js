import { createMemoryOverlay } from "../ui/overlay.js";

export function createStorySystem(options = {}) {
  const { fragments } = options;
  const memoryOverlay = createMemoryOverlay();
  let memoryActive = false;

  function closeMemory() {
    if (!memoryActive) {
      return;
    }

    memoryActive = false;
    memoryOverlay.hide();
  }

  function showMemory(text) {
    memoryActive = true;
    memoryOverlay.show(text);

    if (fragments?.showFragment) {
      const snippet = Array.isArray(text) ? text[0] : text || "";
      fragments.showFragment(snippet, 3200);
    }

    // Ensure the player can read without mouse-look capture.
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  function isActive() {
    return memoryActive;
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && memoryActive) {
      event.preventDefault();
      closeMemory();
    }
  });

  // Block click-through while reading so pointer lock is not re-enabled.
  window.addEventListener(
    "click",
    (event) => {
      if (!memoryActive) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  return {
    showMemory,
    isActive,
  };
}
