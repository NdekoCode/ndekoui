'use client';

import { useId, useState } from 'react';

import { InfoIcon, RotateCcwIcon, SendIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Input } from '@/registry/ndeko/ui/input';
import { Switch } from '@/registry/ndeko/ui/switch';

import { ActionButton, useTimedAction } from './_parts/action-button';
import { ChoiceSegments, type SegmentOption } from './_parts/choice-segments';
import { isEmail } from './_parts/invite-emails';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { Swap } from './_parts/swap';

type Role = 'admin' | 'editor' | 'viewer';

type PermissionId = 'create' | 'edit' | 'delete' | 'invite' | 'reports';

type Permissions = Record<PermissionId, boolean>;

const ROLE_OPTIONS: SegmentOption<Role>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const PERMISSIONS: { id: PermissionId; label: string; line: string }[] = [
  {
    id: 'create',
    label: 'Create tasks',
    line: 'Adds tasks and sub-tasks to any project',
  },
  {
    id: 'edit',
    label: 'Edit the tasks of others',
    line: 'Changes their status, dates and assignees',
  },
  {
    id: 'delete',
    label: 'Delete tasks',
    line: 'Removes tasks for good, with their time',
  },
  {
    id: 'invite',
    label: 'Invite people',
    line: 'Sends invitations to the workspace',
  },
  {
    id: 'reports',
    label: 'See reports',
    line: 'Opens the time and payment reports',
  },
];

const PRESETS: Record<Role, Permissions> = {
  admin: {
    create: true,
    edit: true,
    delete: true,
    invite: true,
    reports: true,
  },
  editor: {
    create: true,
    edit: true,
    delete: false,
    invite: false,
    reports: true,
  },
  viewer: {
    create: false,
    edit: false,
    delete: false,
    invite: false,
    reports: true,
  },
};

const PERMISSION_IDS: PermissionId[] = PERMISSIONS.map(
  (permission) => permission.id
);

function roleLabelOf(role: Role) {
  const option = ROLE_OPTIONS.find((candidate) => candidate.value === role);
  return option?.label ?? role;
}

function differsFromPreset(permissions: Permissions, role: Role) {
  const preset = PRESETS[role];
  return PERMISSION_IDS.some((id) => permissions[id] !== preset[id]);
}

function PermissionRow({
  label,
  line,
  checked,
  onCheckedChange,
}: {
  label: string;
  line: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const switchId = useId();

  return (
    <div className='flex items-center justify-between gap-4 py-1.5'>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <label htmlFor={switchId} className='text-[13px] font-medium'>
          {label}
        </label>
        <p className='text-muted-foreground text-xs'>{line}</p>
      </div>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function ManageAccess() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [permissions, setPermissions] = useState<Permissions>(PRESETS.editor);
  const [error, setError] = useState<string | null>(null);
  const [sentLine, setSentLine] = useState<string | null>(null);
  const action = useTimedAction();
  const emailId = useId();
  const hintId = useId();
  const roleLabel = roleLabelOf(role);
  const isCustom = differsFromPreset(permissions, role);
  const hasError = Boolean(error);
  const hasSentLine = Boolean(sentLine);
  const hint = error ?? 'They get an e-mail invitation to join';
  const permissionsKey = String(isCustom);

  function changeEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setError(null);
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setPermissions(PRESETS[nextRole]);
  }

  function resetPermissions() {
    setPermissions(PRESETS[role]);
  }

  function changePermission(id: PermissionId, checked: boolean) {
    setPermissions((previous) => ({ ...previous, [id]: checked }));
  }

  function commitSend() {
    const address = email.trim().toLowerCase();
    setSentLine(`Invitation sent to ${address} as ${roleLabel}`);
    setEmail('');
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!isEmail(address)) {
      setError('Enter an address like name@company.com');
      return;
    }
    action.run(commitSend);
  }

  return (
    <form onSubmit={send} className='flex flex-col gap-5' noValidate>
      <ModalHeader>
        <ModalTitle>Manage access</ModalTitle>
        <ModalDescription>
          Invite someone and choose exactly what they can do
        </ModalDescription>
      </ModalHeader>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={emailId} className='text-[13px] font-medium'>
          E-mail address
        </label>
        <Input
          id={emailId}
          type='email'
          autoComplete='off'
          placeholder='name@company.com'
          value={email}
          aria-invalid={hasError}
          aria-describedby={hintId}
          onChange={changeEmail}
        />
        <p
          id={hintId}
          className={cn(
            'flex items-center gap-1.5 text-xs',
            hasError && 'text-destructive-ink',
            !hasError && 'text-muted-foreground'
          )}
        >
          <InfoIcon className='size-3.5 shrink-0' />
          <Swap swapKey={hint} kind='label'>
            {hint}
          </Swap>
        </p>
      </div>
      <div className='flex flex-col gap-2'>
        <span className='text-[13px] font-medium'>Role</span>
        <ChoiceSegments
          label='Role'
          value={role}
          options={ROLE_OPTIONS}
          onValueChange={changeRole}
        />
      </div>
      <div className='flex flex-col gap-1'>
        <div className='flex min-h-7 items-center justify-between gap-3'>
          <span className='text-[13px] font-medium'>Permissions</span>
          <Swap swapKey={permissionsKey} kind='label'>
            {isCustom && (
              <span className='flex items-center gap-1'>
                <Chip color='var(--warning)'>Custom</Chip>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={resetPermissions}
                  className='text-muted-foreground'
                >
                  <RotateCcwIcon />
                  {`Reset to ${roleLabel}`}
                </Button>
              </span>
            )}
            {!isCustom && (
              <span className='text-muted-foreground text-xs'>
                {`Set by the ${roleLabel} role`}
              </span>
            )}
          </Swap>
        </div>
        {PERMISSIONS.map((permission) => {
          function changeThis(checked: boolean) {
            changePermission(permission.id, checked);
          }

          return (
            <PermissionRow
              key={permission.id}
              label={permission.label}
              line={permission.line}
              checked={permissions[permission.id]}
              onCheckedChange={changeThis}
            />
          );
        })}
      </div>
      <AnimatedSize>
        {hasSentLine && (
          <Swap
            swapKey={sentLine ?? ''}
            kind='label'
            className='text-muted-foreground flex min-w-0 text-xs'
            contentClassName='max-w-full min-w-0 whitespace-normal'
          >
            {sentLine}
          </Swap>
        )}
      </AnimatedSize>
      <ModalFooter>
        <ModalCloseButton variant='ghost'>Cancel</ModalCloseButton>
        <ActionButton
          type='submit'
          state={action.state}
          idleIcon={<SendIcon />}
          labels={{
            idle: 'Send invitation',
            working: 'Sending',
            done: 'Sent',
          }}
        />
      </ModalFooter>
    </form>
  );
}

export default function Modal06() {
  return (
    <ModalPreview triggerLabel='Open the access dialog' size='md'>
      <ManageAccess />
    </ModalPreview>
  );
}
