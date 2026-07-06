export function rovingTargetOf(key: string, current: number, count: number) {
  const last = count - 1;
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return Math.min(current + 1, last);
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return Math.max(current - 1, 0);
  }
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return last;
  }
  return null;
}
