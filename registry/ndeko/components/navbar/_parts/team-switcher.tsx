'use client';

import { useState } from 'react';

import { MorphingLabel } from '@/registry/ndeko/components/navbar/_parts/morphing-label';
import { ChevronsUpDownIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

function TeamMark({ team }: { team: string }) {
  return <CompanyMark seed={team} className='size-6 rounded-md' />;
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
