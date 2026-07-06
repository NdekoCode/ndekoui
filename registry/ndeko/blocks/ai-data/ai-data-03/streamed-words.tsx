import { Fragment } from 'react';

const ARRIVING =
  'opacity-100 transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0';

function inkOf(isStreaming: boolean) {
  if (isStreaming) {
    return ARRIVING;
  }
  return undefined;
}

/** Each word waits its turn through its own delay, so nothing ticks in script while a text arrives. */
function delayOf(isStreaming: boolean, index: number, wordMs: number) {
  if (!isStreaming) {
    return undefined;
  }
  const delay = index * wordMs;
  return { transitionDelay: `${delay}ms` };
}

function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

type StreamedWordsProps = {
  text: string;
  /** True for a text that has just been written: its words fade in one after the other. */
  isStreaming: boolean;
  wordMs: number;
};

/**
 * Every word is in the page from the start, so the paragraph has its final height at once and
 * a screen reader gets the whole text. Only the ink arrives word by word.
 */
export function StreamedWords({
  text,
  isStreaming,
  wordMs,
}: StreamedWordsProps) {
  const words = text.split(' ');

  return (
    <>
      {words.map((word, index) => (
        <Fragment key={index}>
          {leadingSpaceOf(index)}
          <span
            style={delayOf(isStreaming, index, wordMs)}
            className={inkOf(isStreaming)}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </>
  );
}
