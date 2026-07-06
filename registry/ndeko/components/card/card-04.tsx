'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  MessageCircleIcon,
  ShareIcon,
} from '@/registry/ndeko/lib/icons';
import { fadePresence } from '@/registry/ndeko/lib/motion-presets';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { depthOf, useDeck } from './_parts/deck';
import { holdFocusOutsideCards, isOnControl, sideStepOf } from './_parts/keys';
import { PEOPLE } from './_parts/people';
import { SampleNote } from './_parts/sample-note';
import { useCardDemo } from './_parts/use-card-demo';

export type PostReply = {
  id: string;
  author: string;
  text: string;
};

export type Post = {
  id: string;
  author: { name: string; role: string };
  /** How long ago it was posted, as the card shows it: "2h". */
  age: string;
  text: string;
  /** What the inner panel shows: a picture, a chart, any drawing. */
  visual: React.ReactNode;
  /** Likes from everyone else: the viewer's own like is added on top. */
  likeCount: number;
  replies: PostReply[];
};

/** The control a demonstration holds down before it acts. */
export type PostDeckPress = 'like' | 'next';

export type PostDeckHandle = {
  next: () => void;
  previous: () => void;
  toggleLike: () => void;
};

const LAST_LAYER = 2;
const PEEK_PX = 8;
const SCALE_STEP = 0.04;
const OUT_SHIFT_PERCENT = -60;
const OUT_DROP_PX = 12;
const OUT_TILT_DEG = -8;
const LEAVE_MS = 260;

/** A drag turns the card a little as it moves, and past this distance a release turns the deck. */
const TILT_PER_PX = 0.04;
const SWIPE_PX = 72;

const SHARED_FOR_MS = 1600;

/** Under 20rem a post needs a third line of text, so the cards and the deck grow by one line there. */
const CARD = [
  'bg-card hairline-ring ring-border absolute inset-x-0 bottom-0 flex h-[18.75rem] origin-top flex-col gap-3 rounded-xl p-4 @max-xs:h-[20rem]',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] ease-(--ease-out-strong) select-none',
].join(' ');

const FRONT =
  'cursor-grab touch-pan-y data-[dragging=true]:cursor-grabbing data-[dragging=true]:transition-none';

const TRAVELLING = 'transition-[transform,opacity] duration-300';

const PLACED = 'transition-none';

const ACTION = 'text-muted-foreground -mx-1 gap-1.5 px-2 tabular-nums';

type Placement = { transform: string; opacity: number; zIndex: number };

/** The drag of a finger is added to the place of the card through two custom properties, so no render runs while it moves. */
function transformOf(
  shiftPercent: number,
  offsetY: number,
  scale: number,
  tilt: number
) {
  const shift = `calc(${shiftPercent}% + var(--drag-x, 0px))`;
  const turn = `calc(${tilt}deg + var(--drag-tilt, 0deg))`;
  return `translate(${shift}, ${offsetY}px) scale(${scale}) rotate(${turn})`;
}

function opacityOf(isShown: boolean) {
  if (isShown) {
    return 1;
  }
  return 0;
}

function placementOf(depth: number, isOut: boolean, count: number): Placement {
  if (isOut) {
    const swungOut = transformOf(
      OUT_SHIFT_PERCENT,
      OUT_DROP_PX,
      1,
      OUT_TILT_DEG
    );
    const aboveAll = count + 1;
    return { transform: swungOut, opacity: 0, zIndex: aboveAll };
  }
  const layer = Math.min(depth, LAST_LAYER);
  const lift = layer * -PEEK_PX;
  const shrink = layer * SCALE_STEP;
  const scale = 1 - shrink;
  const isShown = depth <= LAST_LAYER;
  const stackOrder = count - depth;
  return {
    transform: transformOf(0, lift, scale, 0),
    opacity: opacityOf(isShown),
    zIndex: stackOrder,
  };
}

function travelOf(isPlaced: boolean) {
  if (isPlaced) {
    return PLACED;
  }
  return TRAVELLING;
}

function likesOf(post: Post, isLiked: boolean) {
  if (isLiked) {
    return post.likeCount + 1;
  }
  return post.likeCount;
}

function likeWordOf(count: number) {
  if (count === 1) {
    return 'like';
  }
  return 'likes';
}

function replyWordOf(count: number) {
  if (count === 1) {
    return 'reply';
  }
  return 'replies';
}

function shareLabelOf(isShared: boolean) {
  if (isShared) {
    return 'Link copied';
  }
  return 'Copy the link';
}

