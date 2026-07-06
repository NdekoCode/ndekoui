'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { formatCost, seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { CheckIcon, MousePointerIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { useRevealedCount } from '@/registry/ndeko/ui/streamed-text';

import {
  AGENTS,
  CHANGES,
  COMMENT,
  type AgentId,
  type ChangeId,
  type DocAgent,
  type Paragraph,
  type Segment,
} from './data';
import {
  TYPE_TICK_MS,
  type ChangeStatus,
  type CommentStatus,
  type Decision,
  type Pointer,
} from './session';

function gemStyleOf(agent: DocAgent) {
  return { '--gem': seriesColorOf(agent.series) } as React.CSSProperties;
}

/** The inserted words carry the author's colour as a line and a tint; the text itself stays the text colour. */
function insertStyleOf(agent: DocAgent): React.CSSProperties {
  const color = seriesColorOf(agent.series);
  return {
    textDecorationColor: color,
    backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
  };
}

export function AgentTile({ agent }: { agent: DocAgent }) {
  const color = seriesColorOf(agent.series);

  return (
    <MeshTile seed={agent.name} color={color} className='size-6 rounded-md' />
  );
}

const INSERT_CLASS =
  'rounded-[3px] underline decoration-2 underline-offset-[3px]';

/** Only these words re-render while a suggestion types itself. */
function TypedInsert({
  text,
  agent,
  isActive,
}: {
  text: string;
  agent: DocAgent;
  isActive: boolean;
}) {
  const count = useRevealedCount(text.length, isActive, TYPE_TICK_MS);
  const typed = text.slice(0, count);

  return (
    <ins style={insertStyleOf(agent)} className={INSERT_CLASS}>
      {typed}
      <span
        aria-hidden='true'
        className='bg-foreground/60 ms-px inline-block h-[1em] w-[2px] animate-pulse rounded-full align-[-0.15em]'
      />
    </ins>
  );
}

function pressedOf(isPressed: boolean) {
  if (isPressed) {
    return 'scale-90 bg-success/25';
  }
  return undefined;
}

type ChangeHandlers = {
  statuses: Record<ChangeId, ChangeStatus>;
  pressed: string | null;
  isActive: boolean;
  onDecide: (id: ChangeId, decision: Decision) => void;
};

const DECISION_BUTTON =
  'focus-visible:ring-ring/40 inline-flex size-5 cursor-pointer items-center justify-center rounded-md outline-none transition-[background-color,scale] duration-150 focus-visible:ring-[3px] active:scale-[0.97]';

function TrackedChangeView({
  id,
  statuses,
  pressed,
  isActive,
  onDecide,
}: ChangeHandlers & { id: ChangeId }) {
  const change = CHANGES[id];
  const agent = AGENTS[change.author];
  const status = statuses[id];
  const hasRemoval = change.removed !== '';
  const isOriginal = status === 'hidden' || status === 'rejected';

  if (isOriginal) {
    return <span>{change.removed}</span>;
  }
  if (status === 'accepted') {
    return (
      <span className='bg-success/0 starting:bg-success/25 rounded-[3px] transition-colors duration-1000 ease-out'>
        {change.inserted}
      </span>
    );
  }
  return (
    <span>
      {hasRemoval && (
        <del className='text-muted-foreground decoration-foreground/40'>
          {change.removed}
        </del>
      )}
      {hasRemoval && ' '}
      {status === 'typing' && (
        <TypedInsert text={change.inserted} agent={agent} isActive={isActive} />
      )}
      {status === 'pending' && (
        <>
          <ins style={insertStyleOf(agent)} className={INSERT_CLASS}>
            {change.inserted}
          </ins>
          <span className='bg-card hairline-ring ring-foreground/15 dark:bg-foreground/[0.08] ms-1.5 inline-flex items-center gap-0.5 rounded-lg p-0.5 align-middle shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-opacity duration-300 starting:opacity-0'>
            <button
              type='button'
              aria-label={`Accept the suggestion by ${agent.name}: ${change.summary}`}
              onClick={() => onDecide(id, 'accepted')}
              className={cn(
                DECISION_BUTTON,
                'text-success-foreground hover:bg-success/15',
                pressedOf(pressed === `accept-${id}`)
              )}
            >
              <CheckIcon className='size-3.5' />
            </button>
            <button
              type='button'
              aria-label={`Reject the suggestion by ${agent.name}: ${change.summary}`}
              onClick={() => onDecide(id, 'rejected')}
              className={cn(
                DECISION_BUTTON,
                'text-destructive-ink hover:bg-destructive/10'
              )}
            >
              <XIcon className='size-3.5' />
            </button>
          </span>
        </>
      )}
    </span>
  );
}

