'use client';
import { cn } from '@/lib/utils';
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
  type MotionValue,
  type Transition,
} from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, CopyIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export type TerminalTone =
  'default' | 'muted' | 'success' | 'warning' | 'error';

export type TerminalLine =
  | { kind: 'command'; text: string }
  | { kind: 'output'; text: string; tone?: TerminalTone; delay?: number };

type LineStatus = 'done' | 'active' | 'pending';

const TONE_CLASS: Record<TerminalTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  error: 'text-destructive-ink',
};

const PAUSE_AFTER_COMMAND_MS = 400;

const COPIED_DURATION_MS = 1600;

const BLINK: Transition = {
  duration: 1.06,
  times: [0, 0.5, 0.5, 1],
  repeat: Infinity,
  ease: 'linear',
};

const STEADY: Transition = { duration: 0 };

const SWAP_TRANSITION = { duration: 0.15, ease: [0.2, 0, 0, 1] } as const;

function statusOf(index: number, cursor: number): LineStatus {
  if (index < cursor) {
    return 'done';
  }
  if (index === cursor) {
    return 'active';
  }
  return 'pending';
}

function cursorOf(
  shouldReduceMotion: boolean | null,
  activeLine: number,
  lineCount: number
) {
  if (shouldReduceMotion) {
    return lineCount;
  }
  return activeLine;
}

function typedClipOf(typed: number) {
  const visibleCharacters = Math.round(typed);
  return `inset(0 calc(100% - ${visibleCharacters}ch) 0 0)`;
}

function caretOffsetOf(typed: number) {
  const visibleCharacters = Math.round(typed);
  return `translateX(${visibleCharacters}ch)`;
}

function caretMotionOf(shouldBlink: boolean) {
  if (shouldBlink) {
    return { animate: { opacity: [1, 1, 0, 0] }, transition: BLINK };
  }
  return { animate: { opacity: 1 }, transition: STEADY };
}

function swapMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  };
}

function Caret({
  isBlinking,
  shouldReduceMotion,
  style,
}: {
  isBlinking: boolean;
  shouldReduceMotion: boolean | null;
  style?: { transform: MotionValue<string> };
}) {
  const shouldBlink = isBlinking && !shouldReduceMotion;
  const caretMotion = caretMotionOf(shouldBlink);

  return (
    <motion.span
      aria-hidden='true'
      className='bg-foreground/70 absolute inset-y-[0.2em] left-0 w-[1ch]'
      style={style}
      {...caretMotion}
    />
  );
}

function Prompt({ prompt }: { prompt: string }) {
  return (
    <span
      aria-hidden='true'
      className='text-muted-foreground shrink-0 pr-[1ch] select-none'
    >
      {prompt}
    </span>
  );
}

function TypedCommand({
  text,
  prompt,
  isPlaying,
  typingSpeed,
  shouldReduceMotion,
  onTyped,
}: {
  text: string;
  prompt: string;
  isPlaying: boolean;
  typingSpeed: number;
  shouldReduceMotion: boolean | null;
  onTyped: () => void;
}) {
  const typed = useMotionValue(0);
  const clipPath = useTransform(typed, typedClipOf);
  const caretOffset = useTransform(typed, caretOffsetOf);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    let isCancelled = false;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    const typingMs = text.length * typingSpeed;
    const typingSeconds = typingMs / 1000;
    const controls = animate(typed, text.length, {
      duration: typingSeconds,
      ease: 'linear',
    });
    controls.then(() => {
      if (isCancelled) {
        return;
      }
      pauseTimer = setTimeout(onTyped, PAUSE_AFTER_COMMAND_MS);
    });
    return () => {
      isCancelled = true;
      controls.stop();
      clearTimeout(pauseTimer);
    };
  }, [isPlaying, text, typingSpeed, typed, onTyped]);

  return (
    <div className='flex'>
      <Prompt prompt={prompt} />
      <span className='relative shrink-0'>
        <motion.span className='block' style={{ clipPath }}>
          {text}
        </motion.span>
        <Caret
          isBlinking={!isPlaying}
          shouldReduceMotion={shouldReduceMotion}
          style={{ transform: caretOffset }}
        />
      </span>
    </div>
  );
}

function StaticLine({
  line,
  prompt,
  isHidden,
}: {
  line: TerminalLine;
  prompt: string;
  isHidden: boolean;
}) {
  if (line.kind === 'command') {
    return (
      <div className={cn('flex', isHidden && 'opacity-0')}>
        <Prompt prompt={prompt} />
        <span className='shrink-0'>{line.text}</span>
      </div>
    );
  }
  const tone = line.tone ?? 'default';

  return (
    <div className={cn('shrink-0', TONE_CLASS[tone], isHidden && 'opacity-0')}>
      {line.text}
    </div>
  );
}

