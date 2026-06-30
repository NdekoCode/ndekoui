'use client';

import { ChevronDownIcon, UserMinusIcon } from '@/registry/ndeko/lib/icons';
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

import { MorphLabel } from './morph-label';
import { ROLE_META, ROLE_ORDER, isRole, type Role } from './people';

type RoleTrigger = 'chip' | 'text';

const CHIP_TRIGGER =
  'chip-3d inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25';

const TEXT_TRIGGER =
  'inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-[13px] whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 data-popup-open:text-foreground';

function triggerClassOf(trigger: RoleTrigger) {
  if (trigger === 'chip') {
    return CHIP_TRIGGER;
  }
  return TEXT_TRIGGER;
}

function triggerStyleOf(trigger: RoleTrigger, role: Role) {
  if (trigger === 'chip') {
    return { '--chip': ROLE_META[role].color } as React.CSSProperties;
  }
  return undefined;
}

function isLockedOption(option: Role, isLastManager: boolean) {
  const leavesManagerRole = option !== 'manager';
  return isLastManager && leavesManagerRole;
}

type RoleMenuProps = {
  role: Role;
  memberName: string;
  onChange: (role: Role) => void;
  /** The only manager of the team cannot step down: a team keeps one. */
  isLastManager?: boolean;
  /** Adds Remove from team at the end of the menu. */
  onRemove?: () => void;
  trigger?: RoleTrigger;
};

/** The role of a member as a menu: the trigger shows it, the rows explain each one. */
export function RoleMenu({
  role,
  memberName,
  onChange,
  isLastManager = false,
  onRemove,
  trigger = 'chip',
}: RoleMenuProps) {
  const meta = ROLE_META[role];
  const canRemove = onRemove !== undefined;
  const triggerLabel = `Role of ${memberName}: ${meta.label}. Change role`;

  function changeRole(value: unknown) {
    if (isRole(value)) {
      onChange(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={triggerLabel}
        style={triggerStyleOf(trigger, role)}
        className={triggerClassOf(trigger)}
      >
        <MorphLabel value={role}>{meta.label}</MorphLabel>
        <ChevronDownIcon className='size-3.5 opacity-70' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72'>
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>Role of {memberName}</DropdownMenuGroupLabel>
          <DropdownMenuRadioGroup value={role} onValueChange={changeRole}>
            {ROLE_ORDER.map((option) => {
              const optionMeta = ROLE_META[option];
              const isLocked = isLockedOption(option, isLastManager);
              return (
                <DropdownMenuRadioItem
                  key={option}
                  value={option}
                  disabled={isLocked}
                  closeOnClick
                  className='h-auto items-start py-2'
                >
                  <span className='flex flex-col gap-0.5'>
                    <span>{optionMeta.label}</span>
                    <span className='text-muted-foreground text-xs'>
                      {optionMeta.description}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {isLastManager && (
          <p className='text-muted-foreground px-2 pt-1 pb-1.5 text-xs'>
            A team keeps at least one manager. Make someone else a manager first
          </p>
        )}
        {canRemove && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={onRemove}>
              <UserMinusIcon />
              Remove from team
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
