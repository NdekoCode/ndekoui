'use client';

import { Fragment } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import {
  FileTextIcon,
  MailIcon,
  MessageSquareTextIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { leadingSpaceOf, nounOf, wordsOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import {
  StreamCaret,
  inkClassOf,
  shownCountOf,
  useRevealedCount,
} from '@/registry/ndeko/ui/streamed-text';
import { Switch } from '@/registry/ndeko/ui/switch';

import { LabTile } from './_parts/lab-tile';
import { keyWordsOf, passagePiecesOf } from './_parts/passage-words';

export type PassageKind = 'pdf' | 'email' | 'notes';

export type RetrievedPassage = {
  id: string;
  kind: PassageKind;
  source: string;
  /** Where in the source, in a few words: "PDF, clause 4.2". */
  meta: string;
  text: string;
  /** How close the passage is to the question, from 0 to 1. */
  score: number;
  isUsed: boolean;
};

export type AnswerSentence = {
  id: string;
  text: string;
  /** The passage the sentence rests on. Without one, the sentence marks a gap. */
  passageId?: string;
};

type AnswerWord = {
  text: string;
  /** The number of the passage, on the last word of the sentence that rests on it. */
  mark?: number;
};

const KIND_ICON: Record<PassageKind, Icon> = {
  pdf: FileTextIcon,
  email: MailIcon,
  notes: MessageSquareTextIcon,
};

const WORD_MS = 28;

function scoreStyleOf(score: number): React.CSSProperties {
  const share = Math.min(1, Math.max(0, score));
  return { transform: `scaleX(${share})` };
}

function contentToneOf(isUsed: boolean) {
  if (isUsed) {
    return 'opacity-100';
  }
  return 'opacity-55';
}

function rowSurfaceOf(isPressed: boolean) {
  if (isPressed) {
    return 'bg-foreground/[0.07]';
  }
  return 'bg-foreground/[0.03] dark:bg-foreground/[0.05]';
}

function markOf(sentence: AnswerSentence, passages: RetrievedPassage[]) {
  if (!sentence.passageId) {
    return undefined;
  }
  const index = passages.findIndex(
    (passage) => passage.id === sentence.passageId
  );
  if (index < 0) {
    return undefined;
  }
  return index + 1;
}

function wordOf(text: string, isLast: boolean, mark: number | undefined) {
  const word: AnswerWord = { text };
  if (isLast && mark !== undefined) {
    word.mark = mark;
  }
  return word;
}

function answerWordsOf(
  sentences: AnswerSentence[],
  passages: RetrievedPassage[]
) {
  const words: AnswerWord[] = [];
  for (const sentence of sentences) {
    const parts = wordsOf(sentence.text);
    const mark = markOf(sentence, passages);
    const lastIndex = parts.length - 1;
    for (let index = 0; index < parts.length; index += 1) {
      const isLast = index === lastIndex;
      words.push(wordOf(parts[index], isLast, mark));
    }
  }
  return words;
}

function PassageMark({ number }: { number: number }) {
  return (
    <>
      <span
        aria-hidden='true'
        className='keycap-3d text-muted-foreground ms-1 inline-flex h-4 min-w-4 items-center justify-center rounded-[4px] px-1 align-[0.12em] text-[10px] leading-none font-medium tabular-nums'
      >
        {number}
      </span>
      <span className='sr-only'> (passage {number})</span>
    </>
  );
}

type AnswerBodyProps = {
  words: AnswerWord[];
  isActive: boolean;
};

/** Mounted again for each new answer, so its words arrive from the first one every time. */
function AnswerBody({ words, isActive }: AnswerBodyProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const count = useRevealedCount(words.length, isActive, WORD_MS);
  const hasMoreWords = count < words.length;
  const isStreaming = hasMoreWords && !shouldReduceMotion;
  const shown = shownCountOf(isStreaming, count, words.length);
  const lastShown = shown - 1;

  return (
    <p className='text-sm leading-relaxed'>
      {words.map((word, index) => {
        const isShown = index < shown;
        const hasCaret = isStreaming && index === lastShown;
        return (
          <Fragment key={index}>
            {leadingSpaceOf(index)}
            <span className={inkClassOf(isStreaming, isShown)}>
              {word.text}
              {hasCaret && <StreamCaret />}
              {word.mark !== undefined && <PassageMark number={word.mark} />}
            </span>
          </Fragment>
        );
      })}
    </p>
  );
}

type PassageRowProps = {
  passage: RetrievedPassage;
  number: number;
  keys: Set<string>;
  isPressed: boolean;
  onChange: (passageId: string, isUsed: boolean) => void;
};

function PassageRow({
  passage,
  number,
  keys,
  isPressed,
  onChange,
}: PassageRowProps) {
  const KindGlyph = KIND_ICON[passage.kind];
  const pieces = passagePiecesOf(passage.text, keys);
  const toneClass = contentToneOf(passage.isUsed);

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 transition-colors duration-200',
        rowSurfaceOf(isPressed)
      )}
    >
      <span
        className={cn(
          'keycap-3d text-muted-foreground mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-opacity duration-200',
          toneClass
        )}
      >
        <KindGlyph className='size-3.5' />
      </span>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1 transition-opacity duration-200',
          toneClass
        )}
      >
        <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {number}
          </span>
          <span className='min-w-0 truncate text-[13px] font-medium'>
            {passage.source}
          </span>
          <span className='text-muted-foreground min-w-0 truncate text-xs'>
            {passage.meta}
          </span>
          <span className='ms-auto flex shrink-0 items-center gap-1.5'>
            <span
              aria-hidden='true'
              className='bg-foreground/10 h-1 w-12 overflow-hidden rounded-full'
            >
              <span
                style={scoreStyleOf(passage.score)}
                className='bg-primary block h-full w-full origin-left rounded-full'
              />
            </span>
            <span className='text-muted-foreground text-xs tabular-nums'>
              <span className='sr-only'>Similarity </span>
              {passage.score.toFixed(2)}
            </span>
          </span>
        </div>
        <p className='line-clamp-3 text-[13px] leading-relaxed'>
          {pieces.map((piece, index) => {
            if (piece.isMatch) {
              return (
                <mark
                  key={index}
                  className='bg-primary/15 text-foreground rounded-[3px] px-px'
                >
                  {piece.text}
                </mark>
              );
            }
            return <span key={index}>{piece.text}</span>;
          })}
        </p>
      </div>
      <Switch
        checked={passage.isUsed}
        aria-label={`Use ${passage.source}, ${passage.meta}`}
        onCheckedChange={(isUsed) => onChange(passage.id, isUsed)}
        className='mt-0.5'
      />
    </li>
  );
}

