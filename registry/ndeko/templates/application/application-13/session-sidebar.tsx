'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { HistoryIcon, PlusIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';

import { BRAND, DAYS, type PastSession } from './data';

/** The ring is drawn inside the row: the row sits in a box that clips while it arrives. */
const ROW =
  'hover:bg-foreground/5 focus-visible:ring-ring/25 flex h-7 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-start text-[13px] font-medium outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-inset';

type SessionRowProps = {
  session: PastSession;
  onAskAgain: (prompt: string) => void;
};

function SessionRow({ session, onAskAgain }: SessionRowProps) {
  function askAgain() {
    onAskAgain(session.prompt);
  }

  return (
    <button
      type='button'
      aria-label={`Ask again: ${session.title}`}
      onClick={askAgain}
      className={ROW}
    >
      <HistoryIcon className='text-muted-foreground size-4 shrink-0' />
      <span className='min-w-0 flex-1 truncate'>{session.title}</span>
    </button>
  );
}

type SessionSidebarProps = {
  sessions: PastSession[];
  onNewSession: () => void;
  onAskAgain: (prompt: string) => void;
};

/** A past session puts its prompt back in the field, ready to be sent again or changed first. */
export function SessionSidebar({
  sessions,
  onNewSession,
  onAskAgain,
}: SessionSidebarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <div className='flex min-h-0 w-full flex-col gap-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex h-9 items-center gap-2 px-1.5'>
          <span
            aria-hidden='true'
            className='gem-plate inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold select-none [--gem:var(--primary)]'
          >
            {BRAND.initial}
          </span>
          <span className='text-[13px] font-semibold'>{BRAND.name}</span>
        </div>
        <Button
          type='button'
          variant='outline'
          onClick={onNewSession}
          className='w-full justify-start'
        >
          <PlusIcon />
          New session
        </Button>
      </div>
      <nav
        aria-label='Recent sessions'
        className='-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1'
      >
        {DAYS.map((day) => {
          const ofDay = sessions.filter((session) => session.day === day);
          return (
            <section key={day} className='flex flex-col gap-0.5'>
              <h2 className='text-muted-foreground flex h-6 items-center px-2 text-xs font-medium'>
                {day}
              </h2>
              <ul className='flex flex-col'>
                <AnimatePresence initial={false}>
                  {ofDay.map((session) => (
                    <motion.li
                      key={session.id}
                      className='-mx-1 overflow-hidden px-1'
                      {...rowPresence}
                    >
                      <SessionRow session={session} onAskAgain={onAskAgain} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })}
      </nav>
    </div>
  );
}
