'use client';

import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  keyDelayOf,
  prefixesOf,
  PRESS_LEAD_MS,
  pressedSolidOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { useHover } from './_parts/use-hover';
import {
  WaitlistStack,
  type StackEntry,
  type WaitlistPerson,
} from './_parts/waitlist-stack';

type Status = 'idle' | 'invalid' | 'busy' | 'joined' | 'failed';

type Joiner = {
  id: string;
  name: string;
  isLeaving: boolean;
  /** Joined here, now: its avatar slides in. Someone who started on the list is simply there. */
  isNew: boolean;
};

const ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WHITESPACE = /\s/;

const IDLE_HINT = 'One email when your invite is ready';

const BUSY_HINT = 'Adding you to the list';

const JOINED_HINT = 'We will email you when your spot opens';

const JOINED_MESSAGE = 'You are on the list';

const FAILED_MESSAGE = 'Something went wrong, try again';

const BUTTON_LABELS: Record<MorphState, string> = {
  idle: 'Join waitlist',
  busy: 'Joining',
  done: JOINED_MESSAGE,
};

/** A leaving avatar is drawn this long, the time its slide takes, before it is removed. */
const LEAVE_MS = 500;

const NUDGE_KEYFRAMES: Keyframe[] = [
  { transform: 'translateX(0px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(-2px)' },
  { transform: 'translateX(0px)' },
];

const NUDGE_TIMING: KeyframeAnimationOptions = {
  duration: 300,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
};

function problemOf(address: string) {
  if (address === '') {
    return 'Enter your email address';
  }
  if (WHITESPACE.test(address)) {
    return 'An email address has no spaces';
  }
  const atAt = address.indexOf('@');
  if (atAt < 0) {
    return 'An email address has an @ in it';
  }
  if (atAt === 0) {
    return 'Add a name before the @';
  }
  if (!ADDRESS_PATTERN.test(address)) {
    return 'Add the domain after the @';
  }
  return null;
}

function hintOf(status: Status, problem: string) {
  if (status === 'invalid') {
    return problem;
  }
  if (status === 'busy') {
    return BUSY_HINT;
  }
  if (status === 'joined') {
    return JOINED_HINT;
  }
  if (status === 'failed') {
    return FAILED_MESSAGE;
  }
  return IDLE_HINT;
}

function hintToneOf(status: Status) {
  const isInvalid = status === 'invalid';
  const hasFailed = status === 'failed';
  if (isInvalid || hasFailed) {
    return 'text-destructive-ink';
  }
  return 'text-muted-foreground';
}

function morphStateOf(status: Status): MorphState {
  if (status === 'busy') {
    return 'busy';
  }
  if (status === 'joined') {
    return 'done';
  }
  return 'idle';
}

/** Typing again takes a refused or failed attempt back to a fresh one. */
function settledStatusOf(current: Status): Status {
  const isInvalid = current === 'invalid';
  const hasFailed = current === 'failed';
  if (isInvalid || hasFailed) {
    return 'idle';
  }
  return current;
}

function leavingOf(current: Joiner | null): Joiner | null {
  if (current === null) {
    return null;
  }
  return { ...current, isLeaving: true };
}

/** Clears the joiner once it has left, and only then: a new one who joined in the meantime stays. */
function clearedWhenLeft(current: Joiner | null) {
  if (current?.isLeaving) {
    return null;
  }
  return current;
}

function isOnList(joiner: Joiner | null) {
  if (joiner === null) {
    return false;
  }
  return !joiner.isLeaving;
}

function entriesOf(
  people: readonly WaitlistPerson[],
  joiner: Joiner | null
): StackEntry[] {
  if (joiner === null || joiner.isLeaving) {
    return [...people];
  }
  const you: StackEntry = {
    id: joiner.id,
    name: joiner.name,
    label: 'You',
    isArrival: joiner.isNew,
  };
  return [you, ...people];
}

function leaverOf(joiner: Joiner | null): WaitlistPerson | null {
  if (joiner === null || !joiner.isLeaving) {
    return null;
  }
  return { id: joiner.id, name: joiner.name };
}

function startingStatusOf(joinedAs: string | undefined): Status {
  if (joinedAs === undefined) {
    return 'idle';
  }
  return 'joined';
}

function startingJoinerOf(joinedAs: string | undefined): Joiner | null {
  if (joinedAs === undefined) {
    return null;
  }
  return { id: 'you-0', name: joinedAs, isLeaving: false, isNew: false };
}

export type WaitlistFieldHandle = {
  /** Puts this text in the field, as typed. */
  type: (text: string) => void;
  /** Sends the address in the field, as the button does. */
  submit: () => void;
  /** Takes the new address off the list, as Change email does. */
  undo: () => void;
};

