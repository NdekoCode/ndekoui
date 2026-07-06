'use client';
import { useState } from 'react';
import { MotionNumber } from '@/components/core/motion-number';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

const FOLLOWERS_BEFORE = 999;

const COMPACT_FORMAT: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

function followersOf(isFollowing: boolean) {
  if (isFollowing) {
    return FOLLOWERS_BEFORE + 1;
  }
  return FOLLOWERS_BEFORE;
}

function followerWordOf(count: number) {
  if (count === 1) {
    return 'follower';
  }
  return 'followers';
}

function buttonVariantOf(isFollowing: boolean) {
  if (isFollowing) {
    return 'outline';
  }
  return 'default';
}

function buttonLabelOf(isFollowing: boolean) {
  if (isFollowing) {
    return 'Following';
  }
  return 'Follow';
}

export function MotionNumberFollowers() {
  const [isFollowing, setIsFollowing] = useState(false);
  const followers = followersOf(isFollowing);

  function toggleFollow() {
    setIsFollowing((current) => !current);
  }

  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-sm items-center gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <Avatar className='size-10' seed='Mira Okafor' />
      <div className='flex min-w-0 flex-1 flex-col'>
        <span className='text-foreground truncate text-sm font-medium'>
          Mira Okafor
        </span>
        <span className='text-muted-foreground flex items-baseline gap-1 text-xs'>
          <MotionNumber value={followers} format={COMPACT_FORMAT} />
          <span>{followerWordOf(followers)}</span>
        </span>
      </div>
      <Button
        variant={buttonVariantOf(isFollowing)}
        size='sm'
        onClick={toggleFollow}
      >
        {buttonLabelOf(isFollowing)}
      </Button>
    </div>
  );
}