function SegmentView({
  segment,
  ...handlers
}: ChangeHandlers & { segment: Segment }) {
  if ('text' in segment) {
    return <span>{segment.text}</span>;
  }
  return <TrackedChangeView id={segment.change} {...handlers} />;
}

function TypingDots({ name }: { name: string }) {
  return (
    <span className='flex h-5 items-center gap-1' role='status'>
      <span className='sr-only'>{name} is writing a comment</span>
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full' />
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:160ms]' />
      <span className='bg-muted-foreground size-1.5 animate-pulse rounded-full [animation-delay:320ms]' />
    </span>
  );
}

type MarginCommentProps = {
  status: CommentStatus;
  onResolve: () => void;
};

function MarginComment({ status, onResolve }: MarginCommentProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const agent = AGENTS[COMMENT.author];
  const isShown = status === 'typing' || status === 'posted';

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.aside
          key='comment'
          aria-label={`Comment by ${agent.name}`}
          className='overflow-hidden'
          {...rowPresence}
        >
          <div className='bg-foreground/[0.04] mt-2 flex flex-col gap-1.5 rounded-lg p-2.5 @3xl:mt-0'>
            <div className='flex items-center gap-2'>
              <AgentTile agent={agent} />
              <span className='text-xs font-medium'>{agent.name}</span>
            </div>
            {status === 'typing' && <TypingDots name={agent.name} />}
            {status === 'posted' && (
              <p className='text-[13px] leading-snug transition-opacity duration-300 starting:opacity-0'>
                {COMMENT.text}
              </p>
            )}
            {status === 'posted' && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={onResolve}
                className='text-muted-foreground -ms-1.5 w-fit'
              >
                Resolve
              </Button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

type ParagraphRowProps = ChangeHandlers & {
  paragraph: Paragraph;
  comment: CommentStatus;
  onResolveComment: () => void;
};

export function ParagraphRow({
  paragraph,
  comment,
  onResolveComment,
  ...handlers
}: ParagraphRowProps) {
  const hasComment = COMMENT.paragraph === paragraph.id;

  return (
    <div className='grid gap-x-6 @3xl:grid-cols-[minmax(0,1fr)_14rem]'>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-semibold'>{paragraph.heading}</h3>
        <p data-paragraph={paragraph.id} className='text-sm leading-7'>
          {paragraph.segments.map((segment, index) => (
            <SegmentView key={index} segment={segment} {...handlers} />
          ))}
        </p>
      </div>
      <div>
        {hasComment && (
          <MarginComment status={comment} onResolve={onResolveComment} />
        )}
      </div>
    </div>
  );
}

function idleToneOf(isIdle: boolean) {
  if (isIdle) {
    return 'opacity-0';
  }
  return 'opacity-100';
}

type AgentPointerProps = {
  agent: DocAgent;
  pointer: Pointer;
};

/** The pointer glides with a transition on its position and fades once its agent has nothing to do. */
export function AgentPointer({ agent, pointer }: AgentPointerProps) {
  const isIdle = pointer.target === null;
  const iconStyle = { color: seriesColorOf(agent.series) };

  return (
    <span
      data-pointer={agent.id}
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute top-0 left-0 z-10 flex items-start transition-[translate,opacity] duration-700 ease-(--ease-in-out-strong) motion-reduce:transition-none',
        idleToneOf(isIdle)
      )}
    >
      <MousePointerIcon style={iconStyle} className='size-4 fill-current' />
      <span
        style={gemStyleOf(agent)}
        className='gem-plate mt-3 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap'
      >
        {agent.name}
        <span className='opacity-80'>{pointer.action}</span>
        <span className='tabular-nums'>{formatCost(pointer.spendUsd)}</span>
      </span>
    </span>
  );
}

/** Where along its paragraph each agent rests, so two pointers on one paragraph do not cover each other. */
export const POINTER_REACH: Record<AgentId, number> = {
  writer: 0.42,
  reviewer: 0.12,
};
