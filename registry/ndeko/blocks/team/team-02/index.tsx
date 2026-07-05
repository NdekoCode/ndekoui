'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';

import {
  INVITATIONS,
  MEMBERS,
  OPEN_TASKS,
  TEAM_NAME,
  type Invitation,
  type Member,
  type MemberTask,
  type Role,
  type StatusId,
} from './data';
import { InvitationRow } from './invitation-row';
import { InvitePopover } from './invite-popover';
import { TABLE_GRID, totalTodayOf, workedTodayOf } from './member-parts';
import { MemberRow, type MemberActions } from './member-row';

type SortKey = 'team' | 'name' | 'worked' | 'estimate' | 'total';

type SortDirection = 'ascending' | 'descending';

type Sort = { key: SortKey; direction: SortDirection };

type Column = {
  id: string;
  label: string;
  sortKey: SortKey | null;
  className: string;
};

const DEFAULT_SORT: Sort = { key: 'team', direction: 'ascending' };

const COLUMNS: Column[] = [
  {
    id: 'member',
    label: 'Member',
    sortKey: 'name',
    className: 'justify-start',
  },
  {
    id: 'task',
    label: 'Current task',
    sortKey: null,
    className: 'hairline-l hidden md:flex justify-start',
  },
  {
    id: 'worked',
    label: 'Worked today',
    sortKey: 'worked',
    className: 'hairline-l hidden xl:flex justify-center',
  },
  {
    id: 'estimate',
    label: 'Estimate',
    sortKey: 'estimate',
    className: 'hairline-l hidden xl:flex justify-center',
  },
  {
    id: 'total',
    label: 'Total today',
    sortKey: 'total',
    className: 'md:hairline-l justify-end md:justify-center',
  },
];

const SORT_GLYPH_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const SORT_GLYPH: Variants = {
  ascending: { rotate: 180 },
  descending: { rotate: 0 },
};

function countLabel(count: number, singular: string, plural: string) {
  if (count === 1) {
    return `1 ${singular}`;
  }
  return `${count} ${plural}`;
}

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query);
}

function figureOf(member: Member, key: SortKey) {
  if (key === 'worked') {
    return workedTodayOf(member);
  }
  if (key === 'estimate') {
    return member.estimateMinutes;
  }
  return totalTodayOf(member);
}

function compareMembers(first: Member, second: Member, sort: Sort) {
  let order = 0;
  if (sort.key === 'name') {
    order = first.name.localeCompare(second.name);
  } else {
    order = figureOf(first, sort.key) - figureOf(second, sort.key);
  }
  if (sort.direction === 'descending') {
    return -order;
  }
  return order;
}

function sortedMembers(members: Member[], sort: Sort) {
  if (sort.key === 'team') {
    return members;
  }
  const copy = [...members];
  copy.sort((first, second) => compareMembers(first, second, sort));
  return copy;
}

function firstDirectionOf(key: SortKey): SortDirection {
  if (key === 'name') {
    return 'ascending';
  }
  return 'descending';
}

function flipped(direction: SortDirection): SortDirection {
  if (direction === 'ascending') {
    return 'descending';
  }
  return 'ascending';
}

function nextSort(current: Sort, key: SortKey): Sort {
  if (current.key === key) {
    return { key, direction: flipped(current.direction) };
  }
  return { key, direction: firstDirectionOf(key) };
}

function ariaSortOf(sort: Sort, key: SortKey | null) {
  if (!key) {
    return undefined;
  }
  if (sort.key === key) {
    return sort.direction;
  }
  return 'none';
}

function updateMember(
  members: Member[],
  memberId: string,
  change: (member: Member) => Member
) {
  return members.map((member) => {
    if (member.id !== memberId) {
      return member;
    }
    return change(member);
  });
}

function withAddedTime(member: Member, minutes: number): Member {
  const task = member.task;
  if (!task) {
    return member;
  }
  const hasEntry = member.activity.some((entry) => entry.taskId === task.id);
  if (!hasEntry) {
    const entry = {
      taskId: task.id,
      number: task.number,
      title: task.title,
      minutes,
    };
    return { ...member, activity: [entry, ...member.activity] };
  }
  const activity = member.activity.map((entry) => {
    if (entry.taskId !== task.id) {
      return entry;
    }
    return { ...entry, minutes: entry.minutes + minutes };
  });
  return { ...member, activity };
}

function SortGlyph({ sort, columnKey }: { sort: Sort; columnKey: SortKey }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const isSorted = sort.key === columnKey;
  let transition = SORT_GLYPH_TRANSITION;
  if (shouldReduceMotion) {
    transition = { duration: 0 };
  }

  if (!isSorted) {
    return (
      <ChevronsUpDownIcon className='size-3 opacity-0 transition-opacity duration-150 group-hover/sort:opacity-100' />
    );
  }
  return (
    <motion.span
      className='flex'
      variants={SORT_GLYPH}
      initial={false}
      animate={sort.direction}
      transition={transition}
    >
      <ChevronDownIcon className='text-foreground size-3' />
    </motion.span>
  );
}

