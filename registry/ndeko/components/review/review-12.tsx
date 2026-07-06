'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf, type RunAgent } from '@/registry/ndeko/lib/agent-run';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  PencilIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { SettledLine } from './_parts/settled-line';
import { useFocusHandOff } from './_parts/use-focus-hand-off';

export type QuestionChoice = {
  id: string;
  title: string;
  description: string;
};

export type QuestionAnswer = {
  choiceIds: string[];
  other: string;
};

/** The control a demonstration holds down: Send answer, Change, or a choice by its id. */
export type AgentQuestionPress = 'submit' | 'reopen' | `choice-${string}`;

export type AgentQuestionHandle = {
  pick: (choiceId: string) => void;
  submit: () => void;
  reopen: () => void;
};

const DIGIT_KEY = /^[1-9]$/;

const ROW = [
  'group/row hairline-ring ring-foreground/10 relative flex cursor-pointer gap-3 rounded-lg p-2.5',
  'transition-[background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong)',
  'hover:bg-foreground/[0.03] has-[:checked]:bg-primary/[0.06] has-[:checked]:ring-primary/40',
  'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/25',
].join(' ');

const MARK =
  'hairline-ring ring-foreground/25 bg-card text-primary-foreground flex size-4 shrink-0 items-center justify-center transition-[background-color,box-shadow] duration-150 group-has-[:checked]/row:bg-primary group-has-[:checked]/row:ring-primary';

const ROW_PRESSED = 'scale-[0.985] bg-foreground/[0.06]';

function rowPressedOf(isPressed: boolean) {
  if (isPressed) {
    return ROW_PRESSED;
  }
  return undefined;
}

function isTextField(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.matches('input[type="text"], textarea');
}

function isButtonTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.closest('button') !== null;
}

function toggled(ids: string[], id: string) {
  if (ids.includes(id)) {
    return ids.filter((entry) => entry !== id);
  }
  return [...ids, id];
}

function activeIdsOf(ids: string[], other: string, isMultiple: boolean) {
  const hasOther = other.trim() !== '';
  const hidesChoices = hasOther && !isMultiple;
  if (hidesChoices) {
    return [];
  }
  return ids;
}

function titleOf(choices: QuestionChoice[], id: string) {
  const choice = choices.find((entry) => entry.id === id);
  return choice?.title ?? id;
}

function answerTextOf(answer: QuestionAnswer, choices: QuestionChoice[]) {
  const parts = answer.choiceIds.map((id) => titleOf(choices, id));
  if (answer.other !== '') {
    parts.push(`“${answer.other}”`);
  }
  return parts.join(', ');
}

function inputTypeOf(isMultiple: boolean) {
  if (isMultiple) {
    return 'checkbox';
  }
  return 'radio';
}

function handOffOf(isStop: boolean) {
  if (isStop) {
    return '';
  }
  return undefined;
}

function phaseOf(answer: QuestionAnswer | null) {
  if (answer) {
    return 'answered';
  }
  return 'asking';
}

function shakeOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { x: 0 };
  }
  return { x: [0, -4, 4, -2, 0] };
}

function keysHintOf(count: number, isMultiple: boolean) {
  const range = rangeOf(count);
  if (isMultiple) {
    return `${range} tick or untick`;
  }
  return `${range} pick`;
}

function rangeOf(count: number) {
  if (count === 1) {
    return '1';
  }
  return `1 to ${count}`;
}

function CheckBoxMark() {
  return (
    <span aria-hidden='true' className={cn(MARK, 'mt-0.5 rounded-[5px]')}>
      <svg viewBox='0 0 12 12' className='size-3'>
        <path
          d='M2.6 6.4 4.9 8.7 9.5 3.6'
          pathLength={1}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.9'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='transition-[stroke-dashoffset] duration-200 [stroke-dasharray:1] [stroke-dashoffset:1] group-has-[:checked]/row:[stroke-dashoffset:0]'
        />
      </svg>
    </span>
  );
}

