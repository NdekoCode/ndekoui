'use client';

import { seriesColorOf } from '@/registry/ndeko/lib/agent-run';
import { SearchIcon, ShieldCheckIcon } from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/registry/ndeko/ui/command';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { MeshTile } from '@/registry/ndeko/ui/mesh-tile';

import { AGENTS, AGENT_ORDER, type NavGroup, type PageId } from './data';

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label='Search'
        onClick={onOpen}
        className='text-muted-foreground @2xl/app:hidden'
      >
        <SearchIcon />
      </Button>
      <button
        type='button'
        onClick={onOpen}
        className={cn(
          CONTROL_RECIPE,
          'text-muted-foreground hidden h-8 w-56 cursor-pointer items-center gap-2 px-2.5 text-start @2xl/app:flex'
        )}
      >
        <SearchIcon className='size-4 shrink-0' />
        <span className='min-w-0 flex-1 truncate'>Search</span>
        <Kbd>⌘K</Kbd>
      </button>
    </>
  );
}

type SearchPaletteProps = {
  open: boolean;
  groups: NavGroup[];
  canReview: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (pageId: PageId) => void;
  onReview: () => void;
};

export function SearchPalette({
  open,
  groups,
  canReview,
  onOpenChange,
  onNavigate,
  onReview,
}: SearchPaletteProps) {
  function close() {
    onOpenChange(false);
  }

  function review() {
    close();
    onReview();
  }

  function goToAgents() {
    close();
    onNavigate('agents');
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Search'
      description='Go to a page, an agent or a request'
    >
      <CommandInput placeholder='Go to a page, an agent or a request' />
      <CommandList>
        <CommandEmpty>Nothing matches. Try the name of an agent.</CommandEmpty>
        {canReview && (
          <CommandGroup heading='Actions'>
            <CommandItem onSelect={review}>
              <ShieldCheckIcon />
              Review requests
            </CommandItem>
          </CommandGroup>
        )}
        {groups.map((group) => (
          <CommandGroup key={group.id} heading={group.label ?? 'Pages'}>
            {group.items.map((item) => {
              const ItemIcon = item.icon;

              function goToPage() {
                close();
                onNavigate(item.id);
              }

              return (
                <CommandItem
                  key={item.id}
                  value={`${group.id} ${item.label}`}
                  onSelect={goToPage}
                >
                  <ItemIcon />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        <CommandGroup heading='Agents'>
          {AGENT_ORDER.map((agentId) => {
            const agent = AGENTS[agentId];

            return (
              <CommandItem
                key={agent.id}
                value={`agent ${agent.name}`}
                onSelect={goToAgents}
              >
                <MeshTile
                  seed={agent.name}
                  color={seriesColorOf(agent.series)}
                  size='sm'
                />
                {agent.name}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
