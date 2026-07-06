'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  hold,
  PRESS_LEAD_MS,
  pressedQuietOf,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  CircleDashedIcon,
  CircleIcon,
  EyeIcon,
  EyeOffIcon,
  FileIcon,
  FileInputIcon,
  KeyIcon,
  PencilIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { SettledLine } from './_parts/settled-line';
import { useFocusHandOff } from './_parts/use-focus-hand-off';

type SecretPhase = 'editing' | 'saving' | 'saved';

export type PrefixStatus = 'empty' | 'typing' | 'right' | 'wrong';

/** The control a demonstration holds down. */
export type SecretRequestPress = 'save' | 'reveal' | 'paste' | 'replace';

export type SecretRequestHandle = {
  save: () => void;
  replace: () => void;
  toggleReveal: () => void;
};

const SAVING_MS = 700;

const SAVE_LABELS: Record<MorphState, string> = {
  idle: 'Save',
  busy: 'Saving',
  done: 'Saved',
};

const LAST_CHARACTERS = 4;

export function prefixStatusOf(value: string, expectedPrefix: string) {
  if (value === '') {
    return 'empty';
  }
  if (value.startsWith(expectedPrefix)) {
    return 'right';
  }
  if (expectedPrefix.startsWith(value)) {
    return 'typing';
  }
  return 'wrong';
}

function spokenWordOf(status: PrefixStatus, expectedPrefix: string) {
  if (status === 'right') {
    return 'The prefix is right';
  }
  if (status === 'wrong') {
    return `Wrong prefix, it should start with ${expectedPrefix}`;
  }
  return '';
}

function saveStateOf(phase: SecretPhase): MorphState {
  if (phase === 'saving') {
    return 'busy';
  }
  return 'idle';
}

function viewOf(phase: SecretPhase) {
  if (phase === 'saved') {
    return 'saved';
  }
  return 'form';
}

function inputTypeOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'text';
  }
  return 'password';
}

function revealLabelOf(isRevealed: boolean) {
  if (isRevealed) {
    return 'Hide the key';
  }
  return 'Show the key';
}

function fieldRingOf(status: PrefixStatus) {
  if (status === 'right') {
    return 'ring-success/50';
  }
  return undefined;
}

function maskedEndOf(lastFour: string) {
  return `••••${lastFour}`;
}

function shakeOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { x: 0 };
  }
  return { x: [0, -4, 4, -2, 0] };
}

function Prefix({ children }: { children: string }) {
  return <code className='font-mono'>{children}</code>;
}