export type PassageAnswerProps = {
  question: string;
  passages: RetrievedPassage[];
  /** What the answer says with the passages that are on. It is written again whenever it changes. */
  answer: AnswerSentence[];
  onPassageChange: (passageId: string, isUsed: boolean) => void;
  /** False off screen: the answer holds where it is. */
  isActive?: boolean;
  /** The passage whose row a demonstration holds down. */
  pressedPassageId?: string | null;
  className?: string;
};

export function PassageAnswer({
  question,
  passages,
  answer,
  onPassageChange,
  isActive = true,
  pressedPassageId = null,
  className,
}: PassageAnswerProps) {
  const keys = keyWordsOf(question);
  const usedCount = passages.filter((passage) => passage.isUsed).length;
  const words = answerWordsOf(answer, passages);
  const answerKey = answer.map((sentence) => sentence.id).join(' ');

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex justify-end'>
        <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed text-balance'>
          {question}
        </p>
      </div>
      <section aria-label='Retrieved passages' className='flex flex-col gap-2'>
        <h3 className='text-muted-foreground flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-1 text-xs'>
          <span>Passages the answer is built from</span>
          <span className='tabular-nums'>
            <MotionNumber value={usedCount} /> of {passages.length} used
          </span>
        </h3>
        <ul className='flex flex-col gap-1.5'>
          {passages.map((passage, index) => (
            <PassageRow
              key={passage.id}
              passage={passage}
              number={index + 1}
              keys={keys}
              isPressed={pressedPassageId === passage.id}
              onChange={onPassageChange}
            />
          ))}
        </ul>
      </section>
      <div className='flex items-start gap-2.5'>
        <LabTile lab='anthropic' className='mt-0.5' />
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <p className='text-muted-foreground text-xs'>
            Written from <MotionNumber value={usedCount} />{' '}
            {nounOf(usedCount, 'passage')}
          </p>
          <AnimatedSize>
            <AnswerBody key={answerKey} words={words} isActive={isActive} />
          </AnimatedSize>
        </div>
      </div>
    </div>
  );
}

const QUESTION =
  'Can Brightmoor change the pallet fee, and how much notice do we get?';

