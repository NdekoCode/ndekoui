'use client';

import { MotionNumber } from '@/components/core/motion-number';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { PlugIcon, WandIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';

import { SKILLS, TOOLS, type SkillId, type ToolId } from './data';

type ToolsMenuProps = {
  toolIds: ToolId[];
  skillIds: SkillId[];
  isPressed: boolean;
  onToggleTool: (id: ToolId) => void;
  onToggleSkill: (id: SkillId) => void;
};

/** The menu belongs to a person. The demonstration switches the tools on, and their chips arrive in the composer. */
export function ToolsMenu({
  toolIds,
  skillIds,
  isPressed,
  onToggleTool,
  onToggleSkill,
}: ToolsMenuProps) {
  const count = toolIds.length + skillIds.length;
  const hasCount = count > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label={`Tools and skills, ${count} on`}
            className={cn(
              'text-muted-foreground gap-1.5 px-2',
              pressedQuietOf(isPressed)
            )}
          />
        }
      >
        <PlugIcon />
        <span className='sr-only @md:not-sr-only'>Tools</span>
        {hasCount && (
          <span className='bg-primary/10 text-primary-ink inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-medium'>
            <MotionNumber value={count} />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='w-64'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Tools</DropdownMenuGroupLabel>
          {TOOLS.map((tool) => (
            <DropdownMenuCheckboxItem
              key={tool.id}
              checked={toolIds.includes(tool.id)}
              onCheckedChange={() => onToggleTool(tool.id)}
            >
              <BrandTile brand={tool.brand} size='sm' />
              {tool.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Skills</DropdownMenuGroupLabel>
          {SKILLS.map((skill) => (
            <DropdownMenuCheckboxItem
              key={skill.id}
              checked={skillIds.includes(skill.id)}
              onCheckedChange={() => onToggleSkill(skill.id)}
              className='h-auto items-start py-1.5'
            >
              <WandIcon className='mt-0.5' />
              <span className='flex min-w-0 flex-col'>
                <span>{skill.name}</span>
                <span className='text-muted-foreground text-xs'>
                  {skill.hint}
                </span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