export type WaitlistFieldProps = {
  /** The people on the list, the latest first, not counting the visitor. The first few wear the stack. */
  people: readonly WaitlistPerson[];
  /** How many people are on the list in all, the ones in the stack included and the visitor left out: the visitor is added once they join. */
  total: number;
  /** Called with a valid address. Resolve once it is saved; a rejection shows an error and lets them try again. */
  onJoin: (email: string) => Promise<void>;
  /** Starts as if this address had already joined, for a visitor who is on the list or for a picture that rests. */
  joinedAs?: string;
  /** The line beside the stack. */
  caption?: string;
  /** Shows the button held down, for a demonstration that presses it. */
  isPressed?: boolean;
  /** Types and sends from outside, for a demonstration. */
  handleRef?: React.Ref<WaitlistFieldHandle>;
  className?: string;
};

/**
 * An email field with its button. A refused address nudges the field once and says what is wrong;
 * a good one turns the button into "You are on the list" and slides the new avatar into the stack
 * while the last one tucks under a counter that rolls. Change email takes the address back.
 */
export function WaitlistField({
  people,
  total,
  onJoin,
  joinedAs,
  caption = 'on the waitlist',
  isPressed = false,
  handleRef,
  className,
}: WaitlistFieldProps) {
  const [email, setEmail] = useState(joinedAs ?? '');
  const [status, setStatus] = useState<Status>(startingStatusOf(joinedAs));
  const [problem, setProblem] = useState('');
  const [joiner, setJoiner] = useState(() => startingJoinerOf(joinedAs));
  const [announcement, setAnnouncement] = useState('');
  const rowRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const focusAfter = useRef(false);
  const fieldId = useId();
  const hintId = useId();
  const joinCount = useRef(0);
  const { schedule } = useTimeouts();
  const isStill = usePrefersReducedMotion();
  const entries = entriesOf(people, joiner);
  const leaver = leaverOf(joiner);
  const count = total + Number(isOnList(joiner));
  const isInvalid = status === 'invalid';
  const isBusy = status === 'busy';
  const hasJoined = status === 'joined';
  const isLocked = isBusy || hasJoined;
  const hint = hintOf(status, problem);

  useEffect(() => {
    if (!focusAfter.current || status !== 'idle') {
      return;
    }
    focusAfter.current = false;
    fieldRef.current?.focus();
    fieldRef.current?.select();
  }, [status]);

  function nudge() {
    const row = rowRef.current;
    if (!row || isStill) {
      return;
    }
    row.animate(NUDGE_KEYFRAMES, NUDGE_TIMING);
  }

  function refuse(message: string, announces: boolean) {
    setStatus('invalid');
    setProblem(message);
    nudge();
    if (announces) {
      setAnnouncement(message);
    }
  }

  async function attempt(address: string, announces: boolean) {
    if (isLocked) {
      return;
    }
    const trimmed = address.trim();
    const message = problemOf(trimmed);
    if (message !== null) {
      refuse(message, announces);
      return;
    }
    setStatus('busy');
    try {
      await onJoin(trimmed);
    } catch {
      setStatus('failed');
      if (announces) {
        setAnnouncement(FAILED_MESSAGE);
      }
      return;
    }
    joinCount.current += 1;
    const id = `you-${joinCount.current}`;
    setJoiner({ id, name: trimmed, isLeaving: false, isNew: true });
    setStatus('joined');
    if (announces) {
      setAnnouncement(JOINED_MESSAGE);
    }
  }

  function type(text: string) {
    setEmail(text);
    setStatus(settledStatusOf);
  }

  function undo() {
    if (joiner === null) {
      return;
    }
    setJoiner(leavingOf);
    setStatus('idle');
    schedule(() => setJoiner(clearedWhenLeft), LEAVE_MS);
  }

  function submit() {
    void attempt(email, false);
  }

  function typeFromPerson(event: ChangeEvent<HTMLInputElement>) {
    type(event.target.value);
  }

  function submitFromPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void attempt(email, true);
  }

  function changeFromPerson() {
    focusAfter.current = true;
    undo();
  }

  useImperativeHandle(handleRef, () => ({ type, submit, undo }));

  return (
    <form
      noValidate
      onSubmit={submitFromPerson}
      className={cn('flex w-full flex-col gap-4', className)}
    >
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={fieldId} className='text-[13px] font-medium'>
          Join the waitlist
        </label>
        <div ref={rowRef} className='flex gap-2'>
          <Input
            ref={fieldRef}
            id={fieldId}
            type='email'
            name='email'
            inputMode='email'
            autoComplete='email'
            spellCheck={false}
            placeholder='you@company.com'
            value={email}
            onChange={typeFromPerson}
            readOnly={isLocked}
            aria-invalid={isInvalid}
            aria-describedby={hintId}
          />
          <MorphButton
            type='submit'
            state={morphStateOf(status)}
            labels={BUTTON_LABELS}
            className={pressedSolidOf(isPressed)}
          />
        </div>
        <div className='flex items-start justify-between gap-3'>
          <p id={hintId} className={cn('text-xs', hintToneOf(status))}>
            <Swap swapKey={hint}>{hint}</Swap>
          </p>
          {hasJoined && (
            <Button
              type='button'
              variant='link'
              size='sm'
              onClick={changeFromPerson}
              className='h-auto shrink-0 p-0 text-xs'
            >
              Change email
            </Button>
          )}
        </div>
      </div>
      <WaitlistStack
        entries={entries}
        leaver={leaver}
        count={count}
        caption={caption}
      />
      <LiveRegion message={announcement} />
    </form>
  );
}

