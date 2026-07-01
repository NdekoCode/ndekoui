'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { MailIcon, UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';

import {
  CURRENT_USER_NAME,
  INVITATIONS,
  MEMBERS,
  ROLE_LABEL,
  TEAM_NAME,
  type Invitation,
  type Role,
} from './data';
import { InvitationList, LIST_SURFACE } from './invitation-list';
import { InviteSheet, type InviteTab } from './invite-sheet';

const SWITCH_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const SWITCH_OUT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function invitationOf(email: string, role: Role): Invitation {
  return {
    id: `invite-${email}`,
    email,
    role,
    invitedBy: CURRENT_USER_NAME,
    sentLabel: 'Sent just now',
  };
}

export default function Team03() {
  const [invitations, setInvitations] = useState<Invitation[]>(INVITATIONS);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<InviteTab>('invite');
  const pendingHeadingId = useId();
  const membersHeadingId = useId();
  const hasInvitations = invitations.length > 0;
  const memberText = countLabel(MEMBERS.length, 'member', 'members');
  const pendingText = countLabel(
    invitations.length,
    'pending invitation',
    'pending invitations'
  );

  function openInvite() {
    setSheetTab('invite');
    setIsSheetOpen(true);
  }

  function openInvited() {
    setSheetTab('invited');
    setIsSheetOpen(true);
  }

  function send(emails: string[], role: Role) {
    const created = emails.map((email) => invitationOf(email, role));
    setInvitations((previous) => [...created, ...previous]);
  }

  function resend(invitationId: string) {
    setInvitations((previous) =>
      previous.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }
        return { ...invitation, sentLabel: 'Sent again just now' };
      })
    );
  }

  function revoke(invitationId: string) {
    setInvitations((previous) =>
      previous.filter((invitation) => invitation.id !== invitationId)
    );
  }

  return (
    <div className='bg-background text-foreground flex min-h-dvh w-full flex-col'>
      <div className='hairline-b border-border flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h1 className='truncate text-lg font-semibold'>{`${TEAM_NAME} team`}</h1>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {`${memberText} · ${pendingText}`}
          </span>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={openInvited}
            className='hidden sm:inline-flex'
          >
            <MailIcon />
            Invited
          </Button>
          <Button onClick={openInvite}>
            <UserRoundPlusIcon />
            Invite people
          </Button>
        </div>
      </div>
      <div className='mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-6 md:px-6'>
        <section
          aria-labelledby={pendingHeadingId}
          className='flex flex-col gap-3'
        >
          <div className='flex items-baseline gap-2'>
            <h2 id={pendingHeadingId} className='text-sm font-medium'>
              Pending invitations
            </h2>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {invitations.length}
            </span>
          </div>
          <AnimatedSize>
            <div className='relative'>
              <AnimatePresence mode='popLayout' initial={false}>
                {hasInvitations && (
                  <motion.div
                    key='list'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: SWITCH_IN }}
                    exit={{ opacity: 0, transition: SWITCH_OUT }}
                  >
                    <InvitationList
                      invitations={invitations}
                      onResend={resend}
                      onRevoke={revoke}
                    />
                  </motion.div>
                )}
                {!hasInvitations && (
                  <motion.div
                    key='empty'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: SWITCH_IN }}
                    exit={{ opacity: 0, transition: SWITCH_OUT }}
                    className='hairline-border border-foreground/20 flex flex-col items-center gap-3 rounded-xl border-dashed px-4 py-10 text-center'
                  >
                    <div className='flex flex-col gap-1'>
                      <p className='text-sm font-medium'>
                        No pending invitation
                      </p>
                      <p className='text-muted-foreground text-[13px]'>
                        Everyone you invited has joined or the invitation was
                        revoked
                      </p>
                    </div>
                    <Button variant='outline' onClick={openInvite}>
                      Invite people
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnimatedSize>
        </section>
        <section
          aria-labelledby={membersHeadingId}
          className='flex flex-col gap-3'
        >
          <div className='flex items-baseline gap-2'>
            <h2 id={membersHeadingId} className='text-sm font-medium'>
              Members
            </h2>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {MEMBERS.length}
            </span>
          </div>
          <ul className={LIST_SURFACE}>
            {MEMBERS.map((member) => (
              <li
                key={member.id}
                className='flex min-h-14 items-center gap-3 px-3 py-2.5'
              >
                <Avatar>
                  {member.avatar && <AvatarImage src={member.avatar} alt='' />}
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
                <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <p className='truncate text-[13px] font-medium'>
                    {member.name}
                  </p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {member.email}
                  </p>
                </div>
                <Badge variant='secondary' className='text-muted-foreground'>
                  {ROLE_LABEL[member.role]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <InviteSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        tab={sheetTab}
        onTabChange={setSheetTab}
        teamName={TEAM_NAME}
        members={MEMBERS}
        invitations={invitations}
        onSend={send}
        onResend={resend}
        onRevoke={revoke}
      />
    </div>
  );
}
