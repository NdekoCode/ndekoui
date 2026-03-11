'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState } from 'react';

import { MailIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/registry/ndeko/ui/sheet';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { ROLE_OPTIONS, type Invitation, type Member, type Role } from './data';
import { EmailChipsField } from './email-chips-field';
import { InvitationList } from './invitation-list';

export type InviteTab = 'invite' | 'invited';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LABEL_MORPH: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const DIGIT_SHIFT_PX = 8;

const DIGIT_TRANSITION: Transition = { duration: 0.18, ease: [0.2, 0, 0, 1] };

const DIGIT_VARIANTS: Variants = {
  enter: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: offset };
  },
  visible: { opacity: 1, y: 0 },
  exit: (direction: number) => {
    const offset = direction * DIGIT_SHIFT_PX;
    return { opacity: 0, y: -offset };
  },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

type ParsedEmails = { accepted: string[]; rejected: string[]; reason: string };

type CountState = { value: number; direction: number };

function morphOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return LABEL_MORPH;
}

function digitVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return DIGIT_VARIANTS;
}

function directionOf(previous: number, next: number) {
  if (next > previous) {
    return 1;
  }
  return -1;
}

function isInviteTab(value: unknown): value is InviteTab {
  const isInvite = value === 'invite';
  const isInvited = value === 'invited';
  return isInvite || isInvited;
}

function isRole(value: unknown): value is Role {
  return ROLE_OPTIONS.some((option) => option.value === value);
}

function sendLabelOf(count: number) {
  if (count > 1) {
    return `Send ${count} invitations`;
  }
  return 'Send invitation';
}

function rejectionOf(
  address: string,
  takenByMember: Set<string>,
  invited: Set<string>
) {
  const isEmail = EMAIL_PATTERN.test(address);
  if (!isEmail) {
    return `${address} is not an e-mail address`;
  }
  if (takenByMember.has(address)) {
    return `${address} is already in the team`;
  }
  if (invited.has(address)) {
    return `${address} already has an invitation`;
  }
  return null;
}

