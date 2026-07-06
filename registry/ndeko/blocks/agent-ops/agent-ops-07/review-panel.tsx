'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import {
  CircleCheckIcon,
  CircleXIcon,
  LoaderIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold, Swap } from '@/registry/ndeko/ui/chat-motion';
import { InlineSheet } from '@/registry/ndeko/ui/inline-sheet';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';

import { SAMPLES, type Sample } from './data';
import {
  canPublish,
  changesOf,
  type BuilderState,
  type PublishStatus,
  type SampleStatus,
} from './session';

const SAMPLE_WORD: Record<SampleStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  pass: 'Passed',
  fail: 'Failed',
};

const SAMPLE_TONE: Record<SampleStatus, string> = {
  queued: 'text-muted-foreground',
  running: 'text-muted-foreground',
  pass: 'text-success-foreground',
  fail: 'text-destructive-ink',
};

const PUBLISH_STATE: Record<PublishStatus, MorphState> = {
  idle: 'idle',
  pending: 'busy',
  failed: 'idle',
  done: 'done',
};

const CHECK_PATH = 'M5 10.4 8.6 14 15 6.6';

const DRAW = { duration: 0.5, ease: EASE_OUT_STRONG, delay: 0.12 };

const SETTLE = { duration: 0.3, ease: EASE_OUT_STRONG };

function idleLabelOf(publish: PublishStatus, version: number) {
  if (publish === 'failed') {
    return 'Retry';
  }
  return `Publish version ${version}`;
}

function strokeStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { pathLength: 1 };
  }
  return { pathLength: 0 };
}

function markStartOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { opacity: 0, scale: 1 };
  }
  return { opacity: 0, scale: 1.04 };
}

function SampleMark({ status }: { status: SampleStatus }) {
  return (
    <Swap swapKey={status} className='size-4 shrink-0'>
      {status === 'queued' && (
        <span className='bg-muted-foreground/40 m-auto size-1.5 rounded-full' />
      )}
      {status === 'running' && (
        <LoaderIcon className='text-muted-foreground size-4 animate-spin' />
      )}
      {status === 'pass' && (
        <CircleCheckIcon className='text-success-foreground size-4' />
      )}
      {status === 'fail' && (
        <CircleXIcon className='text-destructive-ink size-4' />
      )}
    </Swap>
  );
}

type SampleRowProps = {
  sample: Sample;
  status: SampleStatus;
};

function SampleRow({ sample, status }: SampleRowProps) {
  const hasFailed = status === 'fail';

  return (
    <li className='flex items-start gap-2.5 py-1.5'>
      <span className='flex h-5 items-center'>
        <SampleMark status={status} />
      </span>
      <div className='flex min-w-0 flex-1 flex-col'>
        <p className='text-[13px] leading-5'>{sample.prompt}</p>
        <Fold open={hasFailed}>
          <p className='text-destructive-ink text-xs'>{sample.failure}</p>
        </Fold>
      </div>
      <span
        className={cn(
          'shrink-0 text-xs leading-5 transition-colors duration-200',
          SAMPLE_TONE[status]
        )}
      >
        <Swap swapKey={status}>{SAMPLE_WORD[status]}</Swap>
      </span>
    </li>
  );
}

function LiveMark() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.span
      aria-hidden='true'
      initial={markStartOf(shouldReduceMotion)}
      animate={{ opacity: 1, scale: 1 }}
      transition={SETTLE}
      className='bg-success/10 text-success-foreground flex size-10 items-center justify-center rounded-full'
    >
      <svg viewBox='0 0 20 20' className='size-5'>
        <motion.path
          d={CHECK_PATH}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
          initial={strokeStartOf(shouldReduceMotion)}
          animate={{ pathLength: 1 }}
          transition={DRAW}
        />
      </svg>
    </motion.span>
  );
}

export type ReviewPanelProps = {
  state: BuilderState;
  pressed: string | null;
  onPublish: () => void;
  onClose: () => void;
};

