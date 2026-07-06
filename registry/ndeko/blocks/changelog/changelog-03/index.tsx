'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useSession } from '@/registry/ndeko/hooks/use-session';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import { ArrowRightIcon, BellIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';

import { APP, NOTES } from './data';
import { NewsRow } from './news-row';
import {
  INITIAL,
  LOOP_AFTER_MS,
  reducer,
  RESTING,
  SCRIPT,
  unreadCountOf,
} from './session';

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: RESTING,
  script: SCRIPT,
  loopAfter: LOOP_AFTER_MS,
};

const PANEL_SHOWN = { opacity: 1, scale: 1 };

const PANEL_HIDDEN = { opacity: 0, scale: 0.95 };

const PANEL_FADED = { opacity: 0, scale: 1 };

const PANEL_ARRIVE = { duration: 0.15, ease: [0.23, 1, 0.32, 1] as const };

const PANEL_LEAVE = { duration: 0.1, ease: [0.23, 1, 0.32, 1] as const };

function panelStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return PANEL_FADED;
  }
  return PANEL_HIDDEN;
}

const PILL_SHOWN = { opacity: 1, scale: 1 };

const PILL_HIDDEN = { opacity: 0, scale: 0.6 };

const PILL_TRANSITION = { duration: 0.15, ease: [0.2, 0, 0, 1] as const };

function pillStartOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return PANEL_FADED;
  }
  return PILL_HIDDEN;
}

function spokenLineOf(unread: number) {
  if (unread === 0) {
    return 'You are up to date';
  }
  if (unread === 1) {
    return '1 note unread';
  }
  return `${unread} notes unread`;
}

export default function Changelog03() {
  const { ref, isAutoplaying, state, act, pressed, isFinished, restart } =
    useSession(SESSION);
  const shouldReduceMotion = usePrefersReducedMotion();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { isOpen, readIds } = state;
  const unread = unreadCountOf(readIds);
  const hasUnread = unread > 0;
  const message = spokenUnless(isAutoplaying, spokenLineOf(unread));
  const canReplay = isFinished && !isAutoplaying;
  const listensOutside = isOpen && !isAutoplaying;

  useEffect(() => {
    if (!listensOutside) {
      return;
    }
    function closeFromOutside(event: PointerEvent) {
      const wrapper = wrapperRef.current;
      const target = event.target;
      const isInside = target instanceof Node && wrapper?.contains(target);
      if (!isInside) {
        act({ type: 'closed' });
      }
    }
    document.addEventListener('pointerdown', closeFromOutside);
    return () => document.removeEventListener('pointerdown', closeFromOutside);
  }, [listensOutside, act]);

  function toggle() {
    if (isOpen) {
      act({ type: 'closed' });
      return;
    }
    act({ type: 'opened' });
  }

  function closeOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      act({ type: 'closed' });
      triggerRef.current?.focus();
    }
  }

  return (
    <div ref={ref} className='@container px-4 py-10 @2xl:px-6 @2xl:py-16'>
      <div className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative mx-auto min-h-[30rem] max-w-3xl rounded-2xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <header className='flex h-14 items-center gap-2 px-4'>
          <CompanyMark seed={APP.name} size='lg' />
          <span className='text-sm font-semibold'>{APP.name}</span>
          <div className='ms-auto flex items-center gap-2'>
            <ReplayButton
              isShown={canReplay}
              onReplay={restart}
              label='Replay'
            />
            <div
              ref={wrapperRef}
              onKeyDown={closeOnEscape}
              className='relative'
            >
              <Button
                ref={triggerRef}
                type='button'
                variant='outline'
                aria-expanded={isOpen}
                aria-haspopup='dialog'
                aria-controls={panelId}
                onClick={toggle}
                className={cn(pressedQuietOf(pressed === 'trigger'))}
              >
                <BellIcon />
                What’s new
                <AnimatePresence initial={false}>
                  {hasUnread && (
                    <motion.span
                      key='unread'
                      initial={pillStartOf(shouldReduceMotion)}
                      animate={PILL_SHOWN}
                      exit={pillStartOf(shouldReduceMotion)}
                      transition={PILL_TRANSITION}
                      className='bg-primary text-primary-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-medium'
                    >
                      <MotionNumber value={unread} />
                      <span className='sr-only'> unread</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key='panel'
                    id={panelId}
                    role='dialog'
                    aria-label='What’s new'
                    initial={panelStartOf(shouldReduceMotion)}
                    animate={PANEL_SHOWN}
                    exit={{
                      ...panelStartOf(shouldReduceMotion),
                      transition: PANEL_LEAVE,
                    }}
                    transition={PANEL_ARRIVE}
                    className='surface-raised absolute end-0 top-full z-10 mt-2 w-[min(22rem,calc(100cqw_-_2rem))] origin-top-right rounded-xl'
                  >
                    <div className='flex items-center justify-between gap-2 px-3.5 pt-3 pb-1'>
                      <h3 className='text-sm font-medium'>What’s new</h3>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        disabled={!hasUnread}
                        onClick={() => act({ type: 'allRead' })}
                        className={cn(
                          'text-primary-ink',
                          pressedQuietOf(pressed === 'mark-all')
                        )}
                      >
                        Mark all read
                      </Button>
                    </div>
                    <ul className='flex flex-col p-1.5'>
                      {NOTES.map((note) => (
                        <NewsRow
                          key={note.id}
                          note={note}
                          isUnread={!readIds.includes(note.id)}
                          isPressed={pressed === `note-${note.id}`}
                          onRead={(id) => act({ type: 'read', id })}
                        />
                      ))}
                    </ul>
                    <div className='flex min-h-11 items-center justify-between gap-3 px-3.5 pb-3'>
                      <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                        {!hasUnread && (
                          <>
                            <DrawnCheck tone='success' entrance='draw' />
                            You are up to date
                          </>
                        )}
                      </p>
                      <Button
                        variant='ghost'
                        size='sm'
                        nativeButton={false}
                        render={<a href={APP.allNotesHref} />}
                      >
                        All release notes
                        <ArrowRightIcon />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className='px-4 pt-2'>
          <Badge variant='secondary'>{APP.badge}</Badge>
        </div>
      </div>
      <LiveRegion message={message} />
    </div>
  );
}
