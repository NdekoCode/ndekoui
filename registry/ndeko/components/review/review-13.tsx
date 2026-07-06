'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useImperativeHandle, useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { seriesColorOf, type RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  LinkIcon,
  PencilIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
  UndoIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence, springOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { SettledLine } from './_parts/settled-line';
import { useFocusHandOff } from './_parts/use-focus-hand-off';

export type StagedField = {
  id: string;
  label: string;
  /** What the agent filled in. */
  value: string;
  /** Where the agent found the value. It shows while the field is being edited. */
  source: string;
  kind?: 'text' | 'amount';
  /** A unit shown after the value, such as a currency. */
  suffix?: string;
  isOptional?: boolean;
  /** The field takes the whole row. */
  isWide?: boolean;
};

export type StagedValues = Record<string, string>;

type StagedPhase = 'editing' | 'approving' | 'confirmed' | 'done' | 'discarded';

/** The control a demonstration holds down. */
export type StagedActionPress = 'approve' | 'discard' | 'undo' | 'restage';

export type StagedActionHandle = {
  approve: () => void;
  discard: () => void;
  undo: () => void;
  restage: () => void;
};

const RUNNING_MS = 700;

const CONFIRMED_MS = 500;

const APPROVE_LABELS: Record<MorphState, string> = {
  idle: 'Approve',
  busy: 'Running',
  done: 'Done',
};

const DISCARDED_TEXT = 'Discarded, nothing ran';

function valueOf(field: StagedField, values: StagedValues) {
  return values[field.id] ?? field.value;
}

function isEditedField(field: StagedField, values: StagedValues) {
  return valueOf(field, values) !== field.value;
}

function errorOf(field: StagedField, value: string) {
  const trimmed = value.trim();
  if (trimmed === '') {
    if (field.isOptional) {
      return '';
    }
    return `${field.label} is required`;
  }
  if (field.kind === 'amount') {
    const amount = Number(trimmed);
    const isValid = Number.isFinite(amount) && amount > 0;
    if (!isValid) {
      return 'Enter an amount above 0';
    }
  }
  return '';
}

function viewOf(phase: StagedPhase) {
  if (phase === 'done') {
    return 'done';
  }
  if (phase === 'discarded') {
    return 'discarded';
  }
  return 'form';
}

function approveStateOf(phase: StagedPhase): MorphState {
  if (phase === 'approving') {
    return 'busy';
  }
  if (phase === 'confirmed') {
    return 'done';
  }
  return 'idle';
}

function editedWordsOf(count: number): WordRollWord[] {
  if (count === 0) {
    return ['None', 'edited'];
  }
  const countWord = {
    key: 'count',
    text: String(count),
    node: <MotionNumber value={count} />,
  };
  return [countWord, 'edited'];
}

function editedRingOf(isEdited: boolean) {
  if (isEdited) {
    return 'ring-primary/45';
  }
  return undefined;
}

function describedByOf(
  isShown: boolean,
  showsError: boolean,
  sourceId: string,
  errorId: string
) {
  const ids: string[] = [];
  if (isShown) {
    ids.push(sourceId);
  }
  if (showsError) {
    ids.push(errorId);
  }
  return ids.join(' ');
}

function handOffOf(isFirst: boolean) {
  if (isFirst) {
    return '';
  }
  return undefined;
}

function wideClassOf(isWide: boolean | undefined) {
  if (isWide) {
    return '@sm:col-span-2';
  }
  return undefined;
}

type FieldRowProps = {
  field: StagedField;
  value: string;
  agentName: string;
  isFirst: boolean;
  isShown: boolean;
  isLocked: boolean;
  onValueChange: (fieldId: string, value: string) => void;
  onActivate: (fieldId: string) => void;
  onDeactivate: (fieldId: string) => void;
};