function Replies({ replies }: { replies: PostReply[] }) {
  if (replies.length === 0) {
    return <p className='text-muted-foreground text-xs'>No replies yet</p>;
  }

  return (
    <ul className='flex w-full flex-col gap-2.5 self-start'>
      {replies.map((reply) => (
        <li key={reply.id} className='flex items-start gap-2 text-xs'>
          <Avatar seed={reply.author} className='size-5' />
          <p className='min-w-0 leading-5'>
            <span className='font-medium'>{reply.author}</span>{' '}
            <span className='text-muted-foreground'>{reply.text}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

type Drag = { pointerId: number; startX: number };

type PostCardProps = {
  post: Post;
  position: number;
  count: number;
  placement: Placement;
  isFront: boolean;
  /** The card takes its pose at once, to travel from there on the next change. */
  isPlaced: boolean;
  /** A drag turns the deck: false for a deck of one. */
  canTurn: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isShared: boolean;
  showsReplies: boolean;
  isLikePressed: boolean;
  canShare: boolean;
  onToggleLike: () => void;
  onToggleSaved: () => void;
  onToggleReplies: () => void;
  onShare: () => void;
  onSwipe: (step: 1 | -1) => void;
};

function PostCard({
  post,
  position,
  count,
  placement,
  isFront,
  isPlaced,
  canTurn,
  isLiked,
  isSaved,
  isShared,
  showsReplies,
  isLikePressed,
  canShare,
  onToggleLike,
  onToggleSaved,
  onToggleReplies,
  onShare,
  onSwipe,
}: PostCardProps) {
  const drag = useRef<Drag | null>(null);
  const fade = fadePresence();
  const likes = likesOf(post, isLiked);
  const replyCount = post.replies.length;
  const likeWord = likeWordOf(likes);
  const replyWord = replyWordOf(replyCount);
  const likeLabel = `Like, ${likes} ${likeWord}`;
  const replyLabel = `${replyCount} ${replyWord}`;
  const shareLabel = shareLabelOf(isShared);
  const answersDrag = isFront && canTurn;

  function grab(event: React.PointerEvent<HTMLLIElement>) {
    const isMainButton = event.button === 0;
    const startsOnCard = !isOnControl(event.target);
    const canGrab = answersDrag && isMainButton && startsOnCard;
    if (!canGrab) {
      return;
    }
    const card = event.currentTarget;
    drag.current = { pointerId: event.pointerId, startX: event.clientX };
    card.setPointerCapture(event.pointerId);
    card.dataset.dragging = 'true';
  }

  function heldBy(event: React.PointerEvent<HTMLLIElement>) {
    const held = drag.current;
    if (!held) {
      return null;
    }
    if (held.pointerId !== event.pointerId) {
      return null;
    }
    return held;
  }

  function follow(event: React.PointerEvent<HTMLLIElement>) {
    const held = heldBy(event);
    if (!held) {
      return;
    }
    const offset = event.clientX - held.startX;
    const tilt = offset * TILT_PER_PX;
    const card = event.currentTarget;
    card.style.setProperty('--drag-x', `${offset}px`);
    card.style.setProperty('--drag-tilt', `${tilt}deg`);
  }

  function letGo(card: HTMLLIElement) {
    drag.current = null;
    delete card.dataset.dragging;
    card.style.removeProperty('--drag-x');
    card.style.removeProperty('--drag-tilt');
  }

  function release(event: React.PointerEvent<HTMLLIElement>) {
    const held = heldBy(event);
    if (!held) {
      return;
    }
    const offset = event.clientX - held.startX;
    letGo(event.currentTarget);
    if (offset <= -SWIPE_PX) {
      onSwipe(1);
      return;
    }
    if (offset >= SWIPE_PX) {
      onSwipe(-1);
    }
  }

  /** A drag the browser takes back, to scroll the page for instance, turns nothing. */
  function cancel(event: React.PointerEvent<HTMLLIElement>) {
    if (heldBy(event)) {
      letGo(event.currentTarget);
    }
  }

  return (
    <li
      style={placement}
      inert={!isFront}
      aria-hidden={!isFront}
      onPointerDown={grab}
      onPointerMove={follow}
      onPointerUp={release}
      onPointerCancel={cancel}
      className={cn(CARD, travelOf(isPlaced), answersDrag && FRONT)}
    >
      <div className='flex items-center gap-2.5'>
        <Avatar seed={post.author.name} />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] font-medium'>{post.author.name}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {post.author.role} · {post.age}
          </p>
        </div>
        <p className='text-muted-foreground text-xs tabular-nums'>
          {position}/{count}
        </p>
      </div>
      <div className='bg-foreground/[0.04] relative flex h-32 items-center justify-center overflow-hidden rounded-md p-3'>
        <AnimatePresence mode='popLayout' initial={false}>
          {showsReplies && (
            <motion.div
              key='replies'
              className='flex size-full items-center justify-center'
              {...fade}
            >
              <Replies replies={post.replies} />
            </motion.div>
          )}
          {!showsReplies && (
            <motion.div
              key='visual'
              className='flex size-full items-center justify-center'
              {...fade}
            >
              {post.visual}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className='line-clamp-2 h-10 text-[13px] leading-5 @max-xs:line-clamp-3 @max-xs:h-[3.75rem]'>
        {post.text}
      </p>
      <div className='flex items-center gap-1'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-pressed={isLiked}
          aria-label={likeLabel}
          onClick={onToggleLike}
          className={cn(ACTION, pressedQuietOf(isLikePressed))}
        >
          <Swap swapKey={String(isLiked)}>
            {isLiked && (
              <HeartIcon fill='currentColor' className='text-primary-ink' />
            )}
            {!isLiked && <HeartIcon />}
          </Swap>
          <MotionNumber value={likes} />
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-expanded={showsReplies}
          aria-label={replyLabel}
          onClick={onToggleReplies}
          className={ACTION}
        >
          <MessageCircleIcon />
          {replyCount}
        </Button>
        {canShare && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={shareLabel}
            onClick={onShare}
            className='text-muted-foreground'
          >
            <Swap swapKey={shareLabel}>
              {isShared && <CheckIcon className='text-success-foreground' />}
              {!isShared && <ShareIcon />}
            </Swap>
          </Button>
        )}
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-pressed={isSaved}
          aria-label='Bookmark'
          onClick={onToggleSaved}
          className='text-muted-foreground ms-auto -me-1'
        >
          <Swap swapKey={String(isSaved)}>
            {isSaved && (
              <BookmarkIcon fill='currentColor' className='text-foreground' />
            )}
            {!isSaved && <BookmarkIcon />}
          </Swap>
        </Button>
      </div>
    </li>
  );
}

export type PostDeckProps = {
  posts: Post[];
  likedIds: readonly string[];
  savedIds: readonly string[];
  onLikedChange: (postId: string, isLiked: boolean) => void;
  onSavedChange: (postId: string, isSaved: boolean) => void;
  /** Copies or sends the link of a post. The mark turns into a check once it resolves. Without it, no share control is drawn. */
  onShare?: (post: Post) => void | Promise<void>;
  /** Turns the deck or likes from outside, for a demonstration or a shortcut of the page. */
  handleRef?: React.Ref<PostDeckHandle>;
  /** Shows Like or Next held down, for a demonstration that presses it. */
  pressed?: PostDeckPress | null;
  /** Keeps the live region quiet while a demonstration turns the deck by itself. */
  isSilent?: boolean;
  label?: string;
  /** Says the posts are made up. Leave it out for real posts. */
  note?: string;
  className?: string;
};

export function PostDeck({
  posts,
  likedIds,
  savedIds,
  onLikedChange,
  onSavedChange,
  onShare,
  handleRef,
  pressed = null,
  isSilent = false,
  label = 'Posts',
  note,
  className,
}: PostDeckProps) {
  const hintId = useId();
  const count = posts.length;
  const deck = useDeck(count, LEAVE_MS);
  const [repliesPostId, setRepliesPostId] = useState<string | null>(null);
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);
  const { schedule, clearAll } = useTimeouts();
  const frontPost = posts[deck.front];
  const frontPosition = deck.front + 1;
  const canTurn = count > 1;
  const canShare = onShare !== undefined;
  const isLikeDown = pressed === 'like';
  const isNextDown = pressed === 'next';

  function showNext() {
    setRepliesPostId(null);
    deck.next();
  }

  function showPrevious() {
    setRepliesPostId(null);
    deck.previous();
  }

  function turn(step: 1 | -1) {
    if (step === 1) {
      showNext();
      return;
    }
    showPrevious();
  }

  function turnWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = sideStepOf(event.key);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    holdFocusOutsideCards(event.currentTarget);
    turn(step);
  }

  function toggleLike(post: Post) {
    const isLiked = likedIds.includes(post.id);
    onLikedChange(post.id, !isLiked);
  }

  function toggleSaved(post: Post) {
    const isSaved = savedIds.includes(post.id);
    onSavedChange(post.id, !isSaved);
  }

  function toggleReplies(post: Post) {
    if (repliesPostId === post.id) {
      setRepliesPostId(null);
      return;
    }
    setRepliesPostId(post.id);
  }

  async function share(post: Post) {
    if (!onShare) {
      return;
    }
    try {
      await onShare(post);
    } catch {
      return;
    }
    clearAll();
    setSharedPostId(post.id);
    schedule(() => setSharedPostId(null), SHARED_FOR_MS);
  }

  function toggleFrontLike() {
    if (frontPost) {
      toggleLike(frontPost);
    }
  }

  useImperativeHandle(handleRef, () => ({
    next: showNext,
    previous: showPrevious,
    toggleLike: toggleFrontLike,
  }));

  if (!frontPost) {
    return (
      <p className='hairline-border border-foreground/20 text-muted-foreground flex h-[18.75rem] w-full items-center justify-center rounded-xl border-dashed text-[13px]'>
        No posts yet
      </p>
    );
  }

  const announcement = `Post ${frontPosition} of ${count}, by ${frontPost.author.name}: ${frontPost.text}`;

  return (
    <div
      role='group'
      aria-roledescription='carousel'
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={0}
      onKeyDown={turnWithKeys}
      className={cn(
        '@container flex w-full flex-col gap-3 rounded-xl',
        FOCUS_RING,
        className
      )}
    >
      <ul className='relative h-[19.75rem] @max-xs:h-[21rem]'>
        {posts.map((post, index) => {
          const depth = depthOf(index, deck.front, count);
          const isOut = index === deck.out;
          const isFront = depth === 0;
          const position = index + 1;
          const isPlaced = isOut && deck.isReturning;
          const isLikePressed = isFront && isLikeDown;
          return (
            <PostCard
              key={post.id}
              post={post}
              position={position}
              count={count}
              placement={placementOf(depth, isOut, count)}
              isFront={isFront}
              isPlaced={isPlaced}
              canTurn={canTurn}
              isLiked={likedIds.includes(post.id)}
              isSaved={savedIds.includes(post.id)}
              isShared={sharedPostId === post.id}
              showsReplies={repliesPostId === post.id}
              isLikePressed={isLikePressed}
              canShare={canShare}
              onToggleLike={() => toggleLike(post)}
              onToggleSaved={() => toggleSaved(post)}
              onToggleReplies={() => toggleReplies(post)}
              onShare={() => share(post)}
              onSwipe={turn}
            />
          );
        })}
      </ul>
      <div className='flex h-7 items-center justify-between gap-2 ps-1'>
        <span className='min-w-0 truncate'>
          {note && <SampleNote>{note}</SampleNote>}
        </span>
        {canTurn && (
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Previous post'
              onClick={showPrevious}
              className='text-muted-foreground'
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Next post'
              onClick={showNext}
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(isNextDown)
              )}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
      <span id={hintId} className='sr-only'>
        Left and Right arrows turn the deck
      </span>
      <LiveRegion message={spokenUnless(isSilent, announcement)} />
    </div>
  );
}

const GOAL_BARS = [
  { id: 'export', height: '54%', isClosed: true },
  { id: 'search', height: '78%', isClosed: true },
  { id: 'invites', height: '46%', isClosed: true },
  { id: 'billing', height: '92%', isClosed: true },
  { id: 'alerts', height: '64%', isClosed: true },
  { id: 'roles', height: '84%', isClosed: true },
  { id: 'audit', height: '38%', isClosed: false },
];

function barToneOf(isClosed: boolean) {
  if (isClosed) {
    return 'bg-primary/75';
  }
  return 'bg-foreground/15';
}

function GoalsVisual() {
  return (
    <div aria-hidden='true' className='flex h-20 items-end gap-2'>
      {GOAL_BARS.map((bar) => (
        <span
          key={bar.id}
          style={{ height: bar.height }}
          className={cn('w-4 rounded-sm', barToneOf(bar.isClosed))}
        />
      ))}
    </div>
  );
}

function EmptyStateVisual() {
  return (
    <div
      aria-hidden='true'
      className='bg-card hairline-ring ring-border flex w-40 flex-col items-center gap-2 rounded-md p-3'
    >
      <span className='bg-foreground/10 size-6 rounded-full' />
      <span className='bg-foreground/15 h-1.5 w-24 rounded-full' />
      <span className='bg-foreground/10 h-1.5 w-16 rounded-full' />
      <span className='bg-primary/75 mt-1 h-4 w-14 rounded-full' />
    </div>
  );
}

function BuildVisual() {
  return (
    <div
      aria-hidden='true'
      className='flex w-full max-w-[14rem] flex-col gap-2.5 text-xs tabular-nums'
    >
      <div className='flex items-center gap-2'>
        <span className='bg-foreground/15 h-3 flex-1 rounded-full' />
        <span className='text-muted-foreground w-8'>4:00</span>
      </div>
      <div className='flex items-center gap-2'>
        <span className='flex-1'>
          <span className='bg-primary/75 block h-3 w-[38%] rounded-full' />
        </span>
        <span className='w-8 font-medium'>1:30</span>
      </div>
    </div>
  );
}

const STREAK_WEEKS = ['Week 43', 'Week 44', 'Week 45'];

function StreakVisual() {
  return (
    <ul aria-hidden='true' className='flex flex-col gap-1.5 text-xs'>
      {STREAK_WEEKS.map((week) => (
        <li
          key={week}
          className='bg-card hairline-ring ring-border flex items-center gap-2 rounded-full py-1 ps-1.5 pe-3'
        >
          <span className='bg-success/15 text-success-foreground flex size-4 items-center justify-center rounded-full'>
            <CheckIcon className='size-3' />
          </span>
          {week}
        </li>
      ))}
    </ul>
  );
}

const POSTS: Post[] = [
  {
    id: 'sprint',
    author: PEOPLE.amara,
    age: '2h',
    text: 'Sprint review done. Six of the seven goals are closed and the audit log moves to next week.',
    visual: <GoalsVisual />,
    likeCount: 24,
    replies: [
      {
        id: 'sprint-1',
        author: PEOPLE.jonas.name,
        text: 'Good call to move the audit log.',
      },
      {
        id: 'sprint-2',
        author: PEOPLE.mei.name,
        text: 'Clear notes, thank you.',
      },
    ],
  },
  {
    id: 'empty-states',
    author: PEOPLE.mei,
    age: '5h',
    text: 'The new empty states are in. Every list now says what to do next.',
    visual: <EmptyStateVisual />,
    likeCount: 31,
    replies: [
      {
        id: 'empty-1',
        author: PEOPLE.rafael.name,
        text: 'Support will feel this one.',
      },
    ],
  },
  {
    id: 'build',
    author: PEOPLE.jonas,
    age: '1d',
    text: 'The build went from four minutes to ninety seconds once the icon step was cached.',
    visual: <BuildVisual />,
    likeCount: 47,
    replies: [
      {
        id: 'build-1',
        author: PEOPLE.amara.name,
        text: 'That is a coffee break back, every day.',
      },
      {
        id: 'build-2',
        author: PEOPLE.ingrid.name,
        text: 'Does it hold on a clean checkout?',
      },
    ],
  },
  {
    id: 'replies',
    author: PEOPLE.rafael,
    age: '2d',
    text: 'First replies went out in under an hour for the third week in a row.',
    visual: <StreakVisual />,
    likeCount: 18,
    replies: [],
  },
];

function withId(ids: string[], id: string, isIncluded: boolean) {
  const others = ids.filter((candidate) => candidate !== id);
  if (isIncluded) {
    return [...others, id];
  }
  return others;
}

async function copyLinkOf(post: Post) {
  const link = `https://example.com/posts/${post.id}`;
  await navigator.clipboard.writeText(link);
}

export default function Card04() {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const deck = useRef<PostDeckHandle>(null);
  const { pressed, press } = usePress<PostDeckPress>();

  function changeLiked(postId: string, isLiked: boolean) {
    setLikedIds((current) => withId(current, postId, isLiked));
  }

  function changeSaved(postId: string, isSaved: boolean) {
    setSavedIds((current) => withId(current, postId, isSaved));
  }

  const steps: AutoplayStep[] = [
    { after: 1600, run: () => press('like') },
    { after: PRESS_LEAD_MS, run: () => deck.current?.toggleLike() },
    { after: 1400, run: () => press('next') },
    { after: PRESS_LEAD_MS, run: () => deck.current?.next() },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 800,
  });

  return (
    <div ref={ref} className='min-h-[22.25rem] w-full max-w-[21rem]'>
      <PostDeck
        posts={POSTS}
        likedIds={likedIds}
        savedIds={savedIds}
        onLikedChange={changeLiked}
        onSavedChange={changeSaved}
        onShare={copyLinkOf}
        handleRef={deck}
        pressed={pressed}
        isSilent={isAutoplaying}
        note='Sample posts'
      />
    </div>
  );
}
