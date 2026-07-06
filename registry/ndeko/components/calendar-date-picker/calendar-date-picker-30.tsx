'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { addDays, addMonths } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type RefObject } from 'react';
import type { DateRange, Matcher } from 'react-day-picker';

import { WordRoll } from '@/components/core/word-roll';
import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useIsNarrow } from '@/registry/ndeko/hooks/use-is-narrow';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/registry/ndeko/lib/icons';
import { MENU_ITEM, POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { Label } from '@/registry/ndeko/ui/label';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';
import { Switch } from '@/registry/ndeko/ui/switch';

import { AnimatedCalendar } from './_parts/animated-calendar';
import {
  PERIOD_PRESETS,
  periodTextOf,
  previousPeriodOf,
  readPeriod,
  type Period,
} from './_parts/period-words';
import { useToday } from './_parts/today';

type Step = 'periods' | 'days';

type Selection =
  { kind: 'phrase'; phrase: string } | { kind: 'days'; from: Date; to: Date };

type PressKey = 'typed' | 'days' | 'apply';

const REST_SELECTION: Selection = { kind: 'phrase', phrase: 'last 30 days' };

const SWAP_SHIFT_PX = 10;

const NARROW_REM = 36;

const MARK = 'transition-[scale,opacity] duration-150 ease-(--ease-out-strong)';

function markStateOf(isSelected: boolean) {
  if (isSelected) {
    return 'scale-100 opacity-100';
  }
  return 'scale-75 opacity-0 duration-100';
}

function periodOfSelection(selection: Selection | null, today: Date | null) {
  if (selection === null || today === null) {
    return null;
  }
  if (selection.kind === 'days') {
    return { from: selection.from, to: selection.to };
  }
  return readPeriod(selection.phrase, today);
}

function rangeOfSelection(
  selection: Selection | null,
  today: Date | null
): DateRange | undefined {
  const period = periodOfSelection(selection, today);
  if (period === null) {
    return undefined;
  }
  return { from: period.from, to: period.to };
}

function isPhraseSelected(selection: Selection | null, phrase: string) {
  if (selection === null || selection.kind !== 'phrase') {
    return false;
  }
  return selection.phrase === phrase;
}

function textOfPeriod(period: Period | null, today: Date | null) {
  if (period === null || today === null) {
    return 'Pick a period';
  }
  return periodTextOf(period, today);
}

function capitalized(text: string) {
  const trimmed = text.trim();
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function isPreset(text: string) {
  const phrase = text.trim().toLowerCase();
  return PERIOD_PRESETS.some((preset) => preset.phrase === phrase);
}

function usePeriodPicker(today: Date | null) {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState<Step>('periods');
  const [stepShift, setStepShift] = useState(1);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<Selection | null>(REST_SELECTION);
  const [compare, setCompare] = useState(false);
  const [dayRange, setDayRange] = useState<DateRange | undefined>();
  const [applied, setApplied] = useState<Selection | null>(REST_SELECTION);
  const [appliedCompare, setAppliedCompare] = useState(false);
  const typedPeriod = readTypedPeriod(text, today);

  function openPanel() {
    setDraft(applied);
    setCompare(appliedCompare);
    setStep('periods');
    setText('');
    setDayRange(rangeOfSelection(applied, today));
    setIsOpen(true);
  }

  function changeOpen(next: boolean) {
    if (next) {
      openPanel();
      return;
    }
    setIsOpen(false);
  }

  function selectPhrase(phrase: string) {
    setDraft({ kind: 'phrase', phrase });
  }

  function selectTyped() {
    if (typedPeriod === null) {
      return;
    }
    setDraft({ kind: 'phrase', phrase: text.trim().toLowerCase() });
  }

  function chooseDays(range: DateRange | undefined) {
    setDayRange(range);
    if (range?.from && range?.to) {
      setDraft({ kind: 'days', from: range.from, to: range.to });
    }
  }

  function showDays() {
    setStepShift(1);
    setStep('days');
  }

  function showPeriods() {
    setStepShift(-1);
    setStep('periods');
  }

  function apply() {
    setApplied(draft);
    setAppliedCompare(compare);
    setIsOpen(false);
  }

  function cancel() {
    setIsOpen(false);
  }

  function reset() {
    setIsOpen(true);
    setStep('periods');
    setText('');
    setDraft(REST_SELECTION);
    setCompare(false);
    setDayRange(undefined);
    setApplied(REST_SELECTION);
    setAppliedCompare(false);
  }

  return {
    isOpen,
    step,
    stepShift,
    text,
    changeText: setText,
    typedPeriod,
    draft,
    compare,
    changeCompare: setCompare,
    dayRange,
    applied,
    appliedCompare,
    changeOpen,
    selectPhrase,
    selectTyped,
    chooseDays,
    showDays,
    showPeriods,
    apply,
    cancel,
    reset,
  };
}

function readTypedPeriod(text: string, today: Date | null) {
  if (today === null) {
    return null;
  }
  return readPeriod(text, today);
}

type PeriodPickerState = ReturnType<typeof usePeriodPicker>;

type PeriodRowProps = {
  label: string;
  dates: string;
  isSelected: boolean;
  isPressed?: boolean;
  onSelect: () => void;
};

function PeriodRow({
  label,
  dates,
  isSelected,
  isPressed = false,
  onSelect,
}: PeriodRowProps) {
  return (
    <li>
      <button
        type='button'
        aria-pressed={isSelected}
        onClick={onSelect}
        className={cn(
          MENU_ITEM,
          'hover:bg-foreground/5 cursor-pointer justify-between gap-3 pr-1.5',
          pressedQuietOf(isPressed)
        )}
      >
        <span className='truncate'>{label}</span>
        <span className='text-muted-foreground flex shrink-0 items-center gap-2 text-xs tabular-nums'>
          {dates}
          <SelectedMark className={cn(MARK, markStateOf(isSelected))} />
        </span>
      </button>
    </li>
  );
}

type PanelProps = {
  picker: PeriodPickerState;
  today: Date | null;
  isTwoUp: boolean;
  pressed: PressKey | null;
};

function triggerLabelOf(today: Date | null, text: string) {
  if (today === null) {
    return <span>{text}</span>;
  }
  return <WordRoll text={text} />;
}

function readsAsOf(
  text: string,
  typedPeriod: Period | null,
  today: Date | null
) {
  if (text.trim() === '') {
    return 'Try “last 2 weeks”, “Q3” or “since sep 3”';
  }
  if (typedPeriod === null || today === null) {
    return 'Can’t read that yet';
  }
  return `Reads as ${periodTextOf(typedPeriod, today)}`;
}

function PeriodsStep({ picker, today, pressed }: PanelProps) {
  const { text, changeText, typedPeriod, draft, selectPhrase, selectTyped } =
    picker;
  const readsAs = readsAsOf(text, typedPeriod, today);
  const showsTypedRow = typedPeriod !== null && !isPreset(text);
  const typedPhrase = text.trim().toLowerCase();

  function selectOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    selectTyped();
  }

  return (
    <div className='flex w-[min(20rem,calc(100vw-4rem))] flex-col gap-2'>
      <Input
        aria-label='Period'
        value={text}
        onChange={(event) => changeText(event.currentTarget.value)}
        onKeyDown={selectOnEnter}
        placeholder='Type a period'
        autoComplete='off'
        spellCheck={false}
      />
      <div className='text-muted-foreground flex min-h-4 items-center px-0.5 text-xs'>
        <WordRoll text={readsAs} />
      </div>
      <ul className='flex flex-col'>
        {showsTypedRow && typedPeriod && (
          <PeriodRow
            label={capitalized(text)}
            dates={textOfPeriod(typedPeriod, today)}
            isSelected={isPhraseSelected(draft, typedPhrase)}
            isPressed={pressed === 'typed'}
            onSelect={selectTyped}
          />
        )}
        {PERIOD_PRESETS.map((preset) => (
          <PeriodRow
            key={preset.phrase}
            label={preset.label}
            dates={textOfPeriod(readTypedPeriod(preset.phrase, today), today)}
            isSelected={isPhraseSelected(draft, preset.phrase)}
            onSelect={() => selectPhrase(preset.phrase)}
          />
        ))}
      </ul>
    </div>
  );
}

function DaysStep({ picker, today, isTwoUp }: PanelProps) {
  const { dayRange, chooseDays, showPeriods, draft } = picker;
  const monthCount = twoUpCountOf(isTwoUp);
  const firstShownMonth = firstShownMonthOf(today, monthCount);
  const futureMatcher = futureMatcherOf(today);
  const draftText = textOfPeriod(periodOfSelection(draft, today), today);
  const calendarKey = `${monthCount}`;

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center justify-between gap-3'>
        <Button
          variant='ghost'
          size='sm'
          onClick={showPeriods}
          className='-ms-2'
        >
          <ChevronLeftIcon className='size-3.5' />
          Periods
        </Button>
        <span className='text-muted-foreground text-xs tabular-nums'>
          <WordRoll text={draftText} />
        </span>
      </div>
      <AnimatedCalendar
        key={calendarKey}
        mode='range'
        numberOfMonths={monthCount}
        selected={dayRange}
        onSelect={chooseDays}
        defaultMonth={firstShownMonth}
        disabled={futureMatcher}
      />
    </div>
  );
}

