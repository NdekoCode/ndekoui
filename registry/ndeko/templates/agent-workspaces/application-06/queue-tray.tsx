'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { countOf } from '@/registry/ndeko/lib/words';

import type { Outgoing } from './session';

type QueueRowProps = {
  item: Outgoing;
  position: number;
  onRemove: (id: string) => void;
};

function QueueRow({ item, position, onRemove }: QueueRowProps) {
  function remove() {
    onRemove(item.id);
  }

  return (
    <div className='flex h-8 items-center gap-2 ps-2 pe-1 text-[13px]'>
      <span className='text-muted-foreground w-3 shrink-0 text-xs tabular-nums'>
        {position}
      </span>
      <span className='min-w-0 flex-1 truncate'>{item.text}</span>
      <button
        type='button'
        aria-label={`Remove from the queue: ${item.text}`}
        onClick={remove}
        className='text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground focus-visible:ring-ring/25 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px] active:scale-[0.97]'
      >
        <XIcon className='size-3.5' />
      </button>
    </div>
  );
}

type QueueTrayProps = {
  queue: Outgoing[];
  onRemove: (id: string) => void;
};

export function QueueTray({ queue, onRemove }: QueueTrayProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <section
      aria-label='Queued messages'
      className='bg-foreground/[0.04] mb-2 flex flex-col rounded-xl p-1'
    >
      <h3 className='text-muted-foreground flex items-center gap-1.5 px-2 pt-1 pb-0.5 text-xs'>
        Up next
        <span className='tabular-nums'>{countOf(queue.length, 'message')}</span>
      </h3>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {queue.map((item, index) => (
            <motion.li
              key={item.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <QueueRow item={item} position={index + 1} onRemove={onRemove} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
