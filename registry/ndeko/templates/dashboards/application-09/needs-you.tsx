'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Wash } from '@/registry/ndeko/ui/wash';

import { REQUESTS, type RequestId } from './data';
import { RequestRow } from './request-row';
import type { Decision } from './session';

type NeedsYouProps = {
  pending: RequestId[];
  pressed: string | null;
  onDecide: (requestId: RequestId, decision: Decision) => void;
};

/** The one live surface of the page: agents that wait on a person, in the hue of waiting. */
export function NeedsYou({ pending, pressed, onDecide }: NeedsYouProps) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const hasPending = pending.length > 0;

  return (
    <section
      data-needs-you
      tabIndex={-1}
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] relative isolate flex flex-col rounded-xl pt-4 pb-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none'
    >
      <Wash color='var(--warning)' isShown={hasPending} />
      <div className='flex flex-col gap-0.5 px-4 pb-2'>
        <h2 id={titleId} className='text-sm font-medium'>
          Needs you
        </h2>
        <p className='text-muted-foreground text-xs text-pretty'>
          Agents ask here before they send, pay or delete.
        </p>
      </div>
      <ul aria-labelledby={titleId} className='flex flex-col'>
        <AnimatePresence initial={false}>
          {pending.map((requestId) => (
            <motion.li
              key={requestId}
              className='overflow-hidden'
              {...rowPresence}
            >
              <RequestRow
                request={REQUESTS[requestId]}
                pressed={pressed}
                onDecide={onDecide}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <Fold open={!hasPending}>
        <p className='flex items-center gap-2.5 px-4 py-3 text-[13px]'>
          <DrawnCheck tone='success' entrance='draw-in-view' />
          Nothing waits on you.
        </p>
      </Fold>
    </section>
  );
}
