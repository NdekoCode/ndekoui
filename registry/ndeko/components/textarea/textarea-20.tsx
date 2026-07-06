'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { flushSync } from 'react-dom';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { HistoryIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { Label } from '@/registry/ndeko/ui/label';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const SNAPSHOT_MS = 450;
const MAX_VERSIONS = 40;
const HELD_UNDO_REPEATS_PER_STEP = 4;

const FIRST_SENTENCE = 'Ship the export on Friday.';
const SECOND_SENTENCE = 'Ask Mei about the totals row.';
const THIRD_SENTENCE = 'Hold the release until Monday.';

const VERSIONS = [
  FIRST_SENTENCE,
  `${FIRST_SENTENCE} ${SECOND_SENTENCE}`,
  SECOND_SENTENCE,
  `${SECOND_SENTENCE} ${THIRD_SENTENCE}`,
];

const FINAL_TEXT = VERSIONS[VERSIONS.length - 1];

const VIEW =
  'whitespace-pre-wrap wrap-break-word field-sizing-content max-h-[12lh] min-h-16 overflow-hidden px-2.5 py-2 leading-normal';

const RETURNING_WORD =
  'text-primary-ink transition-[color,opacity] duration-200 ease-(--ease-out-strong) starting:opacity-0';

type Token = {
  text: string;
  isReturning: boolean;
};

function framesOf(history: string[], text: string) {
  const last = history[history.length - 1];
  if (last === text) {
    return history;
  }
  return [...history, text];
}

function withSnapshot(history: string[], text: string) {
  const last = history[history.length - 1];
  const isNew = last !== text;
  const hasContent = text !== '';
  if (!isNew || !hasContent) {
    return history;
  }
  return [...history, text].slice(-MAX_VERSIONS);
}

function countOfWords(text: string) {
  const counts = new Map<string, number>();
  const words = text.split(/\s+/).filter((word) => word !== '');
  for (const word of words) {
    const seen = counts.get(word) ?? 0;
    counts.set(word, seen + 1);
  }
  return counts;
}

function tokensOf(shownText: string, nowText: string): Token[] {
  const remaining = countOfWords(nowText);
  return shownText.split(/(\s+)/).map((text) => {
    const isSpace = text.trim() === '';
    if (isSpace) {
      return { text, isReturning: false };
    }
    const left = remaining.get(text) ?? 0;
    if (left > 0) {
      remaining.set(text, left - 1);
      return { text, isReturning: false };
    }
    return { text, isReturning: true };
  });
}

function shareOf(index: number, count: number) {
  const lastIndex = count - 1;
  if (lastIndex <= 0) {
    return 1;
  }
  return index / lastIndex;
}

function versionLabelOf(index: number, count: number) {
  const isNow = index === count - 1;
  if (isNow) {
    return 'Now';
  }
  return `Version ${index + 1} of ${count}`;
}

function clampedIndex(index: number, count: number) {
  return Math.min(count - 1, Math.max(0, index));
}

function indexAtPointer(event: PointerEvent<HTMLElement>, count: number) {
  const box = event.currentTarget.getBoundingClientRect();
  const share = (event.clientX - box.left) / box.width;
  const boundedShare = Math.min(1, Math.max(0, share));
  return Math.round(boundedShare * (count - 1));
}

function isUndoKey(event: KeyboardEvent<HTMLElement>) {
  const hasModifier = event.metaKey || event.ctrlKey;
  const isZ = event.key.toLowerCase() === 'z';
  return hasModifier && isZ;
}

function RewindView({
  shownText,
  nowText,
}: {
  shownText: string;
  nowText: string;
}) {
  const tokens = tokensOf(shownText, nowText);

  return (
    <div
      aria-hidden='true'
      className={cn(
        CONTROL_RECIPE,
        VIEW,
        'border-foreground/30 ring-ring/25 col-start-1 row-start-1 ring-[3px]'
      )}
    >
      {tokens.map((token, index) => {
        if (!token.isReturning) {
          return <span key={`${index}-${token.text}`}>{token.text}</span>;
        }
        return (
          <span key={`${index}-${token.text}`} className={RETURNING_WORD}>
            {token.text}
          </span>
        );
      })}
    </div>
  );
}

