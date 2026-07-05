'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  LoaderIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Switch } from '@/registry/ndeko/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { Segments, type Segment } from './_parts/segments';
import { Swap } from './_parts/swap';
import { TeamTile } from './_parts/team-tile';

type SaveState = 'idle' | 'saving' | 'saved';

type Visibility = 'public' | 'private';

type HoldState = 'idle' | 'holding' | 'archived';

type Swatch = { id: string; label: string; color: string };

const SWATCHES: Swatch[] = [
  { id: 'blue', label: 'Blue', color: 'var(--info)' },
  { id: 'indigo', label: 'Indigo', color: 'var(--primary)' },
  { id: 'green', label: 'Green', color: 'var(--success)' },
  { id: 'amber', label: 'Amber', color: 'var(--warning)' },
  { id: 'grey', label: 'Grey', color: 'var(--muted-foreground)' },
];

const VISIBILITY_SEGMENTS: Segment<Visibility>[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

const VISIBILITY_HINTS: Record<Visibility, string> = {
  public: 'Anyone in Fernhall can find this team and ask to join',
  private: 'Only the people you invite can see and join this team',
};

const SAVE_DELAY_MS = 700;
const SAVED_RESET_MS = 1500;
const HOLD_DURATION_MS = 1600;
const HOLD_KEYS = new Set([' ', 'Enter']);

const MORPH: Transition = { type: 'spring', bounce: 0, duration: 0.3 };
const INSTANT: Transition = { duration: 0 };
const ARRIVE: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] };
const LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const BLUR_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)', transition: ARRIVE },
  exit: { opacity: 0, filter: 'blur(2px)', transition: LEAVE },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: ARRIVE },
  exit: { opacity: 0, transition: LEAVE },
};

const SWATCH_RING =
  'bg-transparent shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_35%,transparent)]';

const HOLD_LAYER =
  'bg-destructive pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-[inherit] text-white';

const HOLD_FILL = [
  '[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-(--ease-out-strong)',
  'group-data-filled/button:[clip-path:inset(0)] group-data-filled/button:duration-[1600ms] group-data-filled/button:ease-linear',
].join(' ');

const HOLD_FILL_REDUCED = [
  'opacity-0 transition-opacity duration-200',
  'group-data-filled/button:opacity-100 group-data-filled/button:duration-[1600ms] group-data-filled/button:ease-linear',
].join(' ');

const ROW = 'grid gap-x-6 gap-y-2 sm:grid-cols-[8rem_minmax(0,1fr)]';

const ROW_LABEL = 'text-[13px] font-medium sm:pt-1.5';

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return MORPH;
}

function blurOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return BLUR_VARIANTS;
}

function holdFillOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return HOLD_FILL_REDUCED;
  }
  return HOLD_FILL;
}

function saveLabelOf(state: SaveState) {
  if (state === 'saving') {
    return 'Saving';
  }
  if (state === 'saved') {
    return 'Saved';
  }
  return 'Save';
}

function initialsOfName(name: string) {
  const parts = name.split(' ');
  const words = parts.filter((word) => word.length > 0);
  const firstWords = words.slice(0, 2);
  const firstLetters = firstWords.map((word) => word.charAt(0));
  const initials = firstLetters.join('');
  return initials.toUpperCase();
}

function HoldLabel() {
  return (
    <>
      <ArchiveIcon />
      Hold to archive
    </>
  );
}

function swatchById(swatchId: string) {
  const found = SWATCHES.find((swatch) => swatch.id === swatchId);
  if (found) {
    return found;
  }
  return SWATCHES[0];
}

function useTimer() {
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function schedule(callback: () => void, delay: number) {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => {
      timer.current = null;
      callback();
    }, delay);
  }

  function cancel() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return { schedule, cancel };
}

