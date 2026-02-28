import * as THREE from "three";

export function createCinematicEvents({ scene, storyFragments, objectives }) {
  let basementTriggered = false;
  let mirrorTriggered = false;
  let mirrorCompleted = false;
  let fogTarget = scene.fog?.density || 0.08;

  function triggerBasementSequence() {
    if (basementTriggered) {
      return;
    }
    basementTriggered = true;
    objectives?.setObjective("Descend into the basement and find the mirror");
    storyFragments?.showFragment(
      "The house holds its breath. The lights dim as if surprised."
    );
  }

  function triggerMirrorTransition() {
    if (mirrorTriggered) {
      return;
    }
    mirrorTriggered = true;
    fogTarget = Math.max(0.18, fogTarget);
    storyFragments?.showFragment("The glass watches you. It wants you inside.");
    objectives?.setObjective("Explore the mirror world for answers");
  }

  function completeMirrorTransition() {
    if (mirrorCompleted) {
      return;
    }
    mirrorCompleted = true;
    storyFragments?.showFragment("You feel the world tilt behind you.");
  }

  function update(delta, isInMirrorWorld = false) {
    if (!scene.fog) {
      return;
    }

    const current = scene.fog.density;
    const target = mirrorTriggered ? fogTarget + 0.02 : fogTarget;
    scene.fog.density = THREE.MathUtils.lerp(current, target, Math.min(1, delta * 0.4));

    if (isInMirrorWorld && mirrorTriggered) {
      scene.fog.density = Math.max(scene.fog.density, 0.22);
    }
  }

  return {
    triggerBasementSequence,
    triggerMirrorTransition,
    completeMirrorTransition,
    update,
  };
}
