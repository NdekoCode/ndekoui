'use client';

import { useId } from 'react';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  GithubIcon,
  LinkedinBrandIcon,
  MapPinIcon,
  TwitterXIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import type { Member, SocialKind } from './data';

const SOCIAL_ICONS: Record<SocialKind, Icon> = {
  linkedin: LinkedinBrandIcon,
  x: TwitterXIcon,
  github: GithubIcon,
};

const SOCIAL_NAMES: Record<SocialKind, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
  github: 'GitHub',
};

function surfaceOf(isOpen: boolean) {
  if (isOpen) {
    return 'bg-card ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.04]';
  }
  return 'ring-transparent';
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type MemberRowProps = {
  member: Member;
  isOpen: boolean;
  isPressed: boolean;
  onToggle: (memberId: string) => void;
};

export function MemberRow({
  member,
  isOpen,
  isPressed,
  onToggle,
}: MemberRowProps) {
  const bioId = useId();

  return (
    <li
      className={cn(
        'hairline-ring rounded-xl transition-[background-color,box-shadow] duration-200 ease-(--ease-out-strong)',
        surfaceOf(isOpen)
      )}
    >
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={bioId}
        onClick={() => onToggle(member.id)}
        className={cn(
          'hover:bg-foreground/[0.03] focus-visible:ring-ring/25 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-[background-color,scale] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-[3px]',
          pressedQuietOf(isPressed)
        )}
      >
        <Avatar seed={member.name} className='size-9' />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-sm font-medium'>{member.name}</span>
          <span className='text-muted-foreground truncate text-[13px]'>
            {member.role}
          </span>
        </span>
        <span className='text-muted-foreground hidden shrink-0 items-center gap-1 text-xs @xl:flex'>
          <MapPinIcon className='size-3.5' />
          {member.location}
        </span>
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-[rotate] duration-200 ease-(--ease-out-strong)',
            chevronTurnOf(isOpen)
          )}
        />
      </button>
      <Fold open={isOpen} id={bioId}>
        <div className='flex flex-col items-start gap-3 ps-[3.75rem] pe-4 pt-0.5 pb-4'>
          <p className='text-muted-foreground text-[13px] leading-5 text-pretty'>
            {member.bio}
          </p>
          <p className='text-muted-foreground flex items-center gap-1 text-xs @xl:hidden'>
            <MapPinIcon className='size-3.5' />
            {member.location}
          </p>
          <ul className='-mx-1.5 flex items-center gap-0.5'>
            {member.socials.map((social) => {
              const Glyph = SOCIAL_ICONS[social.kind];
              const label = `${member.name} on ${SOCIAL_NAMES[social.kind]}`;

              return (
                <li key={social.kind}>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    nativeButton={false}
                    aria-label={label}
                    render={<a href={social.href} />}
                    className='text-muted-foreground'
                  >
                    <Glyph />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </Fold>
    </li>
  );
}
