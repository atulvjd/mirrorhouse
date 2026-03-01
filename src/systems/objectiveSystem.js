export function createObjectiveSystem() {
  const objectiveEl = document.createElement("div");
  objectiveEl.style.position = "fixed";
  objectiveEl.style.top = "20px";
  objectiveEl.style.left = "20px";
  objectiveEl.style.color = "rgba(200, 200, 200, 0.6)";
  objectiveEl.style.fontFamily = "'Courier New', monospace";
  objectiveEl.style.fontSize = "14px";
  objectiveEl.style.letterSpacing = "2px";
  objectiveEl.style.textShadow = "0 0 5px black";
  objectiveEl.style.zIndex = "50";
  objectiveEl.style.pointerEvents = "none";
  objectiveEl.style.opacity = "0";
  objectiveEl.style.transition = "opacity 2s ease";
  document.body.appendChild(objectiveEl);

  function setObjective(text) {
    objectiveEl.textContent = "OBJECTIVE: " + text.toUpperCase();
    objectiveEl.style.opacity = "1";
    
    // Auto-hide after 10 seconds to keep screen clean
    setTimeout(() => {
        objectiveEl.style.opacity = "0.3";
    }, 10000);
  }

  window.addEventListener('maiden-home-unlocked', () => {
      setObjective("Find Grandmother's Maiden Home");
  });

  return { setObjective };
}
