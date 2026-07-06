'use client';

import { useId, useState } from 'react';

import {
  type AutoplayStep,
  typingSteps,
  useAutoplay,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { keyDelayOf, spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { TicketPercentIcon } from '@/registry/ndeko/lib/icons';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ANCHORS } from './data';
import { PlanCard } from './plan-card';
import {
  MAX_VOLUME,
  type Plan,
  PLANS,
  SECTION,
  START_VOLUME,
} from './pricing-data';
import { SectionFrame, SectionHeader } from './section-frame';
import {
  cheapestPlanAt,
  clampVolume,
  positionOf,
  volumeAt,
  volumeOfText,
} from './volume-model';
import { VolumeSentence } from './volume-sentence';
import { VolumeTrack } from './volume-track';

/** Where the demonstration drags the volume: past both notches, to where Firm becomes the cheapest. */
const DEMO_SCRUB_TO = 120_000;

/** What the demonstration then types, back in the stretch where Starter is the cheapest. */
const DEMO_TYPED = '2500';

/** The pause between two stops when the demonstration drags the number. */
const SCRUB_STEP_MS = 130;

const LOOP_AFTER_MS = 3000;

/** A drag of the demonstration from stop to stop, through the same handler a hand uses. */
function scrubSteps(
  from: number,
  to: number,
  write: (volume: number) => void,
  startAfter: number
): AutoplayStep[] {
  const firstPosition = Math.round(positionOf(from));
  const lastPosition = Math.round(positionOf(to));
  const distance = lastPosition - firstPosition;
  const direction = Math.sign(distance);
  const count = Math.abs(distance);
  const indexes = Array.from({ length: count }, (_, index) => index);
  return indexes.map((index) => {
    const walked = index + 1;
    const offset = walked * direction;
    const position = firstPosition + offset;
    const volume = volumeAt(position);
    const after = keyDelayOf(index, startAfter, SCRUB_STEP_MS);
    return { after, run: () => write(volume) };
  });
}

function announcementOf(cheapest: Plan, isOverLimit: boolean) {
  if (isOverLimit) {
    return SECTION.over;
  }
  return `${cheapest.name} is the cheapest plan at this volume.`;
}

export function Pricing() {
  const [volume, setVolume] = useState(START_VOLUME);
  const [draft, setDraft] = useState<string | null>(null);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [isDemoScrubbing, setIsDemoScrubbing] = useState(false);
  const hintId = useId();
  const cheapest = cheapestPlanAt(volume);

  function type(text: string) {
    setDraft(text);
    const typed = volumeOfText(text);
    if (typed === null) {
      setIsOverLimit(false);
      return;
    }
    const isOver = typed > MAX_VOLUME;
    const next = clampVolume(typed);
    setVolume(next);
    setIsOverLimit(isOver);
  }

  function commit() {
    setDraft(null);
  }

  function scrubTo(next: number) {
    setVolume(next);
    setDraft(null);
    setIsOverLimit(false);
  }

  function startOver() {
    setVolume(START_VOLUME);
    setDraft(null);
    setIsOverLimit(false);
    setIsDemoScrubbing(false);
  }

  const steps: AutoplayStep[] = [
    { after: 1300, run: () => setIsDemoScrubbing(true) },
    ...scrubSteps(START_VOLUME, DEMO_SCRUB_TO, scrubTo, 180),
    { after: 260, run: () => setIsDemoScrubbing(false) },
    { after: 1800, run: () => type('') },
    ...typingSteps(DEMO_TYPED, type, { startAfter: 420, characterMs: 170 }),
    { after: 600, run: commit },
  ];
  const { ref, isAutoplaying } = useAutoplay<HTMLElement>(steps, {
    loopAfter: LOOP_AFTER_MS,
    onReset: startOver,
  });
  /** A person who takes over in the middle of the drag lets go of the number. */
  const showsDemoScrub = isDemoScrubbing && isAutoplaying;
  const announcement = announcementOf(cheapest, isOverLimit);
  const message = spokenUnless(isAutoplaying, announcement);

  useKeptHeight(ref);

  return (
    <SectionFrame id={ANCHORS.pricing} ref={ref}>
      <SectionHeader
        icon={TicketPercentIcon}
        label={SECTION.label}
        title={SECTION.title}
        lead={SECTION.lead}
      />
      <div className='flex flex-col gap-6'>
        <VolumeSentence
          volume={volume}
          draft={draft}
          isOverLimit={isOverLimit}
          isDemoScrubbing={showsDemoScrub}
          hintId={hintId}
          onType={type}
          onCommit={commit}
          onScrub={scrubTo}
        />
        <VolumeTrack
          volume={volume}
          cheapest={cheapest}
          onVolumeChange={scrubTo}
        />
      </div>
      <div className='grid gap-4 @3xl:grid-cols-3'>
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            volume={volume}
            isCheapest={plan === cheapest}
          />
        ))}
      </div>
      <p className='text-muted-foreground text-xs'>{SECTION.footnote}</p>
      <LiveRegion message={message} />
    </SectionFrame>
  );
}
