import {
  GithubIcon,
  LinkedinBrandIcon,
  MailIcon,
  MapPinIcon,
  TwitterXIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';

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

export function MemberProfile({ member }: { member: Member }) {
  return (
    <article className='grid gap-6 @2xl:grid-cols-[auto_minmax(0,1fr)] @2xl:gap-8'>
      <Avatar seed={member.name} className='size-20 rounded-2xl @2xl:size-32' />
      <div className='flex min-w-0 flex-col gap-5'>
        <header className='flex flex-col gap-1'>
          <h3 className='text-xl font-semibold text-balance'>{member.name}</h3>
          <p className='text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm'>
            {member.role}
            <span aria-hidden='true'>·</span>
            <span className='inline-flex items-center gap-1'>
              <MapPinIcon className='size-3.5' />
              {member.location}
            </span>
          </p>
        </header>
        <p className='text-sm leading-6 text-pretty'>{member.bio}</p>
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-xs'>Ask me about</p>
          <ul className='flex flex-wrap gap-1.5'>
            {member.topics.map((topic) => (
              <li key={topic}>
                <Badge variant='secondary'>{topic}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
          <span className='bg-foreground/[0.04] flex min-w-0 items-center gap-2 rounded-lg py-1 ps-2.5 pe-1'>
            <MailIcon className='text-muted-foreground size-4 shrink-0' />
            <span className='truncate text-[13px]'>{member.email}</span>
            <CopyButton
              text={member.email}
              label={`Copy the email address of ${member.name}`}
            />
          </span>
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
      </div>
    </article>
  );
}
