'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  InfoIcon,
  LoaderCircleIcon,
  SendIcon,
  TrashIcon,
  UsersRoundIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import {
  ActionButton,
  useTimedAction,
  type ActionState,
} from './_parts/action-button';
import { AddressField, chipsOf } from './_parts/address-field';
import {
  countOf,
  isSendable,
  mergeAddresses,
  splitAddresses,
  stateOfAddress,
  type AddressEntry,
  type AddressState,
} from './_parts/invite-emails';
import {
  ModalDescription,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { rowVariantsOf } from './_parts/motion';
import { PEOPLE, TEAM_NAME } from './_parts/people';
import { PendingAvatar } from './_parts/person-avatar';
import { RoleSelect, TEAM_ROLES, type TeamRole } from './_parts/role-select';
import { Swap } from './_parts/swap';

type InvitationState = 'pending' | 'expired';

type Invitation = {
  id: string;
  email: string;
  role: TeamRole;
  state: InvitationState;
  line: string;
};

const SHOWN_INVITATIONS = 4;

const REVOKE_ARMED_MS = 4000;

const FRESH_EXPIRY = 'Expires in 7 days';

const INVITATIONS: Invitation[] = [
  {
    id: 'invite-noor',
    email: 'noor.haddad@lattice.example',
    role: 'member',
    state: 'pending',
    line: 'Invited Nov 3 · Expires in 5 days',
  },
  {
    id: 'invite-kofi',
    email: 'kofi.mensah@lattice.example',
    role: 'manager',
    state: 'pending',
    line: 'Invited this morning · Expires in 7 days',
  },
  {
    id: 'invite-ines',
    email: 'ines.carvalho@northfield.example',
    role: 'member',
    state: 'expired',
    line: 'Expired Nov 2',
  },
  {
    id: 'invite-yuki',
    email: 'yuki.tanaka@lattice.example',
    role: 'member',
    state: 'pending',
    line: 'Invited Oct 31 · Expires tomorrow',
  },
  {
    id: 'invite-omar',
    email: 'omar.farouk@lattice.example',
    role: 'admin',
    state: 'expired',
    line: 'Expired Oct 28',
  },
];

const STATE_LOOK: Record<
  InvitationState,
  { label: string; color: string; icon: Icon }
> = {
  pending: { label: 'Pending', color: 'var(--warning)', icon: ClockIcon },
  expired: {
    label: 'Expired',
    color: 'var(--destructive)',
    icon: AlertCircleIcon,
  },
};

const SUMMARY_ORDER: AddressState[] = ['invalid', 'member', 'pending'];

const MEMBER_EMAILS = new Set(PEOPLE.map((person) => person.email));

function roleLabelOf(role: TeamRole) {
  const option = TEAM_ROLES.find((candidate) => candidate.value === role);
  return option?.label ?? role;
}

function summaryLineOf(state: AddressState, count: number) {
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

function inviteLabelOf(count: number) {
  if (count > 1) {
    return `Invite ${count}`;
  }
  return 'Invite';
}

function moreLabelOf(isExpanded: boolean, hiddenCount: number) {
  if (isExpanded) {
    return 'Show less';
  }
  return `Show ${hiddenCount} more`;
}

function invitationOf(email: string, role: TeamRole): Invitation {
  return {
    id: `invite-${email}`,
    email,
    role,
    state: 'pending',
    line: `Invited just now · ${FRESH_EXPIRY}`,
  };
}

function resentOf(invitation: Invitation): Invitation {
  return {
    ...invitation,
    state: 'pending',
    line: `Sent again just now · ${FRESH_EXPIRY}`,
  };
}

function TeamContext() {
  return (
    <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
      <span className='gem-plate flex size-4 items-center justify-center rounded-[4px] [--gem:var(--primary)]'>
        <UsersRoundIcon className='size-2.5' strokeWidth={2.5} />
      </span>
      {`${TEAM_NAME} team`}
    </span>
  );
}

function StateChip({ state }: { state: InvitationState }) {
  const look = STATE_LOOK[state];
  const StateGlyph = look.icon;

  return (
    <Swap swapKey={state} kind='label'>
      <Chip color={look.color} className='h-5'>
        <StateGlyph strokeWidth={2.25} />
        {look.label}
      </Chip>
    </Swap>
  );
}

function RevokeButton({
  email,
  onRevoke,
}: {
  email: string;
  onRevoke: () => void;
}) {
  const [isArmed, setIsArmed] = useState(false);

  useEffect(() => {
    if (!isArmed) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsArmed(false);
    }, REVOKE_ARMED_MS);
    return () => window.clearTimeout(timeout);
  }, [isArmed]);

  function arm() {
    setIsArmed(true);
  }

  function disarm() {
    setIsArmed(false);
  }

  if (isArmed) {
    return (
      <Button
        variant='ghost'
        size='sm'
        autoFocus
        onClick={onRevoke}
        onBlur={disarm}
        className='text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink'
      >
        Revoke
      </Button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={`Revoke the invitation sent to ${email}`}
      onClick={arm}
      className='text-muted-foreground hover:text-destructive-ink'
    >
      <TrashIcon />
    </Button>
  );
}

function ResendButton({
  email,
  onResend,
}: {
  email: string;
  onResend: () => void;
}) {
  const action = useTimedAction();
  const isDone = action.state === 'done';
  const isWorking = action.state === 'working';

  function resend() {
    action.run(onResend);
  }

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      aria-label={`Send the invitation to ${email} again`}
      aria-busy={isWorking}
      onClick={resend}
      className={cn(
        'text-muted-foreground hover:text-foreground',
        isDone && 'text-success-foreground hover:text-success-foreground'
      )}
    >
      <Swap swapKey={action.state}>
        <ResendGlyph state={action.state} />
      </Swap>
    </Button>
  );
}

