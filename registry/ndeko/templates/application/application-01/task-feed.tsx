'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleDashedIcon,
  ClockIcon,
  HashIcon,
  PlusIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import type { ChangeKind, FeedChange, FeedComment, FeedItem } from './data';
import {
  dayGroupsOf,
  feedCountsOf,
  isFeedFilter,
  timeOf,
  type FeedFilter,
} from './detail-model';
import { heightPresenceOf } from './motion-parts';
import { PersonAvatar, PriorityGlyph } from './task-glyphs';
import { personOf } from './task-model';

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'comments', label: 'Comments' },
  { id: 'history', label: 'History' },
];

const EMPTY_LINE: Record<FeedFilter, string> = {
  all: 'Nothing has happened on this task yet',
  comments: 'No comments yet, write the first one below',
  history: 'No changes recorded yet',
};

const CHANGE_GLYPH: Record<ChangeKind, React.ReactNode> = {
  created: <PlusIcon />,
  status: <CircleDashedIcon />,
  assignee: <UserIcon />,
  estimate: <ClockIcon />,
  label: <HashIcon />,
  priority: <PriorityGlyph priority='high' className='text-muted-foreground' />,
};

const THREAD =
  'relative before:absolute before:inset-y-4 before:start-3 before:hairline-l before:border-dashed before:border-foreground/15';

function scrollBehaviorOf(shouldReduceMotion: boolean | null): ScrollBehavior {
  if (shouldReduceMotion) {
    return 'auto';
  }
  return 'smooth';
}

function CommentEntry({ item }: { item: FeedComment }) {
  const author = personOf(item.authorId);
  return (
    <div className='flex gap-3'>
      <PersonAvatar person={author} className='relative size-6 text-[10px]' />
      <div className='min-w-0 flex-1 pt-0.5'>
        <p className='flex items-baseline gap-2 text-[13px]'>
          <span className='font-medium'>{author.name}</span>
          <time
            dateTime={item.at}
            className='text-muted-foreground text-xs tabular-nums'
          >
            {timeOf(item.at)}
          </time>
        </p>
        <p className='mt-1 text-[13px] leading-relaxed whitespace-pre-line'>
          {item.body}
        </p>
      </div>
    </div>
  );
}

function ChangeEntry({ item }: { item: FeedChange }) {
  const author = personOf(item.authorId);
  return (
    <div className='flex items-center gap-3'>
      <span className='keycap-3d text-muted-foreground relative flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3'>
        {CHANGE_GLYPH[item.change]}
      </span>
      <p className='text-muted-foreground min-w-0 text-[13px]'>
        <span className='text-foreground font-medium'>{author.name}</span>{' '}
        {item.text}
        <time dateTime={item.at} className='ms-2 text-xs tabular-nums'>
          {timeOf(item.at)}
        </time>
      </p>
    </div>
  );
}

function FeedEntry({ item, isFresh }: { item: FeedItem; isFresh: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);
  const entryRef = useRef<HTMLLIElement>(null);

  function revealIfFresh() {
    if (!isFresh) {
      return;
    }
    entryRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: scrollBehaviorOf(shouldReduceMotion),
    });
  }

  return (
    <motion.li
      ref={entryRef}
      {...presence}
      onAnimationComplete={revealIfFresh}
      className='overflow-hidden'
    >
      <div className='py-1.5'>
        {item.kind === 'comment' && <CommentEntry item={item} />}
        {item.kind === 'change' && <ChangeEntry item={item} />}
      </div>
    </motion.li>
  );
}

function DayGroupBlock({
  label,
  items,
  freshItemId,
}: {
  label: string;
  items: FeedItem[];
  freshItemId: string | null;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = heightPresenceOf(shouldReduceMotion);

  return (
    <motion.div {...presence} className='overflow-hidden'>
      <p className='text-muted-foreground pt-3 pb-1 text-xs font-medium'>
        {label}
      </p>
      <ul className={THREAD}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <FeedEntry
              key={item.id}
              item={item}
              isFresh={item.id === freshItemId}
            />
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
}

type TaskFeedProps = {
  items: FeedItem[];
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  freshItemId: string | null;
  children?: React.ReactNode;
};

export function TaskFeed({
  items,
  filter,
  onFilterChange,
  freshItemId,
  children,
}: TaskFeedProps) {
  const counts = feedCountsOf(items);
  const groups = dayGroupsOf(items, filter);
  const isEmpty = groups.length === 0;

  function change(value: unknown) {
    if (isFeedFilter(value)) {
      onFilterChange(value);
    }
  }

  return (
    <section aria-label='Activity'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-[13px] font-medium'>Activity</h3>
        <Tabs value={filter} onValueChange={change}>
          <TabsList variant='segmented' aria-label='What the activity shows'>
            {FILTERS.map((option) => (
              <TabsTab key={option.id} value={option.id}>
                {option.label}
                <MotionNumber
                  value={counts[option.id]}
                  className='text-muted-foreground text-xs'
                />
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <AnimatedSize className='mt-1'>
        <div key={filter}>
          {isEmpty && (
            <p className='text-muted-foreground py-4 text-[13px]'>
              {EMPTY_LINE[filter]}
            </p>
          )}
          <AnimatePresence initial={false}>
            {groups.map((group) => (
              <DayGroupBlock
                key={group.day}
                label={group.label}
                items={group.items}
                freshItemId={freshItemId}
              />
            ))}
          </AnimatePresence>
        </div>
      </AnimatedSize>
      {children}
    </section>
  );
}
