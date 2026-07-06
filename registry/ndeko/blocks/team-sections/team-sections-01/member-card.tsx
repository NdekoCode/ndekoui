import {
  GithubIcon,
  LinkedinBrandIcon,
  MapPinIcon,
  TwitterXIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

import type { Member, SocialKind } from './data';
import { MemberBio } from './member-bio';

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

type MemberCardProps = {
  member: Member;
  isOpen: boolean;
  isPressed: boolean;
  onToggle: (memberId: string) => void;
};

export function MemberCard({
  member,
  isOpen,
  isPressed,
  onToggle,
}: MemberCardProps) {
  return (
    <article className='bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex h-full flex-col gap-4 rounded-xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <header className='flex items-start gap-3'>
        <Avatar seed={member.name} className='size-12' />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <h3 className='truncate text-sm font-medium'>{member.name}</h3>
          <p className='text-muted-foreground truncate text-[13px]'>
            {member.role}
          </p>
          <p className='text-muted-foreground flex min-w-0 items-center gap-1 text-xs'>
            <MapPinIcon className='size-3.5 shrink-0' />
            <span className='truncate'>{member.location}</span>
          </p>
        </div>
      </header>
      <MemberBio
        name={member.name}
        bio={member.bio}
        isOpen={isOpen}
        isPressed={isPressed}
        onToggle={() => onToggle(member.id)}
      />
      <ul className='-mx-1.5 mt-auto flex items-center gap-0.5'>
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
    </article>
  );
}
