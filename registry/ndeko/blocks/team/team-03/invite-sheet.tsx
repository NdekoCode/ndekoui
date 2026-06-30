'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useEffectEvent, useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  InfoIcon,
  LoaderCircleIcon,
  MailIcon,
  UserIcon,
} from '@/registry/ndeko/lib/icons';
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
import { EmailChipsField, type ChipLook } from './email-chips-field';
import { InvitationList } from './invitation-list';

export type InviteTab = 'invite' | 'invited';

/** What sending does to an address: a new invitation, the e-mail again for a pending one, nothing for a member or a typo. */
type AddressState = 'new' | 'pending' | 'member' | 'invalid';

type AddressEntry = { email: string; state: AddressState };

type SendState = 'idle' | 'sending' | 'sent';

type SummaryLine = { state: AddressState; text: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOKEN_SEPARATORS = /[\s,;<>"'()]+/;

const SENDING_MS = 800;

const SENT_MS = 700;

const INVITED_COUNT =
  'bg-foreground/[0.06] text-muted-foreground h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-xs';

const CHIP_LOOK: Record<AddressState, ChipLook> = {
  new: { color: 'var(--muted-foreground)', icon: null, hint: '' },
  pending: {
    color: 'var(--warning)',
    icon: ClockIcon,
    hint: 'Already invited: they get the e-mail again',
  },
  member: {
    color: 'var(--muted-foreground)',
    icon: UserIcon,
    hint: 'Already in the team: not invited again',
  },
  invalid: {
    color: 'var(--destructive)',
    icon: AlertCircleIcon,
    hint: 'Not a valid e-mail address',
  },
};

const SUMMARY_ORDER: AddressState[] = ['invalid', 'member', 'pending'];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const INSTANT: Transition = { duration: 0 };

const ICON_SWAP: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const LABEL_SWAP: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
};

const FADE: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function iconSwapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return ICON_SWAP;
}

function labelSwapOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return LABEL_SWAP;
}

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function isInviteTab(value: unknown): value is InviteTab {
  const isInvite = value === 'invite';
  const isInvited = value === 'invited';
  return isInvite || isInvited;
}

function isRole(value: unknown): value is Role {
  return ROLE_OPTIONS.some((option) => option.value === value);
}

/** The addresses in what was typed or pasted; words around an address, such as names copied from a mail, are left out. */
function splitAddresses(text: string) {
  const tokens = text.split(TOKEN_SEPARATORS);
  const holdsAnAddress = text.includes('@');
  const addresses: string[] = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    const address = trimmed.toLowerCase();
    const isEmpty = address.length === 0;
    const isNameAround = holdsAnAddress && !address.includes('@');
    const isRepeat = addresses.includes(address);
    if (isEmpty || isNameAround || isRepeat) {
      continue;
    }
    addresses.push(address);
  }
  return addresses;
}

function mergeAddresses(current: string[], added: string[]) {
  const merged = [...current];
  for (const address of added) {
    if (!merged.includes(address)) {
      merged.push(address);
    }
  }
  return merged;
}

function sendLabelOf(state: SendState, count: number) {
  if (state === 'sending') {
    return 'Sending';
  }
  if (state === 'sent') {
    return 'Sent';
  }
  if (count > 1) {
    return `Send ${count} invitations`;
  }
  return 'Send invitation';
}

function summaryTextOf(state: AddressState, count: number) {
  const isOne = count === 1;
  if (state === 'invalid') {
    if (isOne) {
      return '1 address is not valid. Fix or remove it';
    }
    return `${count} addresses are not valid. Fix or remove them`;
  }
  if (state === 'member') {
    if (isOne) {
      return '1 person is already in the team and is skipped';
    }
    return `${count} people are already in the team and are skipped`;
  }
  if (isOne) {
    return '1 person was already invited and gets the e-mail again';
  }
  return `${count} people were already invited and get the e-mail again`;
}

function summaryOf(entries: AddressEntry[]) {
  const lines: SummaryLine[] = [];
  for (const state of SUMMARY_ORDER) {
    const count = entries.filter((entry) => entry.state === state).length;
    if (count > 0) {
      lines.push({ state, text: summaryTextOf(state, count) });
    }
  }
  return lines;
}

