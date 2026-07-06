'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type PointerEvent } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { ChevronsUpDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import {
  indexOfOption,
  InlineListbox,
  LISTBOX_PADDING_PX,
  OPTION_HEIGHT_PX,
  optionValueAt,
  type ListOption,
} from './_parts/inline-listbox';
import {
  useInlineListbox,
  type InlineListboxControl,
} from './_parts/use-inline-listbox';

const SLIDE_THRESHOLD_PX = 6;

const TRIGGER = [
  'bg-card hairline-ring ring-foreground/12 flex h-8 w-full cursor-pointer touch-none items-center justify-between gap-2 rounded-md px-2 text-[13px] shadow-[0_1px_2px_rgb(0_0_0/0.05)]',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15 outline-none select-none',
  'focus-visible:ring-ring/25 focus-visible:ring-[3px]',
].join(' ');

type Press = {
  x: number;
  y: number;
  hasSlid: boolean;
};

function labelOfValue(options: readonly ListOption[], value: string) {
  const option = options.find((candidate) => candidate.value === value);
  if (option) {
    return option.label;
  }
  return '';
}

function listTopOf(index: number) {
  const rowsAbove = index * OPTION_HEIGHT_PX;
  return -(LISTBOX_PADDING_PX + rowsAbove);
}

function originYOf(index: number) {
  const rowsAbove = index * OPTION_HEIGHT_PX;
  const rowCenter = OPTION_HEIGHT_PX / 2;
  return LISTBOX_PADDING_PX + rowsAbove + rowCenter;
}

function enterScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.96;
}

export type SlideSelectProps = InlineListboxControl & {
  label: string;
  className?: string;
};

