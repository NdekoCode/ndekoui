export function hatchOf(color: string, strength = 45) {
  const stripe = `color-mix(in oklab, ${color} ${strength}%, transparent)`;
  return `repeating-linear-gradient(135deg, ${stripe} 0 1.5px, transparent 1.5px 5px)`;
}