function firstShownMonthOf(today: Date | null, monthCount: number) {
  if (today === null) {
    return undefined;
  }
  return addMonths(today, -(monthCount - 1));
}

function futureMatcherOf(today: Date | null): Matcher | undefined {
  if (today === null) {
    return undefined;
  }
  return { after: today };
}

function twoUpCountOf(isTwoUp: boolean) {
  if (isTwoUp) {
    return 2;
  }
  return 1;
}

function stepVariantsOf(shouldReduceMotion: boolean | null) {
  const shift = SWAP_SHIFT_PX;
  if (shouldReduceMotion) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      leave: { opacity: 0 },
    };
  }
  return {
    enter: (direction: number) => ({ opacity: 0, x: direction * shift }),
    center: { opacity: 1, x: 0 },
    leave: (direction: number) => ({ opacity: 0, x: -direction * shift }),
  };
}

function PanelFooter({
  picker,
  today,
  pressed,
}: Pick<PanelProps, 'picker' | 'today' | 'pressed'>) {
  const compareId = useId();
  const { compare, changeCompare, draft, apply, cancel } = picker;
  const period = periodOfSelection(draft, today);
  const hasPeriod = period !== null;
  const showsPrevious = compare && hasPeriod && today !== null;
  let previousText = '';
  if (period !== null && today !== null) {
    previousText = periodTextOf(previousPeriodOf(period), today);
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center justify-between gap-3'>
        <Label htmlFor={compareId} className='font-normal'>
          Compare with previous period
        </Label>
        <Switch
          id={compareId}
          checked={compare}
          onCheckedChange={changeCompare}
        />
      </div>
      <Fold open={showsPrevious}>
        <p className='text-muted-foreground flex gap-1 text-xs'>
          Previous
          <WordRoll text={previousText} className='text-foreground' />
        </p>
      </Fold>
      <div className='flex justify-end gap-2'>
        <Button variant='ghost' size='sm' onClick={cancel}>
          Cancel
        </Button>
        <Button
          size='sm'
          disabled={!hasPeriod}
          onClick={apply}
          className={pressedQuietOf(pressed === 'apply')}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

type PeriodPickerProps = {
  picker: PeriodPickerState;
  today: Date | null;
  /** The element the panel is drawn in, so it stays inside the component. */
  container: RefObject<HTMLElement | null>;
  isTwoUp: boolean;
  /** True while a demonstration plays: it neither takes the focus nor gives it back. */
  isDemonstrating: boolean;
  pressed?: PressKey | null;
};

export function PeriodPicker({
  picker,
  today,
  container,
  isTwoUp,
  isDemonstrating,
  pressed = null,
}: PeriodPickerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = stepVariantsOf(shouldReduceMotion);
  const keepsFocus = !isDemonstrating;
  const appliedPeriod = periodOfSelection(picker.applied, today);
  const triggerText = textOfPeriod(appliedPeriod, today);
  let previousText = '';
  if (appliedPeriod !== null && today !== null) {
    previousText = periodTextOf(previousPeriodOf(appliedPeriod), today);
  }
  const showsComparison = picker.appliedCompare && appliedPeriod !== null;
  const panelProps = { picker, today, isTwoUp, pressed };

  return (
    <PopoverPrimitive.Root
      open={picker.isOpen}
      onOpenChange={picker.changeOpen}
    >
      <div className='flex w-full max-w-xs flex-col gap-1.5'>
        <PopoverPrimitive.Trigger
          render={
            <Button
              variant='outline'
              className='w-full justify-between font-normal'
              aria-label={`Period: ${triggerText}`}
            />
          }
        >
          {triggerLabelOf(today, triggerText)}
          <CalendarIcon className='text-muted-foreground size-4' />
        </PopoverPrimitive.Trigger>
        <Fold open={showsComparison}>
          <p className='text-muted-foreground flex gap-1 px-1 text-xs'>
            Compared with
            <WordRoll text={previousText} className='text-foreground' />
          </p>
        </Fold>
      </div>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Positioner
          side='bottom'
          align='start'
          sideOffset={6}
          className='z-50'
        >
          <PopoverPrimitive.Popup
            initialFocus={false}
            finalFocus={keepsFocus}
            className={cn(
              'surface-raised max-w-(--available-width) rounded-xl p-3 text-[13px] outline-none',
              POPUP_TRANSITION
            )}
          >
            <AnimatedSize axis='both'>
              <div className='flex flex-col gap-3'>
                <div className='relative'>
                  <AnimatePresence
                    mode='popLayout'
                    initial={false}
                    custom={picker.stepShift}
                  >
                    <motion.div
                      key={picker.step}
                      custom={picker.stepShift}
                      variants={variants}
                      initial='enter'
                      animate='center'
                      exit='leave'
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      {picker.step === 'periods' && (
                        <PeriodsStep {...panelProps} />
                      )}
                      {picker.step === 'days' && <DaysStep {...panelProps} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
                {picker.step === 'periods' && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={picker.showDays}
                    className={cn(
                      'justify-between',
                      pressedQuietOf(pressed === 'days')
                    )}
                  >
                    Pick exact days
                    <ChevronRightIcon className='size-3.5 opacity-60' />
                  </Button>
                )}
                <PanelFooter picker={picker} today={today} pressed={pressed} />
              </div>
            </AnimatedSize>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default function CalendarDatePicker30() {
  const today = useToday();
  const picker = usePeriodPicker(today);
  const { pressed, press } = usePress<PressKey>();

  function chooseDemoDays(isComplete: boolean) {
    if (today === null) {
      return;
    }
    const from = addDays(today, -12);
    if (!isComplete) {
      picker.chooseDays({ from, to: undefined });
      return;
    }
    picker.chooseDays({ from, to: addDays(today, -4) });
  }

  const steps: AutoplayStep[] = [
    { after: 2400, run: hold },
    ...typingSteps('since sep 3', picker.changeText, {
      startAfter: 400,
      characterMs: 70,
    }),
    { after: 900, run: () => press('typed') },
    { after: PRESS_LEAD_MS, run: picker.selectTyped },
    { after: 1500, run: () => picker.changeCompare(true) },
    { after: 1800, run: () => press('days') },
    { after: PRESS_LEAD_MS, run: picker.showDays },
    { after: 1400, run: () => chooseDemoDays(false) },
    { after: 700, run: () => chooseDemoDays(true) },
    { after: 1600, run: () => press('apply') },
    { after: PRESS_LEAD_MS, run: picker.apply },
    { after: 3000, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1800,
    onReset: picker.reset,
  });
  const isNarrow = useIsNarrow(ref, NARROW_REM);

  useKeptHeight(ref);

  return (
    <div ref={ref} className='relative min-h-[34rem] w-full max-w-2xl'>
      <PeriodPicker
        picker={picker}
        today={today}
        container={ref}
        isTwoUp={!isNarrow}
        isDemonstrating={isAutoplaying}
        pressed={pressed}
      />
    </div>
  );
}
