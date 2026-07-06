'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { CircleXIcon, LoaderIcon } from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  rowPresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { viewOfEntry, type EntryMark, type EntryView } from './activity-view';
import { CURRENT_PERSON } from './data';
import type { ActivityEntry } from './session';

/** The list keeps its length: a new line arrives at the top and the oldest one leaves. */
const SHOWN_ENTRIES = 6;

function MarkGlyph({ mark }: { mark: EntryMark }) {
  if (mark === 'running') {
    return <LoaderIcon className='text-muted-foreground size-4 animate-spin' />;
  }
  if (mark === 'denied') {
    return <CircleXIcon className='text-muted-foreground size-4' />;
  }
  return <DrawnCheck tone='success' entrance='draw' />;
}

function Who({ view }: { view: EntryView }) {
  if (view.agent === null) {
    return <Avatar seed={CURRENT_PERSON.name} className='size-7' />;
  }
  return (
    <MeshTile
      seed={view.agent.name}
      color={seriesColorOf(view.agent.series)}
      size='lg'
    />
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const view = viewOfEntry(entry);
  const fade = fadePresence();

  return (
    <div className='flex items-start gap-3 px-4 py-2.5'>
      <Who view={view} />
      <div className='relative min-w-0 flex-1'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.div key={view.text} {...fade}>
            <p className='text-[13px] leading-5 text-pretty'>{view.text}</p>
            <p className='text-muted-foreground text-xs text-pretty'>
              {view.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className='mt-0.5 flex size-[18px] shrink-0 items-center justify-center'>
        <Swap swapKey={view.mark}>
          <MarkGlyph mark={view.mark} />
        </Swap>
      </span>
    </div>
  );
}

export function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  const titleId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const shown = activity.slice(0, SHOWN_ENTRIES);

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex flex-col rounded-xl pt-4 pb-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <h2 id={titleId} className='px-4 pb-2 text-sm font-medium'>
        Recent activity
      </h2>
      <ul className='flex flex-col'>
        <AnimatePresence initial={false}>
          {shown.map((entry) => (
            <motion.li
              key={entry.id}
              className='overflow-hidden'
              {...rowPresence}
            >
              <ActivityRow entry={entry} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
