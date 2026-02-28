const DIALOGUE_LINES = [
  "You don't belong here.",
  "Your face is wrong.",
  "Real smiles are banned.",
  "Hurry, the surface doesn't like you.",
  "You still have a real smile.",
  "I can hear your shadow lagging.",
  "The stitched mouths are superior.",
  "Why do your teeth move without thread?",
  "The streets remember you.",
  "Please stop looking at me like that.",
];

export function getRandomDialogue() {
  return DIALOGUE_LINES[Math.floor(Math.random() * DIALOGUE_LINES.length)];
}