function NameField({
  savedName,
  onSave,
}: {
  savedName: string;
  onSave: (name: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const inputId = useId();
  const [draft, setDraft] = useState(savedName);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const { schedule } = useTimer();
  const trimmed = draft.trim();
  const isDirty = trimmed !== savedName;
  const isEmpty = trimmed.length === 0;
  const canSave = isDirty && !isEmpty;
  const isBusy = saveState !== 'idle';
  const isSaveDisabled = !canSave && !isBusy;

  function finishSaving() {
    onSave(trimmed);
    setSaveState('saved');
    schedule(() => setSaveState('idle'), SAVED_RESET_MS);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setSaveState('saving');
    schedule(finishSaving, SAVE_DELAY_MS);
  }

  return (
    <form onSubmit={submit} className={ROW}>
      <label htmlFor={inputId} className={ROW_LABEL}>
        Name
      </label>
      <div className='flex gap-2'>
        <Input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={isEmpty}
          className='flex-1'
        />
        <Button type='submit' variant='outline' disabled={isSaveDisabled}>
          <Swap swapKey={saveState}>
            {saveState === 'saving' && <LoaderIcon className='animate-spin' />}
            {saveState === 'saved' && <CheckIcon />}
          </Swap>
          <motion.span layout transition={morphOf(shouldReduceMotion)}>
            {saveLabelOf(saveState)}
          </motion.span>
        </Button>
      </div>
    </form>
  );
}

function ColourField({
  swatchId,
  onChange,
}: {
  swatchId: string;
  onChange: (swatchId: string) => void;
}) {
  const labelId = useId();
  const pressedValues = [swatchId];

  function changeValue(nextValues: unknown[]) {
    const [nextValue] = nextValues;
    const swatch = SWATCHES.find((candidate) => candidate.id === nextValue);
    if (swatch) {
      onChange(swatch.id);
    }
  }

  return (
    <div className={ROW}>
      <p id={labelId} className={ROW_LABEL}>
        Colour
      </p>
      <ToggleGroup
        aria-labelledby={labelId}
        value={pressedValues}
        onValueChange={changeValue}
        travel
        indicatorClassName={SWATCH_RING}
        className='gap-1'
      >
        {SWATCHES.map((swatch) => {
          const gemStyle = { '--gem': swatch.color } as React.CSSProperties;
          return (
            <ToggleGroupItem
              key={swatch.id}
              value={swatch.id}
              aria-label={swatch.label}
              className='size-8 min-w-8 rounded-full p-0 hover:bg-transparent data-pressed:bg-transparent'
            >
              <span
                aria-hidden='true'
                style={gemStyle}
                className='gem-plate block size-5 rounded-full'
              />
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}

function VisibilityField({
  visibility,
  onChange,
}: {
  visibility: Visibility;
  onChange: (visibility: Visibility) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const labelId = useId();

  return (
    <div className={ROW}>
      <p id={labelId} className={ROW_LABEL}>
        Visibility
      </p>
      <div className='flex flex-col gap-2'>
        <Segments
          value={visibility}
          segments={VISIBILITY_SEGMENTS}
          onValueChange={onChange}
          label='Visibility'
          className='w-48'
        />
        <AnimatedSize>
          <div className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.p
                key={visibility}
                variants={blurOf(shouldReduceMotion)}
                initial='enter'
                animate='visible'
                exit='exit'
                className='text-muted-foreground text-xs'
              >
                {VISIBILITY_HINTS[visibility]}
              </motion.p>
            </AnimatePresence>
          </div>
        </AnimatedSize>
      </div>
    </div>
  );
}

function ApprovalField({
  isPrivate,
  isRequired,
  onChange,
}: {
  isPrivate: boolean;
  isRequired: boolean;
  onChange: (isRequired: boolean) => void;
}) {
  const labelId = useId();
  const hintId = useId();
  const isOn = isRequired && !isPrivate;

  return (
    <div className={ROW}>
      <p id={labelId} className={ROW_LABEL}>
        Join requests
      </p>
      <div className='flex items-start gap-3 sm:pt-1'>
        <Switch
          checked={isOn}
          disabled={isPrivate}
          onCheckedChange={onChange}
          aria-labelledby={labelId}
          aria-describedby={hintId}
        />
        <p id={hintId} className='text-muted-foreground text-xs'>
          {isPrivate && 'Private teams only take people you invite'}
          {!isPrivate && 'A manager approves each request before someone joins'}
        </p>
      </div>
    </div>
  );
}

function ArchiveField() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [holdState, setHoldState] = useState<HoldState>('idle');
  const { schedule, cancel } = useTimer();
  const isFilled = holdState === 'holding';
  const isArchived = holdState === 'archived';

  function startHold() {
    if (holdState !== 'idle') {
      return;
    }
    setHoldState('holding');
    schedule(() => setHoldState('archived'), HOLD_DURATION_MS);
  }

  function cancelHold() {
    if (holdState !== 'holding') {
      return;
    }
    cancel();
    setHoldState('idle');
  }

  function pressPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button === 0) {
      startHold();
    }
  }

  function pressKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isHoldKey = HOLD_KEYS.has(event.key);
    if (!isHoldKey) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) {
      startHold();
    }
  }

  function releaseKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (HOLD_KEYS.has(event.key)) {
      cancelHold();
    }
  }

  function restore() {
    setHoldState('idle');
  }

  return (
    <div className={ROW}>
      <p className={ROW_LABEL}>Archive</p>
      <AnimatedSize>
        <div aria-live='polite' className='relative'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.div
              key={String(isArchived)}
              variants={blurOf(shouldReduceMotion)}
              initial='enter'
              animate='visible'
              exit='exit'
              className='flex flex-col items-start gap-2'
            >
              {!isArchived && (
                <>
                  <Button
                    variant='outline'
                    data-filled={isFilled || undefined}
                    onPointerDown={pressPointer}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                    onKeyDown={pressKey}
                    onKeyUp={releaseKey}
                    onBlur={cancelHold}
                    onContextMenu={(event) => event.preventDefault()}
                    className='touch-manipulation [-webkit-touch-callout:none]'
                  >
                    <HoldLabel />
                    <span
                      aria-hidden='true'
                      className={cn(HOLD_LAYER, holdFillOf(shouldReduceMotion))}
                    >
                      <HoldLabel />
                    </span>
                  </Button>
                  <p className='text-muted-foreground text-xs'>
                    Tasks and time stay readable. Nobody can add to the team
                  </p>
                </>
              )}
              {isArchived && (
                <div className='flex flex-wrap items-center gap-3'>
                  <p className='text-[13px]'>The team is archived</p>
                  <Button size='sm' variant='outline' onClick={restore}>
                    <ArchiveRestoreIcon />
                    Restore
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </AnimatedSize>
    </div>
  );
}

export default function Teams06() {
  const [name, setName] = useState('Atlas Redesign');
  const [swatchId, setSwatchId] = useState(SWATCHES[0].id);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isApprovalRequired, setIsApprovalRequired] = useState(true);
  const swatch = swatchById(swatchId);
  const isPrivate = visibility === 'private';

  return (
    <section
      aria-label={`Settings of ${name}`}
      className='bg-card hairline-ring ring-border flex w-full max-w-[34rem] flex-col gap-6 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center gap-3'>
        <Swap swapKey={`${swatch.id}-${name}`}>
          <TeamTile
            initials={initialsOfName(name)}
            color={swatch.color}
            size='lg'
          />
        </Swap>
        <div className='min-w-0'>
          <h3 className='truncate text-sm font-medium'>{name}</h3>
          <p className='text-muted-foreground text-xs'>Team settings</p>
        </div>
      </div>
      <NameField savedName={name} onSave={setName} />
      <ColourField swatchId={swatchId} onChange={setSwatchId} />
      <VisibilityField visibility={visibility} onChange={setVisibility} />
      <ApprovalField
        isPrivate={isPrivate}
        isRequired={isApprovalRequired}
        onChange={setIsApprovalRequired}
      />
      <ArchiveField />
    </section>
  );
}
