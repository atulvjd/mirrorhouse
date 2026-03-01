export function createPlayerChoiceSystem(onChoiceReturn, onChoiceStay) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.display = "none";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.background = "rgba(0, 0, 0, 0.8)";
  container.style.zIndex = "100";
  container.style.opacity = "0";
  container.style.transition = "opacity 2s ease";

  const title = document.createElement("h2");
  title.textContent = "The reflection waits for your answer.";
  title.style.color = "#ffffff";
  title.style.fontFamily = "'Courier New', monospace";
  title.style.marginBottom = "50px";
  title.style.letterSpacing = "2px";
  title.style.fontWeight = "normal";

  const btnReturn = createButton("Return to your world", () => {
      hide();
      onChoiceReturn();
  });
  
  const btnStay = createButton("Stay in the honest world", () => {
      hide();
      onChoiceStay();
  });

  container.appendChild(title);
  container.appendChild(btnReturn);
  container.appendChild(btnStay);
  document.body.appendChild(container);

  function createButton(text, onClick) {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.padding = "15px 30px";
      btn.style.margin = "10px";
      btn.style.background = "transparent";
      btn.style.color = "#aaaaaa";
      btn.style.border = "1px solid #555";
      btn.style.fontFamily = "'Courier New', monospace";
      btn.style.fontSize = "18px";
      btn.style.cursor = "pointer";
      btn.style.transition = "all 0.3s ease";
      
      btn.onmouseover = () => {
          btn.style.color = "#ffffff";
          btn.style.border = "1px solid #ffffff";
          btn.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
      };
      btn.onmouseout = () => {
          btn.style.color = "#aaaaaa";
          btn.style.border = "1px solid #555";
          btn.style.boxShadow = "none";
      };
      
      btn.onclick = onClick;
      return btn;
  }

  function show() {
      container.style.display = "flex";
      // Ensure cursor is available
      if (document.pointerLockElement) {
          document.exitPointerLock();
      }
      setTimeout(() => container.style.opacity = "1", 100);
  }

  function hide() {
      container.style.opacity = "0";
      setTimeout(() => {
          container.style.display = "none";
          document.body.removeChild(container);
      }, 2000);
  }

  return { show };
}
