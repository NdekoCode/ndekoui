'use client';

import { useState } from 'react';

import { OrbitingCircles } from '@/components/core/orbiting-circles';
import { PauseIcon, PlayIcon, UsersIcon } from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

type Member = {
  name: string;
  initials: string;
  avatar: string;
};

const MEMBERS: Member[] = [
  { name: 'Amani Diallo', initials: 'AD', avatar: '/avatars/avatar-03.svg' },
  { name: 'Lea Moreau', initials: 'LM', avatar: '/avatars/avatar-04.svg' },
  { name: 'Tomas Ilunga', initials: 'TI', avatar: '/avatars/avatar-05.svg' },
  { name: 'Noor Haddad', initials: 'NH', avatar: '/avatars/avatar-06.svg' },
  { name: 'Ines Mbuyi', initials: 'IM', avatar: '/avatars/avatar-07.svg' },
];

function toggleLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Resume';
  }
  return 'Pause';
}

export function OrbitingCirclesTeam() {
  const [isPaused, setIsPaused] = useState(false);
  const toggleLabel = toggleLabelOf(isPaused);

  function togglePause() {
    setIsPaused((paused) => !paused);
  }

  return (
    <div className='flex w-full flex-col items-center gap-2 py-4'>
      <div
        role='img'
        aria-label='Five members of a fictional team around their workspace'
        className='relative h-[300px] w-full max-w-sm overflow-hidden'
      >
        <span className='bg-muted text-muted-foreground absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl'>
          <UsersIcon className='size-5' />
        </span>
        <OrbitingCircles
          radius={110}
          duration={30}
          iconSize={40}
          paused={isPaused}
        >
          {MEMBERS.map((member) => (
            <Avatar key={member.name} className='size-10 text-xs'>
              <AvatarImage src={member.avatar} alt='' />
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
          ))}
        </OrbitingCircles>
      </div>
      <Button variant='outline' size='sm' onClick={togglePause}>
        {isPaused && <PlayIcon />}
        {!isPaused && <PauseIcon />}
        {toggleLabel}
      </Button>
    </div>
  );
}
