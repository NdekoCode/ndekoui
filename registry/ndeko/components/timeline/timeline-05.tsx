'use client';

import { useState } from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

import { dayLabelOf } from './_parts/dates';
import { MARKER, MARKER_RAIL, MARKER_ROW } from './_parts/markers';
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type OnboardingStep = {
  day: string;
  title: string;
  detail: string;
};

const FIRST_WEEK: OnboardingStep[] = [
  {
    day: '2026-11-09',
    title: 'Laptop and accounts',
    detail: 'Collect your laptop and sign in to mail, chat and the tracker.',
  },
  {
    day: '2026-11-10',
    title: 'Ship a small fix',
    detail: 'Pick a starter issue and take it through review with your buddy.',
  },
  {
    day: '2026-11-12',
    title: 'Sit in on a client call',
    detail: 'Join the Oatfield weekly and write up the notes.',
  },
  {
    day: '2026-11-13',
    title: 'First week review',
    detail:
      'Thirty minutes with your lead on what worked and what was missing.',
  },
];

const DONE_AT_START = 2;

const CIRCLE = [
  MARKER,
  'text-primary-foreground scale-90 group-aria-[current=step]/timeline-item:border-foreground/40',
  'group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100',
].join(' ');

/* The stroke is one dash as long as the path: sliding it into place draws the check, and it leaves faster than it came. */
const CHECK_STROKE = [
  'opacity-0 transition-[stroke-dashoffset,opacity] duration-150 ease-(--ease-out-strong) [stroke-dasharray:1] [stroke-dashoffset:1]',
  'group-data-completed/timeline-item:opacity-100 group-data-completed/timeline-item:delay-100 group-data-completed/timeline-item:duration-300 group-data-completed/timeline-item:[stroke-dashoffset:0]',
].join(' ');

function DrawnCheck() {
  return (
    <svg viewBox='0 0 12 12' aria-hidden='true' className='size-3.5'>
      <path
        d='M2.75 6.25 5 8.5l4.25-4.75'
        pathLength={1}
        fill='none'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        className={CHECK_STROKE}
      />
    </svg>
  );
}

function progressLabelOf(doneCount: number) {
  return `${doneCount} of ${FIRST_WEEK.length} steps done`;
}

function actionLabelOf(isComplete: boolean) {
  if (isComplete) {
    return 'Start over';
  }
  return 'Mark next step done';
}

export default function Timeline05() {
  const [doneCount, setDoneCount] = useState(DONE_AT_START);
  const [notice, setNotice] = useState('');
  const isComplete = doneCount === FIRST_WEEK.length;
  const progressLabel = progressLabelOf(doneCount);
  const actionLabel = actionLabelOf(isComplete);

  function advance() {
    if (isComplete) {
      setDoneCount(0);
      setNotice('Checklist cleared');
      return;
    }
    const finished = FIRST_WEEK[doneCount];
    const nextCount = doneCount + 1;
    const nextProgress = progressLabelOf(nextCount);
    setDoneCount(nextCount);
    setNotice(`${finished.title} done. ${nextProgress}`);
  }

  return (
    <div className='relative flex w-full max-w-md flex-col gap-4'>
      <Timeline
        value={doneCount}
        role='list'
        aria-label='Your first week at Mossline'
        className='[--marker:1.5rem]'
      >
        {FIRST_WEEK.map((onboardingStep, index) => {
          const step = index + 1;
          const state = stepStateOf(step, doneCount);

          return (
            <TimelineItem
              key={onboardingStep.title}
              step={step}
              role='listitem'
              aria-current={currentStepOf(state)}
              className={MARKER_ROW}
            >
              <TimelineHeader>
                <TimelineIndicator className={CIRCLE}>
                  <DrawnCheck />
                </TimelineIndicator>
                <TimelineSeparator className={MARKER_RAIL} />
                <TimelineDate dateTime={onboardingStep.day} className='mt-1'>
                  {dayLabelOf(onboardingStep.day)}
                </TimelineDate>
                <TimelineTitle>
                  {onboardingStep.title}
                  <StepStateNote state={state} />
                </TimelineTitle>
              </TimelineHeader>
              <TimelineContent>{onboardingStep.detail}</TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-2'>
        <p className='text-muted-foreground text-xs tabular-nums'>
          <WordRoll text={progressLabel} value={doneCount} />
        </p>
        <Button type='button' variant='outline' size='sm' onClick={advance}>
          <WordRoll text={actionLabel} />
        </Button>
      </div>
      <LiveRegion message={notice} />
    </div>
  );
}