function ResendGlyph({ state }: { state: ActionState }) {
  if (state === 'working') {
    return <LoaderCircleIcon className='animate-spin' />;
  }
  if (state === 'done') {
    return <CheckIcon />;
  }
  return <SendIcon />;
}

function InvitationRow({
  invitation,
  onResend,
  onRevoke,
}: {
  invitation: Invitation;
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
}) {
  const roleLabel = roleLabelOf(invitation.role);

  function resend() {
    onResend(invitation.id);
  }

  function revoke() {
    onRevoke(invitation.id);
  }

  return (
    <div className='flex min-h-14 items-center gap-3 py-2 pr-1.5 pl-3'>
      <PendingAvatar email={invitation.email} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='truncate text-[13px] leading-tight font-medium'>
          {invitation.email}
        </p>
        <Swap
          swapKey={invitation.line}
          kind='label'
          className='text-muted-foreground flex min-w-0 text-xs leading-tight'
          contentClassName='max-w-full min-w-0'
        >
          <span className='truncate'>{`${roleLabel} · ${invitation.line}`}</span>
        </Swap>
      </div>
      <StateChip state={invitation.state} />
      <div className='flex shrink-0 items-center'>
        <ResendButton email={invitation.email} onResend={resend} />
        <RevokeButton email={invitation.email} onRevoke={revoke} />
      </div>
    </div>
  );
}

