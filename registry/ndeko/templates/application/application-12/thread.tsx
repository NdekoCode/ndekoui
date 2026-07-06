'use client';

import { LetterTile } from '@/registry/ndeko/ui/letter-tile';

import { ANSWER, CODER, FOLLOW_UP_REPLY, type PanelTab } from './data';
import { PullRequest } from './pull-request';
import {
  ANSWER_WORD_MS,
  hasReached,
  type CodingState,
  type Decision,
} from './session';
import { StreamedText } from './stream';
import { useFollowBottom } from './use-follow-bottom';
import { WorkSteps } from './work-steps';

function CoderTile() {
  return <LetterTile initial={CODER.initial} series={CODER.series} size='lg' />;
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
        <CoderTile />
        <p className='text-muted-foreground min-w-0 flex-1 pt-1 text-sm leading-relaxed'>
          {FOLLOW_UP_REPLY}
        </p>
      </div>
    </>
  );
}

type ThreadProps = {
  state: CodingState;
  pressed: string | null;
  isActive: boolean;
  onShow: (tab: PanelTab) => void;
  onDecide: (decision: Decision) => void;
};

export function Thread({
  state,
  pressed,
  isActive,
  onShow,
  onDecide,
}: ThreadProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const { stage, task } = state;
  const hasTask = task !== null;
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
        {!hasTask && (
          <p className='text-muted-foreground m-auto max-w-xs text-center text-[13px] leading-relaxed'>
            Describe a bug. The agent reads the code, proves the bug with a
            failing test, fixes it and asks before it opens a pull request.
          </p>
        )}
        {task && <PersonBubble text={task} />}
        {hasTask && (
          <div className='flex items-start gap-2.5'>
            <CoderTile />
            <div className='flex min-w-0 flex-1 flex-col gap-3 pt-1'>
              <span className='sr-only'>{CODER.name}</span>
              <WorkSteps
                steps={state.steps}
                filesRead={state.filesRead}
                hunksDone={state.hunksDone}
                isWorking={stage === 'working'}
                onShow={onShow}
              />
              {showsAnswer && (
                <p className='text-sm leading-relaxed'>
                  <StreamedText
                    text={ANSWER}
                    isStreaming={stage === 'answering'}
                    isActive={isActive}
                    wordMs={ANSWER_WORD_MS}
                  />
                </p>
              )}
              {showsRequest && (
                <PullRequest
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
