'use client';

import { useFollowBottom } from '@/registry/ndeko/hooks/use-follow-bottom';

import { AgentTurn, OperatorTile } from './agent-turn';
import { AttachmentChip } from './chips';
import {
  EFFORT_WORD,
  FOLLOW_UP_REPLY,
  LIVE_ID,
  NEW_ID,
  pastSessionOf,
  skillOf,
  toolOf,
} from './data';
import type { Decision, Turn, WorkspaceState } from './session';

function PersonBubble({ text }: { text: string }) {
  return (
    <p className='bg-foreground/[0.06] max-w-[85%] self-end rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
      {text}
    </p>
  );
}

function settingsLineOf(turn: Turn) {
  const effort = `${EFFORT_WORD[turn.effort]} effort`;
  const tools = turn.toolIds.map((id) => toolOf(id).name);
  const skills = turn.skillIds.map((id) => skillOf(id).name);
  return [effort, ...tools, ...skills].join(', ');
}

function PersonMessage({ turn }: { turn: Turn }) {
  const hasFiles = turn.attachments.length > 0;

  return (
    <div className='flex max-w-[85%] flex-col items-end gap-1.5 self-end'>
      {hasFiles && (
        <ul
          aria-label='Sent with this message'
          className='flex flex-wrap justify-end gap-1.5'
        >
          {turn.attachments.map((attachment) => (
            <AttachmentChip key={attachment.id} attachment={attachment} />
          ))}
        </ul>
      )}
      <p className='bg-foreground/[0.06] rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
        {turn.text}
      </p>
      <p className='text-muted-foreground text-end text-xs'>
        {settingsLineOf(turn)}
      </p>
    </div>
  );
}

function CannedReply({ text }: { text: string }) {
  return (
    <>
      <PersonBubble text={text} />
      <div className='flex items-start gap-2.5'>
        <OperatorTile />
        <p className='text-muted-foreground min-w-0 flex-1 pt-1 text-sm leading-relaxed'>
          {FOLLOW_UP_REPLY}
        </p>
      </div>
    </>
  );
}

function EmptySession() {
  return (
    <div className='m-auto flex w-full max-w-sm flex-col items-center gap-1.5 py-6 text-center'>
      <h2 className='text-base font-semibold text-balance'>
        Describe the work
      </h2>
      <p className='text-muted-foreground text-[13px] leading-relaxed text-balance'>
        Attach a photo or a file, switch on the tools it may use and set how
        hard it thinks. Each step shows here as it happens.
      </p>
    </div>
  );
}

function PastSummary({ id }: { id: string }) {
  const session = pastSessionOf(id);

  return (
    <>
      <PersonBubble text={session.prompt} />
      <div className='flex items-start gap-2.5'>
        <OperatorTile />
        <div className='flex min-w-0 flex-1 flex-col gap-2 pt-1'>
          <p className='text-sm leading-relaxed'>{session.summary}</p>
          <p className='text-muted-foreground text-xs'>
            A summary of an earlier session. It cannot be continued here.
          </p>
        </div>
      </div>
    </>
  );
}

type TurnViewProps = {
  turn: Turn;
  pressed: string | null;
  isActive: boolean;
  onDecide: (decision: Decision) => void;
};

function TurnView({ turn, pressed, isActive, onDecide }: TurnViewProps) {
  return (
    <>
      <PersonMessage turn={turn} />
      <AgentTurn
        turn={turn}
        pressed={pressed}
        isActive={isActive}
        onDecide={onDecide}
      />
    </>
  );
}

type ThreadProps = {
  state: WorkspaceState;
  pressed: string | null;
  isActive: boolean;
  onDecide: (decision: Decision) => void;
};

export function Thread({ state, pressed, isActive, onDecide }: ThreadProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const { activeId, turns, newLines } = state;
  const isLive = activeId === LIVE_ID;
  const isNew = activeId === NEW_ID;
  const isPast = !isLive && !isNew;
  const hasTurns = turns.length > 0;
  const hasNewLines = newLines.length > 0;

  return (
    <div
      ref={scrollerRef}
      onScroll={updatePinned}
      className='min-h-0 flex-1 overflow-y-auto'
    >
      <div
        ref={contentRef}
        className='mx-auto flex min-h-full w-full max-w-2xl flex-col gap-5 px-4 py-5'
      >
        {isLive && !hasTurns && <EmptySession />}
        {isLive &&
          turns.map((turn) => (
            <TurnView
              key={turn.id}
              turn={turn}
              pressed={pressed}
              isActive={isActive}
              onDecide={onDecide}
            />
          ))}
        {isNew && !hasNewLines && <EmptySession />}
        {isNew &&
          newLines.map((text, index) => (
            <CannedReply key={index} text={text} />
          ))}
        {isPast && <PastSummary id={activeId} />}
      </div>
    </div>
  );
}
