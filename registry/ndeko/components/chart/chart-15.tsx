'use client';

import { useState } from 'react';

import {
  typingSteps,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import {
  hold,
  PRESS_LEAD_MS,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import type { AxisLabel } from './_parts/axis';
import { ChartCard } from './_parts/chart-card';
import { ChipButton } from './_parts/chip-button';
import { DataTable, type DataRow } from './_parts/data-table';
import { formatUsd } from './_parts/format';
import { Legend, type LegendEntry } from './_parts/legend';
import { LINE_STROKE, MorphPath } from './_parts/morph-path';
import { linePathOf, plotPointsOf, yOf } from './_parts/path';
import { PathLayer, PlotFrame } from './_parts/plot';
import { QuestionForm } from './_parts/question-form';
import {
  Readout,
  ReadoutDot,
  ReadoutRow,
  ReadoutTitle,
} from './_parts/readout';
import {
  columnCenterOf,
  extentOf,
  niceScaleOf,
  withZero,
  type Scale,
} from './_parts/scale';
import { StreamedWords } from './_parts/streamed-words';
import { useChartDemo } from './_parts/use-chart-demo';
import { readingAloud, useReading } from './_parts/use-reading';
import {
  arrivedStreamOf,
  spokenStreamOf,
  useWordStream,
  wordsOf,
  type WordStream,
} from './_parts/use-word-stream';

type ValueFormat = (value: number) => string;

export type AskSeries = {
  id: string;
  name: string;
  /** One value per label. */
  values: readonly number[];
};

export type AskResult = {
  id: string;
  question: string;
  /** The lines the chart draws for this question, and the one its answer is about. */
  series: readonly AskSeries[];
  focusId: string;
};

export type AskedQuestion = {
  id: string;
  question: string;
};

export type AskDataProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  /** One label per position: what the readout names and the axis writes. */
  labels: readonly string[];
  /** What the chart draws now. A new result reshapes the same lines. */
  result: AskResult;
  /** The line that answers the question, as it arrives. */
  answer: WordStream;
  question: string;
  onQuestionChange: (question: string) => void;
  onAsk: (question: string) => void;
  /** Questions offered under the field. A follow-up to the current answer comes first. */
  suggestions: readonly string[];
  /** The questions already asked, to go back to one of them. */
  history: readonly AskedQuestion[];
  onRevisit: (id: string) => void;
  /** Said under the field when a question has no answer: what to try next. */
  hint?: string | null;
  formatValue?: ValueFormat;
  /** Shows Ask held down, for a demonstration that presses it. */
  isAskPressed?: boolean;
  className?: string;
};

const PLOT_HEIGHT = 150;

const MAX_LINES = 3;

const FOCUS_COLOR = 'var(--primary)';

/** The lines an answer is not about step back to a quarter of the text colour. */
const MUTED_COLOR = 'color-mix(in oklab, var(--foreground) 22%, transparent)';

function colorOf(series: AskSeries, focusId: string) {
  if (series.id === focusId) {
    return FOCUS_COLOR;
  }
  return MUTED_COLOR;
}

function scaleOf(series: readonly AskSeries[]) {
  const values = series.flatMap((entry) => entry.values);
  const extent = extentOf(values);
  const domain = withZero(extent);
  return niceScaleOf(domain, MAX_LINES);
}

function valueAt(series: AskSeries, index: number) {
  return series.values[index] ?? 0;
}

function topAt(series: AskSeries, index: number, scale: Scale) {
  const value = valueAt(series, index);
  return yOf(value, scale, PLOT_HEIGHT);
}

function formattedAt(series: AskSeries, index: number, format: ValueFormat) {
  const value = valueAt(series, index);
  return format(value);
}

function linePathFor(series: AskSeries, scale: Scale) {
  const points = plotPointsOf(series.values, scale, PLOT_HEIGHT);
  return linePathOf(points);
}

function highestTopOf(
  series: readonly AskSeries[],
  index: number,
  scale: Scale
) {
  const tops = series.map((entry) => topAt(entry, index, scale));
  if (tops.length === 0) {
    return 0;
  }
  return Math.min(...tops);
}

type AnswerLinesProps = {
  series: readonly AskSeries[];
  focus: AskSeries | undefined;
  scale: Scale;
};

/**
 * Lines are keyed by their place in the result, not by their series: a follow-up brings other
 * series, and each line then reshapes into the one that takes its place instead of being replaced.
 * The line the answer is about is drawn once more on top, in colour.
 */
function AnswerLines({ series, focus, scale }: AnswerLinesProps) {
  return (
    <PathLayer height={PLOT_HEIGHT}>
      {series.map((entry, index) => (
        <MorphPath
          key={index}
          d={linePathFor(entry, scale)}
          className={LINE_STROKE}
          style={{ stroke: MUTED_COLOR }}
        />
      ))}
      {focus && (
        <MorphPath
          d={linePathFor(focus, scale)}
          className={LINE_STROKE}
          style={{ stroke: FOCUS_COLOR }}
        />
      )}
    </PathLayer>
  );
}

export function AskData({
  title,
  note,
  labels,
  result,
  answer,
  question,
  onQuestionChange,
  onAsk,
  suggestions,
  history,
  onRevisit,
  hint = null,
  formatValue = formatUsd,
  isAskPressed = false,
  className,
}: AskDataProps) {
  const [hasAsked, setHasAsked] = useState(false);
  const scale = scaleOf(result.series);
  const count = labels.length;
  const lastIndex = Math.max(count - 1, 0);
  const reading = useReading({ count, defaultIndex: lastIndex });
  const shownIndex = reading.shownIndex;
  const shownLabel = labels[shownIndex] ?? '';
  const focus = result.series.find((entry) => entry.id === result.focusId);
  const isStreaming = answer.status === 'streaming';
  const isThinking = answer.status === 'thinking';
  const canAsk = question.trim() !== '' && !isThinking;
  const spokenAnswer = spokenStreamOf(answer);
  const spoken = hint ?? spokenAnswer;

  const axisLabels: AxisLabel[] = labels.map((text, index) => ({
    id: `${index}-${text}`,
    text,
    ratio: columnCenterOf(index, count),
  }));

  const legend: LegendEntry[] = result.series.map((entry) => ({
    id: entry.id,
    label: entry.name,
    color: colorOf(entry, result.focusId),
  }));

  const rows: DataRow[] = labels.map((label, index) => ({
    id: `${index}-${label}`,
    label,
    cells: result.series.map((entry) => formattedAt(entry, index, formatValue)),
  }));

  const readings = result.series.map((entry) => {
    const value = formattedAt(entry, shownIndex, formatValue);
    return `${entry.name} ${value}`;
  });
  const spokenReading = `${shownLabel}: ${readings.join(', ')}`;

  /** An answer is said aloud once a person has asked for one: a demonstration stays silent. */
  function askByHand(text: string) {
    setHasAsked(true);
    onAsk(text);
  }

  function revisit(id: string) {
    setHasAsked(true);
    onRevisit(id);
  }

  return (
    <ChartCard
      title={title}
      note={note}
      summary={`${result.question} ${spokenAnswer}`}
      className={className}
    >
      <div className='flex flex-col gap-2'>
        <QuestionForm
          value={question}
          onValueChange={onQuestionChange}
          onSubmit={askByHand}
          label='Ask a question about this data'
          placeholder='Ask about revenue'
          submitLabel='Ask'
          isSubmitDisabled={!canAsk}
          isSubmitPressed={isAskPressed}
          hint={hint}
        />
        <div
          role='group'
          aria-label='Questions to try'
          className='flex flex-wrap gap-1.5'
        >
          {suggestions.map((suggestion) => (
            <ChipButton key={suggestion} onClick={() => askByHand(suggestion)}>
              {suggestion}
            </ChipButton>
          ))}
        </div>
      </div>
      <p className='min-h-10 text-sm leading-5 font-medium text-pretty'>
        {isThinking && (
          <span className='text-muted-foreground font-normal'>
            Reading the data
          </span>
        )}
        {!isThinking && (
          <StreamedWords
            key={result.id}
            words={answer.words}
            shown={answer.shown}
            isStreaming={isStreaming}
          />
        )}
      </p>
      <PlotFrame
        label={`${result.question} Use the arrow keys to read each position.`}
        scale={scale}
        height={PLOT_HEIGHT}
        formatTick={formatValue}
        axisLabels={axisLabels}
        axisAlign='center'
        plotProps={reading.handlers}
      >
        <AnswerLines series={result.series} focus={focus} scale={scale} />
        <Readout
          ratio={columnCenterOf(shownIndex, Math.max(count, 1))}
          top={highestTopOf(result.series, shownIndex, scale)}
          isVisible={reading.isActive && count > 0}
          isGliding={reading.isGliding}
          marks={result.series.map((entry) => (
            <ReadoutDot
              key={entry.id}
              top={topAt(entry, shownIndex, scale)}
              color={colorOf(entry, result.focusId)}
            />
          ))}
        >
          <ReadoutTitle>{shownLabel}</ReadoutTitle>
          {result.series.map((entry) => (
            <ReadoutRow
              key={entry.id}
              value={formattedAt(entry, shownIndex, formatValue)}
              name={entry.name}
              color={colorOf(entry, result.focusId)}
            />
          ))}
        </Readout>
      </PlotFrame>
      <Legend
        entries={legend}
        label='Series, the one in colour is the answer'
      />
      {history.length > 1 && (
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-muted-foreground text-xs'>Asked</span>
          {history.map((asked) => (
            <ChipButton
              key={asked.id}
              isCurrent={asked.id === result.id}
              onClick={() => revisit(asked.id)}
            >
              {asked.question}
            </ChipButton>
          ))}
        </div>
      )}
      <LiveRegion message={spokenUnless(!hasAsked, spoken)} />
      <LiveRegion
        message={readingAloud(reading.isReadingByKeys, spokenReading)}
      />
      <DataTable
        caption={result.question}
        columns={['Period', ...result.series.map((entry) => entry.name)]}
        rows={rows}
      />
    </ChartCard>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const BY_PLAN: AskSeries[] = [
  {
    id: 'starter',
    name: 'Starter',
    values: [14000, 14500, 15000, 13600, 13200, 12800],
  },
  {
    id: 'team',
    name: 'Team',
    values: [21000, 22000, 23500, 24000, 25500, 27000],
  },
  {
    id: 'business',
    name: 'Business',
    values: [18000, 19500, 21000, 23500, 26000, 29000],
  },
];

const BY_REGION: AskSeries[] = [
  {
    id: 'asia-pacific',
    name: 'Asia Pacific',
    values: [10000, 10500, 10500, 10100, 10200, 10300],
  },
  {
    id: 'north-america',
    name: 'North America',
    values: [26000, 27000, 28500, 29000, 30500, 32000],
  },
  {
    id: 'europe',
    name: 'Europe',
    values: [17000, 18500, 20500, 22000, 24000, 26500],
  },
];

type Canned = AskResult & {
  answer: string;
  /** Words a typed question has to hold to get this answer. */
  keywords: readonly string[];
  /** A follow-up only answers after the question it follows. */
  follows?: string;
};

const CANNED: Canned[] = [
  {
    id: 'fastest-region',
    question: 'And by region?',
    answer:
      'By region, Europe grew fastest: from $17K to $26.5K a month since January.',
    series: BY_REGION,
    focusId: 'europe',
    keywords: ['region'],
    follows: 'fastest-plan',
  },
  {
    id: 'losing-region',
    question: 'Which region stood still?',
    answer:
      'By region, Asia Pacific stood still at about $10K a month while the other two grew.',
    series: BY_REGION,
    focusId: 'asia-pacific',
    keywords: ['region'],
    follows: 'losing-plan',
  },
  {
    id: 'fastest-plan',
    question: 'Which plan grew fastest?',
    answer: 'Business grew fastest: from $18K to $29K a month since January.',
    series: BY_PLAN,
    focusId: 'business',
    keywords: ['grew'],
  },
  {
    id: 'losing-plan',
    question: 'Where did we lose ground?',
    answer:
      'Starter slipped from $14K to $12.8K a month, and has fallen every month since March.',
    series: BY_PLAN,
    focusId: 'starter',
    keywords: ['lose'],
  },
  {
    id: 'team-june',
    question: 'Team revenue in June?',
    answer: 'Team brought in $27K in June, its best month so far.',
    series: BY_PLAN,
    focusId: 'team',
    keywords: ['team'],
  },
];

const FIRST_ANSWER = cannedOf('fastest-plan');

const NO_MATCH_HINT =
  'This sample only answers the questions below. Pick one, or type one of them';

function cannedOf(id: string) {
  const canned = CANNED.find((candidate) => candidate.id === id);
  return canned ?? CANNED[0];
}

function holdsEvery(text: string, keywords: readonly string[]) {
  return keywords.every((keyword) => text.includes(keyword));
}

/** The answer to a typed question: a follow-up of the current answer first, then any question it names. */
function matchOf(question: string, currentId: string) {
  const text = question.toLowerCase();
  return CANNED.find((candidate) => {
    const isOutOfTurn =
      candidate.follows !== undefined && candidate.follows !== currentId;
    if (isOutOfTurn) {
      return false;
    }
    return holdsEvery(text, candidate.keywords);
  });
}

/** The follow-up of the current answer when it has one, then the other questions that stand alone. */
function suggestionsFor(currentId: string) {
  const followUps = CANNED.filter(
    (candidate) => candidate.follows === currentId
  );
  const others = CANNED.filter((candidate) => {
    const standsAlone = candidate.follows === undefined;
    return standsAlone && candidate.id !== currentId;
  });
  const offered = [...followUps, ...others];
  return offered.map((candidate) => candidate.question);
}

const THINK_MS = 700;

const WORD_MS = 60;

function readTimeOf(answer: string) {
  const writing = wordsOf(answer).length * WORD_MS;
  return THINK_MS + writing + 2400;
}

const FOLLOW_UP = cannedOf('fastest-region');

const SECOND_QUESTION = cannedOf('losing-plan');

type PressKey = 'ask';

export default function Chart15() {
  const [question, setQuestion] = useState('');
  const [currentId, setCurrentId] = useState(FIRST_ANSWER.id);
  const [askedIds, setAskedIds] = useState<string[]>([FIRST_ANSWER.id]);
  const [hint, setHint] = useState<string | null>(null);
  const { stream, start, show } = useWordStream(
    arrivedStreamOf(FIRST_ANSWER.answer)
  );
  const { pressed, press } = usePress<PressKey>();
  const current = cannedOf(currentId);
  const history = askedIds.map((id) => {
    const asked = cannedOf(id);
    return { id, question: asked.question };
  });

  function remember(id: string) {
    setAskedIds((asked) => {
      if (asked.includes(id)) {
        return asked;
      }
      return [...asked, id];
    });
  }

  function ask(text: string) {
    const match = matchOf(text, currentId);
    if (!match) {
      setHint(NO_MATCH_HINT);
      return;
    }
    setHint(null);
    setQuestion('');
    setCurrentId(match.id);
    remember(match.id);
    start(match.answer, { thinkMs: THINK_MS, wordMs: WORD_MS });
  }

  function revisit(id: string) {
    const asked = cannedOf(id);
    setHint(null);
    setCurrentId(asked.id);
    show(arrivedStreamOf(asked.answer));
  }

  function changeQuestion(text: string) {
    setHint(null);
    setQuestion(text);
  }

  function resetDemo() {
    setQuestion('');
    setHint(null);
    setCurrentId(FIRST_ANSWER.id);
    setAskedIds([FIRST_ANSWER.id]);
    show(arrivedStreamOf(FIRST_ANSWER.answer));
  }

  const steps: AutoplayStep[] = [
    ...typingSteps(FOLLOW_UP.question, setQuestion, { startAfter: 1600 }),
    { after: 420, run: () => press('ask') },
    { after: PRESS_LEAD_MS, run: () => ask(FOLLOW_UP.question) },
    ...typingSteps(SECOND_QUESTION.question, setQuestion, {
      startAfter: readTimeOf(FOLLOW_UP.answer),
    }),
    { after: 420, run: () => press('ask') },
    { after: PRESS_LEAD_MS, run: () => ask(SECOND_QUESTION.question) },
    { after: readTimeOf(SECOND_QUESTION.answer), run: hold },
  ];
  const { ref, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1200,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[34rem] w-full max-w-[32rem]'
    >
      <AskData
        title='Ask your data'
        note='Illustrative'
        labels={MONTHS}
        result={current}
        answer={stream}
        question={question}
        onQuestionChange={changeQuestion}
        onAsk={ask}
        suggestions={suggestionsFor(currentId)}
        history={history}
        onRevisit={revisit}
        hint={hint}
        isAskPressed={pressed === 'ask'}
        className='w-full'
      />
    </div>
  );
}
