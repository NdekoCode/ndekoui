'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  type Transition,
} from 'motion/react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowUpIcon,
  CodeIcon,
  FileTextIcon,
  LanguagesIcon,
  LightbulbIcon,
  RotateCcwIcon,
  UndoIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { useAutosize } from './_parts/use-autosize';

export type DeckPrompt = {
  id: string;
  icon: React.ReactNode;
  prompt: string;
  hint: string;
};

export type DeckSide = 1 | -1;

export type PromptDeckHandle = {
  /** Sends the front card away to the right, as Right does. */
  next: () => void;
  /** Brings the card that left last back to the front. */
  previous: () => void;
  /** Uses the front card, as pressing it does. */
  pick: () => void;
};

type Pose = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

const STEP_PX = 6;

const VISIBLE_CARDS = 3;

const SCALE_STEP = 0.04;

const EXIT_PX = 320;

const TILT_DEGREES = 4;

const DISMISS_OFFSET = 96;

const DISMISS_SPEED = 500;

const CARD_HEIGHT = 'h-28';

const CARD_SURFACE =
  'bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.05)]';

function signOf(value: number): DeckSide {
  if (value < 0) {
    return -1;
  }
  return 1;
}

function sideOf(offset: number, speed: number) {
  if (offset !== 0) {
    return signOf(offset);
  }
  return signOf(speed);
}

function poseOf(rank: number, side: DeckSide): Pose {
  if (rank < 0) {
    return { x: side * EXIT_PX, y: 0, scale: 1, opacity: 0 };
  }
  const depth = Math.min(rank, VISIBLE_CARDS - 1);
  const y = depth * STEP_PX;
  const scale = 1 - depth * SCALE_STEP;
  const isHidden = rank >= VISIBLE_CARDS;
  if (isHidden) {
    return { x: 0, y, scale, opacity: 0 };
  }
  return { x: 0, y, scale, opacity: 1 };
}

function dragOf(isFront: boolean) {
  if (isFront) {
    return 'x';
  }
  return false;
}

function frontToneOf(isFront: boolean) {
  if (isFront) {
    return 'cursor-grab active:cursor-grabbing';
  }
  return 'pointer-events-none';
}

function pressedToneOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-[0.97] bg-foreground/[0.03]';
  }
  return undefined;
}

type DeckCardProps = {
  prompt: DeckPrompt;
  rank: number;
  side: DeckSide;
  isPressed: boolean;
  glide: Transition;
  register: (id: string, node: HTMLButtonElement | null) => void;
  onDismiss: (side: DeckSide) => void;
  onPick: () => void;
};

function DeckCard({
  prompt,
  rank,
  side,
  isPressed,
  glide,
  register,
  onDismiss,
  onPick,
}: DeckCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-EXIT_PX, 0, EXIT_PX],
    [-TILT_DEGREES, 0, TILT_DEGREES]
  );
  const wasDragged = useRef(false);
  const isFront = rank === 0;
  const pose = poseOf(rank, side);

  function endDrag(info: PanInfo) {
    setTimeout(() => {
      wasDragged.current = false;
    }, 0);
    const isFarEnough = Math.abs(info.offset.x) > DISMISS_OFFSET;
    const isFastEnough = Math.abs(info.velocity.x) > DISMISS_SPEED;
    const shouldLeave = isFarEnough || isFastEnough;
    if (shouldLeave) {
      onDismiss(sideOf(info.offset.x, info.velocity.x));
    }
  }

  function pick() {
    if (wasDragged.current) {
      return;
    }
    onPick();
  }

  return (
    <motion.div
      inert={!isFront}
      initial={false}
      drag={dragOf(isFront)}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => {
        wasDragged.current = true;
      }}
      onDragEnd={(_, info) => endDrag(info)}
      animate={pose}
      transition={glide}
      style={{ x, rotate, zIndex: 100 - rank }}
      className={cn(
        'absolute inset-x-2 top-0 origin-bottom',
        CARD_HEIGHT,
        CARD_SURFACE,
        frontToneOf(isFront)
      )}
    >
      <button
        ref={(node) => register(prompt.id, node)}
        type='button'
        data-deck-card=''
        tabIndex={rankTabIndexOf(isFront)}
        onClick={pick}
        className={cn(
          'focus-visible:ring-ring/25 flex size-full cursor-[inherit] items-start gap-3 rounded-[inherit] p-3.5 text-start transition-[scale,background-color] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px]',
          pressedToneOf(isPressed && isFront)
        )}
      >
        <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*="size-"])]:size-4'>
          {prompt.icon}
        </span>
        <span className='flex h-full min-w-0 flex-1 flex-col gap-1'>
          <span className='line-clamp-3 text-sm leading-5 font-medium'>
            {prompt.prompt}
          </span>
          <span className='text-muted-foreground mt-auto truncate text-xs'>
            {prompt.hint}
          </span>
        </span>
      </button>
    </motion.div>
  );
}

