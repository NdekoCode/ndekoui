'use client';

import {
  EyeIcon,
  PencilIcon,
  ShieldCheckIcon,
  UserIcon,
  UserPenIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

export type RoleOption<Value extends string> = {
  value: Value;
  label: string;
  line: string;
  color: string;
  icon: Icon;
};

export type TeamRole = 'member' | 'manager' | 'admin';

export const TEAM_ROLES: RoleOption<TeamRole>[] = [
  {
    value: 'member',
    label: 'Member',
    line: 'Tracks time and works on tasks',
    color: 'var(--info)',
    icon: UserIcon,
  },
  {
    value: 'manager',
    label: 'Manager',
    line: 'Manages the team, its members and its tasks',
    color: 'var(--success)',
    icon: UserPenIcon,
  },
  {
    value: 'admin',
    label: 'Admin',
    line: 'Manages the workspace and its settings',
    color: 'var(--warning)',
    icon: ShieldCheckIcon,
  },
];

export type AccessLevel = 'view' | 'edit' | 'manage';

export const ACCESS_LEVELS: RoleOption<AccessLevel>[] = [
  {
    value: 'view',
    label: 'Can view',
    line: 'Reads tasks, files and comments',
    color: 'var(--muted-foreground)',
    icon: EyeIcon,
  },
  {
    value: 'edit',
    label: 'Can edit',
    line: 'Also creates and changes tasks',
    color: 'var(--info)',
    icon: PencilIcon,
  },
  {
    value: 'manage',
    label: 'Can manage',
    line: 'Also shares the project and changes its settings',
    color: 'var(--primary)',
    icon: ShieldCheckIcon,
  },
];

type RoleSelectProps<Value extends string> = {
  value: Value;
  options: RoleOption<Value>[];
  onValueChange: (value: Value) => void;
  /** Names the select for screen readers, since its trigger shows the value only. */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** A compact role picker that fits in a field or at the end of a row; its menu says what each role can do. */
export function RoleSelect<Value extends string>({
  value,
  options,
  onValueChange,
  label,
  disabled,
  className,
}: RoleSelectProps<Value>) {
  function changeValue(nextValue: unknown) {
    const option = options.find((candidate) => candidate.value === nextValue);
    if (option) {
      onValueChange(option.value);
    }
  }

  return (
    <Select
      items={options}
      value={value}
      disabled={disabled}
      onValueChange={changeValue}
    >
      <SelectTrigger
        size='sm'
        aria-label={label}
        className={cn(
          'text-muted-foreground hover:bg-foreground/5 hover:text-foreground data-popup-open:bg-foreground/5 w-auto min-w-0 shrink-0 gap-1 border-transparent bg-transparent px-2 shadow-none ring-0 dark:bg-transparent',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align='end' className='w-72'>
        {options.map((option) => {
          const RoleGlyph = option.icon;
          const tileStyle = { '--chip': option.color } as React.CSSProperties;

          return (
            <SelectItem
              key={option.value}
              value={option.value}
              className='h-auto py-1.5'
            >
              <span
                style={tileStyle}
                className='chip-3d flex size-7 shrink-0 items-center justify-center rounded-md'
              >
                <RoleGlyph className='size-3.5 text-current' />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='text-foreground text-[13px] font-medium'>
                  {option.label}
                </span>
                <span className='text-muted-foreground truncate text-xs leading-snug'>
                  {option.line}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