/** Drawn inside the block, so the demonstration never opens a layer over the rest of the page. */
export function ReviewPanel({
  state,
  pressed,
  onPublish,
  onClose,
}: ReviewPanelProps) {
  const titleId = useId();
  const isOpen = state.isReviewOpen;
  const isLive = state.publish === 'done';
  const isPending = state.publish === 'pending';
  const hasFailed = state.publish === 'failed';
  const changes = changesOf(state);
  const hasChanges = changes.length > 0;
  const nextVersion = state.liveVersion + 1;
  const labels: Record<MorphState, string> = {
    idle: idleLabelOf(state.publish, nextVersion),
    busy: 'Publishing',
    done: 'Published',
  };

  return (
    <InlineSheet
      labelledBy={titleId}
      closeLabel='Close the review'
      side='center'
      closer='none'
      isOpen={isOpen}
      panelClassName='text-card-foreground p-6'
      onClose={onClose}
    >
      <AnimatedSize contentClassName='flex flex-col gap-4'>
        {isLive && (
          <div className='flex flex-col items-start gap-3'>
            <LiveMark />
            <div className='flex flex-col gap-1'>
              <h2 id={titleId} className='text-lg leading-tight font-semibold'>
                Version {state.liveVersion} is live
              </h2>
              <p className='text-muted-foreground text-[13px]'>
                Every new conversation uses it. The version before it is kept
                for a rollback.
              </p>
            </div>
            <Button
              type='button'
              data-review-first
              onClick={onClose}
              className='self-end'
            >
              Done
            </Button>
          </div>
        )}
        {!isLive && (
          <>
            <div className='flex flex-col gap-1.5 pe-8'>
              <h2 id={titleId} className='text-lg leading-tight font-semibold'>
                Publish version {nextVersion}
              </h2>
              <p className='text-muted-foreground text-[13px]'>
                Version {state.liveVersion} keeps answering until this one is
                live.
              </p>
            </div>

            <div className='flex flex-col gap-1.5'>
              <h3 className='text-muted-foreground text-xs'>
                Changed since version {state.liveVersion}
              </h3>
              {!hasChanges && (
                <p className='text-[13px]'>
                  Nothing changed, so there is nothing to publish
                </p>
              )}
              <ul className='flex flex-col gap-1'>
                {changes.map((change) => (
                  <li key={change} className='flex gap-2 text-[13px]'>
                    <span
                      aria-hidden='true'
                      className='bg-foreground/30 mt-2 size-1 shrink-0 rounded-full'
                    />
                    {change}
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col gap-1'>
              <h3 className='text-muted-foreground text-xs'>Sample prompts</h3>
              <ul className='flex flex-col'>
                {SAMPLES.map((sample, index) => (
                  <SampleRow
                    key={sample.id}
                    sample={sample}
                    status={state.samples[index]}
                  />
                ))}
              </ul>
            </div>

            <div aria-live='polite'>
              <Fold open={hasFailed}>
                <p className='bg-destructive/10 rounded-lg p-3 text-[13px] leading-relaxed'>
                  <span className='text-destructive-ink font-medium'>
                    Publishing failed.
                  </span>{' '}
                  The service did not answer in time. Version{' '}
                  {state.liveVersion} is still live and nothing changed.
                </p>
              </Fold>
            </div>

            <div className='flex flex-col-reverse gap-2 @sm:flex-row @sm:justify-end'>
              <Button
                type='button'
                variant='ghost'
                disabled={isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <MorphButton
                type='button'
                data-review-first
                state={PUBLISH_STATE[state.publish]}
                labels={labels}
                disabled={!canPublish(state)}
                onClick={onPublish}
                className={pressedSolidOf(pressed === 'publish')}
              />
            </div>
          </>
        )}
      </AnimatedSize>
      {!isLive && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Close'
          disabled={isPending}
          onClick={onClose}
          className='text-muted-foreground absolute top-3 right-3'
        >
          <XIcon />
        </Button>
      )}
    </InlineSheet>
  );
}
