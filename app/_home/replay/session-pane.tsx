import { cn } from '@/registry/ndeko/lib/utils';

import {
  CHARACTER_MS,
  type OutputTone,
  SESSION,
  type SessionLine,
} from './replay-script';

const LINE_IN = 'animate-line-in motion-reduce:animate-none';

const TONE_CLASS: Record<OutputTone, string> = {
  muted: 'text-muted-foreground',
  default: 'text-foreground',
  success: 'text-success-foreground',
};

/** The caret stays a moment after the last letter, as when someone reads what they typed. */
const CARET_LINGER_MS = 500;

function typedCountOf(line: { at: number; text: string }, elapsed: number) {
  const typingMs = elapsed - line.at;
  const count = Math.floor(typingMs / CHARACTER_MS);
  return Math.min(line.text.length, Math.max(0, count));
}

function PromptLine({
  line,
  elapsed,
}: {
  line: { at: number; text: string };
  elapsed: number;
}) {
  const typedCount = typedCountOf(line, elapsed);
  const typed = line.text.slice(0, typedCount);
  const typingEndsAt = line.at + line.text.length * CHARACTER_MS;
  const isCaretShown = elapsed < typingEndsAt + CARET_LINGER_MS;

  return (
    <div className='bg-foreground/[0.06] flex gap-2 rounded-md px-2.5 py-1.5'>
      <span className='text-muted-foreground select-none'>{'>'}</span>
      <span className='min-w-0 whitespace-pre-wrap'>
        {typed}
        {isCaretShown && (
          <span className='bg-foreground/70 ms-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em]' />
        )}
      </span>
    </div>
  );
}

function CallLine({
  line,
  elapsed,
}: {
  line: { doneAt: number; label: string; detail: string };
  elapsed: number;
}) {
  const isDone = elapsed >= line.doneAt;

  return (
    <div className={cn('mt-3 flex gap-2', LINE_IN)}>
      <span
        className={cn(
          'mt-[0.45em] size-1.5 shrink-0 rounded-full transition-colors duration-200',
          isDone && 'bg-success',
          !isDone && 'bg-foreground/35'
        )}
      />
      <span className='min-w-0 break-all whitespace-pre-wrap'>
        <span className='font-medium'>{line.label}</span>
        <span className='text-muted-foreground'>{` ${line.detail}`}</span>
      </span>
    </div>
  );
}

function OutputLine({
  line,
}: {
  line: { text: string; tone: OutputTone; isFirst?: boolean };
}) {
  let gutter = ' ';
  if (line.isFirst) {
    gutter = '⎿';
  }

  return (
    <div className={cn('flex gap-2 ps-3.5', LINE_IN)}>
      <span className='text-muted-foreground w-[1ch] shrink-0 select-none'>
        {gutter}
      </span>
      <span
        className={cn(
          'min-w-0 break-all whitespace-pre-wrap',
          TONE_CLASS[line.tone]
        )}
      >
        {line.text}
      </span>
    </div>
  );
}

function ReplyLine({ text }: { text: string }) {
  return (
    <div className={cn('mt-3 flex gap-2', LINE_IN)}>
      <span className='bg-foreground mt-[0.45em] size-1.5 shrink-0 rounded-full' />
      <span className='min-w-0 font-sans whitespace-pre-wrap'>{text}</span>
    </div>
  );
}

function SessionRow({ line, elapsed }: { line: SessionLine; elapsed: number }) {
  if (line.kind === 'prompt') {
    return <PromptLine line={line} elapsed={elapsed} />;
  }
  if (line.kind === 'call') {
    return <CallLine line={line} elapsed={elapsed} />;
  }
  if (line.kind === 'output') {
    return <OutputLine line={line} />;
  }
  return <ReplyLine text={line.text} />;
}

/** The prompt box is there from the first frame, empty, waiting for the first letter. */
function isShown(line: SessionLine, elapsed: number) {
  const isPrompt = line.kind === 'prompt';
  const hasStarted = elapsed >= line.at;
  return isPrompt || hasStarted;
}

function sessionKeyOf(line: SessionLine) {
  return `${line.kind}-${line.at}`;
}

/** The conversation, kept to its newest lines: the older ones leave by the top, as in a terminal. */
export function SessionPane({ elapsed }: { elapsed: number }) {
  const shownLines = SESSION.filter((line) => isShown(line, elapsed));

  return (
    <div
      aria-hidden='true'
      className='flex h-full min-h-0 flex-col justify-end overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%)] px-4 pt-4 pb-4 font-mono text-[12.5px] leading-5'
    >
      <div className='flex flex-col'>
        {shownLines.map((line) => (
          <SessionRow key={sessionKeyOf(line)} line={line} elapsed={elapsed} />
        ))}
      </div>
    </div>
  );
}
