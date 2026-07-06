'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { StreamedText } from '@/registry/ndeko/ui/streamed-text';

import { ApprovalCard, requestViewOf } from './approval-card';
import { CallRow } from './call-row';
import { OPERATOR, seedOf, stepSeedOf, type ResultKind } from './data';
import { ResultCard } from './result-cards';
import {
  ANSWER_WORD_MS,
  type Decision,
  type StepRun,
  type Turn,
} from './session';
import { ThinkingRow } from './thinking-row';

export function OperatorTile() {
  const color = seriesColorOf(OPERATOR.series);

  return <MeshTile seed={OPERATOR.name} color={color} size='lg' />;
}

function resultKindOf(run: StepRun): ResultKind | null {
  if (run.status !== 'done') {
    return null;
  }
  return stepSeedOf(run.id).result ?? null;
}

type AgentTurnProps = {
  turn: Turn;
  pressed: string | null;
  isActive: boolean;
  onDecide: (decision: Decision) => void;
};

export function AgentTurn({
  turn,
  pressed,
  isActive,
  onDecide,
}: AgentTurnProps) {
  const seed = seedOf(turn.seedId);
  const requestView = requestViewOf(turn);
  const lastIndex = turn.steps.length - 1;
  const isAnswering = turn.stage === 'answering';
  const hasAnswer = isAnswering || turn.stage === 'done';
  const isCanned = turn.seedId === 'canned';

  return (
    <div className='flex items-start gap-2.5'>
      <OperatorTile />
      <div className='flex min-w-0 flex-1 flex-col gap-3 pt-1'>
        <span className='sr-only'>{OPERATOR.name}</span>
        {seed.thought !== undefined && (
          <ThinkingRow
            text={seed.thought}
            stage={turn.stage}
            effort={turn.effort}
            isActive={isActive}
            startedAt={turn.startedAt}
            thoughtEndedAt={turn.thoughtEndedAt}
          />
        )}
        {turn.steps.length > 0 && (
          <ol aria-label='What the agent did' className='flex flex-col'>
            {turn.steps.map((run, index) => {
              const kind = resultKindOf(run);
              return (
                <CallRow key={run.id} run={run} isLast={index === lastIndex}>
                  {kind && <ResultCard kind={kind} />}
                </CallRow>
              );
            })}
          </ol>
        )}
        {requestView !== 'none' && (
          <ApprovalCard
            view={requestView}
            pressed={pressed}
            onDecide={onDecide}
          />
        )}
        {hasAnswer && isCanned && (
          <p className='text-muted-foreground text-sm leading-relaxed'>
            {seed.answer}
          </p>
        )}
        {hasAnswer && !isCanned && (
          <p className='text-sm leading-relaxed'>
            <StreamedText
              text={seed.answer}
              isStreaming={isAnswering}
              isActive={isActive}
              wordMs={ANSWER_WORD_MS}
            />
          </p>
        )}
      </div>
    </div>
  );
}