function HeaderRow({
  sort,
  onSort,
}: {
  sort: Sort;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div
      role='row'
      className={cn(
        TABLE_GRID,
        'hairline-b border-border text-muted-foreground h-9 text-xs font-medium'
      )}
    >
      {COLUMNS.map((column) => {
        const sortKey = column.sortKey;

        function sortByColumn() {
          if (sortKey) {
            onSort(sortKey);
          }
        }

        return (
          <div
            key={column.id}
            role='columnheader'
            aria-sort={ariaSortOf(sort, sortKey)}
            className={cn(
              'border-border flex items-center px-4',
              column.className
            )}
          >
            {sortKey && (
              <button
                type='button'
                onClick={sortByColumn}
                className='group/sort hover:text-foreground focus-visible:ring-ring/25 -mx-1 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 outline-none focus-visible:ring-[3px]'
              >
                {column.label}
                <SortGlyph sort={sort} columnKey={sortKey} />
              </button>
            )}
            {!sortKey && column.label}
          </div>
        );
      })}
      <div
        role='columnheader'
        className='md:hairline-l border-border flex items-center justify-center'
      >
        <span className='sr-only'>Actions</span>
      </div>
    </div>
  );
}

export default function Team02() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [invitations, setInvitations] = useState<Invitation[]>(INVITATIONS);
  const [openTasks, setOpenTasks] = useState<MemberTask[]>(OPEN_TASKS);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const matchingMembers = members.filter((member) =>
    matchesQuery(member.name, normalizedQuery)
  );
  const visibleMembers = sortedMembers(matchingMembers, sort);
  const visibleInvitations = invitations.filter((invitation) =>
    matchesQuery(invitation.email, normalizedQuery)
  );
  const visibleCount = visibleMembers.length + visibleInvitations.length;
  const isEmptySearch = hasQuery && visibleCount === 0;
  const isSorted = sort.key !== 'team';
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

  function returnTask(task: MemberTask | null) {
    if (!task) {
      return;
    }
    setOpenTasks((previous) => [task, ...previous]);
  }

  function taskOf(memberId: string) {
    const member = members.find((candidate) => candidate.id === memberId);
    if (!member) {
      return null;
    }
    return member.task;
  }

  const actions: MemberActions = {
    assignTask(memberId, task) {
      setOpenTasks((previous) =>
        previous.filter((candidate) => candidate.id !== task.id)
      );
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({
          ...member,
          task,
          estimateMinutes: 0,
        }))
      );
    },
    unassignTask(memberId) {
      returnTask(taskOf(memberId));
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({
          ...member,
          task: null,
          estimateMinutes: 0,
        }))
      );
    },
    changeStatus(memberId, status: StatusId) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => {
          if (!member.task) {
            return member;
          }
          return { ...member, task: { ...member.task, status } };
        })
      );
    },
    changeEstimate(memberId, minutes) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({
          ...member,
          estimateMinutes: minutes,
        }))
      );
    },
    addTime(memberId, minutes) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) =>
          withAddedTime(member, minutes)
        )
      );
    },
    changeRole(memberId, role: Role) {
      setMembers((previous) =>
        updateMember(previous, memberId, (member) => ({ ...member, role }))
      );
    },
    removeMember(memberId) {
      returnTask(taskOf(memberId));
      setMembers((previous) =>
        previous.filter((candidate) => candidate.id !== memberId)
      );
    },
  };

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearQuery() {
    setQuery('');
  }

  function sortBy(key: SortKey) {
    setSort((current) => nextSort(current, key));
  }

  function resetSort() {
    setSort(DEFAULT_SORT);
  }

  function invite(email: string, role: Role) {
    const invitation: Invitation = {
      id: `invite-${email}`,
      email,
      role,
      sentLabel: 'Sent just now',
    };
    setInvitations((previous) => [...previous, invitation]);
  }

  function resendInvitation(invitationId: string) {
    setInvitations((previous) =>
      previous.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }
        return { ...invitation, sentLabel: 'Sent again just now' };
      })
    );
  }

  function revokeInvitation(invitationId: string) {
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
            {`${memberCountText} · ${trackingText}`}
          </span>
        </div>
        <div className='flex w-full items-center gap-2 sm:ml-auto sm:w-auto'>
          {isSorted && (
            <Button
              variant='ghost'
              onClick={resetSort}
              className='hidden sm:inline-flex'
            >
              Team order
            </Button>
          )}
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
            onInvite={invite}
          />
        </div>
      </div>
      <div className='px-4 pt-3 pb-6 md:px-6'>
        <div
          role='table'
          aria-label={`Members of the ${TEAM_NAME} team`}
          className='bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          <div role='rowgroup'>
            <HeaderRow sort={sort} onSort={sortBy} />
          </div>
          <div role='rowgroup' className='hairline-divide-y divide-border'>
            <AnimatePresence initial={false}>
              {visibleMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  openTasks={openTasks}
                  actions={actions}
                />
              ))}
              {visibleInvitations.map((invitation) => (
                <InvitationRow
                  key={invitation.id}
                  invitation={invitation}
                  onResend={resendInvitation}
                  onRevoke={revokeInvitation}
                />
              ))}
            </AnimatePresence>
          </div>
          {isEmptySearch && (
            <div className='flex flex-col items-center gap-3 px-4 py-12 text-center'>
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
        </div>
      </div>
    </div>
  );
}
