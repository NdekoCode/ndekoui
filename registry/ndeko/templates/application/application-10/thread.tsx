'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { ActivityTimeline } from './activity-timeline';
import { CitedAnswer } from './cited-answer';
import { FOLLOW_UP_REPLY, RESEARCHER } from './data';
import { hasReached, type Decision, type ResearchState } from './session';
import { ShareRequest } from './share-request';
import { useFollowBottom } from './use-follow-bottom';

function ResearcherTile() {
  const color = seriesColorOf(RESEARCHER.series);

  return <MeshTile seed={RESEARCHER.name} color={color} size='lg' />;
}

function PersonBubble({ text }: { text: string }) {
  return (
    <p className='bg-foreground/[0.06] max-w-[85%] self-end rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
      {text}
    </p>
  );
}

function FollowUp({ text }: { text: string }) {
  return (
    <>
      <PersonBubble text={text} />
      <div className='flex items-start gap-2.5'>
        <ResearcherTile />
        <p className='text-muted-foreground min-w-0 flex-1 pt-1 text-sm leading-relaxed'>
          {FOLLOW_UP_REPLY}
        </p>
      </div>
    </>
  );
}

type ThreadProps = {
  state: ResearchState;
  pressed: string | null;
  isActive: boolean;
  onDecide: (decision: Decision) => void;
};

export function Thread({ state, pressed, isActive, onDecide }: ThreadProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const { stage, question } = state;
  const hasQuestion = question !== null;
  const showsAnswer = hasReached(stage, 'answering');
  const showsRequest = hasReached(stage, 'asking');

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
        {!hasQuestion && (
          <p className='text-muted-foreground m-auto max-w-xs text-center text-[13px] leading-relaxed'>
            Ask a question about the workspace. Each step shows here while the
            memo is written in its panel.
          </p>
        )}
        {question && <PersonBubble text={question} />}
        {hasQuestion && (
          <div className='flex items-start gap-2.5'>
            <ResearcherTile />
            <div className='flex min-w-0 flex-1 flex-col gap-3'>
              <span className='sr-only'>{RESEARCHER.name}</span>
              <ActivityTimeline
                activity={state.activity}
                isResearching={stage === 'researching'}
                startedAt={state.startedAt}
                endedAt={state.endedAt}
              />
              {showsAnswer && (
                <CitedAnswer
                  isStreaming={stage === 'answering'}
                  isActive={isActive}
                  demoLitSource={state.demoLitSource}
                />
              )}
              {showsRequest && (
                <ShareRequest
                  stage={stage}
                  pressed={pressed}
                  onDecide={onDecide}
                />
              )}
            </div>
          </div>
        )}
        {state.followUps.map((text, index) => (
          <FollowUp key={index} text={text} />
        ))}
      </div>
    </div>
  );
}
