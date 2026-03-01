import * as THREE from "three";

export function createEndingSequenceManager(scene, camera, overlay) {
  let sequenceActive = false;
  let currentEnding = null;
  let time = 0;

  function triggerReturnEnding() {
      sequenceActive = true;
      currentEnding = "return";
      time = 0;

      // 1. World Distorts
      document.body.style.transition = "filter 2s ease";
      document.body.style.filter = "hue-rotate(180deg) blur(5px) contrast(200%)";
      
      // 3. Fade to Black & Reset
      setTimeout(() => {
          showBlackScreen(`You wake up in the basement.\nThe mirror is gone.\nThe carpet is back.`, () => {
              // The final twist
              showBlackScreen(`But in the reflection of a small glass frame...\nYour face is stitched.`, null, true);
          });
      }, 3000);
  }

  function triggerStayEnding(reflectionGroup) {
      sequenceActive = true;
      currentEnding = "stay";
      time = 0;

      // 1. Reflection smiles and steps out
      // 2. Player forms stitches (UI/Post process effect)
      overlay.setText("Your face feels tight. The threads pull.");
      overlay.setVisible(true);

      setTimeout(() => {
          overlay.setVisible(false);
          showBlackScreen(`The reflection walks past you.\nIt takes your place in the light.`, () => {
              showBlackScreen(`Your shadow now leads you.\nYou belong here.`, null, true);
          });
      }, 4000);
  }

  function showBlackScreen(text, onNext, isFinal = false) {
      const blackScreen = document.createElement("div");
      blackScreen.style.position = "fixed";
      blackScreen.style.inset = "0";
      blackScreen.style.background = "black";
      blackScreen.style.color = "white";
      blackScreen.style.display = "flex";
      blackScreen.style.flexDirection = "column";
      blackScreen.style.alignItems = "center";
      blackScreen.style.justifyContent = "center";
      blackScreen.style.textAlign = "center";
      blackScreen.style.whiteSpace = "pre-line";
      blackScreen.style.fontFamily = "'Courier New', monospace";
      blackScreen.style.fontSize = "24px";
      blackScreen.style.opacity = "0";
      blackScreen.style.transition = "opacity 2s ease";
      blackScreen.style.zIndex = "200";
      blackScreen.textContent = text;
      
      document.body.appendChild(blackScreen);
      
      requestAnimationFrame(() => {
          blackScreen.style.opacity = "1";
      });

      setTimeout(() => {
          if (isFinal) {
              // End of game
              const endText = document.createElement("div");
              endText.textContent = "THE END";
              endText.style.marginTop = "50px";
              endText.style.color = "red";
              blackScreen.appendChild(endText);
          } else {
              blackScreen.style.opacity = "0";
              setTimeout(() => {
                  document.body.removeChild(blackScreen);
                  if (onNext) onNext();
              }, 2000);
          }
      }, 5000);
  }

  function update(delta) {
      if (!sequenceActive) return;
      time += delta;

      if (currentEnding === "return") {
          // Pull camera violently forward
          camera.position.z -= delta * 15;
          camera.rotation.z += Math.sin(time * 20) * 0.1; // violently shake
      } else if (currentEnding === "stay") {
          // Slow zoom out, peaceful but wrong
          camera.position.z += delta * 0.5;
      }
  }

  return { triggerReturnEnding, triggerStayEnding, update };
}
