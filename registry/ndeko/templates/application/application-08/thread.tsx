'use client';

import { useFollowBottom } from '@/registry/ndeko/hooks/use-follow-bottom';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { ApprovalCard } from './approval-card';
import { CitedAnswer } from './cited-answer';
import {
  ASSISTANT,
  chatOf,
  FOLLOW_UP_REPLY,
  LIVE_ID,
  LIVE_SUGGESTIONS,
  NEW_ID,
  NEW_SUGGESTIONS,
  type ChatLine,
} from './data';
import {
  requestViewOf,
  showsAnswerOf,
  type ChatState,
  type Decision,
} from './session';
import { ThinkingBlock } from './thinking-block';
import { WorkLine } from './work-line';

function AssistantTile() {
  const color = seriesColorOf(ASSISTANT.series);

  return <MeshTile seed={ASSISTANT.name} color={color} size='lg' />;
}

function PersonBubble({ text }: { text: string }) {
  return (
    <p className='bg-foreground/[0.06] max-w-[85%] self-end rounded-2xl rounded-ee-md px-3.5 py-2 text-sm leading-relaxed'>
      {text}
    </p>
  );
}

function AssistantLine({ text }: { text: string }) {
  return (
    <div className='flex items-start gap-2.5'>
      <AssistantTile />
      <p className='min-w-0 flex-1 pt-1 text-sm leading-relaxed'>{text}</p>
    </div>
  );
}

function CannedReply({ text }: { text: string }) {
  return (
    <>
      <PersonBubble text={text} />
      <div className='flex items-start gap-2.5'>
        <AssistantTile />
        <p className='text-muted-foreground min-w-0 flex-1 pt-1 text-sm leading-relaxed'>
          {FOLLOW_UP_REPLY}
        </p>
      </div>
    </>
  );
}

function Line({ line }: { line: ChatLine }) {
  if (line.from === 'person') {
    return <PersonBubble text={line.text} />;
  }
  return <AssistantLine text={line.text} />;
}

type EmptyChatProps = {
  suggestions: string[];
  onSuggest: (text: string) => void;
};

function EmptyChat({ suggestions, onSuggest }: EmptyChatProps) {
  return (
    <div className='m-auto flex w-full max-w-md flex-col items-center gap-5 py-6 text-center'>
      <div className='flex flex-col items-center gap-1.5'>
        <h2 className='text-base font-semibold text-balance'>
          Ask about your shipments
        </h2>
        <p className='text-muted-foreground max-w-xs text-[13px] leading-relaxed text-balance'>
          The plan, every tool call and the cost of the run show in the details
          while the answer is written.
        </p>
      </div>
      <ul
        aria-label='Suggested questions'
        className='flex w-full flex-col gap-1.5'
      >
        {suggestions.map((text) => (
          <li key={text} className='flex'>
            <button
              type='button'
              onClick={() => onSuggest(text)}
              className='bg-foreground/[0.04] hover:bg-foreground/[0.07] focus-visible:ring-ring/25 w-full cursor-pointer rounded-lg px-3 py-2 text-start text-[13px] transition-[background-color,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.97]'
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type LiveChatProps = {
  state: ChatState;
  pressed: string | null;
  isActive: boolean;
  onDecide: (decision: Decision) => void;
  canShowDetails: boolean;
  onShowDetails: () => void;
  onSuggest: (text: string) => void;
};

function LiveChat({
  state,
  pressed,
  isActive,
  onDecide,
  canShowDetails,
  onShowDetails,
  onSuggest,
}: LiveChatProps) {
  const { stage, question } = state;
  if (question === null) {
    return <EmptyChat suggestions={LIVE_SUGGESTIONS} onSuggest={onSuggest} />;
  }
  const requestView = requestViewOf(state);
  const showsRequest = requestView !== 'none';
  const showsPlan = state.plan.length > 0;
  const showsAnswer = showsAnswerOf(state);
  const isAnswering = stage === 'answering';
  const isStoppedMidAnswer =
    stage === 'stopped' && state.stoppedFrom === 'answering';
  const isStreaming = isAnswering || isStoppedMidAnswer;

  return (
    <>
      <PersonBubble text={question} />
      <div className='flex items-start gap-2.5'>
        <AssistantTile />
        <div className='flex min-w-0 flex-1 flex-col gap-3 pt-1'>
          <span className='sr-only'>{ASSISTANT.name}</span>
          <ThinkingBlock
            stage={stage}
            isActive={isActive}
            startedAt={state.startedAt}
            thoughtEndedAt={state.thoughtEndedAt}
          />
          {showsPlan && (
            <WorkLine
              plan={state.plan}
              stage={stage}
              startedAt={state.startedAt}
              endedAt={state.endedAt}
              canShowDetails={canShowDetails}
              onShowDetails={onShowDetails}
            />
          )}
          {showsRequest && (
            <ApprovalCard
              view={requestView}
              pressed={pressed}
              onDecide={onDecide}
            />
          )}
          {showsAnswer && (
            <CitedAnswer
              isStreaming={isStreaming}
              isRunning={isAnswering && isActive}
              demoLitSource={state.demoLitSource}
            />
          )}
        </div>
      </div>
      {state.followUps.map((text, index) => (
        <CannedReply key={index} text={text} />
      ))}
    </>
  );
}

type ThreadProps = LiveChatProps;

export function Thread(props: ThreadProps) {
  const { scrollerRef, contentRef, updatePinned } = useFollowBottom();
  const { activeId, newLines } = props.state;
  const isLive = activeId === LIVE_ID;
  const isNew = activeId === NEW_ID;
  const isPast = !isLive && !isNew;
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
        {isLive && <LiveChat {...props} />}
        {isNew && !hasNewLines && (
          <EmptyChat
            suggestions={NEW_SUGGESTIONS}
            onSuggest={props.onSuggest}
          />
        )}
        {isNew &&
          newLines.map((text, index) => (
            <CannedReply key={index} text={text} />
          ))}
        {isPast &&
          chatOf(activeId).lines.map((line, index) => (
            <Line key={index} line={line} />
          ))}
      </div>
    </div>
  );
}
