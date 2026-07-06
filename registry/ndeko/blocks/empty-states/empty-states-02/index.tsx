'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { ListFilterIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';

import {
  INITIAL_QUERY,
  INITIAL_ROLES,
  MEMBERS,
  ROLES,
  TEAM_NAME,
  type Member,
  type RoleId,
} from './data';
import { fadePresence } from './motion-parts';

function roleNameOf(roleId: RoleId) {
  const role = ROLES.find((item) => item.id === roleId);
  if (role) {
    return role.name;
  }
  return roleId;
}

function matchesQuery(member: Member, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const name = member.name.toLowerCase();
  const email = member.email.toLowerCase();
  return name.includes(needle) || email.includes(needle);
}

function matchesRoles(member: Member, roleIds: RoleId[]) {
  if (roleIds.length === 0) {
    return true;
  }
  return roleIds.includes(member.roleId);
}

function peopleCountOf(count: number) {
  if (count === 1) {
    return '1 person';
  }
  return `${count} people`;
}

function reachOf(total: number) {
  if (total === 1) {
    return 'the one person';
  }
  return `all ${total} people`;
}

function rolePhraseOf(roleIds: RoleId[]) {
  const names = roleIds.map(roleNameOf);
  const joined = names.join(' or ');
  if (names.length === 1) {
    return `the ${joined} role`;
  }
  return `the ${joined} roles`;
}

function emptyLineOf(query: string, roleIds: RoleId[], total: number) {
  const trimmed = query.trim();
  const hasRoles = roleIds.length > 0;
  const reach = reachOf(total);
  if (!trimmed) {
    return `No one has ${rolePhraseOf(roleIds)}, clear the filter to see ${reach}`;
  }
  if (!hasRoles) {
    return `No one matches “${trimmed}”, clear the search to see ${reach}`;
  }
  return `No one matching “${trimmed}” has ${rolePhraseOf(roleIds)}, clear the filters to see ${reach}`;
}

function toggledRoles(roleIds: RoleId[], roleId: RoleId, isIncluded: boolean) {
  const withoutRole = roleIds.filter((current) => current !== roleId);
  if (isIncluded) {
    return [...withoutRole, roleId];
  }
  return withoutRole;
}

function MemberRow({ member }: { member: Member }) {
  return (
    <li className='flex h-14 items-center gap-3 px-3'>
      <Avatar className='size-8' seed={member.name} />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-[13px] font-medium'>{member.name}</p>
        <p className='text-muted-foreground truncate text-xs'>{member.email}</p>
      </div>
      <Badge variant='outline'>{roleNameOf(member.roleId)}</Badge>
    </li>
  );
}

type NoMatchProps = {
  query: string;
  roleIds: RoleId[];
  total: number;
  onClear: () => void;
};

function NoMatch({ query, roleIds, total, onClear }: NoMatchProps) {
  return (
    <div className='flex flex-col items-center px-6 py-12 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <SearchIcon />
      </span>
      <p className='mt-4 text-sm font-medium'>No people match</p>
      <p className='text-muted-foreground mt-1 max-w-sm text-[13px] text-balance'>
        {emptyLineOf(query, roleIds, total)}
      </p>
      <Button variant='outline' onClick={onClear} className='mt-4'>
        <XIcon />
        Clear filters
      </Button>
    </div>
  );
}

export default function EmptyStates02() {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [roleIds, setRoleIds] = useState<RoleId[]>(INITIAL_ROLES);
  const shown = MEMBERS.filter(
    (member) => matchesQuery(member, query) && matchesRoles(member, roleIds)
  );
  const hasMatches = shown.length > 0;
  const hasQuery = query.length > 0;
  const roleCount = roleIds.length;
  const hasRoles = roleCount > 0;

  function clearAll() {
    setQuery('');
    setRoleIds([]);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setQuery('');
    }
  }

  function toggleRole(roleId: RoleId, isIncluded: boolean) {
    setRoleIds((current) => toggledRoles(current, roleId, isIncluded));
  }

  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-8 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='text-sm font-semibold'>People</h1>
        <p className='text-muted-foreground text-xs'>
          {peopleCountOf(MEMBERS.length)} in {TEAM_NAME}
        </p>
        <div className='mt-4 flex items-center gap-2'>
          <div className='relative min-w-0 flex-1'>
            <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder='Search by name or email'
              aria-label='Search by name or email'
              className='ps-8 pe-9'
            />
            {hasQuery && (
              <button
                type='button'
                onClick={() => setQuery('')}
                aria-label='Clear search'
                className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute end-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
              >
                <XIcon className='size-3.5' />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant='outline' />}>
              <ListFilterIcon />
              Role
              {hasRoles && (
                <span className='bg-primary/10 text-primary-ink -me-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs'>
                  <MotionNumber value={roleCount} />
                  <span className='sr-only'> selected</span>
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              {ROLES.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role.id}
                  checked={roleIds.includes(role.id)}
                  onCheckedChange={(checked) => toggleRole(role.id, checked)}
                >
                  {role.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!hasRoles}
                onClick={() => setRoleIds([])}
              >
                <XIcon />
                Clear filter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <AnimatedSize className='mt-4'>
          <div className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              {hasMatches && (
                <motion.ul
                  key='list'
                  aria-label='People'
                  {...fadePresence()}
                  className='bg-card hairline-ring ring-border hairline-divide-y divide-border overflow-clip rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
                >
                  {shown.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </motion.ul>
              )}
              {!hasMatches && (
                <motion.div key='no-match' {...fadePresence()}>
                  <NoMatch
                    query={query}
                    roleIds={roleIds}
                    total={MEMBERS.length}
                    onClear={clearAll}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSize>
      </div>
    </div>
  );
}
