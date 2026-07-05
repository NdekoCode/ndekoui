'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type MotionProps,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleCheckIcon,
  SmileIcon,
  EyeIcon,
  HeartIcon,
  RocketIcon,
  ThumbsUpIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

import type { CommentItem } from './_parts/comment-model';
import { CommentBlock } from './_parts/comment-parts';
import { ENTER, EXIT, RollingCount } from './_parts/motion-parts';
import { CURRENT_USER_ID, isCurrentUser, personOf } from './_parts/people';

type ReactionId = 'agree' | 'love' | 'done' | 'looking' | 'ship';

type ReactionKind = {
  id: ReactionId;
  label: string;
  icon: Icon;
};

type Reaction = {
  id: ReactionId;
  peopleIds: string[];
};

const KINDS: ReactionKind[] = [
  { id: 'agree', label: 'Agree', icon: ThumbsUpIcon },
  { id: 'love', label: 'Love it', icon: HeartIcon },
  { id: 'done', label: 'Done', icon: CircleCheckIcon },
  { id: 'looking', label: 'Looking into it', icon: EyeIcon },
  { id: 'ship', label: 'Ship it', icon: RocketIcon },
];

const COMMENT: CommentItem = {
  id: 'r1',
  authorId: 'leo',
  at: '2026-11-05T10:12:00',
  body: 'The export now matches the ledger to the cent on last month. I will open it for the billing team tomorrow morning.',
};

const FIRST_REACTIONS: Reaction[] = [
  { id: 'agree', peopleIds: ['sana', 'mei', CURRENT_USER_ID] },
  { id: 'ship', peopleIds: ['tomas'] },
];

const CHIP_MOTION: MotionProps = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: EXIT },
  transition: ENTER,
};

const CHIP_FADE: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function chipMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return CHIP_FADE;
  }
  return CHIP_MOTION;
}

function layoutOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return false;
  }
  return 'position';
}

function kindOf(id: ReactionId) {
  const found = KINDS.find((kind) => kind.id === id);
  if (found) {
    return found;
  }
  return KINDS[0];
}

function firstNameOf(personId: string) {
  if (isCurrentUser(personId)) {
    return 'you';
  }
  return personOf(personId).firstName;
}

function whoReactedOf(peopleIds: string[]) {
  const names = peopleIds.map(firstNameOf);
  if (names.length === 1) {
    return names[0];
  }
  const allButLast = names.slice(0, -1).join(', ');
  const last = names[names.length - 1];
  return `${allButLast} and ${last}`;
}

function capitalized(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toggledReactions(reactions: Reaction[], id: ReactionId) {
  const existing = reactions.find((reaction) => reaction.id === id);
  if (!existing) {
    return [...reactions, { id, peopleIds: [CURRENT_USER_ID] }];
  }
  const hasMine = existing.peopleIds.includes(CURRENT_USER_ID);
  const updated = reactions.map((reaction) => {
    if (reaction.id !== id) {
      return reaction;
    }
    if (hasMine) {
      const others = reaction.peopleIds.filter(
        (personId) => personId !== CURRENT_USER_ID
      );
      return { ...reaction, peopleIds: others };
    }
    return { ...reaction, peopleIds: [...reaction.peopleIds, CURRENT_USER_ID] };
  });
  return updated.filter((reaction) => reaction.peopleIds.length > 0);
}

function ReactionChip({
  reaction,
  onToggle,
}: {
  reaction: Reaction;
  onToggle: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const kind = kindOf(reaction.id);
  const Glyph = kind.icon;
  const isMine = reaction.peopleIds.includes(CURRENT_USER_ID);
  const count = reaction.peopleIds.length;
  const who = capitalized(whoReactedOf(reaction.peopleIds));

  return (
    <motion.li
      layout={layoutOf(shouldReduceMotion)}
      {...chipMotionOf(shouldReduceMotion)}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type='button'
              aria-pressed={isMine}
              aria-label={`${kind.label}, ${count}. ${who}`}
              onClick={onToggle}
              className={cn(
                'hairline-ring ring-foreground/12 text-muted-foreground hover:bg-foreground/[0.04] focus-visible:ring-ring/25 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full px-2 text-xs font-medium transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.94]',
                isMine &&
                  'bg-primary/10 text-primary-ink ring-primary/30 hover:bg-primary/15 dark:bg-primary/20'
              )}
            />
          }
        >
          <Glyph className='size-3.5' />
          <RollingCount value={count} />
        </TooltipTrigger>
        <TooltipContent>
          {who} reacted with {kind.label.toLowerCase()}
        </TooltipContent>
      </Tooltip>
    </motion.li>
  );
}

function ReactionPicker({
  reactions,
  onPick,
}: {
  reactions: Reaction[];
  onPick: (id: ReactionId) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function pick(id: ReactionId) {
    onPick(id);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        aria-label='Add a reaction'
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-[3px]'
      >
        <SmileIcon className='size-3.5' />
      </PopoverTrigger>
      <PopoverContent side='top' align='start' className='w-auto p-1'>
        <ul className='flex gap-0.5' aria-label='Reactions'>
          {KINDS.map((kind) => {
            const Glyph = kind.icon;
            const reaction = reactions.find((item) => item.id === kind.id);
            const isMine = Boolean(
              reaction?.peopleIds.includes(CURRENT_USER_ID)
            );
            return (
              <li key={kind.id}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type='button'
                        aria-pressed={isMine}
                        aria-label={kind.label}
                        onClick={() => pick(kind.id)}
                        className={cn(
                          'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-[background-color,color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px] active:scale-[0.94]',
                          isMine && 'bg-primary/10 text-primary-ink'
                        )}
                      />
                    }
                  >
                    <Glyph className='size-4' />
                  </TooltipTrigger>
                  <TooltipContent>{kind.label}</TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function Comment03() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const [reactions, setReactions] = useState(FIRST_REACTIONS);

  function toggle(id: ReactionId) {
    setReactions((current) => toggledReactions(current, id));
  }

  return (
    <section aria-label='Comment with reactions' className='w-full max-w-md'>
      <CommentBlock comment={COMMENT}>
        <p className='text-[13px] leading-5'>{COMMENT.body}</p>
        <LayoutGroup>
          <ul
            aria-label='Reactions'
            className='mt-2 flex flex-wrap items-center gap-1'
          >
            <AnimatePresence initial={false} mode='popLayout'>
              {reactions.map((reaction) => (
                <ReactionChip
                  key={reaction.id}
                  reaction={reaction}
                  onToggle={() => toggle(reaction.id)}
                />
              ))}
              <motion.li key='picker' layout={layoutOf(shouldReduceMotion)}>
                <ReactionPicker reactions={reactions} onPick={toggle} />
              </motion.li>
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      </CommentBlock>
    </section>
  );
}
