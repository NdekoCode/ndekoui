'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { WordRoll } from '@/components/core/word-roll';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  CircleXIcon,
  LoaderIcon,
  ShieldCheckIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import {
  CONTEXT_MONTHS,
  PLAN_STEPS,
  PROMPT_TEXT,
  STATUS_LINES,
  type ApprovalState,
  type Decision,
  type PromptStage,
} from './features-session';

type TileFrameProps = {
  title: string;
  text: string;
  isActive: boolean;
  className?: string;
  children: React.ReactNode;
};

export function TileFrame({
  title,
  text,
  isActive,
  className,
  children,
}: TileFrameProps) {
  return (
    <article
      data-active={isActive}
      className={cn(
        'bg-foreground/[0.03] data-[active=true]:bg-foreground/[0.05] flex flex-col gap-5 rounded-2xl p-3 transition-colors duration-300',
        className
      )}
    >
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] relative flex min-h-44 flex-1 flex-col justify-center overflow-hidden rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        {children}
      </div>
      <div className='flex flex-col gap-1 px-2 pb-2'>
        <h3 className='text-sm font-medium'>{title}</h3>
        <p className='text-muted-foreground text-[13px] leading-5 text-pretty'>
          {text}
        </p>
      </div>
    </article>
  );
}

function StageGlyph({ stage }: { stage: PromptStage }) {
  if (stage === 3) {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (stage === 0) {
    return (
      <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
    );
  }
  return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
}

type PromptTileProps = {
  prompt: string;
  stage: PromptStage;
};

export function PromptTile({ prompt, stage }: PromptTileProps) {
  const hasPrompt = prompt !== '';
  const isTyping = hasPrompt && prompt !== PROMPT_TEXT;
  const status = STATUS_LINES[stage];

  return (
    <div className='flex flex-col gap-3'>
      <p className='bg-foreground/[0.04] min-h-16 rounded-lg px-3 py-2.5 text-[13px] leading-5'>
        {!hasPrompt && (
          <span className='text-muted-foreground'>Ask for a close</span>
        )}
        {hasPrompt && prompt}
        {isTyping && (
          <span
            aria-hidden='true'
            className='bg-foreground/50 ms-0.5 inline-block h-[1em] w-0.5 animate-pulse rounded-full align-[-0.15em]'
          />
        )}
      </p>
      <p className='flex h-6 items-center gap-2.5 px-1 text-xs'>
        <span className='flex size-[18px] shrink-0 items-center justify-center'>
          <Swap swapKey={`stage-${stage}`}>
            <StageGlyph stage={stage} />
          </Swap>
        </span>
        <span className='min-w-0 flex-1 overflow-hidden whitespace-nowrap'>
          <WordRoll text={status} labels={STATUS_LINES} />
        </span>
      </p>
    </div>
  );
}

type PlanStatus = 'upcoming' | 'running' | 'done';

function planStatusOf(index: number, planStep: number): PlanStatus {
  if (index < planStep) {
    return 'done';
  }
  if (index === planStep) {
    return 'running';
  }
  return 'upcoming';
}

function PlanGlyph({ status }: { status: PlanStatus }) {
  if (status === 'done') {
    return <DrawnCheck tone='success' entrance='draw' />;
  }
  if (status === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  return (
    <span className='hairline-ring ring-foreground/25 size-3.5 rounded-full' />
  );
}

const PLAN_WORD: Record<PlanStatus, string> = {
  upcoming: 'Upcoming',
  running: 'Running',
  done: 'Done',
};

export function PlanTile({ planStep }: { planStep: number }) {
  return (
    <ol aria-label='Plan of the close' className='flex flex-col'>
      {PLAN_STEPS.map((title, index) => {
        const status = planStatusOf(index, planStep);
        const isUpcoming = status === 'upcoming';

        return (
          <li key={title} className='flex h-8 items-center gap-2.5 text-[13px]'>
            <span className='flex size-[18px] shrink-0 items-center justify-center'>
              <Swap swapKey={status}>
                <PlanGlyph status={status} />
              </Swap>
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate transition-colors duration-200',
                isUpcoming && 'text-muted-foreground'
              )}
            >
              <span className='sr-only'>{PLAN_WORD[status]}: </span>
              {title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ResultGlyph({ approval }: { approval: ApprovalState }) {
  if (approval === 'denied') {
    return <CircleXIcon className='text-muted-foreground size-4 shrink-0' />;
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function resultLineOf(approval: ApprovalState) {
  if (approval === 'denied') {
    return 'Not posted';
  }
  return 'Posted by you';
}

type ApprovalTileProps = {
  approval: ApprovalState;
  pressed: string | null;
  onDecide: (decision: Decision) => void;
};

export function ApprovalTile({
  approval,
  pressed,
  onDecide,
}: ApprovalTileProps) {
  const isWaiting = approval === 'waiting';

  function allow() {
    onDecide('allowed');
  }

  function deny() {
    onDecide('denied');
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-2.5'>
        <span
          aria-hidden='true'
          className='keycap-3d text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md'
        >
          <ShieldCheckIcon className='size-3.5' />
        </span>
        <div className='flex min-w-0 flex-col leading-tight'>
          <p className='truncate text-[13px] font-medium'>
            Post 14 journal entries
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            Asked by Reconciler
          </p>
        </div>
      </div>
      <Fold open={isWaiting}>
        <div className='flex gap-2 pt-1'>
          <Button
            type='button'
            size='sm'
            onClick={allow}
            className={pressedSolidOf(pressed === 'allow')}
          >
            Allow
          </Button>
          <Button type='button' size='sm' variant='outline' onClick={deny}>
            Deny
          </Button>
        </div>
      </Fold>
      <Fold open={!isWaiting}>
        <p className='flex items-center gap-2.5 pt-1 text-xs'>
          <Swap swapKey={approval}>
            <ResultGlyph approval={approval} />
          </Swap>
          {resultLineOf(approval)}
        </p>
      </Fold>
    </div>
  );
}

const VIEW = 36;

const CENTRE = VIEW / 2;

const RADIUS = 15;

const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function emptyLengthOf(percent: number) {
  const share = Math.min(1, percent / 100);
  return CIRCUMFERENCE * (1 - share);
}

/** The ring eases to its new length a few times in a round, which is the only time it is painted again. */
export function ContextTile({ percent }: { percent: number }) {
  const months = Math.round((percent * CONTEXT_MONTHS) / 100);

  return (
    <div className='flex items-center gap-4'>
      <span className='relative inline-flex size-20 shrink-0 items-center justify-center'>
        <svg
          aria-hidden='true'
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          className='absolute inset-0 size-full -rotate-90'
        >
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={RADIUS}
            fill='none'
            strokeWidth={3}
            className='stroke-foreground/10'
          />
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={RADIUS}
            fill='none'
            strokeWidth={3}
            strokeLinecap='round'
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={emptyLengthOf(percent)}
            className='stroke-primary transition-[stroke-dashoffset] duration-700 ease-(--ease-out-strong)'
          />
        </svg>
        <span className='flex items-baseline text-lg font-semibold'>
          <MotionNumber value={percent} />
          <span className='text-muted-foreground text-xs font-normal'>%</span>
        </span>
      </span>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <span className='text-muted-foreground text-xs'>Ledger in view</span>
        <span className='flex items-baseline gap-1 text-[13px]'>
          <MotionNumber value={months} className='font-medium' />
          of {CONTEXT_MONTHS} months
        </span>
        <span className='text-muted-foreground text-xs'>
          and your chart of accounts
        </span>
      </div>
    </div>
  );
}

const CENTS: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function CostTile({ cents }: { cents: number }) {
  const dollars = cents / 100;

  return (
    <div className='flex flex-col items-start gap-2'>
      <span className='text-muted-foreground text-xs'>Cost of this close</span>
      <MotionNumber
        value={dollars}
        format={CENTS}
        className='text-3xl font-semibold'
      />
      <span className='text-muted-foreground text-xs'>
        412 lines, 14 flagged, 9 entries
      </span>
      <Badge variant='secondary'>Illustrative</Badge>
    </div>
  );
}
