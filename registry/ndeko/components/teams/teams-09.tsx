'use client';

import { motion, useReducedMotion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { CircleAlertIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/ndeko/ui/command';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

import { MorphLabel } from './_parts/morph-label';
import { TeamTile } from './_parts/team-tile';
import { TEAMS, memberCountLabelOf } from './_parts/teams';

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };
const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function teamById(teamId: string) {
  const found = TEAMS.find((team) => team.id === teamId);
  if (found) {
    return found;
  }
  return TEAMS[0];
}

export default function Teams09() {
  const shouldReduceMotion = useReducedMotion();
  const markId = useId();
  const [query, setQuery] = useState('');
  const [teamId, setTeamId] = useState(TEAMS[0].id);
  const current = teamById(teamId);
  const travel = travelOf(shouldReduceMotion);

  function clearSearch() {
    setQuery('');
  }

  return (
    <Command
      label='Move FRN-148 to a team'
      className='bg-card hairline-ring ring-border h-auto w-full max-w-[22rem] shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='flex items-center gap-2 px-3 pt-3 pb-2 text-xs'>
        <span
          role='img'
          aria-label='Bug'
          className='gem-plate inline-flex size-4 shrink-0 items-center justify-center rounded-[5px] [--gem:var(--destructive)]'
        >
          <CircleAlertIcon strokeWidth={2.5} className='size-2.5' />
        </span>
        <span className='text-muted-foreground tabular-nums'>FRN-148</span>
        <span className='text-muted-foreground'>in</span>
        <span aria-live='polite' className='font-medium'>
          <MorphLabel value={current.id}>{current.name}</MorphLabel>
        </span>
      </div>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder='Move to a team'
        aria-label='Find a team'
      />
      <AnimatedSize>
        <CommandList className='max-h-72'>
          <CommandEmpty className='flex flex-col items-center gap-2 py-6'>
            <span>No team matches “{query}”</span>
            <Button size='sm' variant='outline' onClick={clearSearch}>
              Clear search
            </Button>
          </CommandEmpty>
          <CommandGroup heading='Teams'>
            {TEAMS.map((team) => {
              const isCurrent = team.id === teamId;
              return (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => setTeamId(team.id)}
                  aria-current={isCurrent}
                  className='h-9'
                >
                  <TeamTile initials={team.initials} color={team.color} />
                  <span className='min-w-0 flex-1 truncate'>{team.name}</span>
                  <span className='text-muted-foreground text-xs tabular-nums'>
                    {memberCountLabelOf(team.memberCount)}
                  </span>
                  <span className='flex w-[18px] justify-end'>
                    {isCurrent && (
                      <motion.span
                        layoutId={markId}
                        transition={travel}
                        className='flex'
                      >
                        <SelectedMark label='Current team' />
                      </motion.span>
                    )}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </AnimatedSize>
    </Command>
  );
}