function RadioMark() {
  return (
    <span aria-hidden='true' className={cn(MARK, 'mt-0.5 rounded-full')}>
      <span className='block size-1.5 scale-0 rounded-full bg-current transition-transform duration-150 ease-(--ease-out-strong) group-has-[:checked]/row:scale-100' />
    </span>
  );
}

type ChoiceRowProps = {
  choice: QuestionChoice;
  number: number;
  name: string;
  isMultiple: boolean;
  isChecked: boolean;
  isHandOffStop: boolean;
  isPressed: boolean;
  onPick: (choiceId: string) => void;
};

function ChoiceRow({
  choice,
  number,
  name,
  isMultiple,
  isChecked,
  isHandOffStop,
  isPressed,
  onPick,
}: ChoiceRowProps) {
  const inputType = inputTypeOf(isMultiple);
  const handOff = handOffOf(isHandOffStop);

  return (
    <label className={cn(ROW, rowPressedOf(isPressed))}>
      <input
        type={inputType}
        name={name}
        checked={isChecked}
        data-hand-off={handOff}
        onChange={() => onPick(choice.id)}
        className='sr-only'
      />
      {isMultiple && <CheckBoxMark />}
      {!isMultiple && <RadioMark />}
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-[13px] font-medium'>{choice.title}</span>
        <span className='text-muted-foreground text-xs leading-5'>
          {choice.description}
        </span>
      </span>
      <Kbd aria-hidden='true' className='hidden @sm:inline-flex'>
        {number}
      </Kbd>
    </label>
  );
}

function otherToneOf(isChosen: boolean) {
  if (isChosen) {
    return 'bg-primary/[0.06] ring-primary/40';
  }
  return undefined;
}

function otherMarkToneOf(isChosen: boolean) {
  if (isChosen) {
    return 'bg-primary ring-primary';
  }
  return undefined;
}

type OtherRowProps = {
  value: string;
  placeholder: string;
  isChosen: boolean;
  onChange: (text: string) => void;
};

function OtherRow({ value, placeholder, isChosen, onChange }: OtherRowProps) {
  function changeText(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <label className={cn(ROW, 'items-center', otherToneOf(isChosen))}>
      <span
        aria-hidden='true'
        className={cn(MARK, 'rounded-full', otherMarkToneOf(isChosen))}
      >
        <PencilIcon className='size-2.5' />
      </span>
      <input
        type='text'
        value={value}
        placeholder={placeholder}
        autoComplete='off'
        onChange={changeText}
        className='placeholder:text-muted-foreground/75 min-w-0 flex-1 bg-transparent text-base outline-none md:text-[13px]'
      />
    </label>
  );
}

type KeysHintProps = {
  text: string;
  nudges: number;
  isMissing: boolean;
};

function KeysHint({ text, nudges, isMissing }: KeysHintProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const shake = shakeOf(shouldReduceMotion);

  if (!isMissing) {
    return (
      <p className='text-muted-foreground flex items-center gap-1 text-xs'>
        {text}, <Kbd>Enter</Kbd> sends
      </p>
    );
  }
  return (
    <motion.p
      key={nudges}
      animate={shake}
      transition={{ duration: 0.24 }}
      className='text-warning-foreground flex items-center gap-1.5 text-xs'
    >
      <TriangleAlertIcon className='size-3.5' />
      Pick an answer or write your own first
    </motion.p>
  );
}

export type AgentQuestionProps = {
  agent: Pick<RunAgent, 'name' | 'series'>;
  question: string;
  /** One line on why the agent asks before it goes on. */
  reason: string;
  choices: QuestionChoice[];
  /** Several choices can be ticked together. One is picked by default. */
  isMultiple?: boolean;
  /** What a person wrote as another answer. */
  other: string;
  onOtherChange: (text: string) => void;
  otherPlaceholder?: string;
  /** Choices ticked when the card first shows. */
  defaultChoiceIds?: string[];
  onAnswer?: (answer: QuestionAnswer) => void;
  onReopen?: () => void;
  /** Putting the card back to its first state: change this number. */
  resetToken?: number;
  /** Picks and sends from outside, for a demonstration or a shortcut of the page. */
  handleRef?: React.Ref<AgentQuestionHandle>;
  pressed?: AgentQuestionPress | null;
  /** A demonstration is not read aloud. */
  isDemonstrating?: boolean;
  className?: string;
};

