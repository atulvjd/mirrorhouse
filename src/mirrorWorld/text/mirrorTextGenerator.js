export function mirrorText(value) {
  return value
    .split("")
    .reverse()
    .join("")
    .trim();
}
