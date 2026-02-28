export function createInteractionOverlay() {
  const prompt = document.createElement("div");
  prompt.textContent = "Press E to interact";

  prompt.style.position = "fixed";
  prompt.style.left = "50%";
  prompt.style.bottom = "12%";
  prompt.style.transform = "translateX(-50%)";
  prompt.style.padding = "0.45rem 0.8rem";
  prompt.style.border = "1px solid rgba(255, 255, 255, 0.35)";
  prompt.style.borderRadius = "4px";
  prompt.style.background = "rgba(0, 0, 0, 0.5)";
  prompt.style.color = "#efefef";
  prompt.style.fontFamily = "monospace";
  prompt.style.fontSize = "14px";
  prompt.style.letterSpacing = "0.03em";
  prompt.style.pointerEvents = "none";
  prompt.style.zIndex = "20";
  prompt.style.display = "none";

  document.body.appendChild(prompt);

  function setText(text) {
    prompt.textContent = text || "Press E to interact";
  }

  function setVisible(visible) {
    prompt.style.display = visible ? "block" : "none";
  }

  return {
    setText,
    setVisible,
  };
}

export function createMemoryOverlay() {
  const backdrop = document.createElement("div");
  const panel = document.createElement("div");
  const bodyText = document.createElement("p");
  const hint = document.createElement("p");

  backdrop.style.position = "fixed";
  backdrop.style.inset = "0";
  backdrop.style.display = "none";
  backdrop.style.alignItems = "center";
  backdrop.style.justifyContent = "center";
  backdrop.style.background = "rgba(0, 0, 0, 0.62)";
  backdrop.style.zIndex = "30";

  panel.style.width = "min(680px, 88vw)";
  panel.style.padding = "1.2rem 1.4rem";
  panel.style.border = "1px solid rgba(255, 255, 255, 0.25)";
  panel.style.background = "rgba(10, 10, 10, 0.86)";
  panel.style.boxShadow = "0 0 28px rgba(0, 0, 0, 0.65)";
  panel.style.color = "#f1f1f1";
  panel.style.fontFamily = "monospace";
  panel.style.lineHeight = "1.45";

  bodyText.style.margin = "0";
  bodyText.style.whiteSpace = "pre-line";
  bodyText.style.fontSize = "1rem";

  hint.style.margin = "1rem 0 0 0";
  hint.style.textAlign = "center";
  hint.style.opacity = "0.85";
  hint.textContent = "[Press ESC to close]";

  panel.appendChild(bodyText);
  panel.appendChild(hint);
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);

  function show(text) {
    bodyText.textContent = text;
    backdrop.style.display = "flex";
  }

  function hide() {
    backdrop.style.display = "none";
    bodyText.textContent = "";
  }

  return {
    show,
    hide,
  };
}
