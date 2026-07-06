'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';

import { ROLES, type Role } from './data';
import { useSteps } from './use-steps';
import { type VisualProps } from './visual-props';

function rowToneOf(isForward: boolean, isCurrent: boolean) {
  if (isCurrent) {
    return 'bg-card hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.12)]';
  }
  if (isForward) {
    return 'opacity-100';
  }
  return 'scale-[0.97] opacity-35';
}

function decisionRowsOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'grid-rows-[1fr]';
  }
  return 'grid-rows-[0fr]';
}

type RoleRowProps = {
  role: Role;
  isForward: boolean;
  isCurrent: boolean;
};

function RoleRow({ role, isForward, isCurrent }: RoleRowProps) {
  return (
    <li
      className={cn(
        'rounded-xl transition-[opacity,scale,background-color,box-shadow] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
        rowToneOf(isForward, isCurrent)
      )}
    >
      <div className='flex items-center gap-3 p-3'>
        <Avatar
          className='size-8'
          seed={role.name}
          role='img'
          aria-label={role.name}
        />
        <div className='flex min-w-0 flex-col'>
          <p className='truncate text-[13px] font-medium'>{role.name}</p>
          <p className='text-muted-foreground truncate text-xs'>{role.role}</p>
        </div>
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
          decisionRowsOf(isCurrent)
        )}
      >
        <div className='overflow-hidden'>
          <p className='px-3 ps-14 pb-3 text-[13px] text-pretty'>
            {role.decision}
          </p>
        </div>
      </div>
    </li>
  );
}

export function RolesVisual({ progress }: VisualProps) {
  const forward = useSteps(progress, ROLES.length, 0.9);

  return (
    <ul className='mx-auto flex w-full max-w-md flex-col gap-1.5'>
      {ROLES.map((role, index) => (
        <RoleRow
          key={role.name}
          role={role}
          isForward={index < forward}
          isCurrent={index === forward - 1}
        />
      ))}
    </ul>
  );
}
