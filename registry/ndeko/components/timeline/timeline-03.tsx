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
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type ClaimStep = {
  day: string;
  title: string;
  detail: string;
};

const CLAIM: ClaimStep[] = [
  {
    day: '2026-10-28',
    title: 'Claim opened',
    detail:
      'Pinecrest reported two crushed cartons on delivery CF-48213 and sent six photos.',
  },
  {
    day: '2026-10-30',
    title: 'Carrier statement',
    detail:
      'The driver and the depot scan both show the pallet leaving Leeds intact.',
  },
  {
    day: '2026-11-04',
    title: 'Damage assessed',
    detail:
      'An assessor valued the loss at 412.60 EUR, inside the cover of the shipment.',
  },
  {
    day: '2026-11-13',
    title: 'Payout',
    detail:
      'The amount is paid to the account on file once Pinecrest signs the settlement.',
  },
];

const DONE_COUNT = 3;

export default function Timeline03() {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      role='list'
      aria-label='Calder Freight claim CF-48213'
    >
      {CLAIM.map((claimStep, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={claimStep.day}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
          >
            <TimelineHeader>
              <TimelineIndicator />
              <TimelineSeparator />
              <TimelineDate dateTime={claimStep.day}>
                {dayLabelOf(claimStep.day)}
              </TimelineDate>
              <TimelineTitle>
                {claimStep.title}
                <StepStateNote state={state} />
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent>{claimStep.detail}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