type ScrubberProps = {
  index: number;
  count: number;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  onIndexChange: (index: number) => void;
  onKeep: () => void;
  onCancel: () => void;
};

function Scrubber({
  index,
  count,
  sliderRef,
  onIndexChange,
  onKeep,
  onCancel,
}: ScrubberProps) {
  const isDragging = useRef(false);
  const share = shareOf(index, count);
  const thumbStyle = { translate: `${share * 100}cqw 0` };
  const label = versionLabelOf(index, count);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    isDragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onIndexChange(indexAtPointer(event, count));
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) {
      return;
    }
    onIndexChange(indexAtPointer(event, count));
  }

  function endDrag() {
    if (!isDragging.current) {
      return;
    }
    isDragging.current = false;
    onKeep();
  }

  function moveWithKeys(event: KeyboardEvent<HTMLDivElement>) {
    const lastIndex = count - 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      onIndexChange(clampedIndex(index - 1, count));
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      onIndexChange(clampedIndex(index + 1, count));
    }
    if (event.key === 'Home') {
      onIndexChange(0);
    }
    if (event.key === 'End') {
      onIndexChange(lastIndex);
    }
    if (event.key === 'Enter') {
      onKeep();
    }
    if (event.key === 'Escape') {
      onCancel();
    }
    const isHandled = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Enter',
      'Escape',
    ].includes(event.key);
    if (isHandled) {
      event.preventDefault();
    }
  }

  return (
    <div className='flex flex-col gap-3 pt-3'>
      <div
        ref={sliderRef}
        role='slider'
        tabIndex={0}
        aria-label='Version history'
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={label}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={endDrag}
        onPointerCancel={onCancel}
        onKeyDown={moveWithKeys}
        className='focus-visible:ring-ring/25 @container relative flex h-6 cursor-ew-resize touch-none items-center rounded-full outline-none focus-visible:ring-[3px]'
      >
        <span className='bg-foreground/10 h-1 w-full rounded-full' />
        {Array.from({ length: count }, (_, tick) => (
          <span
            key={tick}
            aria-hidden='true'
            style={{ left: `${shareOf(tick, count) * 100}%` }}
            className='bg-foreground/25 absolute top-1/2 -mt-[3px] -ml-[3px] size-1.5 rounded-full'
          />
        ))}
        <span
          aria-hidden='true'
          style={thumbStyle}
          className='keycap-3d absolute top-1/2 left-0 -mt-2 -ml-2 size-4 rounded-full transition-[translate] duration-150 ease-(--ease-out-strong)'
        />
      </div>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {label}
        </span>
        <div className='flex items-center gap-1.5'>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            Back to now
            <Kbd>Esc</Kbd>
          </Button>
          <Button size='sm' onClick={onKeep}>
            Keep this version
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Textarea20() {
  const id = useId();
  const [text, setText] = useState(FINAL_TEXT);
  const [history, setHistory] = useState(VERSIONS);
  const [rewindIndex, setRewindIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const sliderRef = useRef<HTMLDivElement>(null);
  const heldUndo = useRef({ isHeld: false, repeats: 0 });
  const { pressed, press } = usePress<'rewind'>();
  const frames = framesOf(history, text);
  const count = frames.length;
  const isRewinding = rewindIndex !== null;
  const shownIndex = rewindIndex ?? count - 1;
  const shownText = frames[shownIndex];
  const canRewind = count > 1;

  useEffect(() => {
    if (isRewinding) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHistory((current) => withSnapshot(current, text));
    }, SNAPSHOT_MS);
    return () => window.clearTimeout(timer);
  }, [text, isRewinding]);

  function openRewind(index: number) {
    setRewindIndex(clampedIndex(index, count));
  }

  function keepVersion() {
    if (rewindIndex === null) {
      return;
    }
    setText(frames[rewindIndex]);
    setRewindIndex(null);
  }

  function cancelRewind() {
    setRewindIndex(null);
  }

  function openFromButton() {
    if (isRewinding) {
      cancelRewind();
      return;
    }
    flushSync(() => openRewind(count - 2));
    sliderRef.current?.focus();
    setAnnouncement(versionLabelOf(count - 2, count));
  }

  function changeText(event: ChangeEvent<HTMLTextAreaElement>) {
    setText(event.currentTarget.value);
  }

  function holdUndo(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape' && isRewinding) {
      event.preventDefault();
      cancelRewind();
      return;
    }
    if (!isUndoKey(event)) {
      return;
    }
    event.preventDefault();
    if (event.shiftKey || !canRewind) {
      return;
    }
    const held = heldUndo.current;
    if (!held.isHeld) {
      held.isHeld = true;
      held.repeats = 0;
      openRewind(count - 2);
      return;
    }
    held.repeats += 1;
    const isStepDue = held.repeats % HELD_UNDO_REPEATS_PER_STEP === 0;
    if (isStepDue && rewindIndex !== null) {
      openRewind(rewindIndex - 1);
    }
  }

  function releaseUndo(event: KeyboardEvent<HTMLTextAreaElement>) {
    const held = heldUndo.current;
    if (!held.isHeld) {
      return;
    }
    const releasesUndo =
      isUndoKey(event) || event.key === 'Meta' || event.key === 'Control';
    if (!releasesUndo) {
      return;
    }
    held.isHeld = false;
    keepVersion();
  }

  function startWriting() {
    setHistory([]);
    setRewindIndex(null);
    setText('');
  }

  function startOver() {
    setHistory(VERSIONS);
    setRewindIndex(null);
    setText(FINAL_TEXT);
  }

  const steps: AutoplayStep[] = [
    { after: 2600, run: startWriting },
    ...typingSteps(FIRST_SENTENCE, setText, {
      startAfter: 500,
      characterMs: 34,
    }),
    { after: 1100, run: hold },
    ...typingSteps(
      ` ${SECOND_SENTENCE}`,
      (typed) => setText(`${FIRST_SENTENCE}${typed}`),
      { startAfter: 200, characterMs: 30 }
    ),
    { after: 1100, run: hold },
    { after: 200, run: () => setText(SECOND_SENTENCE) },
    { after: 1100, run: hold },
    ...typingSteps(
      ` ${THIRD_SENTENCE}`,
      (typed) => setText(`${SECOND_SENTENCE}${typed}`),
      { startAfter: 200, characterMs: 30 }
    ),
    { after: 1200, run: hold },
    { after: 400, run: () => press('rewind') },
    { after: PRESS_LEAD_MS, run: () => openRewind(count - 2) },
    { after: 900, run: () => setRewindIndex(count - 3) },
    { after: 900, run: () => setRewindIndex(count - 4) },
    { after: 2600, run: cancelRewind },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 3000,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[15rem] w-full max-w-sm flex-col gap-2'
    >
      <div className='flex items-center justify-between gap-2'>
        <Label htmlFor={id}>Standup notes</Label>
        <Button
          variant='ghost'
          size='sm'
          disabled={!canRewind}
          aria-expanded={isRewinding}
          onClick={openFromButton}
          className={cn(
            'text-muted-foreground hover:text-foreground -me-2',
            pressedQuietOf(pressed === 'rewind')
          )}
        >
          <HistoryIcon className='size-3.5' />
          Rewind
        </Button>
      </div>
      <div className='grid'>
        <Textarea
          id={id}
          value={text}
          readOnly={isRewinding}
          onChange={changeText}
          onKeyDown={holdUndo}
          onKeyUp={releaseUndo}
          placeholder='Write a note'
          className={cn('col-start-1 row-start-1', isRewinding && 'opacity-0')}
        />
        {isRewinding && <RewindView shownText={shownText} nowText={text} />}
      </div>
      <Fold open={isRewinding}>
        <Scrubber
          index={shownIndex}
          count={count}
          sliderRef={sliderRef}
          onIndexChange={setRewindIndex}
          onKeep={keepVersion}
          onCancel={cancelRewind}
        />
      </Fold>
      <LiveRegion message={announcement} />
    </div>
  );
}
