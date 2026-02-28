const overlay = document.createElement("div");
const panel = document.createElement("div");
const text = document.createElement("p");

overlay.style.position = "fixed";
overlay.style.inset = "auto 20px 20px";
overlay.style.display = "flex";
overlay.style.alignItems = "flex-end";
overlay.style.justifyContent = "flex-start";
overlay.style.pointerEvents = "none";
overlay.style.zIndex = "75";
overlay.style.opacity = "0";
overlay.style.transition = "opacity 0.35s ease";

panel.style.padding = "0.85rem 1.1rem";
panel.style.background = "rgba(6, 5, 4, 0.85)";
panel.style.border = "1px solid rgba(255,255,255,0.12)";
panel.style.borderRadius = "0.4rem";
panel.style.backdropFilter = "blur(6px)";
panel.style.maxWidth = "320px";
panel.style.boxShadow = "0 10px 40px rgba(0, 0, 0, 0.55)";

text.style.margin = "0";
text.style.color = "#e7dccb";
text.style.fontFamily = "'Georgia', 'Times New Roman', serif";
text.style.fontSize = "clamp(14px, 2vw, 18px)";
text.style.lineHeight = "1.4";
text.style.letterSpacing = "0.01em";
text.style.whiteSpace = "pre-line";

overlay.appendChild(panel);
panel.appendChild(text);
document.body.appendChild(overlay);

let hideTimeout = null;

export function createStoryFragments() {
  function showFragment(fragment, duration = 5000) {
    if (!fragment) {
      return;
    }

    text.textContent = fragment;
    overlay.style.opacity = "1";

    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
    }

    hideTimeout = window.setTimeout(() => {
      overlay.style.opacity = "0";
      hideTimeout = null;
    }, duration);
  }

  function hide() {
    overlay.style.opacity = "0";
    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  return {
    showFragment,
    hide,
  };
}
