'use client';

import { useId, useRef, useState } from 'react';

import { formatCost, seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { CheckIcon, EllipsisIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveDuration } from '@/registry/ndeko/ui/live-duration';

import { AGENTS, LANES, type AgentId, type LaneId } from './data';
import type { Task } from './session';

export const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.04]';

type GemStyle = React.CSSProperties & { '--gem': string };

function sentBackLineOf(note: string | undefined) {
  const hasText = note !== undefined && note !== '';
  if (hasText) {
    return `Sent back by you: ${note}`;
  }
  return 'Sent back by you';
}

function AgentChip({ agentId }: { agentId: AgentId }) {
  const agent = AGENTS[agentId];
  const gemStyle: GemStyle = { '--gem': seriesColorOf(agent.series) };

  return (
    <span className='flex min-w-0 items-center gap-1.5 text-xs font-medium'>
      <span
        aria-hidden='true'
        style={gemStyle}
        className='gem-plate inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold select-none'
      >
        {agent.initial}
      </span>
      <span className='truncate'>{agent.name}</span>
    </span>
  );
}

type ApprovalProps = {
  task: Task;
  isApprovePressed: boolean;
  onApprove: (id: string) => void;
  onSendBack: (id: string, note: string) => void;
};

function Approval({
  task,
  isApprovePressed,
  onApprove,
  onSendBack,
}: ApprovalProps) {
  const noteId = useId();
  const noteRef = useRef<HTMLInputElement>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [note, setNote] = useState('');

  /** The buttons leave when the field unfolds, so the focus goes to the field. */
  function ask() {
    setIsAsking(true);
    requestAnimationFrame(() => noteRef.current?.focus());
  }

  function sendBack(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSendBack(task.id, note.trim());
  }

  return (
    <div className='bg-warning/10 flex flex-col gap-2 rounded-md p-2.5 transition-opacity duration-300 starting:opacity-0'>
      <p className='text-xs leading-5'>{task.request}</p>
      {!isAsking && (
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            size='sm'
            onClick={() => onApprove(task.id)}
            className={pressedSolidOf(isApprovePressed)}
          >
            Approve
          </Button>
          <Button type='button' size='sm' variant='outline' onClick={ask}>
            Request changes
          </Button>
        </div>
      )}
      <Fold open={isAsking}>
        <form onSubmit={sendBack} className='flex flex-col gap-2'>
          <label htmlFor={noteId} className='sr-only'>
            What should change
          </label>
          <Input
            id={noteId}
            ref={noteRef}
            size='sm'
            autoComplete='off'
            placeholder='What should change?'
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className='flex items-center gap-2'>
            <Button type='submit' size='sm'>
              Send back
            </Button>
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => setIsAsking(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Fold>
    </div>
  );
}

export type TaskCardBodyProps = {
  task: Task;
  pressed?: string | null;
  /** The copy under the pointer shows the task and nothing to press. */
  isOverlay?: boolean;
  onApprove?: (id: string) => void;
  onSendBack?: (id: string, note: string) => void;
  onMove?: (id: string, to: LaneId) => void;
};

function noop() {}

export function TaskCardBody({
  task,
  pressed = null,
  isOverlay = false,
  onApprove = noop,
  onSendBack = noop,
  onMove = noop,
}: TaskCardBodyProps) {
  const isRunning = task.lane === 'running';
  const isInReview = task.lane === 'review';
  const isDone = task.lane === 'done';
  const showsApproval = isInReview && !isOverlay;
  const showsApproved = isDone && task.wasApproved;
  const hasNote = task.note !== undefined;
  const otherLanes = LANES.filter((lane) => lane.id !== task.lane);

  return (
    <div className='flex flex-col gap-2 p-2.5'>
      <div className='flex items-center gap-2'>
        <AgentChip agentId={task.agentId} />
        {!isOverlay && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  data-card-menu={task.id}
                  aria-label={`Move ${task.title}`}
                  className='text-muted-foreground -my-1 ms-auto -me-1 size-6'
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-44'>
              {otherLanes.map((lane) => (
                <DropdownMenuItem
                  key={lane.id}
                  onClick={() => onMove(task.id, lane.id)}
                >
                  Move to {lane.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className='text-[13px] leading-5 font-medium text-pretty'>
        {task.title}
      </p>
      {hasNote && (
        <p className='text-muted-foreground text-xs leading-5'>
          {sentBackLineOf(task.note)}
        </p>
      )}
      <p className='text-muted-foreground flex items-center gap-2 text-xs'>
        <LiveDuration item={task} isRunning={isRunning} />
        <span aria-hidden='true'>·</span>
        <span className='tabular-nums'>{formatCost(task.costUsd)}</span>
        {showsApproved && (
          <span className='ms-auto flex items-center gap-1'>
            <CheckIcon className='text-success-foreground size-3.5' />
            Approved by you
          </span>
        )}
      </p>
      {showsApproval && (
        <Approval
          task={task}
          isApprovePressed={pressed === `approve-${task.id}`}
          onApprove={onApprove}
          onSendBack={onSendBack}
        />
      )}
    </div>
  );
}

export function cardClassOf(isDragging: boolean) {
  return cn(CARD_SURFACE, isDragging && 'opacity-40');
}
