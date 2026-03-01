import * as THREE from "three";

export function createPhotoClueSystem(scene, story, interaction) {
  // We locate the existing vintage trunk or add a clue object to it
  let clueActive = false;

  function setupTrunkClue(trunkMesh) {
    interaction.register(trunkMesh, () => {
        if (clueActive) return;
        triggerClue();
    });
  }

  function triggerClue() {
    clueActive = true;
    
    // Sequence of photographs describing the maiden home
    const clues = [
        "A pink-colored house, desaturated by time.",
        "Orchid plants growing wildly outside the windows.",
        "Spring trees with white blossoms surrounding the garden.",
        "A wedding ceremony... she looks happy here.",
        "I must find this house in the city."
    ];

    let current = 0;
    const showNext = () => {
        if (current < clues.length) {
            story.showMemory(clues[current]);
            current++;
            // Note: In a full game, we would swap the 2D texture shown in inspection mode
        } else {
            // Objective updated automatically via story flow
            window.dispatchEvent(new CustomEvent('maiden-home-unlocked'));
        }
    };

    showNext();
    // Subsequent clicks could progress the clue sequence if not handled by standard UI
  }

  return { setupTrunkClue };
}
