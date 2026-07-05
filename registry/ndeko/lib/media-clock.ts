/** 0:07, 1:04, 12:30. */
export function formatClock(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const bounded = Math.max(0, totalSeconds);
  const minutes = Math.floor(bounded / 60);
  const seconds = bounded % 60;
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
}

/** 7 seconds, 1 minute 4 seconds: the clock read aloud. */
export function spokenClockOf(milliseconds: number) {
  const wholeSeconds = Math.floor(milliseconds / 1000);
  const totalSeconds = Math.max(0, wholeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const secondsWord = pluralOf(seconds, 'second');
  if (minutes === 0) {
    return `${seconds} ${secondsWord}`;
  }
  const minutesWord = pluralOf(minutes, 'minute');
  return `${minutes} ${minutesWord} ${seconds} ${secondsWord}`;
}

function pluralOf(count: number, word: string) {
  if (count === 1) {
    return word;
  }
  return `${word}s`;
}