function TerminalSession({
  lines,
  prompt,
  typingSpeed,
  outputDelay,
}: {
  lines: TerminalLine[];
  prompt: string;
  typingSpeed: number;
  outputDelay: number;
}) {
  const sessionRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isInView = useInView(sessionRef, { once: true, amount: 0.5 });
  const [activeLine, setActiveLine] = useState(0);
  const cursor = cursorOf(shouldReduceMotion, activeLine, lines.length);
  const isPlaying = isInView && !shouldReduceMotion;
  const isFinished = cursor >= lines.length;

  const advance = useCallback(() => {
    setActiveLine((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const line = lines[activeLine];
    const isOutput = line?.kind === 'output';
    if (!isOutput) {
      return;
    }
    const delay = line.delay ?? outputDelay;
    const timer = setTimeout(advance, delay);
    return () => clearTimeout(timer);
  }, [activeLine, isPlaying, lines, outputDelay, advance]);

  return (
    <div ref={sessionRef} className='overflow-x-auto px-4 pb-4 whitespace-pre'>
      {lines.map((line, index) => {
        const key = `${index}-${line.text}`;
        const status = statusOf(index, cursor);
        const isTyping = status === 'active' && line.kind === 'command';

        if (isTyping) {
          return (
            <TypedCommand
              key={key}
              text={line.text}
              prompt={prompt}
              isPlaying={isPlaying}
              typingSpeed={typingSpeed}
              shouldReduceMotion={shouldReduceMotion}
              onTyped={advance}
            />
          );
        }
        return (
          <StaticLine
            key={key}
            line={line}
            prompt={prompt}
            isHidden={status === 'pending'}
          />
        );
      })}
      <div
        aria-hidden='true'
        className={cn('flex', !isFinished && 'opacity-0')}
      >
        <Prompt prompt={prompt} />
        <span className='relative'>
          <span className='invisible'> </span>
          <Caret isBlinking shouldReduceMotion={shouldReduceMotion} />
        </span>
      </div>
    </div>
  );
}

function CopyCommandsButton({ commands }: { commands: string }) {
  const [hasCopied, setHasCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swap = swapMotionOf(shouldReduceMotion);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(commands);
    } catch {
      return;
    }
    setHasCopied(true);
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => {
      setHasCopied(false);
    }, COPIED_DURATION_MS);
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      className='text-muted-foreground'
      aria-label='Copy commands'
      onClick={copy}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        {hasCopied && (
          <motion.span
            key='copied'
            className='flex'
            transition={SWAP_TRANSITION}
            {...swap}
          >
            <CheckIcon />
          </motion.span>
        )}
        {!hasCopied && (
          <motion.span
            key='copy'
            className='flex'
            transition={SWAP_TRANSITION}
            {...swap}
          >
            <CopyIcon />
          </motion.span>
        )}
      </AnimatePresence>
      <span className='sr-only' aria-live='polite'>
        {hasCopied && 'Copied'}
      </span>
    </Button>
  );
}

export type TerminalProps = {
  lines: TerminalLine[];
  title?: string;
  prompt?: string;
  typingSpeed?: number;
  outputDelay?: number;
  className?: string;
};

export function Terminal({
  lines,
  title = 'Terminal',
  prompt = '$',
  typingSpeed = 32,
  outputDelay = 120,
  className,
}: TerminalProps) {
  const [run, setRun] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const commandLines = lines.filter((line) => line.kind === 'command');
  const commandTexts = commandLines.map((line) => line.text);
  const commands = commandTexts.join('\n');
  const hasCommands = commandLines.length > 0;
  const canReplay = !shouldReduceMotion;

  function replay() {
    setRun((current) => current + 1);
  }

  return (
    <div
      className={cn(
        'bg-card hairline-ring ring-border w-full overflow-hidden rounded-xl font-mono text-[13px] leading-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='flex h-10 items-center justify-between gap-2 pr-1.5 pl-4'>
        <span className='text-muted-foreground font-sans text-xs'>{title}</span>
        <div className='flex items-center gap-0.5'>
          {canReplay && (
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-muted-foreground'
              aria-label='Replay'
              onClick={replay}
            >
              <RotateCcwIcon />
            </Button>
          )}
          {hasCommands && <CopyCommandsButton commands={commands} />}
        </div>
      </div>
      <TerminalSession
        key={run}
        lines={lines}
        prompt={prompt}
        typingSpeed={typingSpeed}
        outputDelay={outputDelay}
      />
    </div>
  );
}
