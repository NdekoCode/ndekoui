'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { FeatherIcon, RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { TextLoader } from '@/registry/ndeko/ui/chat-loader';
import {
  Message,
  MessageContent,
  MessageGlyph,
} from '@/registry/ndeko/ui/chat-message';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/registry/ndeko/ui/chat-reasoning';
import {
  ResponseStreamSegments,
  useTextStream,
} from '@/registry/ndeko/ui/chat-response-stream';
import {
  Tool,
  type ToolPart,
  type ToolState,
} from '@/registry/ndeko/ui/chat-tool';

import {
  answer,
  finishedStep,
  reasoning,
  reasoningWordMs,
  runSchedule,
  thoughtLabel,
  toolCalls,
  type RunStep,
  type ToolCall,
} from './data';
import { rowPresenceOf } from './presence';
import { ReplySources } from './reply-sources';

function toolStateOf(tool: ToolCall, step: RunStep): ToolState {
  const isDone = step >= tool.doneAt;
  if (isDone) {
    return 'output-available';
  }
  return 'input-available';
}

function outputOf(tool: ToolCall, state: ToolState) {
  const isDone = state === 'output-available';
  if (isDone) {
    return tool.output;
  }
  return undefined;
}

function toolPartOf(tool: ToolCall, step: RunStep): ToolPart {
  const state = toolStateOf(tool, step);
  return {
    type: tool.type,
    state,
    input: tool.input,
    output: outputOf(tool, state),
    toolCallId: tool.toolCallId,
  };
}

function hasAppeared(tool: ToolCall, step: RunStep) {
  return step >= tool.appearsAt;
}

function ReasoningBody({
  isRunning,
  segments,
}: {
  isRunning: boolean;
  segments: ReturnType<typeof useTextStream>['segments'];
}) {
  if (isRunning) {
    return <ResponseStreamSegments segments={segments} />;
  }
  return reasoning;
}

export function ReasoningReply() {
  const [step, setStep] = useState<RunStep>(finishedStep);
  const [reasoningSource, setReasoningSource] = useState('');
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const shouldReduceMotion = useReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const isRunning = step < finishedStep;
  const isFinished = !isRunning;
  const visibleTools = toolCalls.filter((tool) => hasAppeared(tool, step));
  const reasoningStream = useTextStream({
    textStream: reasoningSource,
    mode: 'fade',
    segmentDelay: reasoningWordMs,
  });

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function schedule(task: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      task();
    }, delay);
    timers.current.add(timer);
  }

  function runAgain() {
    if (isRunning) {
      return;
    }
    setStep(0);
    setReasoningSource(reasoning);
    reasoningStream.startStreaming();
    for (const entry of runSchedule) {
      schedule(() => setStep(entry.step), entry.atMs);
    }
  }

  return (
    <Message>
      <MessageGlyph>
        <FeatherIcon />
      </MessageGlyph>
      <div className='min-w-0 flex-1 space-y-3 pt-1.5'>
        <Reasoning isStreaming={isRunning}>
          <ReasoningTrigger>
            <Swap swapKey={String(isRunning)}>
              {isRunning && <TextLoader text='Thinking' />}
              {isFinished && thoughtLabel}
            </Swap>
          </ReasoningTrigger>
          <ReasoningContent>
            <ReasoningBody
              isRunning={isRunning}
              segments={reasoningStream.segments}
            />
          </ReasoningContent>
        </Reasoning>

        <ul aria-label='Tool calls' className='flex flex-col'>
          <AnimatePresence initial={false}>
            {visibleTools.map((tool) => (
              <motion.li
                key={tool.id}
                className='-mx-1 overflow-hidden px-1'
                {...rowPresence}
              >
                <div className='pb-2'>
                  <Tool toolPart={toolPartOf(tool, step)} />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <AnimatePresence initial={false}>
          {isFinished && (
            <motion.div
              key='answer'
              className='-mx-1 overflow-hidden px-1'
              {...rowPresence}
            >
              <div className='space-y-4 pb-1'>
                <MessageContent markdown variant='plain'>
                  {answer}
                </MessageContent>
                <ReplySources />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={runAgain}
                  className='text-muted-foreground -ms-2'
                >
                  <RotateCcwIcon />
                  Run again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Message>
  );
}