function PendingList({
  invitations,
  onResend,
  onRevoke,
}: {
  invitations: Invitation[];
  onResend: (invitationId: string) => void;
  onRevoke: (invitationId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const headingId = useId();
  const hiddenCount = invitations.length - SHOWN_INVITATIONS;
  const canExpand = hiddenCount > 0;
  const hasInvitations = invitations.length > 0;
  let shownInvitations = invitations.slice(0, SHOWN_INVITATIONS);
  if (isExpanded) {
    shownInvitations = invitations;
  }
  const moreLabel = moreLabelOf(isExpanded, hiddenCount);

  function toggleExpanded() {
    setIsExpanded((previous) => !previous);
  }

  if (!hasInvitations) {
    return (
      <p className='text-muted-foreground text-xs'>
        Nobody is waiting to join the team
      </p>
    );
  }

  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <h3
          id={headingId}
          className='text-muted-foreground text-xs font-medium'
        >
          Pending invitations
        </h3>
        <Kbd>
          <MotionNumber value={invitations.length} />
        </Kbd>
      </div>
      <div className='bg-card hairline-ring ring-border overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
        <ul className='flex flex-col py-1'>
          <AnimatePresence initial={false}>
            {shownInvitations.map((invitation) => (
              <motion.li
                key={invitation.id}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <InvitationRow
                  invitation={invitation}
                  onResend={onResend}
                  onRevoke={onRevoke}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {canExpand && (
          <button
            type='button'
            aria-expanded={isExpanded}
            onClick={toggleExpanded}
            className='text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground focus-visible:bg-foreground/[0.03] flex h-9 w-full cursor-pointer items-center gap-2 px-3 text-left text-xs font-medium transition-colors duration-150 outline-none'
          >
            <ChevronDownIcon
              className={cn(
                'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
                isExpanded && 'rotate-180'
              )}
            />
            <Swap swapKey={moreLabel} kind='label'>
              {moreLabel}
            </Swap>
          </button>
        )}
      </div>
    </section>
  );
}

function InvitePeople() {
  const [addresses, setAddresses] = useState<string[]>([
    'ada.lindqvist@lattice.example',
    'kofi.mensah@lattice.example',
    'priya@lattice.example',
    'bruno@lattice',
  ]);
  const [role, setRole] = useState<TeamRole>('member');
  const [invitations, setInvitations] = useState<Invitation[]>(INVITATIONS);
  const action = useTimedAction();
  const summaryId = useId();
  const pendingEmails = new Set(
    invitations.map((invitation) => invitation.email)
  );
  const context = { memberEmails: MEMBER_EMAILS, pendingEmails };
  const entries: AddressEntry[] = addresses.map((email) => ({
    email,
    state: stateOfAddress(email, context),
  }));
  const sendable = entries.filter((entry) => isSendable(entry.state));
  const sendableCount = sendable.length;
  const hasInvalid = countOf(entries, 'invalid') > 0;
  const isSendDisabled = sendableCount === 0;
  const allSummaryLines = SUMMARY_ORDER.map((state) => ({
    state,
    count: countOf(entries, state),
  }));
  const summaryLines = allSummaryLines.filter((line) => line.count > 0);
  const hasSummary = summaryLines.length > 0;

  function addAddresses(text: string) {
    const added = splitAddresses(text);
    setAddresses((previous) => mergeAddresses(previous, added));
  }

  function removeAddress(email: string) {
    setAddresses((previous) => previous.filter((item) => item !== email));
  }

  function resendInvitation(invitationId: string) {
    setInvitations((previous) =>
      previous.map((invitation) => {
        if (invitation.id !== invitationId) {
          return invitation;
        }
        return resentOf(invitation);
      })
    );
  }

  function revokeInvitation(invitationId: string) {
    setInvitations((previous) =>
      previous.filter((invitation) => invitation.id !== invitationId)
    );
  }

  function commitSend() {
    const newEntries = sendable.filter((entry) => entry.state === 'new');
    const newEmails = newEntries.map((entry) => entry.email);
    const resentEntries = sendable.filter((entry) => entry.state === 'pending');
    const resentEmails = resentEntries.map((entry) => entry.email);
    const sentEmails = sendable.map((entry) => entry.email);
    const created = newEmails.map((email) => invitationOf(email, role));
    setInvitations((previous) => {
      const refreshed = previous.map((invitation) => {
        const isResent = resentEmails.includes(invitation.email);
        if (!isResent) {
          return invitation;
        }
        return resentOf(invitation);
      });
      return [...created, ...refreshed];
    });
    setAddresses((previous) =>
      previous.filter((email) => !sentEmails.includes(email))
    );
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendDisabled) {
      return;
    }
    action.run(commitSend);
  }

  function sendFromShortcut() {
    if (isSendDisabled) {
      return;
    }
    action.run(commitSend);
  }

  return (
    <>
      <ModalHeader>
        <TeamContext />
        <ModalTitle>Invite people</ModalTitle>
        <ModalDescription>
          They get an e-mail with a link to join the team
        </ModalDescription>
      </ModalHeader>
      <form onSubmit={send} autoComplete='off' className='flex flex-col gap-2'>
        <div className='flex items-start gap-2'>
          <AddressField
            label='E-mail addresses'
            chips={chipsOf(entries)}
            onAdd={addAddresses}
            onRemove={removeAddress}
            onSubmitShortcut={sendFromShortcut}
            describedBy={summaryId}
            isInvalid={hasInvalid}
            className='flex-1'
            trailing={
              <RoleSelect
                label='Role of the people invited'
                value={role}
                options={TEAM_ROLES}
                onValueChange={setRole}
              />
            }
          />
          <ActionButton
            type='submit'
            size='lg'
            state={action.state}
            disabled={isSendDisabled}
            idleIcon={<SendIcon />}
            labels={{
              idle: inviteLabelOf(sendableCount),
              working: 'Sending',
              done: 'Sent',
            }}
          />
        </div>
        <AnimatedSize>
          <div id={summaryId} className='flex flex-col gap-1'>
            <p className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <InfoIcon className='size-3.5 shrink-0' />
              Press Enter or a comma after each address, or paste a list
            </p>
            {hasSummary && (
              <ul className='text-muted-foreground flex flex-col gap-0.5 pl-5 text-xs'>
                {summaryLines.map((line) => (
                  <li
                    key={line.state}
                    className={cn(
                      line.state === 'invalid' && 'text-destructive-ink'
                    )}
                  >
                    {summaryLineOf(line.state, line.count)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </AnimatedSize>
      </form>
      <PendingList
        invitations={invitations}
        onResend={resendInvitation}
        onRevoke={revokeInvitation}
      />
    </>
  );
}

export default function Modal01() {
  return (
    <ModalPreview triggerLabel='Open the invite dialog' size='lg'>
      <InvitePeople />
    </ModalPreview>
  );
}