function SlidingCount({ value }: { value: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState<CountState>({ value, direction: 1 });
  const variants = digitVariantsOf(shouldReduceMotion);

  if (shown.value !== value) {
    const direction = directionOf(shown.value, value);
    setShown({ value, direction });
  }

  return (
    <span className='bg-foreground/[0.06] text-muted-foreground relative inline-flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-sm px-1.5 text-xs tabular-nums'>
      <AnimatePresence
        mode='popLayout'
        initial={false}
        custom={shown.direction}
      >
        <motion.span
          key={value}
          custom={shown.direction}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={DIGIT_TRANSITION}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type InviteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: InviteTab;
  onTabChange: (tab: InviteTab) => void;
  teamName: string;
  members: Member[];
  invitations: Invitation[];
  onSend: (emails: string[], role: Role) => void;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
};

export function InviteSheet({
  open,
  onOpenChange,
  tab,
  onTabChange,
  teamName,
  members,
  invitations,
  onSend,
  onResend,
  onRevoke,
}: InviteSheetProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const labelMorph = morphOf(shouldReduceMotion);
  const fieldId = useId();
  const hintId = useId();
  const noteId = useId();
  const hasError = Boolean(error);
  const hasInvitations = invitations.length > 0;
  const hasDraft = draft.trim().length > 0;
  let sendCount = emails.length;
  if (hasDraft) {
    sendCount += 1;
  }
  const canSend = sendCount > 0;

  function parse(text: string, current: string[]): ParsedEmails {
    const memberEmails = new Set(members.map((member) => member.email));
    const invitedEmails = new Set(invitations.map((item) => item.email));
    const parts = text.split(/[\s,;]+/);
    const accepted: string[] = [];
    const rejected: string[] = [];
    let reason = '';
    for (const part of parts) {
      const address = part.trim().toLowerCase();
      const isEmpty = address.length === 0;
      const isKnown = current.includes(address) || accepted.includes(address);
      if (isEmpty || isKnown) {
        continue;
      }
      const rejection = rejectionOf(address, memberEmails, invitedEmails);
      if (rejection) {
        rejected.push(address);
        if (!reason) {
          reason = rejection;
        }
        continue;
      }
      accepted.push(address);
    }
    return { accepted, rejected, reason };
  }

  function commit(text: string) {
    const parsed = parse(text, emails);
    setEmails((previous) => [...previous, ...parsed.accepted]);
    setDraft(parsed.rejected.join(' '));
    const hasRejected = parsed.rejected.length > 0;
    if (hasRejected) {
      setError(parsed.reason);
      return;
    }
    setError(null);
  }

  function changeDraft(nextDraft: string) {
    setDraft(nextDraft);
    setError(null);
  }

  function removeEmail(email: string) {
    setEmails((previous) => previous.filter((item) => item !== email));
  }

  function changeRole(value: unknown) {
    if (isRole(value)) {
      setRole(value);
    }
  }

  function changeNote(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setNote(event.target.value);
  }

  function changeTab(value: unknown) {
    if (isInviteTab(value)) {
      onTabChange(value);
    }
  }

  function showInviteTab() {
    onTabChange('invite');
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parse(draft, emails);
    const hasRejected = parsed.rejected.length > 0;
    if (hasRejected) {
      setEmails((previous) => [...previous, ...parsed.accepted]);
      setDraft(parsed.rejected.join(' '));
      setError(parsed.reason);
      return;
    }
    const allEmails = [...emails, ...parsed.accepted];
    if (allEmails.length === 0) {
      setError('Add at least one e-mail address');
      return;
    }
    onSend(allEmails, role);
    setEmails([]);
    setDraft('');
    setNote('');
    setError(null);
    onTabChange('invited');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='bottom-auto max-h-[calc(100dvh-1rem)] max-w-md gap-0 p-0'>
        <SheetHeader className='px-5 pt-5 pb-3'>
          <SheetTitle>{`Invite to ${teamName}`}</SheetTitle>
          <SheetDescription>
            People join the team once they accept the e-mail
          </SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={changeTab} className='gap-0'>
          <TabsList aria-label='Invitations' className='mx-5'>
            <TabsTab value='invite'>Invite</TabsTab>
            <TabsTab value='invited'>
              Invited
              <SlidingCount value={invitations.length} />
            </TabsTab>
          </TabsList>
          <AnimatedSize className='m-0' contentClassName='p-0'>
            <TabsPanel value='invite' className='rounded-none'>
              <form
                onSubmit={send}
                className='flex flex-col gap-5 px-5 pt-4 pb-5'
              >
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor={fieldId} className='text-[13px] font-medium'>
                    E-mail addresses
                  </label>
                  <EmailChipsField
                    id={fieldId}
                    emails={emails}
                    draft={draft}
                    isInvalid={hasError}
                    describedBy={hintId}
                    onDraftChange={changeDraft}
                    onCommit={commit}
                    onRemove={removeEmail}
                  />
                  <p
                    id={hintId}
                    className={cn(
                      'text-xs',
                      hasError && 'text-destructive-ink',
                      !hasError && 'text-muted-foreground'
                    )}
                  >
                    {error ?? 'Separate addresses with a comma or a space'}
                  </p>
                </div>
                <fieldset className='flex flex-col gap-1.5'>
                  <legend className='mb-1.5 text-[13px] font-medium'>
                    Role
                  </legend>
                  <RadioGroup
                    value={role}
                    onValueChange={changeRole}
                    className='bg-card hairline-ring ring-border hairline-divide-y divide-border gap-0 overflow-hidden rounded-xl'
                  >
                    {ROLE_OPTIONS.map((option) => {
                      const isPicked = option.value === role;

                      return (
                        <label
                          key={option.value}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors duration-150',
                            isPicked && 'bg-primary/[0.06]'
                          )}
                        >
                          <RadioGroupItem
                            value={option.value}
                            className='mt-0.5'
                          />
                          <span className='flex min-w-0 flex-col gap-0.5'>
                            <span className='text-[13px] font-medium'>
                              {option.label}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {option.line}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </fieldset>
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor={noteId} className='text-[13px] font-medium'>
                    Note
                    <span className='text-muted-foreground font-normal'>
                      {' '}
                      (optional)
                    </span>
                  </label>
                  <Textarea
                    id={noteId}
                    value={note}
                    placeholder='Added to the invitation e-mail'
                    onChange={changeNote}
                  />
                </div>
                <div className='flex items-center justify-end gap-2'>
                  <SheetClose render={<Button type='button' variant='ghost' />}>
                    Cancel
                  </SheetClose>
                  <Button type='submit' disabled={!canSend}>
                    <MailIcon />
                    <motion.span layout transition={labelMorph}>
                      {sendLabelOf(sendCount)}
                    </motion.span>
                  </Button>
                </div>
              </form>
            </TabsPanel>
            <TabsPanel value='invited' className='rounded-none'>
              <div className='flex flex-col gap-3 px-5 pt-4 pb-5'>
                {hasInvitations && (
                  <InvitationList
                    invitations={invitations}
                    isCompact
                    onResend={onResend}
                    onRevoke={onRevoke}
                  />
                )}
                {!hasInvitations && (
                  <div className='hairline-border border-foreground/20 flex flex-col items-center gap-3 rounded-xl border-dashed px-4 py-8 text-center'>
                    <p className='text-sm font-medium'>No pending invitation</p>
                    <Button variant='outline' onClick={showInviteTab}>
                      Invite people
                    </Button>
                  </div>
                )}
              </div>
            </TabsPanel>
          </AnimatedSize>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