export function SlideSelect({
  label,
  className,
  ...control
}: SlideSelectProps) {
  const { options, value } = control;
  const listboxRef = useRef<HTMLDivElement>(null);
  const press = useRef<Press | null>(null);
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
  const currentIndex = indexOfOption(options, value);
  const currentLabel = labelOfValue(options, value);

  function startPress(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { x: event.clientX, y: event.clientY, hasSlid: false };
    openAround();
  }

  function slidePress(event: PointerEvent<HTMLButtonElement>) {
    const start = press.current;
    if (!start) {
      return;
    }
    const travel = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (travel > SLIDE_THRESHOLD_PX) {
      start.hasSlid = true;
    }
    if (!start.hasSlid) {
      return;
    }
    const under = optionValueAt(
      listboxRef.current,
      event.clientX,
      event.clientY
    );
    changeHighlight(under);
  }

  function endPress(event: PointerEvent<HTMLButtonElement>) {
    const start = press.current;
    press.current = null;
    if (!start || !start.hasSlid) {
      return;
    }
    const under = optionValueAt(
      listboxRef.current,
      event.clientX,
      event.clientY
    );
    if (under === null) {
      close();
      return;
    }
    pick(under);
  }

  function cancelPress() {
    press.current = null;
    close();
  }

  const enter = { opacity: 0, scale: enterScaleOf(shouldReduceMotion) };
  const listStyle = {
    top: listTopOf(currentIndex),
    left: -LISTBOX_PADDING_PX,
    right: -LISTBOX_PADDING_PX,
    transformOrigin: `50% ${originYOf(currentIndex)}px`,
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type='button'
        role='combobox'
        aria-label={label}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={controlsId}
        aria-activedescendant={activeId}
        onPointerDown={startPress}
        onPointerMove={slidePress}
        onPointerUp={endPress}
        onPointerCancel={cancelPress}
        onKeyDown={handleKey}
        className={TRIGGER}
      >
        <Swap swapKey={value} className='min-w-0'>
          <span className='truncate'>{currentLabel}</span>
        </Swap>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            style={listStyle}
            initial={enter}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className='absolute z-30'
          >
            <InlineListbox
              id={listId}
              label={label}
              options={options}
              value={value}
              highlighted={activeValue}
              onHighlight={changeHighlight}
              onPick={pick}
              listboxRef={listboxRef}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type SettingId = 'repeat' | 'alert' | 'calendar';

type Setting = {
  id: SettingId;
  label: string;
  options: ListOption[];
};

const SETTINGS: Setting[] = [
  {
    id: 'repeat',
    label: 'Repeat',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'day', label: 'Every day' },
      { value: 'week', label: 'Every week' },
      { value: 'month', label: 'Every month' },
      { value: 'year', label: 'Every year' },
    ],
  },
  {
    id: 'alert',
    label: 'Alert',
    options: [
      { value: 'none', label: 'None' },
      { value: 'start', label: 'At time of event' },
      { value: '5', label: '5 minutes before' },
      { value: '15', label: '15 minutes before' },
      { value: '60', label: '1 hour before' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    options: [
      { value: 'work', label: 'Work' },
      { value: 'home', label: 'Home' },
      { value: 'family', label: 'Family' },
      { value: 'birthdays', label: 'Birthdays' },
    ],
  },
];

type Values = Record<SettingId, string>;

const NO_HIGHLIGHTS: Record<SettingId, string | null> = {
  repeat: null,
  alert: null,
  calendar: null,
};

const RESTING_VALUES: Values = {
  repeat: 'week',
  alert: '15',
  calendar: 'home',
};

export default function Select52() {
  const [values, setValues] = useState(RESTING_VALUES);
  const [openId, setOpenId] = useState<SettingId | null>(null);
  const [highlights, setHighlights] = useState(NO_HIGHLIGHTS);
  const [announcement, setAnnouncement] = useState('');

  function highlightFor(id: SettingId, value: string | null) {
    setHighlights((current) => ({ ...current, [id]: value }));
  }

  function openList(id: SettingId) {
    setOpenId(id);
    highlightFor(id, values[id]);
  }

  function pickFromDemo(id: SettingId, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
    setOpenId(null);
    highlightFor(id, null);
  }

  function changeFromPerson(setting: Setting, value: string) {
    const option = setting.options.find(
      (candidate) => candidate.value === value
    );
    setValues((current) => ({ ...current, [setting.id]: value }));
    if (option) {
      setAnnouncement(`${setting.label}: ${option.label}`);
    }
  }

  function changeOpen(id: SettingId, isOpen: boolean) {
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

  function startOver() {
    setValues(RESTING_VALUES);
    setOpenId(null);
    setHighlights(NO_HIGHLIGHTS);
  }

  const steps: AutoplayStep[] = [
    { after: 2400, run: () => openList('repeat') },
    { after: 900, run: () => highlightFor('repeat', 'month') },
    { after: 700, run: () => highlightFor('repeat', 'day') },
    { after: 900, run: () => pickFromDemo('repeat', 'day') },
    { after: 1800, run: () => openList('alert') },
    { after: 900, run: () => highlightFor('alert', '5') },
    { after: 700, run: () => highlightFor('alert', 'start') },
    { after: 900, run: () => pickFromDemo('alert', 'start') },
    { after: 1800, run: () => openList('calendar') },
    { after: 900, run: () => highlightFor('calendar', 'family') },
    { after: 900, run: () => pickFromDemo('calendar', 'family') },
    { after: 1600, run: hold },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2400,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='min-h-[22rem] w-full max-w-sm pt-4 pb-14'>
      <section
        aria-label='New event'
        className='bg-foreground/[0.025] rounded-xl p-1'
      >
        <h3 className='px-3 py-2.5 text-sm font-medium'>New event</h3>
        {SETTINGS.map((setting) => (
          <div
            key={setting.id}
            className='flex h-12 items-center justify-between gap-3 px-3'
          >
            <span className='text-[13px]'>{setting.label}</span>
            <SlideSelect
              label={setting.label}
              options={setting.options}
              value={values[setting.id]}
              onValueChange={(value) => changeFromPerson(setting, value)}
              open={openId === setting.id}
              onOpenChange={(isOpen) => changeOpen(setting.id, isOpen)}
              highlighted={highlights[setting.id]}
              onHighlightedChange={(value) => highlightFor(setting.id, value)}
              className='w-44'
            />
          </div>
        ))}
      </section>
      <LiveRegion message={announcement} />
    </div>
  );
}
