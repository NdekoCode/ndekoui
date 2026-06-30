'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { CheckIcon, UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type FillOrigin = { x: string; y: string };

const CENTRE: FillOrigin = { x: '50%', y: '50%' };

const FILL_LAYER =
  'bg-primary text-primary-foreground pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] px-3.5';

const FILL_GROWS =
  'transition-[clip-path] duration-300 ease-(--ease-out-strong)';
const FILL_SHRINKS =
  'transition-[clip-path] duration-150 ease-(--ease-out-strong)';
const FILL_FADES = 'transition-opacity duration-150';

const CONTENT =
  'col-start-1 row-start-1 flex items-center justify-center gap-2';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function contentOf(isFollowing: boolean) {
  if (isFollowing) {
    return { key: 'following', icon: <CheckIcon />, label: 'Following' };
  }
  return { key: 'follow', icon: <UserRoundPlusIcon />, label: 'Follow' };
}

function clipRadiusOf(isFollowing: boolean) {
  if (isFollowing) {
    return '150%';
  }
  return '0%';
}

function fillTransitionOf(
  isFollowing: boolean,
  shouldReduceMotion: boolean | null
) {
  if (shouldReduceMotion) {
    return FILL_FADES;
  }
  if (isFollowing) {
    return FILL_GROWS;
  }
  return FILL_SHRINKS;
}

function fillStyleOf(
  isFollowing: boolean,
  origin: FillOrigin,
  shouldReduceMotion: boolean | null
): React.CSSProperties {
  if (shouldReduceMotion) {
    return { opacity: Number(isFollowing) };
  }
  const radius = clipRadiusOf(isFollowing);
  return { clipPath: `circle(${radius} at ${origin.x} ${origin.y})` };
}

function pressOriginOf(event: React.MouseEvent<HTMLButtonElement>) {
  const isKeyboardClick = event.detail === 0;
  if (isKeyboardClick) {
    return CENTRE;
  }
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  return { x: `${x}px`, y: `${y}px` };
}

function FollowContent({
  isFollowing,
  variants,
}: {
  isFollowing: boolean;
  variants: Variants;
}) {
  const content = contentOf(isFollowing);

  return (
    <span className='grid'>
      <span aria-hidden='true' className={cn(CONTENT, 'invisible')}>
        <CheckIcon />
        Following
      </span>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={content.key}
          className={CONTENT}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {content.icon}
          {content.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Button59() {
  const [isFollowing, setIsFollowing] = useState(false);
  const [origin, setOrigin] = useState<FillOrigin>(CENTRE);
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const fillTransition = fillTransitionOf(isFollowing, shouldReduceMotion);
  const fillStyle = fillStyleOf(isFollowing, origin, shouldReduceMotion);

  function toggleFollow(event: React.MouseEvent<HTMLButtonElement>) {
    setOrigin(pressOriginOf(event));
    setIsFollowing((current) => !current);
  }

  return (
    <Button
      variant='outline'
      aria-label='Follow Mira Okafor'
      aria-pressed={isFollowing}
      onClick={toggleFollow}
    >
      <FollowContent isFollowing={isFollowing} variants={swapVariants} />
      <span
        aria-hidden='true'
        className={cn(FILL_LAYER, fillTransition)}
        style={fillStyle}
      >
        <FollowContent isFollowing={isFollowing} variants={swapVariants} />
      </span>
    </Button>
  );
}