const NO_CHOICES: string[] = [];

export function AgentQuestion({
  agent,
  question,
  reason,
  choices,
  isMultiple = false,
  other,
  onOtherChange,
  otherPlaceholder = 'Something else',
  defaultChoiceIds = NO_CHOICES,
  onAnswer,
  onReopen,
  resetToken = 0,
  handleRef,
  pressed = null,
  isDemonstrating = false,
  className,
}: AgentQuestionProps) {
  const [choiceIds, setChoiceIds] = useState(defaultChoiceIds);
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  const [nudges, setNudges] = useState(0);
  const [notice, setNotice] = useState('');
  const [seenToken, setSeenToken] = useState(resetToken);
  const groupName = useId();
  const titleId = useId();
  const fade = fadePresence();
  const phase = phaseOf(answer);
  const { rootRef, markIfFocusInside } = useFocusHandOff(phase);
  const activeIds = activeIdsOf(choiceIds, other, isMultiple);
  const trimmedOther = other.trim();
  const hasOther = trimmedOther !== '';
  const hasAnswer = activeIds.length > 0 || hasOther;
  const isMissing = nudges > 0 && !hasAnswer;
  const stopId = activeIds[0] ?? choices[0]?.id;
  const keysHint = keysHintOf(Math.min(choices.length, 9), isMultiple);

  if (seenToken !== resetToken) {
    setSeenToken(resetToken);
    setChoiceIds(defaultChoiceIds);
    setAnswer(null);
    setNudges(0);
  }

  function pick(choiceId: string) {
    if (isMultiple) {
      setChoiceIds((current) => toggled(current, choiceId));
      return;
    }
    setChoiceIds([choiceId]);
    if (other !== '') {
      onOtherChange('');
    }
  }

  function submit() {
    if (!hasAnswer) {
      setNudges((current) => current + 1);
      setNotice('Pick an answer or write your own first');
      return;
    }
    markIfFocusInside();
    const next = { choiceIds: activeIds, other: trimmedOther };
    setAnswer(next);
    setNudges(0);
    setNotice(`You answered: ${answerTextOf(next, choices)}`);
    onAnswer?.(next);
  }

  function reopen() {
    markIfFocusInside();
    setAnswer(null);
    setNotice('The question is open again');
    onReopen?.();
  }

  useImperativeHandle(handleRef, () => ({ pick, submit, reopen }));

  function handleKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const isComposing = event.nativeEvent.isComposing;
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
    const isBlocked = isComposing || hasModifier;
    if (isBlocked) {
      return;
    }
    const isDigit = DIGIT_KEY.test(event.key);
    const canPickByNumber = isDigit && !isTextField(event.target);
    if (canPickByNumber) {
      const choice = choices[Number(event.key) - 1];
      if (choice) {
        event.preventDefault();
        pick(choice.id);
      }
      return;
    }
    const isEnter = event.key === 'Enter';
    if (isEnter && !isButtonTarget(event.target)) {
      event.preventDefault();
      submit();
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
          <motion.div key={phase} {...fade}>
            {answer && (
              <SettledLine
                icon={<DrawnCheck tone='success' entrance='draw' />}
                actionLabel='Change'
                actionIcon={<RotateCcwIcon />}
                onAction={reopen}
                isActionPressed={pressed === 'reopen'}
              >
                <span className='text-muted-foreground'>You answered: </span>
                <span className='font-medium'>
                  {answerTextOf(answer, choices)}
                </span>
              </SettledLine>
            )}
            {!answer && (
              <div
                role='group'
                aria-labelledby={titleId}
                onKeyDown={handleKeys}
                className='flex flex-col gap-3 p-4'
              >
                <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                  <MeshTile
                    seed={agent.name}
                    color={seriesColorOf(agent.series)}
                  />
                  <span>
                    <span className='text-foreground font-medium'>
                      {agent.name}
                    </span>{' '}
                    needs an answer before it goes on
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <p id={titleId} className='text-sm font-medium text-balance'>
                    {question}
                  </p>
                  <p className='text-muted-foreground text-xs leading-5'>
                    <span className='text-foreground font-medium'>
                      Why it asks{' '}
                    </span>
                    {reason}
                  </p>
                </div>
                <fieldset className='flex min-w-0 flex-col gap-1.5'>
                  <legend className='sr-only'>{question}</legend>
                  {choices.map((choice, index) => (
                    <ChoiceRow
                      key={choice.id}
                      choice={choice}
                      number={index + 1}
                      name={groupName}
                      isMultiple={isMultiple}
                      isChecked={activeIds.includes(choice.id)}
                      isHandOffStop={choice.id === stopId}
                      isPressed={pressed === `choice-${choice.id}`}
                      onPick={pick}
                    />
                  ))}
                  <OtherRow
                    value={other}
                    placeholder={otherPlaceholder}
                    isChosen={hasOther}
                    onChange={onOtherChange}
                  />
                </fieldset>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                  <Button
                    type='button'
                    size='sm'
                    onClick={submit}
                    className={pressedSolidOf(pressed === 'submit')}
                  >
                    Send answer
                  </Button>
                  <KeysHint
                    text={keysHint}
                    nudges={nudges}
                    isMissing={isMissing}
                  />
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

const CHOICES: QuestionChoice[] = [
  {
    id: 'production',
    title: 'Run it in production',
    description: 'Applies the change to the live orders table in one go',
  },
  {
    id: 'staging',
    title: 'Staging first',
    description: 'Runs on the copy, compares row counts, then asks you again',
  },
  {
    id: 'night',
    title: 'Wait for the quiet window',
    description: 'Schedules it for 02:00, when the shop is least busy',
  },
];

const RESTING_CHOICES = ['staging'];

const OTHER_ANSWER = 'Staging, orders table only';

function restingChoicesOf(isResting: boolean) {
  if (isResting) {
    return RESTING_CHOICES;
  }
  return NO_CHOICES;
}

function QuestionDemo({ isResting }: { isResting: boolean }) {
  const [other, setOther] = useState('');
  const [round, setRound] = useState(0);
  const card = useRef<AgentQuestionHandle>(null);
  const { pressed, press } = usePress<AgentQuestionPress>();

  function resetDemo() {
    setOther('');
    setRound((current) => current + 1);
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => press('choice-staging') },
    { after: PRESS_LEAD_MS, run: () => card.current?.pick('staging') },
    { after: 1100, run: () => press('submit') },
    { after: PRESS_LEAD_MS, run: () => card.current?.submit() },
    { after: 2200, run: () => press('reopen') },
    { after: PRESS_LEAD_MS, run: () => card.current?.reopen() },
    ...typingSteps(OTHER_ANSWER, setOther, {
      startAfter: 1100,
      characterMs: 45,
    }),
    { after: 900, run: () => press('submit') },
    { after: PRESS_LEAD_MS, run: () => card.current?.submit() },
    { after: 2400, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2200,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div ref={ref} className='flex min-h-[26rem] w-full max-w-[28rem] flex-col'>
      <AgentQuestion
        agent={PLANNER}
        question='Where should the orders migration run first?'
        reason='It cannot be rolled back once it reaches production'
        choices={CHOICES}
        other={other}
        onOtherChange={setOther}
        defaultChoiceIds={restingChoicesOf(isResting)}
        resetToken={round}
        handleRef={card}
        pressed={pressed}
        isDemonstrating={isAutoplaying}
      />
    </div>
  );
}

export default function Review12() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <QuestionDemo key={restKey} isResting={shouldReduceMotion} />;
}
