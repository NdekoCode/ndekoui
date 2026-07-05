'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AlertCircleIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  InfoIcon,
  LoaderCircleIcon,
  SendIcon,
  UserIcon,
  UserPenIcon,
  UserRoundPlusIcon,
  XIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

import { ROLE_LABEL, type Role } from './data';

type AddressState = 'new' | 'pending' | 'invalid';

type AddressEntry = { email: string; state: AddressState };

type SendState = 'idle' | 'sending' | 'sent';

type ChipLook = { color: string; icon: Icon | null; hint: string };

type RoleOption = {
  value: Role;
  label: string;
  line: string;
  color: string;
  icon: Icon;
};

type SummaryLine = { id: string; text: string; isError: boolean };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOKEN_SEPARATORS = /[\s,;<>"'()]+/;

const COMMIT_KEYS = new Set(['Enter', ',', ';', ' ', 'Tab']);

const SENDING_MS = 800;

const SENT_MS = 900;

const CHIP_LOOK: Record<AddressState, ChipLook> = {
  new: { color: 'var(--muted-foreground)', icon: null, hint: '' },
  pending: {
    color: 'var(--warning)',
    icon: ClockIcon,
    hint: 'Already invited: resend it from the list',
  },
  invalid: {
    color: 'var(--destructive)',
    icon: AlertCircleIcon,
    hint: 'Not a valid e-mail address',
  },
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'member',
    label: ROLE_LABEL.member,
    line: 'Tracks time and works on tasks',
    color: 'var(--info)',
    icon: UserIcon,
  },
  {
    value: 'manager',
    label: ROLE_LABEL.manager,
    line: 'Also invites people and changes the team',
    color: 'var(--success)',
    icon: UserPenIcon,
  },
  {
    value: 'viewer',
    label: ROLE_LABEL.viewer,
    line: 'Reads tasks and reports without editing them',
    color: 'var(--muted-foreground)',
    icon: EyeIcon,
  },
];

const PRESENCE_IN: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const PRESENCE_OUT: Transition = { duration: 0.14, ease: [0.23, 1, 0.32, 1] };

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const CHIP_PRESENCE: Variants = {
  hidden: { opacity: 0, scale: 0.9, transition: PRESENCE_OUT },
  shown: { opacity: 1, scale: 1, transition: PRESENCE_IN },
};

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
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function chipVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE;
  }
  return CHIP_PRESENCE;
}

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

function stateOf(email: string, takenEmails: string[]): AddressState {
  if (!EMAIL_PATTERN.test(email)) {
    return 'invalid';
  }
  if (takenEmails.includes(email)) {
    return 'pending';
  }
  return 'new';
}

function entriesOf(addresses: string[], takenEmails: string[]) {
  return addresses.map((email) => ({
    email,
    state: stateOf(email, takenEmails),
  }));
}

function newEmailsOf(entries: AddressEntry[]) {
  const newEntries = entries.filter((entry) => entry.state === 'new');
  return newEntries.map((entry) => entry.email);
}

function isRole(value: unknown): value is Role {
  return ROLE_OPTIONS.some((option) => option.value === value);
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

function invalidLineOf(count: number): SummaryLine | null {
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return {
      id: 'invalid',
      text: '1 address is not valid. Fix or remove it',
      isError: true,
    };
  }
  return {
    id: 'invalid',
    text: `${count} addresses are not valid. Fix or remove them`,
    isError: true,
  };
}

function pendingLineOf(count: number): SummaryLine | null {
  if (count === 0) {
    return null;
  }
  if (count === 1) {
    return {
      id: 'pending',
      text: '1 address already has an invitation and is skipped',
      isError: false,
    };
  }
  return {
    id: 'pending',
    text: `${count} addresses already have an invitation and are skipped`,
    isError: false,
  };
}

function isSummaryLine(line: SummaryLine | null): line is SummaryLine {
  return line !== null;
}

function summaryOf(entries: AddressEntry[]) {
  const invalidCount = entries.filter(
    (entry) => entry.state === 'invalid'
  ).length;
  const pendingCount = entries.filter(
    (entry) => entry.state === 'pending'
  ).length;
  const lines = [invalidLineOf(invalidCount), pendingLineOf(pendingCount)];
  return lines.filter(isSummaryLine);
}

