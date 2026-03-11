'use client';

import { useId, useState } from 'react';

import { UserRoundPlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function describedByOf(hasError: boolean, errorId: string) {
  if (hasError) {
    return errorId;
  }
  return undefined;
}

type InvitePopoverProps = {
  teamName: string;
  takenEmails: string[];
  onInvite: (email: string) => void;
};

export function InvitePopover({
  teamName,
  takenEmails,
  onInvite,
}: InvitePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();
  const errorId = useId();
  const hasError = Boolean(error);
  const describedBy = describedByOf(hasError, errorId);

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      setEmail('');
      setError(null);
    }
    setIsOpen(nextOpen);
  }

  function changeEmail(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    setError(null);
  }

  function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    const isEmail = EMAIL_PATTERN.test(address);
    if (!isEmail) {
      setError('Enter an address like name@company.com');
      return;
    }
    const isTaken = takenEmails.includes(address);
    if (isTaken) {
      setError(`${address} is already invited`);
      return;
    }
    onInvite(address);
    setIsOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger render={<Button variant='outline' />}>
        <UserRoundPlusIcon />
        Invite
      </PopoverTrigger>
      <PopoverContent align='end' className='w-80'>
        <form onSubmit={invite} className='flex flex-col gap-3'>
          <div className='flex flex-col gap-1'>
            <PopoverTitle>{`Invite to ${teamName}`}</PopoverTitle>
            <PopoverDescription>
              They join as a member once they accept the e-mail
            </PopoverDescription>
          </div>
          <div className='flex flex-col gap-1.5'>
            <label htmlFor={fieldId} className='sr-only'>
              E-mail address
            </label>
            <Input
              id={fieldId}
              autoFocus
              type='email'
              placeholder='name@company.com'
              value={email}
              aria-invalid={hasError}
              aria-describedby={describedBy}
              onChange={changeEmail}
            />
            {hasError && (
              <p id={errorId} className='text-destructive-ink text-xs'>
                {error}
              </p>
            )}
          </div>
          <Button type='submit' className='self-end'>
            Send invitation
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
