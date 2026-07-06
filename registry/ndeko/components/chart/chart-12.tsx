'use client';

import { useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { hold, spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { ChartCard } from './_parts/chart-card';
import { walkSteps, whileDemonstrating } from './_parts/demo';
import { MorphPath } from './_parts/morph-path';
import { PLOT_SURFACE } from './_parts/plot';
import { useChartDemo } from './_parts/use-chart-demo';
import { activeIndexOf, readingAloud, useReading } from './_parts/use-reading';
import { WrappingRoll } from './_parts/wrapping-roll';

export type MatchupContender = {
  id: string;
  name: string;
  /** Fixed per contender, so a colour always names the same one whoever it meets. */
  series: SeriesSlot;
  /** One score per criterion, where a higher score is better. */
  scores: readonly number[];
};

export type MatchupProps = {
  title: string;
  /** A short mark beside the title, such as "Illustrative" over sample data. */
  note?: string;
  criteria: readonly string[];
  contenders: readonly MatchupContender[];
  firstId: string;
  secondId: string;
  onFirstIdChange: (id: string) => void;
  onSecondIdChange: (id: string) => void;
  /** Lights a criterion from outside, for a demonstration. */
  guideIndex?: number | null;
  className?: string;
};

type Lead = {
  criterion: string;
  first: number;
  second: number;
  /** How far ahead the leader is. Zero when the two are level. */
  size: number;
  /** Null when the two are level. */
  leader: MatchupContender | null;
};

/** The shape is drawn in a square of this many units from its centre to an edge. */
const HALF_VIEW = 100;

const VIEW_BOX = '-100 -100 200 200';

const PETAL_REACH = 62;

/** A criterion where the two are level still shows a bud, so no direction of the shape is empty. */
const BUD_REACH = 9;

const PETAL_GROWTH = PETAL_REACH - BUD_REACH;

const LABEL_REACH = 84;

/** How far along a petal its sides stop spreading and turn back in. */
const FLARE = 0.55;

/** Petals stay this share inside the line that splits two neighbours, so they never touch. */
const CLEARANCE = 0.88;

const FULL_TURN = Math.PI * 2;

const LEVEL_COLOR = 'color-mix(in oklab, var(--foreground) 18%, transparent)';

function scoreAt(contender: MatchupContender, index: number) {
  return contender.scores[index] ?? 0;
}

function leaderOf(
  difference: number,
  first: MatchupContender,
  second: MatchupContender
) {
  if (difference > 0) {
    return first;
  }
  if (difference < 0) {
    return second;
  }
  return null;
}

function leadsOf(
  criteria: readonly string[],
  first: MatchupContender,
  second: MatchupContender
) {
  return criteria.map((criterion, index): Lead => {
    const firstScore = scoreAt(first, index);
    const secondScore = scoreAt(second, index);
    const difference = firstScore - secondScore;
    return {
      criterion,
      first: firstScore,
      second: secondScore,
      size: Math.abs(difference),
      leader: leaderOf(difference, first, second),
    };
  });
}

/** The widest gap between any two contenders on any criterion: the lead a full petal stands for. */
function widestGapOf(
  criteria: readonly string[],
  contenders: readonly MatchupContender[]
) {
  let widest = 1;
  for (const [index] of criteria.entries()) {
    const scores = contenders.map((contender) => scoreAt(contender, index));
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    widest = Math.max(widest, highest - lowest);
  }
  return widest;
}

function reachOf(lead: Lead, widestGap: number) {
  const share = lead.size / widestGap;
  const growth = share * PETAL_GROWTH;
  return BUD_REACH + growth;
}

function angleOf(index: number, count: number) {
  const share = index / count;
  return share * FULL_TURN;
}

/** A point turned round the centre by an angle, clockwise from straight up, written for a path. */
function turned(x: number, y: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const turnedX = x * cos - y * sin;
  const turnedY = x * sin + y * cos;
  const left = turnedX.toFixed(2);
  const top = turnedY.toFixed(2);
  return `${left} ${top}`;
}

/**
 * A petal from the centre to its tip. Its sides leave the centre inside the line that splits two
 * neighbours, so petals of any length never overlap, and they meet at a round tip.
 */
function petalPathOf(reach: number, angle: number, criterionCount: number) {
  const halfSlice = Math.PI / criterionCount;
  const spread = Math.tan(halfSlice) * CLEARANCE;
  const flareAt = reach * FLARE;
  const side = flareAt * spread;
  const shoulder = -flareAt;
  const base = turned(0, 0, angle);
  const tip = turned(0, -reach, angle);
  const rightOut = turned(side, shoulder, angle);
  const rightIn = turned(side, -reach, angle);
  const leftIn = turned(-side, -reach, angle);
  const leftOut = turned(-side, shoulder, angle);
  return `M${base} C${rightOut} ${rightIn} ${tip} C${leftIn} ${leftOut} ${base} Z`;
}

/** A distance from the centre of the square, as a percentage from its left or top edge. */
function percentFromCentre(distance: number) {
  const share = distance / HALF_VIEW;
  const percent = 50 + share * 50;
  return `${percent}%`;
}

/** Where the label of a criterion sits round the shape, in percentages of its square. */
function labelPlaceOf(angle: number): React.CSSProperties {
  const x = Math.sin(angle) * LABEL_REACH;
  const y = -Math.cos(angle) * LABEL_REACH;
  const left = percentFromCentre(x);
  const top = percentFromCentre(y);
  return { left, top };
}

function colorOf(contender: MatchupContender | null) {
  if (!contender) {
    return LEVEL_COLOR;
  }
  return seriesColorOf(contender.series);
}

function leadTextOf(lead: Lead) {
  if (!lead.leader) {
    return 'Level';
  }
  return `+${lead.size}`;
}

function leadWordsOf(lead: Lead) {
  if (!lead.leader) {
    return `${lead.criterion}: level`;
  }
  return `${lead.criterion}: ${lead.leader.name} leads by ${lead.size}`;
}

function listOf(names: readonly string[]) {
  if (names.length <= 1) {
    return names.join('');
  }
  const last = names[names.length - 1];
  const others = names.slice(0, -1);
  const start = others.join(', ');
  return `${start} and ${last}`;
}

/** The two criteria a contender leads by the most, in words. */
function strengthsOf(leads: readonly Lead[], contender: MatchupContender) {
  const own = leads.filter((lead) => lead.leader?.id === contender.id);
  const ranked = [...own].sort((first, second) => second.size - first.size);
  const strongest = ranked.slice(0, 2);
  const names = strongest.map((lead) => lead.criterion.toLowerCase());
  return listOf(names);
}

function firstLineOf(leads: readonly Lead[], first: MatchupContender) {
  const strengths = strengthsOf(leads, first);
  if (strengths === '') {
    return `${first.name} leads nowhere`;
  }
  return `${first.name} leads on ${strengths}`;
}

function secondLineOf(leads: readonly Lead[], second: MatchupContender) {
  const strengths = strengthsOf(leads, second);
  if (strengths === '') {
    return `${second.name} leads nowhere`;
  }
  return `${second.name} on ${strengths}`;
}

function dimmedOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-35';
  }
  return undefined;
}

