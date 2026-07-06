'use client';

import { useEffect, useState } from 'react';

import { useAutoplay } from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  pressedSolidOf,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import { RotateCcwIcon } from '@/registry/ndeko/lib/icons';
import { wordsOf } from '@/registry/ndeko/lib/words';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';
import { StreamedText, StreamedWords } from '@/registry/ndeko/ui/streamed-text';

import { ASSISTANT, DRAFT_REPLY, INCOMING } from './data';
import { useRestingState } from './use-resting-state';

type DraftStage = 'reading' | 'drafting' | 'ready' | 'sent';

const WORD_MS = 45;

const READING_MS = 1300;

const DRAFT_WORDS = wordsOf(DRAFT_REPLY);

const DRAFT_MS = DRAFT_WORDS.length * WORD_MS + 500;

const SEND_AFTER_MS = READING_MS + DRAFT_MS + 1200;

function statusWordOf(stage: DraftStage) {
  if (stage === 'reading') {
    return 'Reading the message';
  }
  if (stage === 'drafting') {
    return 'Drafting';
  }
  if (stage === 'ready') {
    return 'Waiting for your yes';
  }
  return 'Sent';
}

function sendLabelOf(stage: DraftStage) {
  if (stage === 'sent') {
    return 'Sent';
  }
  return 'Send reply';
}

function waitOf(stage: DraftStage) {
  if (stage === 'reading') {
    return READING_MS;
  }
  if (stage === 'drafting') {
    return DRAFT_MS;
  }
  return null;
}

function nextStageOf(stage: DraftStage): DraftStage {
  if (stage === 'reading') {
    return 'drafting';
  }
  return 'ready';
}

type DraftBodyProps = {
  stage: DraftStage;
  round: number;
  isActive: boolean;
};

function DraftBody({ stage, round, isActive }: DraftBodyProps) {
  if (stage === 'reading') {
    return (
      <p className='text-sm leading-relaxed text-pretty'>
        <StreamedWords words={DRAFT_WORDS} shown={0} isStreaming />
      </p>
    );
  }
  const isStreaming = stage === 'drafting';

  return (
    <p className='text-sm leading-relaxed text-pretty'>
      <StreamedText
        key={round}
        text={DRAFT_REPLY}
        isStreaming={isStreaming}
        isActive={isActive}
        wordMs={WORD_MS}
      />
    </p>
  );
}

export function DraftDemo() {
  const [stage, setStage] = useState<DraftStage>('reading');
  const [round, setRound] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const { pressed, press } = usePress<'send'>();
  const steps = [
    { after: SEND_AFTER_MS, run: () => press('send') },
    { after: 240, run: () => setStage('sent') },
    { after: 3200, run: hold },
  ];
  const { ref, isInView } = useAutoplay(steps, {
    loopAfter: 1000,
    onReset: () => setStage('reading'),
  });
  const canSend = stage === 'ready';
  const canRedraft = stage === 'ready' || stage === 'sent';
  const statusWord = statusWordOf(stage);
  const sendLabel = sendLabelOf(stage);
  const hasSent = stage === 'sent';

  useKeptHeight(ref);
  useRestingState<DraftStage>(shouldReduceMotion, 'ready', setStage);

  useEffect(() => {
    const wait = waitOf(stage);
    if (wait === null || !isInView) {
      return;
    }
    const next = nextStageOf(stage);
    const timer = setTimeout(() => setStage(next), wait);
    return () => clearTimeout(timer);
  }, [stage, round, isInView]);

  function redraft() {
    setRound((current) => current + 1);
    setStage('drafting');
  }

  return (
    <div
      ref={ref}
      className='bg-card hairline-ring ring-border flex w-full max-w-sm flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]'
    >
      <div className='bg-foreground/[0.04] flex flex-col gap-2 rounded-lg p-3'>
        <div className='flex items-center gap-2.5'>
          <Avatar
            className='size-6'
            seed={INCOMING.from}
            role='img'
            aria-label={INCOMING.from}
          />
          <p className='text-[13px] font-medium'>{INCOMING.from}</p>
          <p className='text-muted-foreground ms-auto text-xs tabular-nums'>
            {INCOMING.time}
          </p>
        </div>
        <p className='text-[13px] leading-relaxed text-pretty'>
          {INCOMING.text}
        </p>
      </div>
      <div className='flex flex-col gap-2 px-1'>
        <div className='flex items-center gap-2'>
          <MeshTile seed={ASSISTANT.name} size='md' />
          <p className='text-muted-foreground text-xs font-medium'>
            Draft reply
          </p>
          <p
            aria-live='polite'
            className='text-muted-foreground ms-auto flex items-center gap-1.5 text-xs'
          >
            {hasSent && <DrawnCheck tone='success' entrance='pop' />}
            <Swap swapKey={statusWord}>{statusWord}</Swap>
          </p>
        </div>
        <DraftBody stage={stage} round={round} isActive={isInView} />
      </div>
      <div className='flex items-center justify-end gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          disabled={!canRedraft}
          focusableWhenDisabled
          onClick={redraft}
        >
          <RotateCcwIcon />
          Redraft
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!canSend}
          focusableWhenDisabled
          onClick={() => setStage('sent')}
          className={pressedSolidOf(pressed === 'send')}
        >
          <Swap swapKey={sendLabel}>{sendLabel}</Swap>
        </Button>
      </div>
    </div>
  );
}
