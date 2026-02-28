const objectivePanel = document.createElement("div");
const objectiveText = document.createElement("span");

objectivePanel.style.position = "fixed";
objectivePanel.style.top = "20px";
objectivePanel.style.right = "20px";
objectivePanel.style.padding = "0.6rem 1rem";
objectivePanel.style.border = "1px solid rgba(255, 255, 255, 0.2)";
objectivePanel.style.borderRadius = "0.5rem";
objectivePanel.style.background = "rgba(8, 8, 12, 0.75)";
objectivePanel.style.color = "#fefbf4";
objectivePanel.style.fontFamily = "'Courier New', monospace";
objectivePanel.style.fontSize = "0.85rem";
objectivePanel.style.textTransform = "uppercase";
objectivePanel.style.letterSpacing = "0.15em";
objectivePanel.style.zIndex = "80";
objectivePanel.style.backdropFilter = "blur(6px)";
objectivePanel.style.display = "flex";
objectivePanel.style.flexDirection = "column";
objectivePanel.appendChild(objectiveText);

document.body.appendChild(objectivePanel);

let currentObjective = "";

export function createObjectiveSystem() {
  function setObjective(text) {
    if (!text || text === currentObjective) {
      return;
    }

    currentObjective = text;
    objectiveText.textContent = text;
    objectivePanel.style.opacity = "0";
    objectivePanel.style.transition = "opacity 0.35s ease";
    window.requestAnimationFrame(() => {
      objectivePanel.style.opacity = "1";
    });
  }

  function hide() {
    objectivePanel.style.opacity = "0";
  }

  return {
    setObjective,
    hide,
  };
}
