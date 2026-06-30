'use client';

import { useState } from 'react';

import {
  ChevronsUpDownIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from '@/registry/ndeko/lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { MorphLabel } from './_parts/morph-label';
import { SlidingCount } from './_parts/sliding-count';
import { Swap } from './_parts/swap';
import { TeamTile } from './_parts/team-tile';
import { TEAMS, memberCountLabelOf, type Team } from './_parts/teams';

const TRIGGER =
  'inline-flex h-8 max-w-full cursor-pointer items-center gap-2 rounded-full bg-card ps-1 pe-2.5 text-[13px] font-medium outline-none hairline-ring ring-foreground/12 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-colors duration-150 hover:bg-foreground/[0.03] focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/[0.04] dark:bg-foreground/[0.04]';

function countOf(count: number) {
  return String(count);
}

function isTeamId(value: unknown): value is string {
  return TEAMS.some((team) => team.id === value);
}

function triggerLabelOf(team: Team) {
  const members = memberCountLabelOf(team.memberCount);
  return `Team: ${team.name}, ${members}. Switch team`;
}

function teamById(teamId: string) {
  const found = TEAMS.find((team) => team.id === teamId);
  if (found) {
    return found;
  }
  return TEAMS[0];
}

function TeamRow({ team }: { team: Team }) {
  return (
    <>
      <TeamTile initials={team.initials} color={team.color} />
      <span className='min-w-0 flex-1 truncate'>{team.name}</span>
      <span className='text-muted-foreground text-xs tabular-nums'>
        {team.memberCount}
        <span className='sr-only'> members</span>
      </span>
    </>
  );
}

export default function Teams02() {
  const [currentId, setCurrentId] = useState(TEAMS[0].id);
  const current = teamById(currentId);
  const triggerLabel = triggerLabelOf(current);

  function switchTeam(value: unknown) {
    if (isTeamId(value)) {
      setCurrentId(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={triggerLabel} className={TRIGGER}>
        <Swap swapKey={current.id}>
          <TeamTile initials={current.initials} color={current.color} />
        </Swap>
        <MorphLabel value={current.id}>{current.name}</MorphLabel>
        <SlidingCount
          value={current.memberCount}
          format={countOf}
          className='text-muted-foreground text-xs font-normal'
        />
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5 shrink-0' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-72'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Teams</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={currentId} onValueChange={switchTeam}>
            {TEAMS.map((team) => (
              <DropdownMenuRadioItem
                key={team.id}
                value={team.id}
                closeOnClick
                className='h-9'
              >
                <TeamRow team={team} />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SettingsIcon />
          Settings of {current.name}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <UsersIcon />
          All teams
        </DropdownMenuItem>
        <DropdownMenuItem>
          <PlusIcon />
          Create team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