function CheckLine({
  status,
  expectedPrefix,
}: {
  status: PrefixStatus;
  expectedPrefix: string;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const shake = shakeOf(shouldReduceMotion);

  if (status === 'right') {
    return (
      <span className='text-success-foreground inline-flex items-center gap-1.5'>
        <DrawnCheck tone='success' entrance='draw' className='size-4' />
        Prefix is right
      </span>
    );
  }
  if (status === 'wrong') {
    return (
      <motion.span
        animate={shake}
        transition={{ duration: 0.24 }}
        className='text-destructive-ink inline-flex items-center gap-1.5'
      >
        <TriangleAlertIcon className='size-3.5 shrink-0' />
        <span>
          Wrong prefix, it should start with <Prefix>{expectedPrefix}</Prefix>
        </span>
      </motion.span>
    );
  }
  if (status === 'typing') {
    return (
      <span className='text-muted-foreground inline-flex items-center gap-1.5'>
        <CircleIcon className='size-3.5 shrink-0' />
        Matching so far
      </span>
    );
  }
  return (
    <span className='text-muted-foreground inline-flex items-center gap-1.5'>
      <CircleDashedIcon className='size-3.5 shrink-0' />
      <span>
        Should start with <Prefix>{expectedPrefix}</Prefix>
      </span>
    </span>
  );
}

export type SecretRequestProps = {
  /** The name of the variable the key is saved under: `LEDGER_API_KEY`. */
  name: string;
  /** What the key is for, in a sentence. */
  purpose: string;
  /** The file the key is saved in: `.env.local`. */
  destination: string;
  /** How a right key starts: `kl_test_`. */
  expectedPrefix: string;
  /** Shorter keys cannot be saved. */
  minLength?: number;
  value: string;
  onValueChange: (value: string) => void;
  /** Receives the key once, when Save is pressed. The card keeps only its last four characters. */
  onSave?: (value: string) => void;
  onReplace?: () => void;
  /** Putting the card back to its first state: change this number. */
  resetToken?: number;
  handleRef?: React.Ref<SecretRequestHandle>;
  pressed?: SecretRequestPress | null;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

export function SecretRequest({
  name,
  purpose,
  destination,
  expectedPrefix,
  minLength = 20,
  value,
  onValueChange,
  onSave,
  onReplace,
  resetToken = 0,
  handleRef,
  pressed = null,
  isDemonstrating = false,
  className,
}: SecretRequestProps) {
  const [phase, setPhase] = useState<SecretPhase>('editing');
  const [isRevealed, setIsRevealed] = useState(false);
  const [lastFour, setLastFour] = useState('');
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const checkId = useId();
  const { schedule, clearAll } = useTimeouts();
  const fade = fadePresence();
  const view = viewOf(phase);
  const { rootRef, markIfFocusInside } = useFocusHandOff(view);
  const status = prefixStatusOf(value, expectedPrefix);
  const isLongEnough = value.length >= minLength;
  const isSavable = status === 'right' && isLongEnough;
  const isBusy = phase === 'saving';
  const isWrong = status === 'wrong';
  const spoken = spokenWordOf(status, expectedPrefix);
  const needsMore = status === 'right' && !isLongEnough;

  useEffect(() => {
    clearAll();
  }, [resetToken, clearAll]);

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setPhase('editing');
    setIsRevealed(false);
    setLastFour('');
  }

  function save() {
    if (isBusy) {
      return;
    }
    if (!isSavable) {
      setNotice(`Check the key first, it should start with ${expectedPrefix}`);
      return;
    }
    const secret = value;
    setLastFour(secret.slice(-LAST_CHARACTERS));
    setIsRevealed(false);
    setPhase('saving');
    onSave?.(secret);
    schedule(() => {
      markIfFocusInside();
      onValueChange('');
      setPhase('saved');
      setNotice(`Saved to ${destination}`);
    }, SAVING_MS);
  }

  function replace() {
    markIfFocusInside();
    onValueChange('');
    setLastFour('');
    setPhase('editing');
    setNotice('Paste the new key');
    onReplace?.();
  }

  function toggleReveal() {
    setIsRevealed((current) => !current);
  }

  useImperativeHandle(handleRef, () => ({ save, replace, toggleReveal }));

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      onValueChange(text.trim());
      inputRef.current?.focus();
    } catch {
      setNotice('Paste is blocked here, type the key or press Control V');
    }
  }

  function changeValue(event: React.ChangeEvent<HTMLInputElement>) {
    onValueChange(event.target.value);
  }

  function saveFromKey(event: React.KeyboardEvent<HTMLInputElement>) {
    const isEnter = event.key === 'Enter';
    const isComposing = event.nativeEvent.isComposing;
    if (isEnter && !isComposing) {
      event.preventDefault();
      save();
    }
  }

  const spokenStatus = spokenUnless(isDemonstrating, spoken);
  const spokenNotice = spokenUnless(isDemonstrating, notice);

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
            {view === 'saved' && (
              <SettledLine
                icon={<DrawnCheck tone='success' entrance='draw' />}
                actionLabel='Replace'
                actionIcon={<PencilIcon />}
                onAction={replace}
                isActionPressed={pressed === 'replace'}
              >
                <span className='text-muted-foreground'>Saved to </span>
                <code className='font-mono font-medium'>{destination}</code>
                <span className='text-muted-foreground'>, ending in </span>
                <code className='font-mono font-medium tabular-nums'>
                  {maskedEndOf(lastFour)}
                </code>
              </SettledLine>
            )}
            {view === 'form' && (
              <div className='flex flex-col gap-3.5 p-4'>
                <div className='flex items-start gap-3'>
                  <span className='keycap-3d text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg'>
                    <KeyIcon className='size-4' />
                  </span>
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <p className='truncate font-mono text-[13px] font-medium'>
                      {name}
                    </p>
                    <p className='text-muted-foreground text-xs leading-5'>
                      {purpose}
                    </p>
                  </div>
                </div>
                <p className='text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs'>
                  Saved to
                  <Badge variant='outline' className='font-mono'>
                    <FileIcon />
                    {destination}
                  </Badge>
                  on this machine, never in the chat
                </p>
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor={inputId} className='text-xs font-medium'>
                    Paste the key
                  </label>
                  <div className='flex items-start gap-2'>
                    <div className='relative min-w-0 flex-1'>
                      <Input
                        ref={inputRef}
                        id={inputId}
                        type={inputTypeOf(isRevealed)}
                        value={value}
                        disabled={isBusy}
                        autoComplete='off'
                        autoCapitalize='off'
                        spellCheck={false}
                        data-1p-ignore=''
                        data-lpignore='true'
                        data-hand-off=''
                        aria-invalid={isWrong}
                        aria-describedby={checkId}
                        onChange={changeValue}
                        onKeyDown={saveFromKey}
                        className={cn('pe-9 font-mono', fieldRingOf(status))}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        aria-label={revealLabelOf(isRevealed)}
                        aria-pressed={isRevealed}
                        onClick={toggleReveal}
                        className={cn(
                          'text-muted-foreground absolute end-0.5 top-0.5 size-7',
                          pressedQuietOf(pressed === 'reveal')
                        )}
                      >
                        <Swap swapKey={String(isRevealed)}>
                          {isRevealed && <EyeOffIcon />}
                          {!isRevealed && <EyeIcon />}
                        </Swap>
                      </Button>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='default'
                      disabled={isBusy}
                      onClick={paste}
                      className={pressedQuietOf(pressed === 'paste')}
                    >
                      <FileInputIcon />
                      Paste
                    </Button>
                  </div>
                  <p id={checkId} className='flex min-h-5 items-center text-xs'>
                    <Swap swapKey={status}>
                      <CheckLine
                        status={status}
                        expectedPrefix={expectedPrefix}
                      />
                    </Swap>
                  </p>
                </div>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                  <MorphButton
                    type='button'
                    size='sm'
                    state={saveStateOf(phase)}
                    labels={SAVE_LABELS}
                    disabled={!isSavable}
                    onClick={save}
                    className={pressedSolidOf(pressed === 'save')}
                  />
                  {needsMore && (
                    <p className='text-muted-foreground text-xs'>
                      The key looks short, add the rest
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </AnimatedSize>
      <LiveRegion message={spokenStatus} />
      <LiveRegion message={spokenNotice} />
    </div>
  );
}

const FAKE_KEY = 'kl_test_not-a-real-key-9f3a';

const WRONG_START = 'pk_te';

function restingValueOf(isResting: boolean) {
  if (isResting) {
    return FAKE_KEY;
  }
  return '';
}

function SecretDemo({ isResting }: { isResting: boolean }) {
  const [value, setValue] = useState(restingValueOf(isResting));
  const [round, setRound] = useState(0);
  const card = useRef<SecretRequestHandle>(null);
  const { pressed, press } = usePress<SecretRequestPress>();

  function resetDemo() {
    setValue('');
    setRound((current) => current + 1);
  }

  function clearValue() {
    setValue('');
  }

  const steps: AutoplayStep[] = [
    ...typingSteps(WRONG_START, setValue, {
      startAfter: 1400,
      characterMs: 150,
    }),
    { after: 1700, run: clearValue },
    ...typingSteps(FAKE_KEY, setValue, { startAfter: 500, characterMs: 85 }),
    { after: 900, run: () => press('reveal') },
    { after: PRESS_LEAD_MS, run: () => card.current?.toggleReveal() },
    { after: 1700, run: () => press('reveal') },
    { after: PRESS_LEAD_MS, run: () => card.current?.toggleReveal() },
    { after: 700, run: () => press('save') },
    { after: PRESS_LEAD_MS, run: () => card.current?.save() },
    { after: 3000, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2000,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex min-h-[16rem] w-full max-w-[28rem] flex-col'>
      <SecretRequest
        name='LEDGER_API_KEY'
        purpose='Lets Reviewer read your test invoices while it checks the totals'
        destination='.env.local'
        expectedPrefix='kl_test_'
        value={value}
        onValueChange={setValue}
        resetToken={round}
        handleRef={card}
        pressed={pressed}
        isDemonstrating={isAutoplaying}
      />
    </div>
  );
}

export default function Review14() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <SecretDemo key={restKey} isResting={shouldReduceMotion} />;
}
