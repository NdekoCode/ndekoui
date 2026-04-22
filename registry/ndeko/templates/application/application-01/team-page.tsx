'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useState } from 'react';

import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import { TEAM_NAME } from './data';
import { InvitationRow } from './invitation-row';
import { InvitePopover } from './invite-popover';
import { MemberCard } from './member-card';
import { MEMBER_GRID } from './member-parts';
import type { TeamState } from './use-team';

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const ITEM_PRESENCE: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    transition: PRESENCE_OUT,
  },
  shown: {
    height: 'auto',
    opacity: 1,
    transition: PRESENCE_IN,
    transitionEnd: { overflow: 'visible' },
  },
};

const ITEM_FADE: Variants = {
  hidden: { opacity: 0, transition: PRESENCE_OUT },
  shown: { opacity: 1, transition: PRESENCE_IN },
};

const COLUMN_LABELS = [
  { id: 'member', label: 'Member', isFigure: false },
  { id: 'task', label: 'Current task', isFigure: false },
  { id: 'worked', label: 'Worked today', isFigure: true },
  { id: 'estimate', label: 'Estimate', isFigure: true },
  { id: 'total', label: 'Total today', isFigure: true },
];

function itemVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return ITEM_FADE;
  }
  return ITEM_PRESENCE;
}

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

function ColumnLabels() {
  return (
    <div
      aria-hidden='true'
      className={cn(
        MEMBER_GRID,
        'text-muted-foreground hidden h-9 text-xs font-medium xl:grid'
      )}
    >
      {COLUMN_LABELS.map((column, index) => {
        const isFirst = index === 0;

        return (
          <span
            key={column.id}
            className={cn(
              'border-border flex items-center px-4',
              !isFirst && 'hairline-l',
              column.isFigure && 'justify-center'
            )}
          >
            {column.label}
          </span>
        );
      })}
      <span className='hairline-l border-border' />
    </div>
  );
}

type TeamPageProps = {
  team: TeamState;
};

export function TeamPage({ team }: TeamPageProps) {
  const { members, invitations, openTasks, actions } = team;
  const [query, setQuery] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const itemVariants = itemVariantsOf(shouldReduceMotion);

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const visibleMembers = members.filter((member) =>
    matchesQuery(member.name, normalizedQuery)
  );
  const visibleInvitations = invitations.filter((invitation) =>
    matchesQuery(invitation.email, normalizedQuery)
  );
  const visibleCount = visibleMembers.length + visibleInvitations.length;
  const isEmptySearch = hasQuery && visibleCount === 0;
  const trackingCount = members.filter(
    (member) => member.presence === 'tracking'
  ).length;
  const memberCountText = countLabel(members.length, 'member', 'members');
  const trackingText = countLabel(
    trackingCount,
    'person tracking time',
    'people tracking time'
  );
  const takenEmails = invitations.map((invitation) => invitation.email);

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearQuery() {
    setQuery('');
  }

  return (
    <div className='flex min-h-0 w-full flex-1 flex-col overflow-y-auto'>
      <div className='hairline-b border-border flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6'>
        <div className='flex min-w-0 items-baseline gap-2'>
          <h1 className='truncate text-lg font-semibold'>{`${TEAM_NAME} team`}</h1>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {`${memberCountText} · ${trackingText}`}
          </span>
        </div>
        <div className='flex w-full items-center gap-2 sm:ml-auto sm:w-auto'>
          <div className='relative min-w-0 flex-1 sm:w-56 sm:flex-none'>
            <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={query}
              placeholder='Search people'
              aria-label='Search members and invitations'
              onChange={changeQuery}
              className='pl-8'
            />
          </div>
          <InvitePopover
            teamName={TEAM_NAME}
            takenEmails={takenEmails}
            onInvite={team.invite}
          />
        </div>
      </div>
      <div className='flex flex-col gap-3 px-4 pt-3 pb-6 md:px-6'>
        <ColumnLabels />
        {isEmptySearch && (
          <div className='hairline-border border-foreground/20 flex flex-col items-center gap-3 rounded-xl border-dashed px-4 py-12 text-center'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm font-medium'>
                {`No member or invitation matches “${query.trim()}”`}
              </p>
              <p className='text-muted-foreground text-[13px]'>
                Search by first name, last name or e-mail address
              </p>
            </div>
            <Button variant='outline' onClick={clearQuery}>
              <XIcon />
              Clear search
            </Button>
          </div>
        )}
        <ul className='flex flex-col'>
          <AnimatePresence initial={false}>
            {visibleMembers.map((member) => (
              <motion.li
                key={member.id}
                variants={itemVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <div className='pb-2'>
                  <MemberCard
                    member={member}
                    openTasks={openTasks}
                    actions={actions}
                  />
                </div>
              </motion.li>
            ))}
            {visibleInvitations.map((invitation) => (
              <motion.li
                key={invitation.id}
                variants={itemVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <div className='pb-2'>
                  <InvitationRow
                    invitation={invitation}
                    onResend={team.resendInvitation}
                    onRevoke={team.revokeInvitation}
                  />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
