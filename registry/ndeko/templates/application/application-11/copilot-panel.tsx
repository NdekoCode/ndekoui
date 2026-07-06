'use client';

import { WordRoll } from '@/components/core/word-roll';
import { useFollowBottom } from '@/registry/ndeko/hooks/use-follow-bottom';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { CopilotSteps } from './copilot-steps';
import { CustomerCard } from './customer-card';
import {
  CUSTOMER_FIELDS,
  MODEL,
  WRITER,
  type StepId,
  type Ticket,
} from './data';
import { RefundRequest } from './refund-request';
import type { Decision, RefundStatus, StepRun } from './session';

const WORKING_WORD: Record<StepId, string> = {
  read: 'Reading the ticket',
  lookup: 'Looking up the customer',
  search: 'Searching the help center',
  draft: 'Drafting a reply',
};

const RESTING_WORDS = [
  'Nothing to suggest',
  'Waiting on you',
  'Starting',
  'Done',
];

const WORKING_WORDS = Object.values(WORKING_WORD);

const STATUS_WORDS = [...WORKING_WORDS, ...RESTING_WORDS];

export type CopilotWork = {
  steps: StepRun[];
  lookedUpFields: number;
  articlesFound: number;
  refund: RefundStatus;
};

function statusOf(work: CopilotWork | null) {
  if (!work) {
    return 'Nothing to suggest';
  }
  if (work.refund === 'asking') {
    return 'Waiting on you';
  }
  const running = work.steps.find((run) => run.status === 'running');
  if (running) {
    return WORKING_WORD[running.id];
  }
  if (work.steps.length === 0) {
    return 'Starting';
  }
  return 'Done';
}

function lookedUpOf(work: CopilotWork | null) {
  if (!work) {
    return CUSTOMER_FIELDS.length;
  }
  return work.lookedUpFields;
}

/** The request only shows where the panel is asked to show it, and only once the copilot has asked. */
function requestOf(work: CopilotWork | null, showsRefund: boolean) {
  if (!work || !showsRefund) {
    return null;
  }
  if (work.refund === 'none') {
    return null;
  }
  return work.refund;
}

/**
 * The copilot follows one ticket: `work` is null on any other, where the panel shows the customer and
 * nothing to suggest. On a phone the refund request sits above the reply box, so `showsRefund` is false.
 */
type CopilotPanelProps = {
  ticket: Ticket | null;
  work: CopilotWork | null;
  showsRefund: boolean;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
  className?: string;
};

export function CopilotPanel({
  ticket,
  work,
  showsRefund,
  pressed,
  onDecide,
  className,
}: CopilotPanelProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const status = statusOf(work);
  const request = requestOf(work, showsRefund);
  const hasTicket = ticket !== null;
  const showsNothingToSuggest = hasTicket && !work;

  return (
    <div className={cn('flex min-h-0 flex-col gap-3', className)}>
      <header className='flex shrink-0 items-start gap-2.5 px-1'>
        <MeshTile
          seed={WRITER.name}
          color={seriesColorOf(WRITER.series)}
          size='lg'
        />
        <div className='flex min-w-0 flex-1 flex-col leading-tight'>
          <div className='flex items-center gap-2'>
            <h2 className='min-w-0 flex-1 truncate text-sm font-medium'>
              Copilot
            </h2>
            <span className='text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs'>
              <BrandTile brand={MODEL.brand} />
              {MODEL.name}
            </span>
          </div>
          {ticket && (
            <span className='text-muted-foreground text-xs'>
              <WordRoll text={status} labels={STATUS_WORDS} />
            </span>
          )}
        </div>
      </header>

      {/* The scroller exists before a ticket is open, so it is there to follow once cards arrive. */}
      <div
        ref={scrollerRef}
        onScroll={updatePinned}
        className='-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1'
      >
        <div ref={contentRef} className='flex flex-col gap-3'>
          {!ticket && (
            <p className='text-muted-foreground px-1 text-[13px] leading-relaxed'>
              Open a ticket and the copilot gets to work: it reads the message,
              looks up the customer and searches the help center.
            </p>
          )}
          {ticket && (
            <CustomerCard
              customer={ticket.customer}
              lookedUpFields={lookedUpOf(work)}
            />
          )}
          {work && (
            <div className='px-2'>
              <CopilotSteps
                steps={work.steps}
                articlesFound={work.articlesFound}
              />
            </div>
          )}
          {showsNothingToSuggest && (
            <p className='text-muted-foreground px-1 text-xs leading-5'>
              Nothing to suggest here. This demonstration follows one ticket,
              the torn bag.
            </p>
          )}
          {request && (
            <RefundRequest
              status={request}
              pressed={pressed}
              onDecide={onDecide}
            />
          )}
          {ticket && (
            <Badge variant='secondary' className='mx-1'>
              Illustrative figures
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
