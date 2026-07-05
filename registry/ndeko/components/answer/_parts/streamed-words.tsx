import { cn } from '@/registry/ndeko/lib/utils';

type StreamedWordsProps = {
  words: readonly string[];
  shown: number;
  /** Draws a caret after the last word while more words are coming. */
  isStreaming?: boolean;
  className?: string;
};

/** Each word fades in as it mounts, so a streamed line settles word by word without a re-render per frame. */
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
      {isStreaming && <StreamCaret />}
    </span>
  );
}

export function StreamCaret({ className }: { className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'bg-foreground/50 inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]',
        className
      )}
    />
  );
}