const PASSAGES: RetrievedPassage[] = [
  {
    id: 'fee',
    kind: 'pdf',
    source: 'Q3 supply contract',
    meta: 'PDF, clause 4.2',
    text: 'Brightmoor may change the flat pallet fee once per quarter. A new fee applies from the first day of the next quarter.',
    score: 0.91,
    isUsed: true,
  },
  {
    id: 'notice',
    kind: 'pdf',
    source: 'Q3 supply contract',
    meta: 'PDF, clause 9.1',
    text: 'Any change to a fee needs 60 days written notice to the buyer. Notice sent by email counts as written notice.',
    score: 0.86,
    isUsed: true,
  },
  {
    id: 'call',
    kind: 'notes',
    source: 'Account review call',
    meta: 'Call notes, 20 Oct',
    text: 'Dana said Brightmoor will not raise the pallet fee before the end of next year, but did not want to put it in writing.',
    score: 0.78,
    isUsed: true,
  },
  {
    id: 'email',
    kind: 'email',
    source: 'Email from Dana Reyes',
    meta: 'Email, 14 Oct',
    text: 'We can move your payment terms from 30 to 45 days. The pallet fee is not part of that change.',
    score: 0.64,
    isUsed: true,
  },
  {
    id: 'handbook',
    kind: 'pdf',
    source: 'Supplier handbook',
    meta: 'PDF, section 3',
    text: 'Fee changes announced by phone are not binding until confirmed in writing.',
    score: 0.52,
    isUsed: true,
  },
];

type SentenceSpec = {
  id: string;
  text: string;
  passageId: string;
  /** Said instead when the passage is left out. Without one, the sentence goes. */
  gap?: AnswerSentence;
};

const SENTENCES: SentenceSpec[] = [
  {
    id: 'fee',
    passageId: 'fee',
    text: 'Yes, Brightmoor can change the flat pallet fee once per quarter, from the first day of the next quarter.',
  },
  {
    id: 'notice',
    passageId: 'notice',
    text: 'It has to give you 60 days of written notice, and an email counts.',
    gap: {
      id: 'notice-gap',
      text: 'The passages left on do not say how much notice you get.',
    },
  },
  {
    id: 'call',
    passageId: 'call',
    text: 'On a call in October, Dana said the fee would hold until the end of next year, but nothing is in writing.',
  },
  {
    id: 'email',
    passageId: 'email',
    text: 'Her October email changes the payment terms only, not the fee.',
  },
  {
    id: 'handbook',
    passageId: 'handbook',
    text: 'A promise made by phone is not binding until it is confirmed in writing.',
  },
];

type PassageState = {
  used: Record<string, boolean>;
};

type PassageAction =
  { type: 'use'; passageId: string; isUsed: boolean } | { type: 'hold' };

type PassageStep = SessionStep<PassageState, PassageAction>;

function allUsed(): Record<string, boolean> {
  const used: Record<string, boolean> = {};
  for (const passage of PASSAGES) {
    used[passage.id] = true;
  }
  return used;
}

const INITIAL: PassageState = { used: allUsed() };

const RESTING: PassageState = { used: { ...allUsed(), notice: false } };

function reducer(state: PassageState, action: PassageAction): PassageState {
  switch (action.type) {
    case 'use':
      return {
        used: { ...state.used, [action.passageId]: action.isUsed },
      };
    case 'hold':
      return state;
  }
}

function passagesOf(state: PassageState) {
  return PASSAGES.map((passage) => ({
    ...passage,
    isUsed: state.used[passage.id],
  }));
}

function sentenceOf(spec: SentenceSpec, isUsed: boolean) {
  if (isUsed) {
    return { id: spec.id, text: spec.text, passageId: spec.passageId };
  }
  return spec.gap;
}

function answerOf(state: PassageState) {
  const sentences: AnswerSentence[] = [];
  for (const spec of SENTENCES) {
    const sentence = sentenceOf(spec, state.used[spec.passageId]);
    if (sentence) {
      sentences.push(sentence);
    }
  }
  return sentences;
}

const SCRIPT: PassageStep[] = [
  {
    after: 4800,
    by: 'demo',
    press: 'notice',
    action: { type: 'use', passageId: 'notice', isUsed: false },
  },
  {
    after: 4200,
    by: 'demo',
    press: 'notice',
    action: { type: 'use', passageId: 'notice', isUsed: true },
  },
  { after: 4200, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(passages: RetrievedPassage[]) {
  const usedCount = passages.filter((passage) => passage.isUsed).length;
  return `The answer rests on ${usedCount} of ${passages.length} passages`;
}

export default function Answer07() {
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const passages = passagesOf(state);
  const answer = answerOf(state);
  const canReplay = isFinished && !isAutoplaying;
  const announcement = announcementOf(passages);

  function changePassage(passageId: string, isUsed: boolean) {
    act({ type: 'use', passageId, isUsed });
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[46rem] w-full max-w-[44rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <PassageAnswer
          question={QUESTION}
          passages={passages}
          answer={answer}
          onPassageChange={changePassage}
          isActive={isInView}
          pressedPassageId={pressed}
          className='bg-card hairline-ring ring-border rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={restart} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