function SendGlyph({ state }: { state: SendState }) {
  if (state === 'sending') {
    return <LoaderCircleIcon className='animate-spin' />;
  }
  if (state === 'sent') {
    return <CheckIcon />;
  }
  return <SendIcon />;
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
  const shouldReduceMotion = usePrefersReducedMotion();
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

function RoleSelect({
  value,
  onValueChange,
}: {
  value: Role;
  onValueChange: (role: Role) => void;
}) {
  function changeValue(nextValue: unknown) {
    if (isRole(nextValue)) {
      onValueChange(nextValue);
    }
  }

  return (
    <Select items={ROLE_OPTIONS} value={value} onValueChange={changeValue}>
      <SelectTrigger
        size='sm'
        aria-label='Role of the people invited'
        className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground data-popup-open:bg-foreground/5 w-auto shrink-0 gap-1 border-transparent bg-transparent px-2 shadow-none ring-0 dark:bg-transparent'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align='end' className='w-72'>
        {ROLE_OPTIONS.map((option) => {
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

function AddressChip({
  entry,
  allowsLayout,
  onRemove,
}: {
  entry: AddressEntry;
  allowsLayout: boolean;
  onRemove: (email: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const look = CHIP_LOOK[entry.state];
  const ChipGlyph = look.icon;
  const hasHint = look.hint.length > 0;

  function remove() {
    onRemove(entry.email);
  }

  return (
    <motion.li
      layout={allowsLayout}
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      title={look.hint}
      className='flex max-w-full'
    >
      <Chip
        color={look.color}
        className='h-6 max-w-full gap-1 pr-0.5 pl-1.5 text-xs'
      >
        {ChipGlyph && <ChipGlyph strokeWidth={2.25} />}
        <span className='truncate'>{entry.email}</span>
        {hasHint && <span className='sr-only'>{look.hint}</span>}
        <button
          type='button'
          aria-label={`Remove ${entry.email}`}
          onClick={remove}
          className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[5px] opacity-70 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]'
        >
          <XIcon className='size-3' />
        </button>
      </Chip>
    </motion.li>
  );
}

type InvitePopoverProps = {
  teamName: string;
  takenEmails: string[];
  onInvite: (email: string, role: Role) => void;
};

/**
 * Several addresses at once, each a chip tinted by what sending does to it, and the role of the batch inside the
 * field. Sending morphs the button to Sent, then the popover closes and the invitations join the list.
 */
export function InvitePopover({
  teamName,
  takenEmails,
  onInvite,
}: InvitePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [queued, setQueued] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [sendState, setSendState] = useState<SendState>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const summaryId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const allowsLayout = !shouldReduceMotion;
  const entries = entriesOf(addresses, takenEmails);
  const draftAddresses = splitAddresses(draft);
  const withDraft = mergeAddresses(addresses, draftAddresses);
  const withDraftEntries = entriesOf(withDraft, takenEmails);
  const sendCount = newEmailsOf(withDraftEntries).length;
  const isIdle = sendState === 'idle';
  const isSendDisabled = sendCount === 0;
  const summary = summaryOf(entries);
  const hasSummary = summary.length > 0;
  const hasEntries = entries.length > 0;
  const hasInvalid = summary.some((line) => line.isError);
  const lastEntry = entries.at(-1);

  const deliverQueued = useEffectEvent(() => {
    for (const email of queued) {
      onInvite(email, role);
    }
    const sentEmails = queued;
    setAddresses((previous) =>
      previous.filter((email) => !sentEmails.includes(email))
    );
    setQueued([]);
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
        setIsOpen(false);
      }, SENT_MS);
      return () => window.clearTimeout(timeout);
    }
  }, [sendState]);

  function reset() {
    setAddresses([]);
    setQueued([]);
    setDraft('');
    setSendState('idle');
  }

  function changeOpen(nextOpen: boolean) {
    if (nextOpen) {
      reset();
    }
    setIsOpen(nextOpen);
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  function addFromText(text: string) {
    const added = splitAddresses(text);
    setAddresses((previous) => mergeAddresses(previous, added));
  }

  function commitDraft() {
    const typed = draft.trim();
    if (typed.length === 0) {
      return false;
    }
    addFromText(typed);
    setDraft('');
    return true;
  }

  function removeAddress(email: string) {
    setAddresses((previous) => previous.filter((item) => item !== email));
    focusInput();
  }

  function changeDraft(event: React.ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const isEnter = event.key === 'Enter';
    const isDraftEmpty = draft.trim().length === 0;
    const sendsFromEmptyLine = isEnter && isDraftEmpty;
    if (sendsFromEmptyLine) {
      return;
    }
    if (COMMIT_KEYS.has(event.key)) {
      const hasCommitted = commitDraft();
      const isTab = event.key === 'Tab';
      const keepsTabMoving = isTab && !hasCommitted;
      if (!keepsTabMoving) {
        event.preventDefault();
      }
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const takesLastChip = isBackspace && draft.length === 0;
    if (takesLastChip && lastEntry) {
      removeAddress(lastEntry.email);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    event.preventDefault();
    addFromText(`${draft} ${pasted}`);
    setDraft('');
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isIdle) {
      return;
    }
    const newEmails = newEmailsOf(withDraftEntries);
    setAddresses(withDraft);
    setDraft('');
    if (newEmails.length === 0) {
      return;
    }
    setQueued(newEmails);
    setSendState('sending');
  }

  return (
    <Popover open={isOpen} onOpenChange={changeOpen}>
      <PopoverTrigger render={<Button variant='outline' />}>
        <UserRoundPlusIcon />
        Invite
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[min(24rem,calc(100vw-2rem))]'>
        <form
          onSubmit={send}
          autoComplete='off'
          className='flex flex-col gap-3'
        >
          <div className='flex flex-col gap-1'>
            <PopoverTitle>{`Invite to ${teamName}`}</PopoverTitle>
            <PopoverDescription>
              They get an e-mail with a link to join the team
            </PopoverDescription>
          </div>
          <div className='flex flex-col gap-1.5'>
            <div
              role='presentation'
              onClick={focusInput}
              data-invalid={hasInvalid || undefined}
              className={cn(
                CONTROL_RECIPE,
                'flex min-h-9 cursor-text items-start gap-1 p-1',
                'focus-within:border-foreground/30 focus-within:ring-ring/25 focus-within:ring-[3px]'
              )}
            >
              <div className='relative flex max-h-[5.5rem] min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto overscroll-contain'>
                {hasEntries && (
                  <ul aria-label='Addresses to invite' className='contents'>
                    <AnimatePresence initial={false} mode='popLayout'>
                      {entries.map((entry) => (
                        <AddressChip
                          key={entry.email}
                          entry={entry}
                          allowsLayout={allowsLayout}
                          onRemove={removeAddress}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
                <label htmlFor={inputId} className='sr-only'>
                  E-mail addresses
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  autoFocus
                  type='text'
                  inputMode='email'
                  autoComplete='off'
                  spellCheck={false}
                  value={draft}
                  aria-describedby={summaryId}
                  aria-invalid={hasInvalid || undefined}
                  placeholder='name@company.com, another@company.com'
                  onChange={changeDraft}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  onBlur={commitDraft}
                  className='placeholder:text-muted-foreground/75 h-7 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none md:text-[13px]'
                />
              </div>
              <div className='flex h-7 shrink-0 items-center'>
                <RoleSelect value={role} onValueChange={setRole} />
              </div>
            </div>
            <AnimatedSize>
              <div id={summaryId} className='flex flex-col gap-0.5 text-xs'>
                <p className='text-muted-foreground flex items-center gap-1.5'>
                  <InfoIcon className='size-3.5 shrink-0' />
                  Press Enter or a comma after each address
                </p>
                {hasSummary && (
                  <ul className='flex flex-col gap-0.5 pl-5'>
                    {summary.map((line) => (
                      <li
                        key={line.id}
                        className={cn(
                          line.isError && 'text-destructive-ink',
                          !line.isError && 'text-muted-foreground'
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
          <div className='flex justify-end'>
            <SendButton
              state={sendState}
              count={sendCount}
              isDisabled={isSendDisabled}
            />
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
