export function slugOf(value: string) {
  const lowered = value.toLowerCase();
  const dashed = lowered.replace(/[^a-z0-9]+/g, '-');
  return dashed.replace(/^-|-$/g, '');
}