function emptyTextOf(count: number) {
  if (count === 0) {
    return 'No suggestions yet';
  }
  return 'That was every idea';
}

function rankTabIndexOf(isFront: boolean) {
  if (isFront) {
    return 0;
  }
  return -1;
}

export type PromptDeckProps = {
  prompts: DeckPrompt[];
  onPick?: (prompt: DeckPrompt) => void;
  handleRef?: React.Ref<PromptDeckHandle>;
  /** Shows the front card held down, for a demonstration that presses it. */
  isFrontPressed?: boolean;
  /** Putting the deck back to its first state: change this number. */
  resetToken?: number;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

export function PromptDeck({
  prompts,
  onPick,
  handleRef,
  isFrontPressed = false,
  resetToken = 0,
  isDemonstrating = false,
  className,
}: PromptDeckProps) {
  const [index, setIndex] = useState(0);
  const [sides, setSides] = useState<Record<string, DeckSide>>({});
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const shouldFocusFront = useRef(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const fade = fadePresence();
  const glide = springOf(shouldReduceMotion);
  const count = prompts.length;
  const isEmpty = index >= count;
  const front = prompts[index];
  const shown = Math.min(index + 1, count);

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setIndex(0);
  }

  useEffect(() => {
    if (!shouldFocusFront.current) {
      return;
    }
    shouldFocusFront.current = false;
    const current = prompts[index];
    if (current) {
      buttons.current.get(current.id)?.focus();
      return;
    }
    const showAgainButton =
      rootRef.current?.querySelector<HTMLElement>('[data-deck-empty]');
    showAgainButton?.focus();
  }, [index, prompts]);

  function register(id: string, node: HTMLButtonElement | null) {
    if (node) {
      buttons.current.set(id, node);
      return;
    }
    buttons.current.delete(id);
  }

  function rememberFocus() {
    const active = document.activeElement;
    const isElement = active instanceof HTMLElement;
    shouldFocusFront.current = isElement && active.matches('[data-deck-card]');
  }

  function dismissFront(side: DeckSide) {
    if (!front) {
      return;
    }
    rememberFocus();
    setSides((current) => ({ ...current, [front.id]: side }));
    setIndex((current) => current + 1);
    const following = prompts[index + 1];
    if (following) {
      setNotice(`Next idea: ${following.prompt}`);
      return;
    }
    setNotice('That was every idea');
  }

  function previous() {
    if (index === 0) {
      return;
    }
    rememberFocus();
    const back = prompts[index - 1];
    setIndex((current) => current - 1);
    setNotice(`Back to: ${back.prompt}`);
  }

  function showAgain() {
    setIndex(0);
    setNotice('The ideas are back');
  }

  function pick() {
    if (!front) {
      return;
    }
    setNotice(`Using: ${front.prompt}`);
    onPick?.(front);
  }

  useImperativeHandle(handleRef, () => ({
    next: () => dismissFront(1),
    previous,
    pick,
  }));

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
    if (hasModifier) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      dismissFront(1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      dismissFront(-1);
    }
  }

  return (
    <div
      ref={rootRef}
      onKeyDown={handleKeys}
      className={cn('@container flex w-full flex-col gap-3', className)}
    >
      <div
        role='group'
        aria-label='Suggested prompts'
        className='relative -mx-2 h-[calc(7rem+12px)] overflow-x-clip'
      >
        {prompts.map((prompt, position) => (
          <DeckCard
            key={prompt.id}
            prompt={prompt}
            rank={position - index}
            side={sides[prompt.id] ?? 1}
            isPressed={isFrontPressed}
            glide={glide}
            register={register}
            onDismiss={dismissFront}
            onPick={pick}
          />
        ))}
        <AnimatePresence initial={false}>
          {isEmpty && (
            <motion.div
              key='empty'
              {...fade}
              className={cn(
                'hairline-border border-foreground/20 absolute inset-x-2 top-0 flex flex-col items-center justify-center gap-2 rounded-xl border-dashed',
                CARD_HEIGHT
              )}
            >
              <p className='text-muted-foreground text-[13px]'>
                {emptyTextOf(count)}
              </p>
              {count > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  data-deck-empty=''
                  onClick={showAgain}
                >
                  <RotateCcwIcon />
                  Show them again
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className='flex h-7 items-center justify-between gap-3 px-1'>
        <p className='text-muted-foreground flex items-baseline gap-1 text-xs'>
          <MotionNumber value={shown} /> of {count}
        </p>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={index === 0}
          focusableWhenDisabled
          onClick={previous}
          className='text-muted-foreground'
        >
          <UndoIcon />
          Back
        </Button>
      </div>
      <p className='text-muted-foreground hidden items-center gap-1 px-1 text-xs @sm:flex'>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> send a card away, <Kbd>Enter</Kbd> uses it
      </p>
      <LiveRegion message={spokenUnless(isDemonstrating, notice)} />
    </div>
  );
}

const PROMPTS: DeckPrompt[] = [
  {
    id: 'summary',
    icon: <FileTextIcon />,
    prompt: 'Summarize this contract and list what I must do before signing',
    hint: 'Reads the file you attached',
  },
  {
    id: 'translate',
    icon: <LanguagesIcon />,
    prompt: 'Translate my last message into Lingala and keep the same tone',
    hint: 'Keeps names and numbers as they are',
  },
  {
    id: 'bug',
    icon: <CodeIcon />,
    prompt: 'Find why the invoice total is off by a cent and fix it',
    hint: 'Looks at the staged changes first',
  },
  {
    id: 'ideas',
    icon: <LightbulbIcon />,
    prompt: 'Give me five names for a small neighbourhood delivery service',
    hint: 'Short names that are easy to say',
  },
];

const TYPE_MS = 24;

type TypeJob = {
  id: number;
  text: string;
};

function TypedComposer({
  value,
  onValueChange,
  onSend,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim() !== '';
  useAutosize(textareaRef, value, 120);

  return (
    <div className='bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 flex items-end gap-1.5 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]'>
      <Textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-label='Message'
        placeholder='Pick an idea or write your own'
        className='max-h-none min-h-8 border-0 bg-transparent px-1.5 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
      />
      <Button
        type='button'
        size='icon'
        aria-label='Send'
        disabled={!hasText}
        focusableWhenDisabled
        onClick={onSend}
      >
        <ArrowUpIcon />
      </Button>
    </div>
  );
}

function DeckDemo() {
  const [round, setRound] = useState(0);
  const [draft, setDraft] = useState('');
  const [job, setJob] = useState<TypeJob | null>(null);
  const deck = useRef<PromptDeckHandle>(null);
  const { pressed, press } = usePress<'front'>();

  useEffect(() => {
    if (!job) {
      return;
    }
    let length = 0;
    const timer = setInterval(() => {
      length += 1;
      setDraft(job.text.slice(0, length));
      if (length >= job.text.length) {
        clearInterval(timer);
      }
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [job]);

  function resetDemo() {
    setJob(null);
    setDraft('');
    setRound((current) => current + 1);
  }

  function takeIdea(prompt: DeckPrompt) {
    setJob({ id: Date.now(), text: prompt.prompt });
  }

  function editDraft(text: string) {
    setJob(null);
    setDraft(text);
  }

  function sendDraft() {
    setJob(null);
    setDraft('');
  }

  const steps: AutoplayStep[] = [
    { after: 1800, run: () => deck.current?.next() },
    { after: 1600, run: () => deck.current?.next() },
    { after: 1500, run: () => press('front') },
    { after: PRESS_LEAD_MS, run: () => deck.current?.pick() },
    { after: 3600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[17rem] w-full max-w-[28rem] flex-col gap-3'
    >
      <PromptDeck
        prompts={PROMPTS}
        onPick={takeIdea}
        handleRef={deck}
        isFrontPressed={pressed === 'front'}
        resetToken={round}
        isDemonstrating={isAutoplaying}
      />
      <TypedComposer
        value={draft}
        onValueChange={editDraft}
        onSend={sendDraft}
      />
    </div>
  );
}

export default function Prompt11() {
  return <DeckDemo />;
}
