'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { LoaderIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';

import type { NoticeData, NoticeTone } from './data';
import { fadePresence, heightPresenceOf, MorphText } from './motion-parts';

export type NoticePhase = 'open' | 'working' | 'resolved';

const ORB_TONE: Record<NoticeTone, StatusOrbTone> = {
  warning: 'warning',
  error: 'error',
  info: 'info',
};

function orbToneOf(tone: NoticeTone, phase: NoticePhase): StatusOrbTone {
  if (phase === 'resolved') {
    return 'success';
  }
  return ORB_TONE[tone];
}

function textOf(notice: NoticeData, isResolved: boolean) {
  if (isResolved) {
    return notice.resolved;
  }
  return notice.open;
}

function actionLabelOf(notice: NoticeData, isWorking: boolean) {
  if (isWorking) {
    return notice.workingAction;
  }
  return notice.action;
}

type NoticeProps = {
  notice: NoticeData;
  phase: NoticePhase;
  recoveryHref: string;
  onAction: (noticeId: string) => void;
  onDismiss: (noticeId: string) => void;
};

export function Notice({
  notice,
  phase,
  recoveryHref,
  onAction,
  onDismiss,
}: NoticeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isResolved = phase === 'resolved';
  const isWorking = phase === 'working';
  const text = textOf(notice, isResolved);

  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <div className='pb-3'>
        <div className='bg-card hairline-ring ring-border flex items-start gap-3 rounded-xl py-3 ps-3.5 pe-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <StatusOrb
            tone={orbToneOf(notice.tone, phase)}
            size='sm'
            className='mt-px'
          />
          <AnimatedSize className='min-w-0 flex-1'>
            <div className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                <motion.div key={String(isResolved)} {...fadePresence()}>
                  <p className='text-[13px] font-medium'>{text.title}</p>
                  <p className='text-muted-foreground mt-0.5 text-[13px] text-pretty'>
                    {text.line}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            {!isResolved && (
              <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2'>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={isWorking}
                  onClick={() => onAction(notice.id)}
                >
                  <AnimatedSize axis='width'>
                    <span className='flex items-center gap-1.5'>
                      {isWorking && (
                        <LoaderIcon className='size-3.5 animate-spin' />
                      )}
                      <MorphText text={actionLabelOf(notice, isWorking)} />
                    </span>
                  </AnimatedSize>
                </Button>
                <a
                  href={recoveryHref}
                  className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 rounded-sm text-xs underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
                >
                  {notice.recoveryLink}
                </a>
              </div>
            )}
          </AnimatedSize>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={`Dismiss: ${text.title}`}
            onClick={() => onDismiss(notice.id)}
            className='text-muted-foreground -mt-0.5'
          >
            <XIcon />
          </Button>
        </div>
      </div>
    </motion.li>
  );
}
