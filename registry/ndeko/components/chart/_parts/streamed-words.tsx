type StreamedWordsProps = {
  words: readonly string[];
  /** How many of the words have arrived. */
  shown: number;
  /** Draws a caret after the last word while more are coming. */
  isStreaming?: boolean;
  className?: string;
};

/** Each word fades in as it mounts, so a streamed line settles word by word with no script per frame. */
export function StreamedWords({
  words,
  shown,
  isStreaming = false,
  className,
}: StreamedWordsProps) {
  const visible = words.slice(0, shown);

  return (
    <span className={className}>
      {visible.map((word, index) => (
        <span
          key={index}
          className='transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0'
        >
          {word}{' '}
        </span>
      ))}
      {isStreaming && (
        <span
          aria-hidden='true'
          className='bg-foreground/50 inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]'
        />
      )}
    </span>
  );
}
