'use client';

import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll, type WordRollWord } from '@/components/core/word-roll';
import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  elapsedOf,
  emptyRun,
  formatDuration,
  type CallStatus,
  type PlanStep,
  type RunEvent,
  type RunSnapshot,
  type StepStatus,
} from '@/registry/ndeko/lib/agent-run';
import {
  ArrowUpIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import {
  MessageAction,
  MessageActions,
} from '@/registry/ndeko/ui/chat-message';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { POPOVER_GLIDE } from '@/registry/ndeko/ui/popover';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { CopyAction } from './_parts/copy-action';
import { LabTile } from './_parts/lab-tile';
import { nounOf, siteInitialOf, wordsOf } from './_parts/words';

export type AnswerSource = {
  id: string;
  site: string;
  title: string;
  href: string;
  /** The line of the page the answer leans on. */
  quote: string;
};

export type AnswerToken =
  | { kind: 'word'; text: string }
  | { kind: 'cite'; number: number }
  | { kind: 'break' };

type PlacedToken = AnswerToken & { index: number };

type CitationPayload = {
  number: number;
  source: AnswerSource;
};

const CITE_PATTERN = /\[(\d+)\]/g;

const PARAGRAPH_BREAK = /\n{2,}/;

const CARD_OPEN_DELAY_MS = 150;

const CARD_CLOSE_DELAY_MS = 90;

function tokensOfPiece(piece: string): AnswerToken[] {
  const firstMark = piece.indexOf('[');
  const hasMarks = firstMark >= 0;
  if (!hasMarks) {
    return [{ kind: 'word', text: piece }];
  }
  const tokens: AnswerToken[] = [];
  const text = piece.slice(0, firstMark);
  if (text !== '') {
    tokens.push({ kind: 'word', text });
  }
  for (const match of piece.matchAll(CITE_PATTERN)) {
    const number = Number(match[1]);
    tokens.push({ kind: 'cite', number });
  }
  return tokens;
}

/** "fee.[1] Before" gives the word "fee.", the mark 1 and the word "Before"; a blank line starts a paragraph. */
export function tokensOf(text: string): AnswerToken[] {
  const tokens: AnswerToken[] = [];
  const paragraphs = text.split(PARAGRAPH_BREAK);
  paragraphs.forEach((paragraph, index) => {
    if (index > 0) {
      tokens.push({ kind: 'break' });
    }
    for (const piece of wordsOf(paragraph)) {
      const pieceTokens = tokensOfPiece(piece);
      tokens.push(...pieceTokens);
    }
  });
  return tokens;
}

function paragraphsOf(tokens: AnswerToken[], shown: number) {
  const paragraphs: PlacedToken[][] = [[]];
  const visible = tokens.slice(0, shown);
  visible.forEach((token, index) => {
    if (token.kind === 'break') {
      paragraphs.push([]);
      return;
    }
    const current = paragraphs[paragraphs.length - 1];
    current.push({ ...token, index });
  });
  return paragraphs.filter((paragraph) => paragraph.length > 0);
}

function citedNumbersOf(tokens: AnswerToken[], shown: number) {
  const numbers = new Set<number>();
  const visible = tokens.slice(0, shown);
  for (const token of visible) {
    if (token.kind === 'cite') {
      numbers.add(token.number);
    }
  }
  return numbers;
}

function plainTextOf(tokens: AnswerToken[]) {
  const parts: string[] = [];
  for (const token of tokens) {
    if (token.kind === 'word') {
      parts.push(` ${token.text}`);
    }
    if (token.kind === 'cite') {
      parts.push(`[${token.number}]`);
    }
    if (token.kind === 'break') {
      parts.push('\n\n');
    }
  }
  const joined = parts.join('');
  const tidied = joined.replace(/\n\n /g, '\n\n');
  return tidied.trim();
}

function sourceLineOf(source: AnswerSource, index: number) {
  const number = index + 1;
  return `[${number}] ${source.title}, ${source.href}`;
}

function copyTextOf(tokens: AnswerToken[], sources: AnswerSource[]) {
  const body = plainTextOf(tokens);
  const lines = sources.map(sourceLineOf);
  const list = lines.join('\n');
  return `${body}\n\nSources\n${list}`;
}

function leadingSpaceOf(position: number) {
  if (position === 0) {
    return '';
  }
  return ' ';
}

function litOverlayOf(isLit: boolean) {
  if (isLit) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function litTextOf(isLit: boolean) {
  if (isLit) {
    return 'text-primary-ink';
  }
  return 'text-muted-foreground';
}

type LightHandlers = {
  litNumber: number | null;
  onLight: (number: number | null) => void;
};

type CitationMarkProps = LightHandlers & {
  number: number;
  source: AnswerSource;
  handle: PreviewCardPrimitive.Handle<CitationPayload>;
};

function CitationMark({
  number,
  source,
  handle,
  litNumber,
  onLight,
}: CitationMarkProps) {
  const isLit = litNumber === number;
  const payload: CitationPayload = { number, source };

  function light() {
    onLight(number);
  }

  function dim() {
    onLight(null);
  }

  return (
    <PreviewCardPrimitive.Trigger
      handle={handle}
      payload={payload}
      href={source.href}
      target='_blank'
      rel='noreferrer'
      delay={CARD_OPEN_DELAY_MS}
      closeDelay={CARD_CLOSE_DELAY_MS}
      aria-label={`Source ${number}: ${source.title}, ${source.site}`}
      onPointerEnter={light}
      onPointerLeave={dim}
      onFocus={light}
      onBlur={dim}
      className={cn(
        'keycap-3d focus-visible:ring-ring/25 relative ms-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-[4px] px-1 align-[0.12em] text-[10px] leading-none font-medium tabular-nums no-underline transition-[color,opacity,scale] duration-200 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] starting:scale-75 starting:opacity-0',
        litTextOf(isLit)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary/15 pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-150',
          litOverlayOf(isLit)
        )}
      />
      <span className='relative'>{number}</span>
    </PreviewCardPrimitive.Trigger>
  );
}

function CitationBody({ payload }: { payload: CitationPayload }) {
  const { source, number } = payload;
  const initial = siteInitialOf(source.site);

  return (
    <div className='flex flex-col gap-2'>
      <span className='flex items-center gap-1.5'>
        <LetterTile initial={initial} size='sm' />
        <span className='text-primary-ink min-w-0 flex-1 truncate text-xs'>
          {source.site}
        </span>
        <span className='text-muted-foreground text-xs tabular-nums'>
          Source {number}
        </span>
      </span>
      <span className='text-[13px] font-medium text-balance'>
        {source.title}
      </span>
      <blockquote className='border-foreground/10 text-muted-foreground border-s-2 ps-3 text-[13px] leading-relaxed'>
        &ldquo;{source.quote}&rdquo;
      </blockquote>
    </div>
  );
}

function CitationPopup({ payload }: { payload: CitationPayload | undefined }) {
  return (
    <PreviewCardPrimitive.Portal>
      <PreviewCardPrimitive.Positioner
        side='top'
        sideOffset={8}
        align='center'
        className={cn('z-50', POPOVER_GLIDE)}
      >
        <PreviewCardPrimitive.Popup
          className={cn(
            'surface-raised w-72 max-w-[calc(100vw-2rem)] rounded-xl p-3 outline-none',
            POPUP_TRANSITION
          )}
        >
          <AnimatedSize>
            {payload && <CitationBody payload={payload} />}
          </AnimatedSize>
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

type SourcePillsProps = LightHandlers & {
  sources: AnswerSource[];
  shownNumbers: Set<number>;
};

function SourcePills({
  sources,
  shownNumbers,
  litNumber,
  onLight,
}: SourcePillsProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const pillMotion = pillMotionOf(shouldReduceMotion);

  return (
    <ul aria-label='Sources' className='flex flex-wrap gap-1.5'>
      <AnimatePresence initial={false} mode='popLayout'>
        {sources.map((source, index) => {
          const number = index + 1;
          const isShown = shownNumbers.has(number);
          if (!isShown) {
            return null;
          }
          const isLit = litNumber === number;
          return (
            <motion.li key={source.id} layout {...pillMotion}>
              <a
                href={source.href}
                target='_blank'
                rel='noreferrer'
                onPointerEnter={() => onLight(number)}
                onPointerLeave={() => onLight(null)}
                onFocus={() => onLight(number)}
                onBlur={() => onLight(null)}
                className='bg-foreground/[0.05] focus-visible:ring-ring/25 relative flex h-6 max-w-52 items-center gap-1.5 overflow-hidden rounded-full ps-1 pe-1 text-xs no-underline outline-none focus-visible:ring-[3px]'
              >
                <span
                  aria-hidden='true'
                  className={cn(
                    'bg-primary/12 pointer-events-none absolute inset-0 transition-opacity duration-150',
                    litOverlayOf(isLit)
                  )}
                />
                <LetterTile
                  initial={siteInitialOf(source.site)}
                  size='sm'
                  className='relative rounded-full'
                />
                <span
                  className={cn(
                    'relative min-w-0 truncate transition-colors duration-150',
                    litTextOf(isLit)
                  )}
                >
                  {source.site}
                </span>
                <span className='keycap-3d text-muted-foreground relative inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums'>
                  {number}
                </span>
              </a>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

const PILL_ENTER = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: 'spring', bounce: 0, duration: 0.3 },
} as const;

const PILL_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function pillMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return PILL_FADE;
  }
  return PILL_ENTER;
}

type AnswerParagraphProps = LightHandlers & {
  tokens: PlacedToken[];
  sources: AnswerSource[];
  handle: PreviewCardPrimitive.Handle<CitationPayload>;
  showsCaret: boolean;
};

function AnswerParagraph({
  tokens,
  sources,
  handle,
  showsCaret,
  litNumber,
  onLight,
}: AnswerParagraphProps) {
  return (
    <p>
      {tokens.map((token, position) => {
        if (token.kind === 'cite') {
          const cited = sources[token.number - 1];
          if (!cited) {
            return null;
          }
          return (
            <CitationMark
              key={token.index}
              number={token.number}
              source={cited}
              handle={handle}
              litNumber={litNumber}
              onLight={onLight}
            />
          );
        }
        if (token.kind === 'word') {
          return (
            <span
              key={token.index}
              className='transition-opacity duration-300 ease-(--ease-out-strong) starting:opacity-0'
            >
              {leadingSpaceOf(position)}
              {token.text}
            </span>
          );
        }
        return null;
      })}
      {showsCaret && (
        <span
          aria-hidden='true'
          className='bg-foreground/50 ms-1 inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]'
        />
      )}
    </p>
  );
}

export type CitedAnswerProps = {
  tokens: AnswerToken[];
  /** The cited sources in mark order: mark 1 is the first. */
  sources: AnswerSource[];
  /** How many tokens have streamed so far; all of them when left out. */
  shownTokens?: number;
  isStreaming?: boolean;
  className?: string;
};

export function CitedAnswer({
  tokens,
  sources,
  shownTokens,
  isStreaming = false,
  className,
}: CitedAnswerProps) {
  const [litNumber, setLitNumber] = useState<number | null>(null);
  const [cardHandle] = useState(() =>
    PreviewCardPrimitive.createHandle<CitationPayload>()
  );
  const shown = shownTokens ?? tokens.length;
  const paragraphs = paragraphsOf(tokens, shown);
  const shownNumbers = citedNumbersOf(tokens, shown);
  const lastParagraph = paragraphs.length - 1;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='text-foreground flex flex-col gap-2.5 text-sm leading-relaxed'>
        {paragraphs.map((paragraph, paragraphIndex) => {
          const isLast = paragraphIndex === lastParagraph;
          const showsCaret = isStreaming && isLast;
          return (
            <AnswerParagraph
              key={paragraph[0].index}
              tokens={paragraph}
              sources={sources}
              handle={cardHandle}
              showsCaret={showsCaret}
              litNumber={litNumber}
              onLight={setLitNumber}
            />
          );
        })}
      </div>
      <SourcePills
        sources={sources}
        shownNumbers={shownNumbers}
        litNumber={litNumber}
        onLight={setLitNumber}
      />
      <PreviewCardPrimitive.Root handle={cardHandle}>
        {({ payload }) => <CitationPopup payload={payload} />}
      </PreviewCardPrimitive.Root>
    </div>
  );
}

export type AnswerStage =
  'idle' | 'searching' | 'reading' | 'writing' | 'done' | 'stopped';

type Span = { startedAt?: number; endedAt?: number };

function stepOf(plan: PlanStep[], id: string) {
  return plan.find((step) => step.id === id);
}

function stageOf(run: RunSnapshot): AnswerStage {
  if (run.status === 'cancelled') {
    return 'stopped';
  }
  if (run.status === 'done') {
    return 'done';
  }
  const running = run.plan.find((step) => step.status === 'running');
  if (!running) {
    return 'idle';
  }
  if (running.id === 'search') {
    return 'searching';
  }
  if (running.id === 'read') {
    return 'reading';
  }
  return 'writing';
}

function searchSpanOf(plan: PlanStep[]): Span {
  const search = stepOf(plan, 'search');
  const read = stepOf(plan, 'read');
  return { startedAt: search?.startedAt, endedAt: read?.endedAt };
}

function isLookingStage(stage: AnswerStage) {
  const isSearching = stage === 'searching';
  const isReading = stage === 'reading';
  return isSearching || isReading;
}

function countWordOf(count: number): WordRollWord {
  return {
    key: 'count',
    text: String(count),
    node: <MotionNumber value={count} />,
  };
}

function spanTextOf(span: Span) {
  const end = span.endedAt ?? span.startedAt ?? 0;
  const elapsed = elapsedOf(span, end);
  return formatDuration(elapsed);
}

function summaryWordsOf(
  stage: AnswerStage,
  foundCount: number,
  span: Span
): WordRollWord[] {
  const noun = nounOf(foundCount, 'source');
  const count = countWordOf(foundCount);
  if (stage === 'idle') {
    return ['Getting', 'ready'];
  }
  if (stage === 'searching') {
    return ['Searching,', count, noun, 'found'];
  }
  if (stage === 'reading') {
    return ['Reading', count, noun];
  }
  const time = spanTextOf(span);
  return ['Searched', count, noun, 'in', time];
}

const STEP_AS_CALL: Record<Exclude<StepStatus, 'skipped'>, CallStatus> = {
  upcoming: 'queued',
  running: 'running',
  done: 'done',
  failed: 'failed',
};

function StepGlyph({ status }: { status: StepStatus }) {
  if (status === 'skipped') {
    return (
      <span className='inline-flex size-4 shrink-0'>
        <CircleDashedIcon className='text-muted-foreground size-4' />
        <span className='sr-only'>Stopped</span>
      </span>
    );
  }
  return <CallStatusMark status={STEP_AS_CALL[status]} />;
}

type StepWording = {
  upcoming: string;
  running: string;
  done: string;
  stopped: string;
};

function stepWordingOf(
  id: string,
  foundCount: number,
  citeCount: number
): StepWording {
  const sources = `${foundCount} ${nounOf(foundCount, 'source')}`;
  const citations = `${citeCount} ${nounOf(citeCount, 'citation')}`;
  if (id === 'search') {
    return {
      upcoming: 'Search the web',
      running: 'Searching the web',
      done: 'Searched the web',
      stopped: 'Stopped while searching',
    };
  }
  if (id === 'read') {
    return {
      upcoming: 'Read the sources',
      running: `Reading ${sources}`,
      done: `Read ${sources}`,
      stopped: 'Stopped while reading',
    };
  }
  return {
    upcoming: 'Write the answer',
    running: 'Writing the answer',
    done: `Wrote the answer with ${citations}`,
    stopped: 'Stopped while writing',
  };
}

function stepLabelOf(step: PlanStep, foundCount: number, citeCount: number) {
  const wording = stepWordingOf(step.id, foundCount, citeCount);
  if (step.status === 'running') {
    return wording.running;
  }
  if (step.status === 'done') {
    return wording.done;
  }
  if (step.status === 'skipped') {
    return wording.stopped;
  }
  return wording.upcoming;
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

export type AnswerStepsProps = {
  plan: PlanStep[];
  /** What the search query was, shown under the first step. */
  query: string;
  found: AnswerSource[];
  citeCount: number;
  stage: AnswerStage;
};

export function AnswerSteps({
  plan,
  query,
  found,
  citeCount,
  stage,
}: AnswerStepsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const span = searchSpanOf(plan);
  const words = summaryWordsOf(stage, found.length, span);
  const isLooking = isLookingStage(stage);
  const hasStarted = span.startedAt !== undefined;
  const showsClock = isLooking && hasStarted;

  function toggle() {
    setIsOpen((current) => !current);
  }

  return (
    <div className='@container flex flex-col'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 -ms-1 flex h-7 w-fit max-w-full cursor-pointer items-center gap-1.5 rounded-md px-1 text-[13px] transition-colors outline-none focus-visible:ring-[3px]'
      >
        <span className='min-w-0 truncate'>
          <WordRoll words={words} />
        </span>
        {showsClock && (
          <LiveDuration
            item={span}
            isRunning={isLooking}
            className='text-muted-foreground/80 text-xs'
          />
        )}
        <ChevronDownIcon
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <ol className='flex flex-col gap-2 pt-2 pb-1'>
          {plan.map((step) => {
            const isSearch = step.id === 'search';
            return (
              <li key={step.id} className='flex flex-col gap-1.5'>
                <span className='flex items-center gap-2 text-[13px]'>
                  <Swap swapKey={step.status} className='size-4 shrink-0'>
                    <StepGlyph status={step.status} />
                  </Swap>
                  <span className='min-w-0 truncate'>
                    {stepLabelOf(step, found.length, citeCount)}
                  </span>
                </span>
                {isSearch && (
                  <div className='flex flex-col gap-1 ps-6'>
                    <span className='text-muted-foreground truncate font-mono text-xs'>
                      {query}
                    </span>
                    <ul aria-label='Sources found' className='flex flex-col'>
                      <AnimatePresence initial={false}>
                        {found.map((source) => (
                          <motion.li
                            key={source.id}
                            className='overflow-hidden'
                            {...rowPresence}
                          >
                            <span className='flex h-6 items-center gap-1.5 text-xs'>
                              <LetterTile
                                initial={siteInitialOf(source.site)}
                                size='sm'
                              />
                              <span className='min-w-0 truncate'>
                                {source.title}
                              </span>
                              <span className='text-muted-foreground hidden shrink-0 @sm:inline'>
                                {source.site}
                              </span>
                            </span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Fold>
    </div>
  );
}

type Feedback = 'good' | 'bad';

function toggledFeedback(current: Feedback | null, choice: Feedback) {
  if (current === choice) {
    return null;
  }
  return choice;
}

const ACTION_BUTTON =
  'text-muted-foreground aria-pressed:bg-foreground/[0.07] aria-pressed:text-primary-ink';

type AnswerActionsProps = {
  copyText: string;
  feedback: Feedback | null;
  onFeedback: (feedback: Feedback | null) => void;
  onRegenerate: () => void;
  onCopied: () => void;
};

function AnswerActions({
  copyText,
  feedback,
  onFeedback,
  onRegenerate,
  onCopied,
}: AnswerActionsProps) {
  const isGood = feedback === 'good';
  const isBad = feedback === 'bad';

  return (
    <MessageActions className='-ms-1.5'>
      <MessageAction tooltip='Copy'>
        <CopyAction
          text={copyText}
          label='Copy the answer'
          onCopied={onCopied}
        />
      </MessageAction>
      <MessageAction tooltip='Regenerate'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Regenerate the answer'
          onClick={onRegenerate}
          className={ACTION_BUTTON}
        >
          <RefreshCwIcon className='size-3.5' />
        </Button>
      </MessageAction>
      <MessageAction tooltip='Good answer'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Good answer'
          aria-pressed={isGood}
          onClick={() => onFeedback(toggledFeedback(feedback, 'good'))}
          className={ACTION_BUTTON}
        >
          <ThumbsUpIcon className='size-3.5' />
        </Button>
      </MessageAction>
      <MessageAction tooltip='Bad answer'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Bad answer'
          aria-pressed={isBad}
          onClick={() => onFeedback(toggledFeedback(feedback, 'bad'))}
          className={ACTION_BUTTON}
        >
          <ThumbsDownIcon className='size-3.5' />
        </Button>
      </MessageAction>
    </MessageActions>
  );
}

type AnswerId = 'pallet-fee' | 'old-tiers' | 'harbourline' | 'announced';

type CannedAnswer = {
  id: AnswerId;
  question: string;
  query: string;
  text: string;
  found: AnswerSource[];
  /** Source ids in mark order. */
  cited: string[];
  followUps: AnswerId[];
};

function makeSource(
  id: string,
  site: string,
  slug: string,
  title: string,
  quote: string
): AnswerSource {
  return { id, site, title, quote, href: `https://${site}/${slug}` };
}

const ANSWERS: CannedAnswer[] = [
  {
    id: 'pallet-fee',
    question: 'Did Brightmoor change its pallet fees this year?',
    query: 'brightmoor pallet fee 2026',
    text: 'Yes. Brightmoor moved bulk orders to a flat fee of 18.40 EUR per pallet on 1 October.[1] Before that, its tiered rate started at 15.90 EUR.[2]\n\nThe flat fee applies from 40 pallets, so smaller orders keep the old tiers.[1] Two regional carriers matched it within a month,[3] and contracts signed before September keep the old rate until they renew.[4]',
    found: [
      makeSource(
        'fees',
        'brightmoor-supply.example',
        'pricing/pallets',
        'Pallet fees from 1 October',
        'From 1 October, bulk orders are billed a flat fee of 18.40 EUR per pallet. Orders under 40 pallets keep the tiers in Annex B.'
      ),
      makeSource(
        'rates',
        'harbourline-freight.example',
        'news/autumn-rates',
        'Regional pallet rates, autumn update',
        'Until September, the Brightmoor tiered rate started at 15.90 EUR per pallet.'
      ),
      makeSource(
        'index',
        'freightdesk.example',
        'index/q3',
        'Q3 freight index',
        'Pallet prices in the region rose 6% over the quarter.'
      ),
      makeSource(
        'matched',
        'palletwatch.example',
        'flat-fees',
        'Who matched the new flat fees',
        'Two regional carriers matched the 18.40 EUR fee within a month of the change.'
      ),
      makeSource(
        'waivers',
        'buyers-circle.example',
        't/brightmoor-waivers',
        'Thread: Brightmoor fee waivers',
        'Brightmoor confirmed that contracts signed before September keep the old rate until renewal.'
      ),
      makeSource(
        'tracker',
        'ledgerline.example',
        'suppliers/brightmoor',
        'Supplier fee tracker',
        'Brightmoor: one fee change recorded this year.'
      ),
    ],
    cited: ['fees', 'rates', 'matched', 'waivers'],
    followUps: ['old-tiers', 'harbourline', 'announced'],
  },
  {
    id: 'old-tiers',
    question: 'Which orders keep the old tiers?',
    query: 'brightmoor annex b tiered pallet rate',
    text: 'Two kinds of orders keep the tiers. Orders under 40 pallets are still billed by tier, from 15.90 EUR for the first ten pallets.[1]\n\nContracts signed before 1 September also keep the tiered rate until their renewal date, whatever the order size.[2]',
    found: [
      makeSource(
        'annex',
        'brightmoor-supply.example',
        'pricing/annex-b',
        'Annex B: tiered pallet rates',
        'Orders under 40 pallets are billed by tier, from 15.90 EUR for the first ten pallets.'
      ),
      makeSource(
        'tracker',
        'ledgerline.example',
        'suppliers/brightmoor',
        'Supplier fee tracker',
        'Brightmoor: one fee change recorded this year.'
      ),
      makeSource(
        'renewal',
        'buyers-circle.example',
        't/brightmoor-waivers',
        'Thread: Brightmoor fee waivers',
        'Contracts signed before 1 September keep the tiered rate until their renewal date.'
      ),
    ],
    cited: ['annex', 'renewal'],
    followUps: ['harbourline', 'announced'],
  },
  {
    id: 'harbourline',
    question: 'How does Harbourline price pallets now?',
    query: 'harbourline freight pallet rate 2026',
    text: 'Harbourline still prices by tier. Its first tier is 16.20 EUR per pallet and drops to 14.80 EUR above 60 pallets.[1]\n\nIt matched the Brightmoor flat fee of 18.40 EUR only on overnight routes.[2] For a regular order of 50 pallets, Harbourline comes out cheaper.[1]',
    found: [
      makeSource(
        'tiers',
        'harbourline-freight.example',
        'rates',
        'Pallet rates and tiers',
        'Tier one is 16.20 EUR per pallet. Above 60 pallets, tier three is 14.80 EUR.'
      ),
      makeSource(
        'index',
        'freightdesk.example',
        'index/q3',
        'Q3 freight index',
        'Pallet prices in the region rose 6% over the quarter.'
      ),
      makeSource(
        'overnight',
        'palletwatch.example',
        'flat-fees',
        'Who matched the new flat fees',
        'Harbourline matched the 18.40 EUR flat fee on overnight routes only.'
      ),
    ],
    cited: ['tiers', 'overnight'],
    followUps: ['old-tiers', 'announced'],
  },
  {
    id: 'announced',
    question: 'When was the change announced?',
    query: 'brightmoor flat pallet fee announcement',
    text: 'Brightmoor announced the flat fee on 2 September in a news post.[1] The note reached account holders the same day,[2] four weeks before the fee took effect on 1 October.[3]',
    found: [
      makeSource(
        'news',
        'brightmoor-supply.example',
        'news/flat-pallet-fee',
        'News: a flat fee for bulk pallets',
        'Today we are announcing a flat pallet fee for bulk orders, effective 1 October.'
      ),
      makeSource(
        'coverage',
        'palletwatch.example',
        'brightmoor-goes-flat',
        'Brightmoor goes flat',
        'The note went to account holders on 2 September, four weeks ahead of the change.'
      ),
      makeSource(
        'fees',
        'brightmoor-supply.example',
        'pricing/pallets',
        'Pallet fees from 1 October',
        'From 1 October, bulk orders are billed a flat fee of 18.40 EUR per pallet.'
      ),
    ],
    cited: ['news', 'coverage', 'fees'],
    followUps: ['old-tiers', 'harbourline'],
  },
];

const FIRST_ANSWER = ANSWERS[0];

function answerOf(id: AnswerId) {
  const answer = ANSWERS.find((candidate) => candidate.id === id);
  return answer ?? FIRST_ANSWER;
}

function citedSourcesOf(answer: CannedAnswer) {
  const cited: AnswerSource[] = [];
  for (const id of answer.cited) {
    const match = answer.found.find((candidate) => candidate.id === id);
    if (match) {
      cited.push(match);
    }
  }
  return cited;
}

const PLAN: PlanStep[] = [
  { id: 'search', title: 'Searched the web', status: 'upcoming' },
  { id: 'read', title: 'Read the sources', status: 'upcoming' },
  { id: 'write', title: 'Wrote the answer', status: 'upcoming' },
];

const IDLE_RUN = emptyRun({ id: 'answer', title: 'Answer', plan: PLAN });

const START_MS = 400;

const SOURCE_MS = 280;

const READ_MS = 900;

const TOKEN_MS = 55;

function stepEvent(id: string, status: StepStatus): RunEvent {
  return { type: 'step.updated', id, patch: { status } };
}

function scriptOf(answer: CannedAnswer): RunScriptStep[] {
  const tokens = tokensOf(answer.text);
  const steps: RunScriptStep[] = [
    { after: START_MS, event: { type: 'run.started' } },
    { after: 0, event: stepEvent('search', 'running') },
  ];
  for (const found of answer.found) {
    steps.push({
      after: SOURCE_MS,
      event: {
        type: 'call.started',
        call: {
          id: found.id,
          tool: 'web_search',
          label: found.title,
          status: 'done',
        },
      },
    });
  }
  steps.push({ after: 200, event: stepEvent('search', 'done') });
  steps.push({ after: 0, event: stepEvent('read', 'running') });
  steps.push({ after: READ_MS, event: stepEvent('read', 'done') });
  steps.push({ after: 0, event: stepEvent('write', 'running') });
  for (let index = 0; index < tokens.length; index += 1) {
    steps.push({
      after: TOKEN_MS,
      event: { type: 'usage.added', outputTokens: 1 },
    });
  }
  steps.push({ after: 0, event: stepEvent('write', 'done') });
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

function scriptsOf(answers: CannedAnswer[]) {
  const scripts = new Map<AnswerId, RunScriptStep[]>();
  for (const answer of answers) {
    scripts.set(answer.id, scriptOf(answer));
  }
  return scripts;
}

const SCRIPTS = scriptsOf(ANSWERS);

const EMPTY_SCRIPT: RunScriptStep[] = [];

function scriptFor(id: AnswerId) {
  return SCRIPTS.get(id) ?? EMPTY_SCRIPT;
}

function tokensByAnswerOf(answers: CannedAnswer[]) {
  const tokens = new Map<AnswerId, AnswerToken[]>();
  for (const answer of answers) {
    tokens.set(answer.id, tokensOf(answer.text));
  }
  return tokens;
}

const TOKENS = tokensByAnswerOf(ANSWERS);

const NO_TOKENS: AnswerToken[] = [];

function tokensFor(id: AnswerId) {
  return TOKENS.get(id) ?? NO_TOKENS;
}

const FOLLOW_UP_ORDER: AnswerId[] = ['old-tiers', 'harbourline', 'announced'];

const FILL_WORD_MS = 70;

const SEND_PAUSE_MS = 350;

type Turn = {
  id: string;
  question: string;
  answerId: AnswerId;
};

type TurnRecord = Turn & {
  stage: AnswerStage;
  plan: PlanStep[];
  foundCount: number;
  shownTokens: number;
};

function answerIdForQuestion(question: string, asked: AnswerId[]): AnswerId {
  const cleaned = question.trim();
  const trimmed = cleaned.toLowerCase();
  const match = ANSWERS.find(
    (answer) => answer.question.toLowerCase() === trimmed
  );
  if (match) {
    return match.id;
  }
  const unasked = FOLLOW_UP_ORDER.find((id) => !asked.includes(id));
  return unasked ?? FOLLOW_UP_ORDER[0];
}

function recordOf(turn: Turn, run: RunSnapshot): TurnRecord {
  const stage = stageOf(run);
  const isFinished = stage === 'done';
  const tokens = tokensFor(turn.answerId);
  const shownTokens = finishedCountOf(isFinished, tokens.length, run);
  return {
    ...turn,
    stage,
    plan: run.plan,
    foundCount: run.calls.length,
    shownTokens,
  };
}

function finishedCountOf(isFinished: boolean, total: number, run: RunSnapshot) {
  if (isFinished) {
    return total;
  }
  return run.usage.outputTokens;
}

function announcementOf(stage: AnswerStage, notice: string) {
  if (notice !== '') {
    return notice;
  }
  if (stage === 'searching') {
    return 'Searching sources';
  }
  if (stage === 'writing') {
    return 'Writing the answer';
  }
  if (stage === 'done') {
    return 'Answer ready';
  }
  if (stage === 'stopped') {
    return 'Answer stopped';
  }
  return '';
}

function isAnsweringStage(stage: AnswerStage) {
  const isDone = stage === 'done';
  const isStopped = stage === 'stopped';
  const isSettled = isDone || isStopped;
  return !isSettled;
}

function appendWord(text: string, word: string) {
  if (text === '') {
    return word;
  }
  return `${text} ${word}`;
}

function isSendKey(event: React.KeyboardEvent<HTMLTextAreaElement>) {
  const isEnter = event.key === 'Enter';
  const isNewLine = event.shiftKey;
  const isComposing = event.nativeEvent.isComposing;
  const isPlainEnter = isEnter && !isNewLine;
  return isPlainEnter && !isComposing;
}

function StopGlyph() {
  return (
    <span aria-hidden='true' className='size-2.5 rounded-[2px] bg-current' />
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isAnswering: boolean;
  isFilling: boolean;
};

function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isAnswering,
  isFilling,
}: ComposerProps) {
  const hasText = value.trim().length > 0;
  const canSend = hasText && !isFilling;
  const canPress = isAnswering || canSend;
  const keyLabel = composerKeyLabelOf(isAnswering);

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isSendKey(event)) {
      return;
    }
    event.preventDefault();
    if (isAnswering) {
      return;
    }
    onSend();
  }

  function press() {
    if (isAnswering) {
      onStop();
      return;
    }
    onSend();
  }

  return (
    <div className='bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 flex items-end gap-1.5 rounded-xl p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]'>
      <Textarea
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeys}
        readOnly={isFilling}
        aria-label='Ask a follow-up'
        placeholder='Ask a follow-up'
        className='min-h-8 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
      />
      <Button
        type='button'
        size='icon'
        aria-label={keyLabel}
        disabled={!canPress}
        onClick={press}
      >
        <Swap swapKey={String(isAnswering)}>
          {isAnswering && <StopGlyph />}
          {!isAnswering && <ArrowUpIcon />}
        </Swap>
      </Button>
    </div>
  );
}

function composerKeyLabelOf(isAnswering: boolean) {
  if (isAnswering) {
    return 'Stop the answer';
  }
  return 'Send the question';
}

function QuestionBubble({ question }: { question: string }) {
  return (
    <div className='flex justify-end'>
      <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed text-balance'>
        {question}
      </p>
    </div>
  );
}

function EarlierTurn({ record }: { record: TurnRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const answer = answerOf(record.answerId);
  const tokens = tokensFor(record.answerId);
  const sources = citedSourcesOf(answer);
  const noun = nounOf(sources.length, 'source');
  const isStopped = record.stage === 'stopped';
  const hasText = record.shownTokens > 0;

  return (
    <div className='flex flex-col'>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((current) => !current)}
        className='hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 text-start text-[13px] outline-none focus-visible:ring-[3px]'
      >
        <span className='min-w-0 flex-1 truncate'>{record.question}</span>
        <span className='text-muted-foreground shrink-0 text-xs'>
          {isStopped && 'Stopped'}
          {!isStopped && `${sources.length} ${noun}`}
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-3.5 shrink-0 transition-transform duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={panelId}>
        <div className='flex flex-col gap-3 px-2 pt-2 pb-3'>
          <QuestionBubble question={record.question} />
          {hasText && (
            <CitedAnswer
              tokens={tokens}
              sources={sources}
              shownTokens={record.shownTokens}
            />
          )}
          {!hasText && (
            <p className='text-muted-foreground text-[13px]'>
              Stopped before the answer started
            </p>
          )}
        </div>
      </Fold>
    </div>
  );
}

export default function Answer01() {
  const [turn, setTurn] = useState<Turn>({
    id: 'turn-0',
    question: FIRST_ANSWER.question,
    answerId: FIRST_ANSWER.id,
  });
  const [earlier, setEarlier] = useState<TurnRecord[]>([]);
  const [asked, setAsked] = useState<AnswerId[]>([FIRST_ANSWER.id]);
  const [isStopped, setIsStopped] = useState(false);
  const [draft, setDraft] = useState('');
  const [isFilling, setIsFilling] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [notice, setNotice] = useState('');
  const [turnCount, setTurnCount] = useState(1);
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { amount: 0.3 });
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const { schedule, clearAll } = useTimeouts();
  const isActive = isInView && !isStopped;
  const { snapshot, store, restart } = useRunScript(scriptFor(turn.answerId), {
    initial: IDLE_RUN,
    isActive,
  });
  const answer = answerOf(turn.answerId);
  const tokens = tokensFor(turn.answerId);
  const cited = citedSourcesOf(answer);
  const stage = stageOf(snapshot);
  const found = answer.found.slice(0, snapshot.calls.length);
  const isDone = stage === 'done';
  const isStoppedStage = stage === 'stopped';
  const isSettled = isDone || isStoppedStage;
  const isAnswering = isAnsweringStage(stage);
  const isWriting = stage === 'writing';
  const shownTokens = finishedCountOf(isDone, tokens.length, snapshot);
  const hasAnswerText = shownTokens > 0;
  const hasEarlier = earlier.length > 0;
  const followUps = answer.followUps.filter((id) => !asked.includes(id));
  const hasFollowUps = followUps.length > 0;
  const showsFollowUps = isDone && hasFollowUps;
  const announcement = announcementOf(stage, notice);
  const copyText = copyTextOf(tokens, cited);

  function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed === '') {
      return;
    }
    const answerId = answerIdForQuestion(trimmed, asked);
    const record = recordOf(turn, store.getSnapshot());
    setEarlier((current) => [...current, record]);
    setTurn({ id: `turn-${turnCount}`, question: trimmed, answerId });
    setTurnCount((current) => current + 1);
    setAsked((current) => [...current, answerId]);
    setDraft('');
    setIsStopped(false);
    setFeedback(null);
    setNotice('');
    restart();
  }

  function fillAndAsk(question: string) {
    if (isFilling) {
      return;
    }
    clearAll();
    const words = wordsOf(question);
    setIsFilling(true);
    setDraft('');
    words.forEach((word, index) => {
      const delay = (index + 1) * FILL_WORD_MS;
      schedule(() => setDraft((current) => appendWord(current, word)), delay);
    });
    const typingTime = (words.length + 1) * FILL_WORD_MS;
    const sendAt = typingTime + SEND_PAUSE_MS;
    schedule(() => {
      setIsFilling(false);
      ask(question);
    }, sendAt);
  }

  function send() {
    if (isAnswering) {
      return;
    }
    ask(draft);
  }

  function stop() {
    const running = snapshot.plan.find((step) => step.status === 'running');
    if (running) {
      store.dispatch(stepEvent(running.id, 'skipped'));
    }
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
    setIsStopped(true);
  }

  function regenerate() {
    setIsStopped(false);
    setFeedback(null);
    setNotice('');
    restart();
  }

  function changeFeedback(next: Feedback | null) {
    setFeedback(next);
    if (next === 'good') {
      setNotice('Marked as a good answer');
      return;
    }
    if (next === 'bad') {
      setNotice('Marked as a bad answer');
      return;
    }
    setNotice('Feedback removed');
  }

  return (
    <div
      ref={rootRef}
      className='bg-card hairline-ring ring-border flex w-full max-w-[36rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      {hasEarlier && (
        <ul aria-label='Earlier questions' className='-mx-2 flex flex-col'>
          <AnimatePresence initial={false}>
            {earlier.map((record) => (
              <motion.li
                key={record.id}
                className='overflow-hidden'
                {...rowPresence}
              >
                <EarlierTurn record={record} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className='relative'>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div
            key={turn.id}
            className='flex flex-col gap-3'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuestionBubble question={turn.question} />
            <div className='flex items-start gap-2.5'>
              <LabTile lab='anthropic' className='mt-1' />
              <div className='flex min-w-0 flex-1 flex-col gap-2'>
                <AnswerSteps
                  plan={snapshot.plan}
                  query={answer.query}
                  found={found}
                  citeCount={cited.length}
                  stage={stage}
                />
                <AnimatedSize>
                  {hasAnswerText && (
                    <CitedAnswer
                      tokens={tokens}
                      sources={cited}
                      shownTokens={shownTokens}
                      isStreaming={isWriting}
                    />
                  )}
                </AnimatedSize>
                <AnimatePresence initial={false}>
                  {isSettled && (
                    <motion.div
                      key='actions'
                      className='overflow-hidden'
                      {...rowPresence}
                    >
                      <AnswerActions
                        copyText={copyText}
                        feedback={feedback}
                        onFeedback={changeFeedback}
                        onRegenerate={regenerate}
                        onCopied={() => setNotice('Answer copied')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {showsFollowUps && (
          <motion.div
            key={`follow-ups-${turn.id}`}
            className='overflow-hidden'
            {...rowPresence}
          >
            <div className='flex flex-col gap-2'>
              <p className='text-muted-foreground text-xs'>Ask next</p>
              <ul className='flex flex-wrap gap-1.5'>
                {followUps.map((id) => {
                  const followUp = answerOf(id);
                  return (
                    <li key={id} className='max-w-full'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={isFilling}
                        onClick={() => fillAndAsk(followUp.question)}
                        className='max-w-full'
                      >
                        <span className='truncate'>{followUp.question}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Composer
        value={draft}
        onChange={setDraft}
        onSend={send}
        onStop={stop}
        isAnswering={isAnswering}
        isFilling={isFilling}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
