'use client';

import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Transition,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Slider, SliderThumbValue } from '@/registry/ndeko/ui/slider';
import { Switch } from '@/registry/ndeko/ui/switch';

import {
  MONEY_FORMAT,
  MONEY_LOCALE,
  WHOLE_MONEY_FORMAT,
  formatWholeMoney,
  isCapReached,
  sameCap,
  shareOfCapRange,
  type SpendCap,
} from './billing-model';
import { CAP_BOUNDS, PLAN } from './data';
import { SaveButton, type SaveStatus } from './save-button';

const SAVING_MS = 700;

const SAVED_HOLD_MS = 900;

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const HEIGHT_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function heightPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

function delayOf(status: SaveStatus) {
  if (status === 'saving') {
    return SAVING_MS;
  }
  return SAVED_HOLD_MS;
}

function amountOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0];
}

function capAriaTextOf(_formatted: string, value: number) {
  return `${formatWholeMoney(value)} a month`;
}

function fillToneOf(isReached: boolean) {
  if (isReached) {
    return 'bg-warning';
  }
  return 'bg-primary';
}

function markerOpacityOf(isCapped: boolean) {
  if (isCapped) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

type SpendBarProps = {
  spent: number;
  cap: SpendCap;
};

/** Spending so far against the whole range of caps, with a marker where the cap sits. */
function SpendBar({ spent, cap }: SpendBarProps) {
  const isReached = isCapReached(cap, spent);
  const spentShare = shareOfCapRange(spent);
  const capShare = shareOfCapRange(cap.amount);
  const fillStyle = { transform: `scaleX(${spentShare})` };
  const capPercent = capShare * 100;
  const markerTrackStyle = { transform: `translateX(${capPercent}%)` };

  return (
    <div aria-hidden='true' className='relative py-1'>
      <div className='bg-foreground/10 h-1.5 overflow-hidden rounded-full'>
        <span
          style={fillStyle}
          className={cn(
            'block h-full origin-left rounded-full transition-colors duration-150 rtl:origin-right',
            fillToneOf(isReached)
          )}
        />
      </div>
      <span
        style={markerTrackStyle}
        className='pointer-events-none absolute inset-0 transition-transform duration-150 ease-(--ease-out-strong) rtl:-scale-x-100'
      >
        <span
          className={cn(
            'bg-foreground absolute top-0 left-0 h-3.5 w-0.5 -translate-x-1/2 rounded-full transition-opacity duration-150',
            markerOpacityOf(cap.isCapped)
          )}
        />
      </span>
    </div>
  );
}

type CapEditorProps = {
  draft: SpendCap;
  status: SaveStatus;
  hasChanges: boolean;
  onDraftChange: (draft: SpendCap) => void;
  onCancel: () => void;
  onSave: () => void;
};

function CapEditor({
  draft,
  status,
  hasChanges,
  onDraftChange,
  onCancel,
  onSave,
}: CapEditorProps) {
  const isBusy = status !== 'idle';
  const isSliderOff = !draft.isCapped;

  function changeAmount(value: number | readonly number[]) {
    const amount = amountOf(value);
    onDraftChange({ ...draft, amount });
  }

  function changeCapped(isCapped: boolean) {
    onDraftChange({ ...draft, isCapped });
  }

  return (
    <div className='flex flex-col gap-4 pt-5'>
      <label className='flex cursor-pointer items-center justify-between gap-3 text-[13px]'>
        Stop on-demand charges at a monthly cap
        <Switch checked={draft.isCapped} onCheckedChange={changeCapped} />
      </label>
      <div className='flex flex-col gap-1'>
        <Slider
          value={draft.amount}
          min={CAP_BOUNDS.min}
          max={CAP_BOUNDS.max}
          step={CAP_BOUNDS.step}
          disabled={isSliderOff}
          thumbLabels={['Monthly cap']}
          getAriaValueText={capAriaTextOf}
          thumbContent={() => (
            <SliderThumbValue>
              {formatWholeMoney(draft.amount)}
            </SliderThumbValue>
          )}
          onValueChange={changeAmount}
        />
        <div className='text-muted-foreground flex justify-between text-xs tabular-nums'>
          <span>{formatWholeMoney(CAP_BOUNDS.min)}</span>
          <span>{formatWholeMoney(CAP_BOUNDS.max)}</span>
        </div>
      </div>
      <div className='flex items-center justify-end gap-2'>
        <Button variant='ghost' disabled={isBusy} onClick={onCancel}>
          Cancel
        </Button>
        <SaveButton
          status={status}
          idleLabel='Save cap'
          disabled={!hasChanges}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

type CapFigureProps = {
  cap: SpendCap;
};

function CapFigure({ cap }: CapFigureProps) {
  if (!cap.isCapped) {
    return <span className='font-medium'>No cap</span>;
  }
  return (
    <span className='inline-flex items-baseline gap-1'>
      <MotionNumber
        value={cap.amount}
        locale={MONEY_LOCALE}
        format={WHOLE_MONEY_FORMAT}
        className='font-medium'
      />
      a month
    </span>
  );
}

function shownCapOf(isEditing: boolean, draft: SpendCap, cap: SpendCap) {
  if (isEditing) {
    return draft;
  }
  return cap;
}

type SpendCapCardProps = {
  cap: SpendCap;
  spent: number;
  onCapChange: (cap: SpendCap) => void;
};

export function SpendCapCard({ cap, spent, onCapChange }: SpendCapCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<SpendCap>(cap);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const changeButtonRef = useRef<HTMLButtonElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const heightPresence = heightPresenceOf(shouldReduceMotion);
  const shownCap = shownCapOf(isEditing, draft, cap);
  const isReached = isCapReached(shownCap, spent);
  const hasChanges = !sameCap(draft, cap);

  useEffect(() => {
    if (status === 'idle') {
      return;
    }
    function advance() {
      if (status === 'saving') {
        onCapChange(draft);
        setStatus('saved');
        return;
      }
      setStatus('idle');
      setIsEditing(false);
      window.requestAnimationFrame(() => changeButtonRef.current?.focus());
    }
    const delay = delayOf(status);
    const timer = window.setTimeout(advance, delay);
    return () => window.clearTimeout(timer);
  }, [status, draft, onCapChange]);

  function startEditing() {
    setDraft(cap);
    setIsEditing(true);
    window.requestAnimationFrame(() => {
      const firstControl =
        editorRef.current?.querySelector<HTMLElement>('button, input');
      firstControl?.focus();
    });
  }

  function cancel() {
    setIsEditing(false);
    setDraft(cap);
    window.requestAnimationFrame(() => changeButtonRef.current?.focus());
  }

  function save() {
    setStatus('saving');
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-2'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-sm font-medium'>On-demand spending</h2>
          <p className='text-muted-foreground text-xs text-pretty'>
            Use beyond the plan, added to the invoice of {PLAN.renewsOn}
          </p>
        </div>
        <AnimatePresence initial={false}>
          {!isEditing && (
            <motion.div key='change' {...FADE_PRESENCE}>
              <Button
                ref={changeButtonRef}
                variant='outline'
                size='sm'
                onClick={startEditing}
              >
                Change cap
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <SpendBar spent={spent} cap={shownCap} />
      <div className='flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px]'>
        <span className='text-muted-foreground'>
          <MotionNumber
            value={spent}
            locale={MONEY_LOCALE}
            format={MONEY_FORMAT}
            className='text-foreground font-medium'
          />{' '}
          spent so far
        </span>
        <span className='text-muted-foreground'>
          Cap: <CapFigure cap={cap} />
        </span>
      </div>
      <AnimatedSize>
        <AnimatePresence initial={false}>
          {isReached && (
            <motion.p
              key='reached'
              {...heightPresence}
              className='text-warning-foreground overflow-hidden text-xs text-pretty'
            >
              <span className='block pb-1'>
                The cap is at or below what is already spent. Runs over the plan
                and new guest viewers pause until {PLAN.renewsOn}.
              </span>
            </motion.p>
          )}
        </AnimatePresence>
        {isEditing && (
          <motion.div
            ref={editorRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: ENTER }}
          >
            <CapEditor
              draft={draft}
              status={status}
              hasChanges={hasChanges}
              onDraftChange={setDraft}
              onCancel={cancel}
              onSave={save}
            />
          </motion.div>
        )}
      </AnimatedSize>
    </div>
  );
}