function SendGlyph({ state }: { state: SendState }) {
  if (state === 'sending') {
    return <LoaderCircleIcon className='animate-spin' />;
  }
  if (state === 'sent') {
    return <CheckIcon />;
  }
  return <MailIcon />;
}

/** The send button becomes its next state: its icon swaps, its label crossfades and its width follows. */
function SendButton({
  state,
  count,
  isDisabled,
}: {
  state: SendState;
  count: number;
  isDisabled: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const iconVariants = iconSwapOf(shouldReduceMotion);
  const labelVariants = labelSwapOf(shouldReduceMotion);
  const label = sendLabelOf(state, count);
  const isSending = state === 'sending';

  return (
    <Button type='submit' disabled={isDisabled} aria-busy={isSending}>
      <span className='relative flex'>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={state}
            className='flex'
            variants={iconVariants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            <SendGlyph state={state} />
          </motion.span>
        </AnimatePresence>
      </span>
      <AnimatedSize axis='width' as='span'>
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={label}
              className='whitespace-nowrap'
              variants={labelVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>
      </AnimatedSize>
    </Button>
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

/**
 * Invites people the way the invite dialog does: every address becomes a chip tinted by what sending does to it,
 * a summary says what is skipped or sent again, and sending morphs the button before the Invited tab shows the rows.
 */
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
  const [addresses, setAddresses] = useState<string[]>([]);
  const [queued, setQueued] = useState<AddressEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [note, setNote] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const shouldReduceMotion = useReducedMotion();
  const roleTravel = travelOf(shouldReduceMotion);
  const fieldId = useId();
  const summaryId = useId();
  const noteId = useId();
  const roleTintId = useId();
  const memberEmails = new Set(members.map((member) => member.email));
  const pendingEmails = new Set(
    invitations.map((invitation) => invitation.email)
  );
  const hasInvitations = invitations.length > 0;
  const draftAddresses = splitAddresses(draft);
  const withDraft = mergeAddresses(addresses, draftAddresses);
  const withDraftEntries = withDraft.map(entryOf);
  const sendable = withDraftEntries.filter(isSendable);
  const sendCount = sendable.length;
  const entries = addresses.map(entryOf);
  const summary = summaryOf(entries);
  const hasSummary = summary.length > 0;
  const hasInvalid = summary.some((line) => line.state === 'invalid');
  const isIdle = sendState === 'idle';
  const isSendDisabled = sendCount === 0;

  function entryOf(email: string): AddressEntry {
    if (!EMAIL_PATTERN.test(email)) {
      return { email, state: 'invalid' };
    }
    if (memberEmails.has(email)) {
      return { email, state: 'member' };
    }
    if (pendingEmails.has(email)) {
      return { email, state: 'pending' };
    }
    return { email, state: 'new' };
  }

  function isSendable(entry: AddressEntry) {
    const isNew = entry.state === 'new';
    const isPending = entry.state === 'pending';
    return isNew || isPending;
  }

  function lookOf(email: string) {
    const entry = entryOf(email);
    return CHIP_LOOK[entry.state];
  }

  const deliverQueued = useEffectEvent(() => {
    const newEntries = queued.filter((entry) => entry.state === 'new');
    const newEmails = newEntries.map((entry) => entry.email);
    const pendingEntries = queued.filter((entry) => entry.state === 'pending');
    const resentEmails = pendingEntries.map((entry) => entry.email);
    const sentEmails = queued.map((entry) => entry.email);
    const hasNew = newEmails.length > 0;
    if (hasNew) {
      onSend(newEmails, role);
    }
    for (const invitation of invitations) {
      const isResent = resentEmails.includes(invitation.email);
      if (isResent) {
        onResend(invitation.id);
      }
    }
    setAddresses((previous) =>
      previous.filter((email) => !sentEmails.includes(email))
    );
    setQueued([]);
    setNote('');
  });

  const showInvited = useEffectEvent(() => {
    onTabChange('invited');
  });

  useEffect(() => {
    if (sendState === 'sending') {
      const timeout = window.setTimeout(() => {
        deliverQueued();
        setSendState('sent');
      }, SENDING_MS);
      return () => window.clearTimeout(timeout);
    }
    if (sendState === 'sent') {
      const timeout = window.setTimeout(() => {
        setSendState('idle');
        showInvited();
      }, SENT_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [sendState]);

  function commit(text: string) {
    const added = splitAddresses(text);
    setAddresses((previous) => mergeAddresses(previous, added));
    setDraft('');
  }

  function changeDraft(nextDraft: string) {
    setDraft(nextDraft);
  }

  function removeEmail(email: string) {
    setAddresses((previous) => previous.filter((item) => item !== email));
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
    if (!isIdle) {
      return;
    }
    setAddresses(withDraft);
    setDraft('');
    if (sendable.length === 0) {
      return;
    }
    setQueued(sendable);
    setSendState('sending');
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='bottom-auto max-h-[calc(100dvh-1rem)] max-w-md gap-0 p-0'>
        <SheetHeader className='px-5 pt-5 pb-3'>
          <SheetTitle>{`Invite to ${teamName}`}</SheetTitle>
          <SheetDescription>
            They get an e-mail with a link to join the team
          </SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={changeTab} className='gap-0'>
          <TabsList aria-label='Invitations' className='mx-5'>
            <TabsTab value='invite'>Invite</TabsTab>
            <TabsTab value='invited'>
              Invited
              <MotionNumber
                value={invitations.length}
                className={INVITED_COUNT}
              />
            </TabsTab>
          </TabsList>
          <AnimatedSize className='m-0' contentClassName='p-0'>
            <TabsPanel value='invite' className='rounded-none'>
              <form
                onSubmit={send}
                autoComplete='off'
                className='flex flex-col gap-5 px-5 pt-4 pb-5'
              >
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor={fieldId} className='text-[13px] font-medium'>
                    E-mail addresses
                  </label>
                  <EmailChipsField
                    id={fieldId}
                    emails={addresses}
                    draft={draft}
                    isInvalid={hasInvalid}
                    describedBy={summaryId}
                    onDraftChange={changeDraft}
                    onCommit={commit}
                    onRemove={removeEmail}
                    lookOf={lookOf}
                  />
                  <AnimatedSize>
                    <div
                      id={summaryId}
                      className='flex flex-col gap-0.5 text-xs'
                    >
                      <p className='text-muted-foreground flex items-center gap-1.5'>
                        <InfoIcon className='size-3.5 shrink-0' />
                        Press Enter or a comma after each address, or paste a
                        list
                      </p>
                      {hasSummary && (
                        <ul className='flex flex-col gap-0.5 pl-5'>
                          {summary.map((line) => (
                            <li
                              key={line.state}
                              className={cn(
                                line.state === 'invalid' &&
                                  'text-destructive-ink',
                                line.state !== 'invalid' &&
                                  'text-muted-foreground'
                              )}
                            >
                              {line.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </AnimatedSize>
                </div>
                <fieldset className='flex flex-col gap-1.5'>
                  <legend className='mb-1.5 text-[13px] font-medium'>
                    Role
                  </legend>
                  <RadioGroup
                    value={role}
                    onValueChange={changeRole}
                    className='bg-card hairline-ring ring-border gap-0 rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
                  >
                    {ROLE_OPTIONS.map((option) => {
                      const isPicked = option.value === role;

                      return (
                        <label
                          key={option.value}
                          className='relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5'
                        >
                          {isPicked && (
                            <motion.span
                              layoutId={roleTintId}
                              aria-hidden='true'
                              transition={roleTravel}
                              className='bg-primary/[0.07] absolute inset-0 rounded-lg'
                            />
                          )}
                          <RadioGroupItem
                            value={option.value}
                            className='relative mt-0.5'
                          />
                          <span className='relative flex min-w-0 flex-col gap-0.5'>
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
                  <SendButton
                    state={sendState}
                    count={sendCount}
                    isDisabled={isSendDisabled}
                  />
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