function litOf(isLit: boolean) {
  if (isLit) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
}

type ColorKeyProps = {
  color: string;
  className?: string;
};

function ColorKey({ color, className }: ColorKeyProps) {
  return (
    <span
      aria-hidden='true'
      className={cn('size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  );
}

type ContenderPickerProps = {
  label: string;
  contenders: readonly MatchupContender[];
  value: string;
  /** The contender on the other side, which this side cannot also pick. */
  takenId: string;
  onValueChange: (id: string) => void;
};

function ContenderPicker({
  label,
  contenders,
  value,
  takenId,
  onValueChange,
}: ContenderPickerProps) {
  const items = contenders.map((contender) => ({
    value: contender.id,
    label: contender.name,
  }));

  function changeValue(next: string | null) {
    if (next !== null) {
      onValueChange(next);
    }
  }

  return (
    <Select items={items} value={value} onValueChange={changeValue}>
      <SelectTrigger size='sm' aria-label={label} className='w-auto min-w-0'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {contenders.map((contender) => (
          <SelectItem
            key={contender.id}
            value={contender.id}
            disabled={contender.id === takenId}
          >
            {contender.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Matchup({
  title,
  note,
  criteria,
  contenders,
  firstId,
  secondId,
  onFirstIdChange,
  onSecondIdChange,
  guideIndex = null,
  className,
}: MatchupProps) {
  const [hasPicked, setHasPicked] = useState(false);
  const first = contenderOf(contenders, firstId);
  const second = contenderOf(contenders, secondId);
  const leads = leadsOf(criteria, first, second);
  const widestGap = widestGapOf(criteria, contenders);
  const count = Math.max(criteria.length, 1);
  const reading = useReading({ count, defaultIndex: 0, guideIndex });
  const activeIndex = activeIndexOf(reading.isActive, reading.shownIndex);
  const firstLine = firstLineOf(leads, first);
  const secondLine = secondLineOf(leads, second);
  const sentence = `${firstLine}; ${secondLine}`;
  const shownLead = leads.at(reading.shownIndex);
  const pointReading = readingOfLead(shownLead);
  const keyReading = readingAloud(reading.isReadingByKeys, pointReading);

  /** The sentence is said aloud once a person has picked a contender: a demonstration stays silent. */
  function pickFirst(id: string) {
    setHasPicked(true);
    onFirstIdChange(id);
  }

  function pickSecond(id: string) {
    setHasPicked(true);
    onSecondIdChange(id);
  }

  return (
    <ChartCard
      title={title}
      note={note}
      summary={`${sentence}.`}
      className={className}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <ContenderPicker
          label='First contender'
          contenders={contenders}
          value={first.id}
          takenId={second.id}
          onValueChange={pickFirst}
        />
        <span className='text-muted-foreground text-xs'>against</span>
        <ContenderPicker
          label='Second contender'
          contenders={contenders}
          value={second.id}
          takenId={first.id}
          onValueChange={pickSecond}
        />
      </div>
      <div className='flex flex-col gap-0.5 text-[13px]'>
        <p className='flex items-start gap-2'>
          <ColorKey color={colorOf(first)} className='mt-1.5' />
          <WrappingRoll text={firstLine} className='min-w-0' />
        </p>
        <p className='flex items-start gap-2'>
          <ColorKey color={colorOf(second)} className='mt-1.5' />
          <WrappingRoll text={secondLine} className='min-w-0' />
        </p>
      </div>
      <div
        role='group'
        tabIndex={0}
        aria-label={`${title}. Use the arrow keys to read each criterion.`}
        className={cn(
          PLOT_SURFACE,
          'mx-auto aspect-square w-full max-w-[17rem]'
        )}
        {...reading.markHandlers}
      >
        <svg
          aria-hidden='true'
          viewBox={VIEW_BOX}
          className='absolute inset-0 size-full'
        >
          <circle
            r={PETAL_REACH}
            vectorEffect='non-scaling-stroke'
            className='stroke-border fill-none [stroke-width:var(--hairline)]'
          />
          {leads.map((lead, index) => {
            const angle = angleOf(index, count);
            const reach = reachOf(lead, widestGap);
            const isDimmed = activeIndex !== null && activeIndex !== index;

            return (
              <MorphPath
                key={lead.criterion}
                d={petalPathOf(reach, angle, count)}
                onPointerEnter={() => reading.pointTo(index)}
                className={cn(
                  'transition-[fill,opacity] duration-300 ease-(--ease-out-strong)',
                  dimmedOf(isDimmed)
                )}
                style={{ fill: colorOf(lead.leader) }}
              />
            );
          })}
          <circle r={3.5} className='fill-card' />
        </svg>
        {leads.map((lead, index) => (
          <span
            key={lead.criterion}
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute flex -translate-1/2 flex-col items-center text-[11px] leading-4 whitespace-nowrap transition-colors duration-150',
              litOf(activeIndex === index)
            )}
            style={labelPlaceOf(angleOf(index, count))}
          >
            {lead.criterion}
            <span className='flex items-center gap-1 tabular-nums'>
              <ColorKey color={colorOf(lead.leader)} />
              {leadTextOf(lead)}
            </span>
          </span>
        ))}
      </div>
      <table className='w-full text-xs tabular-nums'>
        <caption className='sr-only'>
          Scores on each criterion, and who leads
        </caption>
        <thead>
          <tr className='text-muted-foreground text-start'>
            <th scope='col' className='py-1.5 text-start font-normal'>
              Criterion
            </th>
            <th
              scope='col'
              className='py-1.5 ps-3 text-end font-normal text-balance'
            >
              {first.name}
            </th>
            <th
              scope='col'
              className='py-1.5 ps-3 text-end font-normal text-balance'
            >
              {second.name}
            </th>
            <th scope='col' className='py-1.5 ps-3 text-end font-normal'>
              Lead
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={lead.criterion}
              onPointerEnter={() => reading.pointTo(index)}
              onPointerLeave={() => reading.pointTo(null)}
              className={cn(
                'hairline-t border-border transition-colors duration-150',
                activeIndex === index && 'bg-foreground/[0.03]'
              )}
            >
              <th scope='row' className='py-1.5 text-start font-medium'>
                {lead.criterion}
              </th>
              <td className='py-1.5 ps-3 text-end'>{lead.first}</td>
              <td className='py-1.5 ps-3 text-end'>{lead.second}</td>
              <td className='py-1.5 ps-3 text-end'>
                <span className='inline-flex items-center justify-end gap-1.5'>
                  <ColorKey color={colorOf(lead.leader)} />
                  {leadTextOf(lead)}
                  <span className='sr-only'>
                    {lead.leader && ` for ${lead.leader.name}`}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LiveRegion message={keyReading} />
      <LiveRegion message={spokenUnless(!hasPicked, sentence)} />
    </ChartCard>
  );
}

function contenderOf(contenders: readonly MatchupContender[], id: string) {
  const contender = contenders.find((candidate) => candidate.id === id);
  return contender ?? contenders[0];
}

function readingOfLead(lead: Lead | undefined) {
  if (!lead) {
    return '';
  }
  return leadWordsOf(lead);
}

const CRITERIA = [
  'Reasoning',
  'Accuracy',
  'Speed',
  'Cost',
  'Context',
  'Tool use',
];

const MODELS: MatchupContender[] = [
  {
    id: 'lumen-max',
    name: 'Lumen Max',
    series: 3,
    scores: [92, 90, 58, 44, 88, 84],
  },
  {
    id: 'lumen-swift',
    name: 'Lumen Swift',
    series: 1,
    scores: [71, 76, 93, 91, 62, 70],
  },
  {
    id: 'quarry-large',
    name: 'Quarry Large',
    series: 2,
    scores: [86, 84, 72, 63, 91, 77],
  },
  {
    id: 'quarry-mini',
    name: 'Quarry Mini',
    series: 4,
    scores: [64, 70, 89, 95, 55, 61],
  },
];

const FIRST_MODEL = 'lumen-max';

const RESTING_RIVAL = 'lumen-swift';

/** Cost, speed, then context: where the two resting contenders are furthest apart. */
const WALK = [3, 2, 4];

export default function Chart12() {
  const [firstId, setFirstId] = useState(FIRST_MODEL);
  const [secondId, setSecondId] = useState(RESTING_RIVAL);
  const [guide, setGuide] = useState<number | null>(null);

  function resetDemo() {
    setFirstId(FIRST_MODEL);
    setSecondId(RESTING_RIVAL);
    setGuide(null);
  }

  const steps: AutoplayStep[] = [
    ...walkSteps(WALK, setGuide, { startAfter: 1300, stepMs: 900 }),
    { after: 1100, run: () => setGuide(null) },
    { after: 500, run: () => setSecondId('quarry-large') },
    { after: 2600, run: () => setSecondId('quarry-mini') },
    { after: 2600, run: () => setSecondId(RESTING_RIVAL) },
    { after: 1400, run: hold },
  ];
  const { ref, isAutoplaying, stopOnKeyboardFocus } = useChartDemo(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  return (
    <div
      ref={ref}
      onFocus={stopOnKeyboardFocus}
      className='flex min-h-[41rem] w-full max-w-[26rem]'
    >
      <Matchup
        title='Model matchup'
        note='Illustrative'
        criteria={CRITERIA}
        contenders={MODELS}
        firstId={firstId}
        secondId={secondId}
        onFirstIdChange={setFirstId}
        onSecondIdChange={setSecondId}
        guideIndex={whileDemonstrating(isAutoplaying, guide)}
        className='w-full'
      />
    </div>
  );
}
