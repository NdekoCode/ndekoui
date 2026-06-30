'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useId, useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import {
  CheckIcon,
  LoaderCircleIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Input, type InputProps } from '@/registry/ndeko/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';
import { Switch } from '@/registry/ndeko/ui/switch';

export const SETTINGS_SURFACE_BASE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

export const SETTINGS_SURFACE = `${SETTINGS_SURFACE_BASE} hairline-divide-y divide-border`;

const ROW_LABEL = 'text-[13px] font-medium';

const SAVE_DELAY_MS = 800;

const SAVED_HOLD_MS = 1100;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const THUMB_TRAVEL: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };

const INSTANT: Transition = { duration: 0 };

const ENTER: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const LEAVE: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const BAR_VARIANTS: Variants = {
  enter: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: ENTER },
  exit: { opacity: 0, y: 8, scale: 0.98, transition: LEAVE },
};

const PANEL_VARIANTS: Variants = {
  enter: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: ENTER },
};

const DOT_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.4 },
  visible: { opacity: 1, scale: 1, transition: ENTER },
  exit: { opacity: 0, scale: 0.4, transition: LEAVE },
};

const ERROR_VARIANTS: Variants = {
  enter: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: ENTER },
  exit: { height: 0, opacity: 0, transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: ENTER },
  exit: { opacity: 0, transition: LEAVE },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function barVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BAR_VARIANTS;
}

function panelVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return PANEL_VARIANTS;
}

function errorVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ERROR_VARIANTS;
}

export function describedByOf(hasError: boolean, errorId: string) {
  if (hasError) {
    return errorId;
  }
  return undefined;
}

function thumbTravelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return THUMB_TRAVEL;
}

function dotVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DOT_VARIANTS;
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

type SettingsValues = Record<string, unknown>;

function changedKeysOf<Values extends SettingsValues>(
  saved: Values,
  draft: Values
) {
  const keys = Object.keys(saved);
  return keys.filter((key) => !Object.is(saved[key], draft[key]));
}

/** An edit made while Saved is still showing starts a new round of changes. */
function statusAfterEditOf(current: SaveStatus): SaveStatus {
  if (current === 'saved') {
    return 'idle';
  }
  return current;
}

/**
 * Keeps the saved values and the draft apart. Saving stands in for a request with a fixed
 * delay, then holds the Saved state long enough to be read.
 */