type DemoBeat =
  | { after: number; kind: 'type'; text: string }
  | { after: number; kind: 'press' }
  | { after: number; kind: 'submit' }
  | { after: number; kind: 'undo' };

const PEOPLE: WaitlistPerson[] = [
  { id: 'theo', name: 'Theo Marchetti' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'kasongo', name: 'Kasongo Tshibola' },
  { id: 'elise', name: 'Elise Moreau' },
  { id: 'jonas', name: 'Jonas Weber' },
];

const TOTAL = 2418;

const FIRST_PART = 'amina';

const SECOND_PART = '@example.com';

const FULL_ADDRESS = `${FIRST_PART}${SECOND_PART}`;

/** What the demonstration's server takes to answer, long enough for the button to show it is working. */
const JOIN_MS = 650;

function typedBeatsOf(
  typedBefore: string,
  typed: string,
  startAfter: number,
  characterMs: number
) {
  return prefixesOf(typed).map((prefix, index): DemoBeat => {
    const after = keyDelayOf(index, startAfter, characterMs);
    return { after, kind: 'type', text: `${typedBefore}${prefix}` };
  });
}

/** The address is typed without its domain and sent, which is refused; then it is finished and sent again, and joins. */
const DEMO_BEATS: DemoBeat[] = [
  ...typedBeatsOf('', FIRST_PART, 1200, 80),
  { after: 600, kind: 'press' },
  { after: PRESS_LEAD_MS, kind: 'submit' },
  ...typedBeatsOf(FIRST_PART, SECOND_PART, 1800, 70),
  { after: 600, kind: 'press' },
  { after: PRESS_LEAD_MS, kind: 'submit' },
  { after: 4600, kind: 'undo' },
  { after: 900, kind: 'type', text: '' },
];

type DemoProps = {
  isResting: boolean;
};

function restingAddressOf(isResting: boolean) {
  if (isResting) {
    return FULL_ADDRESS;
  }
  return undefined;
}

function Input66Demo({ isResting }: DemoProps) {
  const field = useRef<WaitlistFieldHandle>(null);
  const { pressed, press } = usePress<'join'>();
  const { isHovered, hoverHandlers } = useHover();
  const { schedule } = useTimeouts();
  const steps: AutoplayStep[] = DEMO_BEATS.map((beat) => ({
    after: beat.after,
    run: () => playBeat(beat),
  }));
  const { ref } = useAutoplay(steps, {
    loopAfter: 1500,
    isEnabled: !isHovered,
  });

  useKeptHeight(ref);

  function joinAfterDelay() {
    return new Promise<void>((resolve) => {
      schedule(() => resolve(), JOIN_MS);
    });
  }

  function playBeat(beat: DemoBeat) {
    if (beat.kind === 'type') {
      field.current?.type(beat.text);
      return;
    }
    if (beat.kind === 'press') {
      press('join');
      return;
    }
    if (beat.kind === 'submit') {
      field.current?.submit();
      return;
    }
    field.current?.undo();
  }

  return (
    <div ref={ref} className='w-full max-w-[24rem]' {...hoverHandlers}>
      <WaitlistField
        handleRef={field}
        people={PEOPLE}
        total={TOTAL}
        onJoin={joinAfterDelay}
        joinedAs={restingAddressOf(isResting)}
        caption='on the waitlist · Illustrative'
        isPressed={pressed === 'join'}
      />
    </div>
  );
}

/** Under reduced motion the piece rests on its best picture, the address in, the button saying so and the new avatar in the stack, and the demonstration is built again from there. */
export default function Input66() {
  const isStill = usePrefersReducedMotion();

  return <Input66Demo key={String(isStill)} isResting={isStill} />;
}
