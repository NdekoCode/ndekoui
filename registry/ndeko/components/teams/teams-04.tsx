'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

import { MailIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';

import { rowCollapseOf } from './_parts/collapse';
import { MEMBERS, type Member, type Role } from './_parts/people';
import { PresenceAvatar } from './_parts/presence-avatar';
import { RoleMenu } from './_parts/role-menu';
import { SlidingCount } from './_parts/sliding-count';
import { memberCountLabelOf } from './_parts/teams';

type Invitation = { id: string; email: string; sentLabel: string };

const INITIAL_MEMBERS = MEMBERS.slice(0, 5);

const INITIAL_INVITATIONS: Invitation[] = [
  { id: 'priya', email: 'priya@example.com', sentLabel: 'Invited 2 days ago' },
];

function invitedLabelOf(count: number) {
  if (count === 0) {
    return 'no pending invite';
  }
  if (count === 1) {
    return '1 invited';
  }
  return `${count} invited`;
}

function withRole(members: Member[], memberId: string, role: Role) {
  return members.map((member) => {
    if (member.id !== memberId) {
      return member;
    }
    return { ...member, role };
  });
}

/** You leave a team from its settings, never by removing yourself from the list. */
function removalOf(member: Member, remove: () => void) {
  if (member.isYou) {
    return undefined;
  }
  return remove;
}

function managerCountOf(members: Member[]) {
  return members.filter((member) => member.role === 'manager').length;
}

type MemberRowProps = {
  member: Member;
  isLastManager: boolean;
  onRoleChange: (memberId: string, role: Role) => void;
  onRemove: (memberId: string) => void;
};

function MemberRow({
  member,
  isLastManager,
  onRoleChange,
  onRemove,
}: MemberRowProps) {
  const shouldReduceMotion = useReducedMotion();

  function changeRole(role: Role) {
    onRoleChange(member.id, role);
  }

  function remove() {
    onRemove(member.id);
  }

  return (
    <motion.li
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <div className='flex items-center gap-3 py-2'>
        <PresenceAvatar member={member} size='sm' />
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-1.5 text-[13px] leading-5 font-medium'>
            <span className='truncate'>{member.name}</span>
            {member.isYou && <Badge variant='secondary'>You</Badge>}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {member.email}
          </p>
        </div>
        <RoleMenu
          role={member.role}
          memberName={member.name}
          isLastManager={isLastManager}
          onChange={changeRole}
          onRemove={removalOf(member, remove)}
          trigger='text'
        />
      </div>
    </motion.li>
  );
}

function InvitationRow({
  invitation,
  onRevoke,
}: {
  invitation: Invitation;
  onRevoke: (invitationId: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.li
      variants={rowCollapseOf(shouldReduceMotion)}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='overflow-hidden'
    >
      <div className='flex items-center gap-3 py-2'>
        <span className='hairline-border text-muted-foreground border-foreground/25 flex size-7 shrink-0 items-center justify-center rounded-full border-dashed'>
          <MailIcon className='size-3.5' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[13px] leading-5 font-medium'>
            {invitation.email}
          </p>
          <p className='text-muted-foreground truncate text-xs'>
            {invitation.sentLabel}
          </p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          aria-label={`Revoke the invite to ${invitation.email}`}
          onClick={() => onRevoke(invitation.id)}
          className='text-muted-foreground'
        >
          <XIcon />
          Revoke
        </Button>
      </div>
    </motion.li>
  );
}

export default function Teams04() {
  const titleId = useId();
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [invitations, setInvitations] = useState(INITIAL_INVITATIONS);
  const managerCount = managerCountOf(members);
  const hasOneManager = managerCount === 1;

  function changeRole(memberId: string, role: Role) {
    setMembers((current) => withRole(current, memberId, role));
  }

  function remove(memberId: string) {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  }

  function revoke(invitationId: string) {
    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== invitationId)
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border w-full max-w-[30rem] rounded-xl px-4 pt-3.5 pb-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex items-baseline justify-between gap-3 pb-1'>
        <h3 id={titleId} className='text-sm font-medium'>
          Members of Atlas Redesign
        </h3>
        <p className='text-muted-foreground flex gap-1 text-xs'>
          <SlidingCount value={members.length} format={memberCountLabelOf} />
          <span aria-hidden='true'>·</span>
          <SlidingCount value={invitations.length} format={invitedLabelOf} />
        </p>
      </header>
      <ul aria-label='Members'>
        <AnimatePresence initial={false}>
          {members.map((member) => {
            const isManager = member.role === 'manager';
            const isLastManager = isManager && hasOneManager;
            return (
              <MemberRow
                key={member.id}
                member={member}
                isLastManager={isLastManager}
                onRoleChange={changeRole}
                onRemove={remove}
              />
            );
          })}
          {invitations.map((invitation) => (
            <InvitationRow
              key={invitation.id}
              invitation={invitation}
              onRevoke={revoke}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
