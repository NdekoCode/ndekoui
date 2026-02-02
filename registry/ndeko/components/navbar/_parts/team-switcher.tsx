'use client';

import { useState } from 'react';

import { MorphingLabel } from '@/registry/ndeko/components/navbar/_parts/morphing-label';
import { ChevronsUpDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

const GEM_STYLE = { '--gem': 'var(--primary)' } as React.CSSProperties;

function initialOf(team: string) {
  const firstLetter = team.charAt(0);
  return firstLetter.toUpperCase();
}

function TeamMark({ team }: { team: string }) {
  return (
    <span
      aria-hidden='true'
      style={GEM_STYLE}
      className='gem-plate flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold'
    >
      {initialOf(team)}
    </span>
  );
}

type TeamSwitcherProps = {
  teams: string[];
  defaultTeam: string;
};

function TeamSwitcher({ teams, defaultTeam }: TeamSwitcherProps) {
  const [selectedTeam, setSelectedTeam] = useState(defaultTeam);

  function selectTeam(team: string) {
    setSelectedTeam(team);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' className='gap-2 px-1.5' />}
      >
        <TeamMark team={selectedTeam} />
        <MorphingLabel value={selectedTeam}>{selectedTeam}</MorphingLabel>
        <ChevronsUpDownIcon className='text-muted-foreground size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={selectedTeam} onValueChange={selectTeam}>
          {teams.map((team) => (
            <DropdownMenuRadioItem key={team} value={team} closeOnClick>
              <TeamMark team={team} />
              {team}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { TeamSwitcher };
