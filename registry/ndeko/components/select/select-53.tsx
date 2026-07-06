'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { nounOf } from '@/registry/ndeko/lib/words';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Card } from '@/registry/ndeko/ui/card';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { InlineListbox, type ListOption } from './_parts/inline-listbox';
import {
  useInlineListbox,
  type InlineListboxControl,
} from './_parts/use-inline-listbox';

const WORD = [
  'text-foreground relative inline-flex cursor-pointer items-center rounded-md px-1 font-medium select-none',
  'decoration-foreground/30 underline decoration-dotted underline-offset-[6px] outline-none',
  'transition-colors duration-150 hover:bg-foreground/5',
  'focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

const HELD_WORD = 'bg-foreground/10';

const VIEWPORT_MARGIN_PX = 12;

function heldOf(isHeld: boolean) {
  if (isHeld) {
    return HELD_WORD;
  }
  return undefined;
}

function labelOfValue(options: readonly ListOption[], value: string) {
  const option = options.find((candidate) => candidate.value === value);
  if (option) {
    return option.label;
  }
  return '';
}

function enterShiftOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return -4;
}

type ChoiceWordProps = InlineListboxControl & {
  label: string;
};

function ChoiceWord({ label, ...control }: ChoiceWordProps) {
  const { options, value } = control;
  const popupRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const {
    listId,
    rootRef,
    isOpen,
    activeValue,
    controlsId,
    activeId,
    openAround,
    close,
    pick,
    changeHighlight,
    handleKey,
  } = useInlineListbox(control);
  const currentLabel = labelOfValue(options, value);

  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!popup) {
      return;
    }
    popup.style.left = '0px';
    const limit = document.documentElement.clientWidth - VIEWPORT_MARGIN_PX;
    const overflow = popup.getBoundingClientRect().right - limit;
    if (overflow > 0) {
      popup.style.left = `${-overflow}px`;
    }
  }, [isOpen]);

  function toggle() {
    if (isOpen) {
      close();
      return;
    }
    openAround();
  }

  const enter = { opacity: 0, y: enterShiftOf(shouldReduceMotion) };

  return (
    <span ref={rootRef} className='relative inline-block'>
      <button
        type='button'
        role='combobox'
        aria-label={`${label}: ${currentLabel}`}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={controlsId}
        aria-activedescendant={activeId}
        onClick={toggle}
        onKeyDown={handleKey}
        className={cn(WORD, heldOf(isOpen))}
      >
        {currentLabel}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.span
            ref={popupRef}
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className='absolute top-full left-0 z-30 mt-1.5 block min-w-40'
          >
            <InlineListbox
              id={listId}
              label={label}
              options={options}
              value={value}
              highlighted={activeValue}
              onHighlight={changeHighlight}
              onPick={pick}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

type Dial = {
  startX: number;
  startValue: number;
  hasMoved: boolean;
};

const DIAL_THRESHOLD_PX = 3;
const PAGE_STEPS = 10;

function clamped(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

type ScrubWordProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  pixelsPerStep: number;
  valueText: string;
  onValueChange: (value: number) => void;
  isDialing?: boolean;
  children: React.ReactNode;
};

function ScrubWord({
  label,
  value,
  min,
  max,
  pixelsPerStep,
  valueText,
  onValueChange,
  isDialing = false,
  children,
}: ScrubWordProps) {
  const dial = useRef<Dial | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isHeld = isDragging || isDialing;

  function change(next: number) {
    const bounded = clamped(next, min, max);
    if (bounded !== value) {
      onValueChange(bounded);
    }
  }

  function startDial(event: PointerEvent<HTMLSpanElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dial.current = {
      startX: event.clientX,
      startValue: value,
      hasMoved: false,
    };
    setIsDragging(true);
  }

  function moveDial(event: PointerEvent<HTMLSpanElement>) {
    const start = dial.current;
    if (!start) {
      return;
    }
    const travel = event.clientX - start.startX;
    if (Math.abs(travel) >= DIAL_THRESHOLD_PX) {
      start.hasMoved = true;
    }
    if (!start.hasMoved) {
      return;
    }
    const steps = Math.round(travel / pixelsPerStep);
    change(start.startValue + steps);
  }

  function endDial() {
    dial.current = null;
    setIsDragging(false);
  }

  function stepWithKeys(event: KeyboardEvent<HTMLSpanElement>) {
    const decrease = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    const increase = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    if (decrease) {
      change(value - 1);
    }
    if (increase) {
      change(value + 1);
    }
    if (event.key === 'PageDown') {
      change(value - PAGE_STEPS);
    }
    if (event.key === 'PageUp') {
      change(value + PAGE_STEPS);
    }
    if (event.key === 'Home') {
      change(min);
    }
    if (event.key === 'End') {
      change(max);
    }
    const isHandled = [
      'ArrowLeft',
      'ArrowDown',
      'ArrowRight',
      'ArrowUp',
      'PageDown',
      'PageUp',
      'Home',
      'End',
    ].includes(event.key);
    if (isHandled) {
      event.preventDefault();
    }
  }

  return (
    <span
      role='spinbutton'
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onPointerDown={startDial}
      onPointerMove={moveDial}
      onPointerUp={endDial}
      onPointerCancel={endDial}
      onKeyDown={stepWithKeys}
      className={cn(WORD, 'cursor-ew-resize touch-none', heldOf(isHeld))}
    >
      {children}
    </span>
  );
}

type Frequency = 'day' | 'week' | 'month';

type Scope = 'all' | 'active' | 'one';

type Rule = {
  frequency: Frequency;
  hour: number;
  copies: number;
  scope: Scope;
};

const FREQUENCIES: ListOption[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

const SCOPES: ListOption[] = [
  { value: 'all', label: 'all projects' },
  { value: 'active', label: 'active projects' },
  { value: 'one', label: 'this project' },
];

const GIGABYTES_PER_COPY: Record<Scope, number> = {
  all: 4.2,
  active: 2.4,
  one: 0.8,
};

const MIN_COPIES = 1;
const MAX_COPIES = 90;
const LAST_HOUR = 23;

const RESTING_RULE: Rule = {
  frequency: 'day',
  hour: 2,
  copies: 30,
  scope: 'all',
};

function isFrequency(value: string): value is Frequency {
  return FREQUENCIES.some((option) => option.value === value);
}

function isScope(value: string): value is Scope {
  return SCOPES.some((option) => option.value === value);
}

function hourTextOf(hour: number) {
  const padded = String(hour).padStart(2, '0');
  return `${padded}:00`;
}

function storedGigabytesOf(rule: Rule) {
  const perCopy = GIGABYTES_PER_COPY[rule.scope];
  return Math.round(perCopy * rule.copies);
}

/** The numbers stay the same words while they change, so only the digits roll. */
function explanationOf(rule: Rule): WordRollWord[] {
  const stored = storedGigabytesOf(rule);
  const unit = nounOf(rule.copies, rule.frequency);
  const copiesWord = {
    key: 'copies',
    text: String(rule.copies),
    node: <MotionNumber value={rule.copies} />,
  };
  const storedWord = {
    key: 'stored',
    text: `${stored} GB`,
    node: <MotionNumber value={stored} suffix=' GB' />,
  };
  return [
    'Restores',
    'the',
    'last',
    copiesWord,
    unit,
    '·',
    'about',
    storedWord,
  ];
}

function spokenRuleOf(rule: Rule) {
  const frequency = rule.frequency;
  const time = hourTextOf(rule.hour);
  const copies = rule.copies;
  const copyNoun = nounOf(copies, 'copy', 'copies');
  const scope = labelOfValue(SCOPES, rule.scope);
  return `Back up every ${frequency} at ${time} and keep ${copies} ${copyNoun} for ${scope}`;
}

type WordId = 'frequency' | 'scope';

const NO_HIGHLIGHTS: Record<WordId, string | null> = {
  frequency: null,
  scope: null,
};

type DialId = 'hour' | 'copies';

export default function Select53() {
  const [rule, setRule] = useState(RESTING_RULE);
  const [openId, setOpenId] = useState<WordId | null>(null);
  const [highlights, setHighlights] = useState(NO_HIGHLIGHTS);
  const [dialing, setDialing] = useState<DialId | null>(null);
  const [announcement, setAnnouncement] = useState('');

  function highlightFor(id: WordId, value: string | null) {
    setHighlights((current) => ({ ...current, [id]: value }));
  }

  function openList(id: WordId) {
    setOpenId(id);
    highlightFor(id, rule[id]);
  }

  function changeOpen(id: WordId, isOpen: boolean) {
    if (isOpen) {
      setOpenId(id);
      return;
    }
    setOpenId((current) => {
      if (current === id) {
        return null;
      }
      return current;
    });
  }

  function setFrequency(value: string) {
    if (isFrequency(value)) {
      setRule((current) => ({ ...current, frequency: value }));
    }
  }

  function setScope(value: string) {
    if (isScope(value)) {
      setRule((current) => ({ ...current, scope: value }));
    }
  }

  function setHour(hour: number) {
    setRule((current) => ({ ...current, hour }));
  }

  function setCopies(copies: number) {
    setRule((current) => ({ ...current, copies }));
  }

  function pickFromDemo(id: WordId, value: string) {
    if (id === 'frequency') {
      setFrequency(value);
    }
    if (id === 'scope') {
      setScope(value);
    }
    setOpenId(null);
    highlightFor(id, null);
  }

  function announceFor(next: Rule) {
    setAnnouncement(spokenRuleOf(next));
  }

  function chooseFrequency(value: string) {
    if (!isFrequency(value)) {
      return;
    }
    setFrequency(value);
    announceFor({ ...rule, frequency: value });
  }

  function chooseScope(value: string) {
    if (!isScope(value)) {
      return;
    }
    setScope(value);
    announceFor({ ...rule, scope: value });
  }

  function dialSteps(values: number[], write: (value: number) => void) {
    return values.map((value) => ({ after: 130, run: () => write(value) }));
  }

  function startOver() {
    setRule(RESTING_RULE);
    setOpenId(null);
    setHighlights(NO_HIGHLIGHTS);
    setDialing(null);
  }

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => openList('frequency') },
    { after: 900, run: () => highlightFor('frequency', 'week') },
    { after: 700, run: () => pickFromDemo('frequency', 'week') },
    { after: 1500, run: () => setDialing('copies') },
    ...dialSteps([33, 36, 39, 42, 45, 48], setCopies),
    { after: 500, run: () => setDialing(null) },
    { after: 1300, run: () => setDialing('hour') },
    ...dialSteps([3, 4, 5], setHour),
    { after: 500, run: () => setDialing(null) },
    { after: 1300, run: () => openList('scope') },
    { after: 900, run: () => highlightFor('scope', 'active') },
    { after: 700, run: () => pickFromDemo('scope', 'active') },
    { after: 1800, run: hold },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: startOver,
  });

  useKeptHeight(ref);

  const copyNoun = nounOf(rule.copies, 'copy', 'copies');
  const hourText = hourTextOf(rule.hour);

  return (
    <div ref={ref} className='min-h-[18rem] w-full max-w-md pb-10'>
      <Card className='gap-4 px-5'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs font-medium'>
            Backup rule
          </span>
          <Badge variant='secondary'>Illustrative</Badge>
        </div>
        <div
          role='group'
          aria-label='Backup rule'
          className='text-muted-foreground text-lg leading-10'
        >
          Back up every{' '}
          <ChoiceWord
            label='Frequency'
            options={FREQUENCIES}
            value={rule.frequency}
            onValueChange={chooseFrequency}
            open={openId === 'frequency'}
            onOpenChange={(isOpen) => changeOpen('frequency', isOpen)}
            highlighted={highlights.frequency}
            onHighlightedChange={(value) => highlightFor('frequency', value)}
          />{' '}
          at{' '}
          <ScrubWord
            label='Time of day'
            value={rule.hour}
            min={0}
            max={LAST_HOUR}
            pixelsPerStep={14}
            valueText={hourText}
            onValueChange={setHour}
            isDialing={dialing === 'hour'}
          >
            <MotionNumber
              value={rule.hour}
              format={{ minimumIntegerDigits: 2 }}
              suffix=':00'
            />
          </ScrubWord>{' '}
          and keep{' '}
          <ScrubWord
            label='Copies to keep'
            value={rule.copies}
            min={MIN_COPIES}
            max={MAX_COPIES}
            pixelsPerStep={4}
            valueText={`${rule.copies} ${copyNoun}`}
            onValueChange={setCopies}
            isDialing={dialing === 'copies'}
          >
            <MotionNumber value={rule.copies} />
          </ScrubWord>{' '}
          {copyNoun} for{' '}
          <ChoiceWord
            label='Projects'
            options={SCOPES}
            value={rule.scope}
            onValueChange={chooseScope}
            open={openId === 'scope'}
            onOpenChange={(isOpen) => changeOpen('scope', isOpen)}
            highlighted={highlights.scope}
            onHighlightedChange={(value) => highlightFor('scope', value)}
          />
        </div>
        <div className='flex flex-col gap-1'>
          <WordRoll words={explanationOf(rule)} className='text-sm' />
          <p className='text-muted-foreground text-xs'>
            Tap a word to pick another, drag a number sideways to dial it
          </p>
        </div>
      </Card>
      <LiveRegion message={announcement} />
    </div>
  );
}