function FieldRow({
  field,
  value,
  agentName,
  isFirst,
  isShown,
  isLocked,
  onValueChange,
  onActivate,
  onDeactivate,
}: FieldRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const pop = springOf(shouldReduceMotion);
  const inputId = useId();
  const sourceId = useId();
  const errorId = useId();
  const isEdited = value !== field.value;
  const error = errorOf(field, value);
  const showsError = error !== '' && !isShown;
  const hasSuffix = field.suffix !== undefined;
  const describedBy = describedByOf(isShown, showsError, sourceId, errorId);

  function changeValue(event: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(field.id, event.target.value);
  }

  function reset() {
    onValueChange(field.id, field.value);
  }

  function resetFromKey(event: React.KeyboardEvent<HTMLInputElement>) {
    const isEscape = event.key === 'Escape';
    if (isEscape && isEdited) {
      event.preventDefault();
      reset();
    }
  }

  return (
    <div className={cn('flex min-w-0 flex-col', wideClassOf(field.isWide))}>
      <div className='flex h-6 items-center justify-between gap-2 pb-1.5'>
        <label htmlFor={inputId} className='text-xs font-medium'>
          {field.label}
        </label>
        <span className='flex items-center gap-1'>
          <AnimatePresence initial={false}>
            {isEdited && (
              <motion.span
                key='edited'
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={pop}
              >
                <Chip color='var(--primary)'>
                  <PencilIcon />
                  Edited
                </Chip>
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {isEdited && !isLocked && (
              <motion.span
                key='reset'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={pop}
              >
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={reset}
                  aria-label={`Reset ${field.label} to ${field.value}`}
                  className='text-muted-foreground h-5 px-1.5'
                >
                  <RotateCcwIcon className='size-3' />
                  Reset
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>
      <div className='relative'>
        <Input
          id={inputId}
          value={value}
          disabled={isLocked}
          autoComplete='off'
          aria-invalid={showsError}
          aria-describedby={describedBy}
          data-hand-off={handOffOf(isFirst)}
          onChange={changeValue}
          onFocus={() => onActivate(field.id)}
          onBlur={() => onDeactivate(field.id)}
          onKeyDown={resetFromKey}
          className={cn(
            'transition-[color,box-shadow,border-color,background-color]',
            editedRingOf(isEdited),
            hasSuffix && 'pe-12'
          )}
        />
        {hasSuffix && (
          <span
            aria-hidden='true'
            className='text-muted-foreground pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-xs'
          >
            {field.suffix}
          </span>
        )}
      </div>
      <p
        id={errorId}
        className={cn(
          'text-destructive-ink flex items-center gap-1 pt-1.5 text-xs',
          !showsError && 'hidden'
        )}
      >
        {error}
      </p>
      <Fold open={isShown} id={sourceId}>
        <div className='text-muted-foreground flex flex-col gap-0.5 pt-1.5 text-xs leading-5'>
          <p className='flex items-start gap-1.5'>
            <LinkIcon className='mt-0.5 size-3.5 shrink-0' />
            {field.source}
          </p>
          {isEdited && (
            <p className='ps-5'>
              {agentName} wrote{' '}
              <span className='tabular-nums'>{field.value}</span>
            </p>
          )}
        </div>
      </Fold>
    </div>
  );
}

export type StagedActionProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  /** What will run once it is approved: "Create a refund". */
  title: string;
  fields: StagedField[];
  values: StagedValues;
  onValueChange: (fieldId: string, value: string) => void;
  /** The line shown once it ran, built from the values that were approved. */
  describeResult: (values: StagedValues) => string;
  /** Shows the source of this field as if it had focus, for a demonstration that points at it. */
  pointedId?: string | null;
  onApprove?: (values: StagedValues) => void;
  onDiscard?: () => void;
  onUndo?: () => void;
  /** Putting the card back to its first state: change this number. */
  resetToken?: number;
  handleRef?: React.Ref<StagedActionHandle>;
  pressed?: StagedActionPress | null;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

export function StagedAction({
  agent,
  title,
  fields,
  values,
  onValueChange,
  describeResult,
  pointedId = null,
  onApprove,
  onDiscard,
  onUndo,
  resetToken = 0,
  handleRef,
  pressed = null,
  isDemonstrating = false,
  className,
}: StagedActionProps) {
  const [phase, setPhase] = useState<StagedPhase>('editing');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [approvedValues, setApprovedValues] = useState<StagedValues>({});
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const { schedule, clearAll } = useTimeouts();
  const fade = fadePresence();
  const view = viewOf(phase);
  const { rootRef, markIfFocusInside } = useFocusHandOff(view);
  const shownId = activeId ?? pointedId;
  const isLocked = phase === 'approving' || phase === 'confirmed';
  const editedCount = fields.filter((field) =>
    isEditedField(field, values)
  ).length;
  const editedWords = editedWordsOf(editedCount);
  const hasErrors = fields.some((field) => {
    const value = valueOf(field, values);
    return errorOf(field, value) !== '';
  });

  useEffect(() => {
    clearAll();
  }, [resetToken, clearAll]);

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setPhase('editing');
    setActiveId(null);
  }

  function finishApproval(approved: StagedValues) {
    markIfFocusInside();
    setPhase('done');
    setNotice(describeResult(approved));
    onApprove?.(approved);
  }

  function approve() {
    const isEditing = phase === 'editing';
    if (!isEditing) {
      return;
    }
    if (hasErrors) {
      setNotice('Fix the fields marked as missing first');
      return;
    }
    const approved = { ...values };
    setApprovedValues(approved);
    setActiveId(null);
    setPhase('approving');
    schedule(() => setPhase('confirmed'), RUNNING_MS);
    schedule(() => finishApproval(approved), RUNNING_MS + CONFIRMED_MS);
  }

  function discard() {
    const isEditing = phase === 'editing';
    if (!isEditing) {
      return;
    }
    markIfFocusInside();
    setActiveId(null);
    setPhase('discarded');
    setNotice(DISCARDED_TEXT);
    onDiscard?.();
  }

  function undo() {
    markIfFocusInside();
    setPhase('editing');
    setNotice('The action is staged again');
    onUndo?.();
  }

  function restage() {
    markIfFocusInside();
    for (const field of fields) {
      onValueChange(field.id, field.value);
    }
    setPhase('editing');
    setNotice('The action is staged again');
  }

  useImperativeHandle(handleRef, () => ({ approve, discard, undo, restage }));

  function activate(fieldId: string) {
    setActiveId(fieldId);
  }

  function deactivate(fieldId: string) {
    setActiveId((current) => {
      if (current === fieldId) {
        return null;
      }
      return current;
    });
    const field = fields.find((entry) => entry.id === fieldId);
    if (!field) {
      return;
    }
    const error = errorOf(field, valueOf(field, values));
    if (error !== '') {
      setNotice(error);
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'surface-raised @container overflow-hidden rounded-xl',
        className
      )}
    >
      <AnimatedSize>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={view} {...fade}>
            {view === 'done' && (
              <SettledLine
                icon={<DrawnCheck tone='success' entrance='draw' />}
                actionLabel='Stage again'
                actionIcon={<RotateCcwIcon />}
                onAction={restage}
                isActionPressed={pressed === 'restage'}
              >
                <span className='font-medium'>
                  {describeResult(approvedValues)}
                </span>
              </SettledLine>
            )}
            {view === 'discarded' && (
              <SettledLine
                icon={<XIcon className='text-muted-foreground size-4' />}
                actionLabel='Undo'
                actionIcon={<UndoIcon />}
                onAction={undo}
                isActionPressed={pressed === 'undo'}
              >
                <span className='text-muted-foreground'>{DISCARDED_TEXT}</span>
              </SettledLine>
            )}
            {view === 'form' && (
              <div className='flex flex-col gap-3.5 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-muted-foreground flex min-w-0 items-center gap-2 text-xs'>
                    <MeshTile
                      seed={agent.name}
                      color={seriesColorOf(agent.series)}
                    />
                    <span className='min-w-0 truncate'>
                      <span className='text-foreground font-medium'>
                        {agent.name}
                      </span>{' '}
                      staged this from the conversation
                    </span>
                  </span>
                  <span className='text-muted-foreground shrink-0 text-xs'>
                    <WordRoll words={editedWords} />
                  </span>
                </div>
                <p className='text-sm font-medium text-balance'>{title}</p>
                <div className='grid grid-cols-1 gap-x-3 gap-y-3 @sm:grid-cols-2'>
                  {fields.map((field, index) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      value={valueOf(field, values)}
                      agentName={agent.name}
                      isFirst={index === 0}
                      isShown={shownId === field.id}
                      isLocked={isLocked}
                      onValueChange={onValueChange}
                      onActivate={activate}
                      onDeactivate={deactivate}
                    />
                  ))}
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <MorphButton
                    type='button'
                    size='sm'
                    state={approveStateOf(phase)}
                    labels={APPROVE_LABELS}
                    disabled={hasErrors}
                    onClick={approve}
                    className={pressedSolidOf(pressed === 'approve')}
                  />
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    disabled={isLocked}
                    onClick={discard}
                    className={pressedQuietOf(pressed === 'discard')}
                  >
                    Discard
                  </Button>
                  {hasErrors && (
                    <p className='text-warning-foreground flex items-center gap-1.5 text-xs'>
                      <TriangleAlertIcon className='size-3.5' />
                      Fill the empty fields to approve
                    </p>
                  )}
                  {!hasErrors && (
                    <p className='text-muted-foreground hidden text-xs @md:block'>
                      Nothing runs until you approve
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
      <LiveRegion message={spokenUnless(isDemonstrating, notice)} />
    </div>
  );
}

const PLANNER: Pick<RunAgent, 'name' | 'series'> = {
  name: 'Planner',
  series: 1,
};

const FIELDS: StagedField[] = [
  {
    id: 'order',
    label: 'Order',
    value: 'ORD-48217',
    source: 'Your message at 14:02 names this order',
  },
  {
    id: 'customer',
    label: 'Customer',
    value: 'Grace Mbuyi',
    source: 'The customer on order ORD-48217',
  },
  {
    id: 'amount',
    label: 'Amount',
    value: '48.00',
    suffix: 'EUR',
    kind: 'amount',
    source: 'Price of the cracked item, line 2 of the order',
  },
  {
    id: 'reason',
    label: 'Reason',
    value: 'Item arrived damaged',
    source: 'Customer email of 12 November',
  },
];

const ORIGINAL_VALUES: StagedValues = {
  order: 'ORD-48217',
  customer: 'Grace Mbuyi',
  amount: '48.00',
  reason: 'Item arrived damaged',
};

const EDITED_AMOUNT = '36.00';

const RESTING_VALUES: StagedValues = {
  ...ORIGINAL_VALUES,
  amount: EDITED_AMOUNT,
};

function describeRefund(values: StagedValues) {
  return `Refund created: ${values.amount} EUR to ${values.customer}`;
}

function initialValuesOf(isResting: boolean) {
  if (isResting) {
    return RESTING_VALUES;
  }
  return ORIGINAL_VALUES;
}

function initialPointedOf(isResting: boolean) {
  if (isResting) {
    return 'amount';
  }
  return null;
}

type StagedDemoProps = {
  isResting: boolean;
};

function StagedDemo({ isResting }: StagedDemoProps) {
  const [values, setValues] = useState(initialValuesOf(isResting));
  const [pointedId, setPointedId] = useState<string | null>(
    initialPointedOf(isResting)
  );
  const [round, setRound] = useState(0);
  const card = useRef<StagedActionHandle>(null);
  const { pressed, press } = usePress<StagedActionPress>();

  function changeValue(fieldId: string, value: string) {
    setValues((current) => ({ ...current, [fieldId]: value }));
  }

  function typeAmount(typed: string) {
    changeValue('amount', typed);
  }

  function resetDemo() {
    setValues(ORIGINAL_VALUES);
    setPointedId(null);
    setRound((current) => current + 1);
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => setPointedId('amount') },
    ...typingSteps(EDITED_AMOUNT, typeAmount, {
      startAfter: 1100,
      characterMs: 130,
    }),
    { after: 1500, run: () => press('approve') },
    { after: PRESS_LEAD_MS, run: () => setPointedId(null) },
    { after: 0, run: () => card.current?.approve() },
    { after: 3600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2000,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[23rem] w-full max-w-[30rem] flex-col gap-2'
    >
      <StagedAction
        agent={PLANNER}
        title='Create a refund'
        fields={FIELDS}
        values={values}
        onValueChange={changeValue}
        describeResult={describeRefund}
        pointedId={pointedId}
        resetToken={round}
        handleRef={card}
        pressed={pressed}
        isDemonstrating={isAutoplaying}
      />
      <p className='text-muted-foreground px-1 text-xs'>
        Illustrative refund on sample data
      </p>
    </div>
  );
}

export default function Review13() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <StagedDemo key={restKey} isResting={shouldReduceMotion} />;
}