export function useSettingsDraft<Values extends SettingsValues>(
  initialValues: Values
) {
  const [savedValues, setSavedValues] = useState(initialValues);
  const [draft, setDraft] = useState(initialValues);
  const [pending, setPending] = useState<Values | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const changedKeys = changedKeysOf(savedValues, draft);
  const hasChanges = changedKeys.length > 0;
  const isSettled = status === 'idle';
  const isBarShown = hasChanges || !isSettled;

  useEffect(() => {
    if (status !== 'saving') {
      return;
    }
    const timer = window.setTimeout(() => {
      if (pending) {
        setSavedValues(pending);
      }
      setStatus('saved');
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, pending]);

  useEffect(() => {
    if (status !== 'saved') {
      return;
    }
    const timer = window.setTimeout(() => setStatus('idle'), SAVED_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  function change<Key extends keyof Values>(key: Key, value: Values[Key]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setStatus(statusAfterEditOf);
  }

  function discard() {
    setDraft(savedValues);
  }

  function save() {
    if (status === 'saving') {
      return;
    }
    setPending(draft);
    setStatus('saving');
  }

  return {
    savedValues,
    draft,
    changedKeys,
    status,
    isBarShown,
    change,
    discard,
    save,
  };
}

export function hasChangeIn(changedKeys: string[], sectionKeys: string[]) {
  return sectionKeys.some((key) => changedKeys.includes(key));
}

type SettingsPageProps = {
  title: string;
  line: string;
  bar: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsPage({
  title,
  line,
  bar,
  children,
}: SettingsPageProps) {
  return (
    <div className='bg-background text-foreground flex min-h-dvh w-full flex-col'>
      <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 md:gap-8 md:px-6 md:py-10'>
        <header className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {title}
          </h1>
          <p className='text-muted-foreground text-[13px] text-pretty'>
            {line}
          </p>
        </header>
        {children}
      </div>
      {bar}
    </div>
  );
}

export type NavItem<Id extends string> = {
  id: Id;
  label: string;
  icon: Icon;
  hasChanges: boolean;
};

function UnsavedDot({ isShown }: { isShown: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const variants = dotVariantsOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.span
          key='dot'
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          className='bg-primary ml-auto size-1.5 shrink-0 rounded-full'
        >
          <span className='sr-only'>Unsaved changes</span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

type SectionTabsProps<Id extends string> = {
  label: string;
  items: NavItem<Id>[];
  value: Id;
  onValueChange: (id: Id) => void;
  children: React.ReactNode;
};

/** Sections as tabs: a rail beside the column on wide screens, a row above it on phones. One highlight travels between them. */
export function SectionTabs<Id extends string>({
  label,
  items,
  value,
  onValueChange,
  children,
}: SectionTabsProps<Id>) {
  function changeValue(nextValue: unknown) {
    const item = items.find((candidate) => candidate.id === nextValue);
    if (item) {
      onValueChange(item.id);
    }
  }

  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={changeValue}
      orientation='vertical'
      className='flex flex-col gap-6 md:grid md:grid-cols-[11rem_minmax(0,42rem)] md:items-start md:gap-10'
    >
      <TabsPrimitive.List
        aria-label={label}
        className='relative -mx-4 flex gap-1 overflow-x-auto px-4 md:sticky md:top-10 md:mx-0 md:flex-col md:overflow-visible md:px-0'
      >
        {items.map((item) => {
          const ItemIcon = item.icon;

          return (
            <TabsPrimitive.Tab
              key={item.id}
              value={item.id}
              className='text-muted-foreground hover:text-foreground data-active:text-foreground focus-visible:ring-ring/25 relative z-10 flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px] [&_svg]:size-4 [&_svg]:shrink-0'
            >
              <ItemIcon />
              {item.label}
              <UnsavedDot isShown={item.hasChanges} />
            </TabsPrimitive.Tab>
          );
        })}
        <TabsPrimitive.Indicator className='bg-foreground/[0.06] pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top) rounded-md transition-[translate,width,height] duration-[250ms] ease-(--ease-in-out-strong)' />
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

type SectionPanelProps = {
  value: string;
  /** False on the section shown at first, so nothing moves on load. */
  animatesIn: boolean;
  children: React.ReactNode;
};

function panelInitialOf(animatesIn: boolean) {
  if (animatesIn) {
    return 'enter';
  }
  return false;
}

export function SectionPanel({
  value,
  animatesIn,
  children,
}: SectionPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = panelVariantsOf(shouldReduceMotion);
  const initial = panelInitialOf(animatesIn);

  return (
    <TabsPrimitive.Panel
      value={value}
      className='focus-visible:ring-ring/25 rounded-xl outline-none focus-visible:ring-[3px]'
    >
      <motion.div
        variants={variants}
        initial={initial}
        animate='visible'
        className='flex flex-col gap-8'
      >
        {children}
      </motion.div>
    </TabsPrimitive.Panel>
  );
}

type SettingsSectionProps = {
  title: string;
  line?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  line,
  action,
  children,
}: SettingsSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-0.5'>
          <h2 id={headingId} className='text-sm font-medium'>
            {title}
          </h2>
          {line && <p className='text-muted-foreground text-xs'>{line}</p>}
        </div>
        {action}
      </div>
      <div className={SETTINGS_SURFACE}>{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  label: string;
  line: React.ReactNode;
  labelId?: string;
  lineId?: string;
  htmlFor?: string;
  children: React.ReactNode;
};

export function SettingsRow({
  label,
  line,
  labelId,
  lineId,
  htmlFor,
  children,
}: SettingsRowProps) {
  return (
    <div className='flex min-h-14 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        {htmlFor && (
          <label id={labelId} htmlFor={htmlFor} className={ROW_LABEL}>
            {label}
          </label>
        )}
        {!htmlFor && (
          <p id={labelId} className={ROW_LABEL}>
            {label}
          </p>
        )}
        <p id={lineId} className='text-muted-foreground text-xs'>
          {line}
        </p>
      </div>
      <div className='flex shrink-0 flex-col sm:items-end'>{children}</div>
    </div>
  );
}

function saveLabelOf(status: SaveStatus) {
  if (status === 'saving') {
    return 'Saving';
  }
  if (status === 'saved') {
    return 'Saved';
  }
  return 'Save changes';
}

function saveGlyphOf(status: SaveStatus) {
  if (status === 'saving') {
    return {
      key: 'saving',
      icon: <LoaderCircleIcon className='animate-spin' />,
    };
  }
  if (status === 'saved') {
    return { key: 'saved', icon: <CheckIcon /> };
  }
  return null;
}

type SaveButtonProps = {
  status: SaveStatus;
  onSave: () => void;
};

/** The label becomes its next state and the pill resizes to it: Save changes, Saving, Saved. */
function SaveButton({ status, onSave }: SaveButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = saveLabelOf(status);
  const glyph = saveGlyphOf(status);
  const isBusy = status !== 'idle';

  return (
    <Button
      size='sm'
      disabled={isBusy}
      focusableWhenDisabled
      onClick={onSave}
      className='data-disabled:opacity-100'
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-1.5'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {glyph && (
            <motion.span
              key={glyph.key}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              {glyph.icon}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={label}
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
    </Button>
  );
}

function changeCountLabelOf(count: number) {
  if (count === 1) {
    return '1 unsaved change';
  }
  return `${count} unsaved changes`;
}

function barMessageOf(status: SaveStatus, changeCount: number) {
  if (status === 'saved') {
    return 'All changes saved';
  }
  return changeCountLabelOf(changeCount);
}

type UnsavedBarProps = {
  isShown: boolean;
  status: SaveStatus;
  changeCount: number;
  /** Replaces the count, for example to say what blocks the save. */
  message?: string;
  onDiscard: () => void;
  onSave: () => void;
};

export function UnsavedBar({
  isShown,
  status,
  changeCount,
  message,
  onDiscard,
  onSave,
}: UnsavedBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = barVariantsOf(shouldReduceMotion);
  const defaultText = barMessageOf(status, changeCount);
  const text = message ?? defaultText;
  const isBusy = status !== 'idle';

  return (
    <div className='pointer-events-none sticky bottom-0 z-20 flex justify-center px-4 pb-4'>
      <AnimatePresence initial={false}>
        {isShown && (
          <motion.div
            key='unsaved-bar'
            role='region'
            aria-label='Unsaved changes'
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            className='surface-raised pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-full py-1.5 pr-1.5 pl-4'
          >
            <p
              role='status'
              className='min-w-0 flex-1 truncate text-[13px] tabular-nums'
            >
              <WordRoll text={text} value={changeCount} />
            </p>
            <Button
              variant='ghost'
              size='sm'
              disabled={isBusy}
              onClick={onDiscard}
            >
              Discard
            </Button>
            <SaveButton status={status} onSave={onSave} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type ChoiceOption<Value extends string> = {
  value: Value;
  label: string;
};

type SegmentedChoiceProps<Value extends string> = {
  options: ChoiceOption<Value>[];
  value: Value;
  labelledBy?: string;
  describedBy?: string;
  disabled?: boolean;
  onValueChange: (value: Value) => void;
};

/** A setting with two to four values as one segmented radio group. The thumb slides to the picked value. */
export function SegmentedChoice<Value extends string>({
  options,
  value,
  labelledBy,
  describedBy,
  disabled,
  onValueChange,
}: SegmentedChoiceProps<Value>) {
  const shouldReduceMotion = useReducedMotion();
  const travel = thumbTravelOf(shouldReduceMotion);
  const thumbId = useId();

  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <RadioGroupPrimitive
      value={value}
      onValueChange={changeValue}
      disabled={disabled}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className='bg-foreground/[0.05] inline-flex w-fit items-center gap-0.5 rounded-lg p-0.5 data-disabled:opacity-50'
    >
      {options.map((option) => {
        const isPicked = option.value === value;

        return (
          <RadioPrimitive.Root
            key={option.value}
            value={option.value}
            className='text-muted-foreground hover:text-foreground data-checked:text-foreground focus-visible:ring-ring/25 relative inline-flex h-7 cursor-pointer items-center justify-center rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-[3px] data-disabled:cursor-not-allowed'
          >
            {isPicked && (
              <motion.span
                aria-hidden='true'
                layoutId={thumbId}
                transition={travel}
                className='bg-card hairline-ring ring-foreground/10 dark:bg-foreground/[0.09] absolute inset-0 rounded-md shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
              />
            )}
            <span className='relative'>{option.label}</span>
          </RadioPrimitive.Root>
        );
      })}
    </RadioGroupPrimitive>
  );
}

type ErrorPresenceProps = {
  id: string;
  error?: string | null;
};

/** A field error that grows in under its control and folds away once the person types again. */
export function ErrorPresence({ id, error }: ErrorPresenceProps) {
  const shouldReduceMotion = useReducedMotion();
  const variants = errorVariantsOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          key='error'
          id={id}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          className='text-destructive-ink overflow-hidden text-xs sm:max-w-64 sm:text-right'
        >
          <span className='block pt-1.5'>{error}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

type TextRowProps = Pick<
  InputProps,
  'type' | 'autoComplete' | 'inputMode' | 'placeholder' | 'maxLength'
> & {
  label: string;
  line: string;
  value: string;
  error?: string;
  inputId?: string;
  onValueChange: (value: string) => void;
};

export function TextRow({
  label,
  line,
  value,
  error,
  inputId,
  onValueChange,
  ...inputProps
}: TextRowProps) {
  const generatedId = useId();
  const errorId = useId();
  const id = inputId ?? generatedId;
  const hasError = Boolean(error);
  const describedBy = describedByOf(hasError, errorId);

  function changeValue(event: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(event.target.value);
  }

  return (
    <SettingsRow label={label} line={line} htmlFor={id}>
      <Input
        id={id}
        value={value}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        onChange={changeValue}
        className='w-full sm:w-64'
        {...inputProps}
      />
      <ErrorPresence id={errorId} error={error} />
    </SettingsRow>
  );
}

type SwitchRowProps = {
  label: string;
  line: React.ReactNode;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function SwitchRow({
  label,
  line,
  checked,
  disabled,
  onCheckedChange,
}: SwitchRowProps) {
  const labelId = useId();
  const lineId = useId();

  return (
    <SettingsRow label={label} line={line} labelId={labelId} lineId={lineId}>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        aria-describedby={lineId}
      />
    </SettingsRow>
  );
}

type SelectOption = { value: string; label: string };

type SelectRowProps = {
  label: string;
  line: React.ReactNode;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
};

export function SelectRow({
  label,
  line,
  value,
  options,
  disabled,
  onValueChange,
}: SelectRowProps) {
  const labelId = useId();

  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <SettingsRow label={label} line={line} labelId={labelId}>
      <Select
        items={options}
        value={value}
        disabled={disabled}
        onValueChange={changeValue}
      >
        <SelectTrigger aria-labelledby={labelId} className='w-full sm:w-64'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align='end'>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsRow>
  );
}

type ChoiceRowProps<Value extends string> = {
  label: string;
  line: React.ReactNode;
  value: Value;
  options: ChoiceOption<Value>[];
  disabled?: boolean;
  onValueChange: (value: Value) => void;
};

export function ChoiceRow<Value extends string>({
  label,
  line,
  value,
  options,
  disabled,
  onValueChange,
}: ChoiceRowProps<Value>) {
  const labelId = useId();
  const lineId = useId();

  return (
    <SettingsRow label={label} line={line} labelId={labelId} lineId={lineId}>
      <SegmentedChoice
        options={options}
        value={value}
        labelledBy={labelId}
        describedBy={lineId}
        disabled={disabled}
        onValueChange={onValueChange}
      />
    </SettingsRow>
  );
}
