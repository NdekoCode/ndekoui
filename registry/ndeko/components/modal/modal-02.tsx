'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AlertCircleIcon,
  CheckIcon,
  PlusIcon,
  SendIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Chip } from '@/registry/ndeko/ui/chip';

import { ActionButton, useTimedAction } from './_parts/action-button';
import { AddressField, type FieldChip } from './_parts/address-field';
import {
  ADDRESS_LOOK,
  mergeAddresses,
  splitAddresses,
  stateOfAddress,
  type AddressLook,
  type AddressState,
} from './_parts/invite-emails';
import {
  ModalDescription,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf, rowVariantsOf } from './_parts/motion';
import { PEOPLE, WORKSPACE_NAME } from './_parts/people';
import { PendingAvatar, PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';

type InviteStatus = 'sent' | 'joined';

type RecentInvite = { email: string; status: InviteStatus };

type SeatState = 'used' | 'reserved' | 'free';

/** People in the workspace who are not in the recent list, each holding a seat. */
const OTHER_MEMBERS = 3;

const SEATS_PER_STEP = 5;

const RECENT_INVITES: RecentInvite[] = [
  { email: 'priya@lattice.example', status: 'joined' },
  { email: 'noor.haddad@lattice.example', status: 'sent' },
  { email: 'mateo@lattice.example', status: 'joined' },
  { email: 'kofi.mensah@lattice.example', status: 'sent' },
];

const NO_SEAT_LOOK: AddressLook = {
  color: 'var(--destructive)',
  icon: AlertCircleIcon,
  hint: 'No seat left for this address',
};

const MEMBER_EMAILS = new Set(PEOPLE.map((person) => person.email));

type FieldEntry = { email: string; state: AddressState; hasSeat: boolean };

function seatStateOf(index: number, used: number, reserved: number): SeatState {
  if (index < used) {
    return 'used';
  }
  const reservedEnd = used + reserved;
  if (index < reservedEnd) {
    return 'reserved';
  }
  return 'free';
}

const SEAT_CLASS: Record<SeatState, string> = {
  used: 'bg-primary border-transparent',
  reserved: 'hairline-border border-dashed border-primary bg-primary/10',
  free: 'bg-foreground/[0.08] border-transparent',
};

function lookOf(entry: FieldEntry): AddressLook {
  const isNew = entry.state === 'new';
  const lacksSeat = isNew && !entry.hasSeat;
  if (lacksSeat) {
    return NO_SEAT_LOOK;
  }
  return ADDRESS_LOOK[entry.state];
}

function entriesOf(
  addresses: string[],
  pendingEmails: ReadonlySet<string>,
  freeSeats: number
) {
  const context = { memberEmails: MEMBER_EMAILS, pendingEmails };
  const entries: FieldEntry[] = [];
  let seatsLeft = freeSeats;
  for (const email of addresses) {
    const state = stateOfAddress(email, context);
    const isNew = state === 'new';
    const hasSeat = isNew && seatsLeft > 0;
    if (hasSeat) {
      seatsLeft -= 1;
    }
    entries.push({ email, state, hasSeat });
  }
  return entries;
}

function seatLineOf(reserved: number, lacking: number, freeSeats: number) {
  if (lacking === 1) {
    return '1 address has no seat left. Add seats or remove it';
  }
  if (lacking > 1) {
    return `${lacking} addresses have no seat left. Add seats or remove them`;
  }
  if (reserved === 1) {
    return 'The address below takes 1 more seat';
  }
  if (reserved > 1) {
    return `The ${reserved} addresses below take ${reserved} more seats`;
  }
  if (freeSeats === 1) {
    return '1 seat left on your plan';
  }
  return `${freeSeats} seats left on your plan`;
}

function sendLabelOf(count: number) {
  if (count > 1) {
    return `Send ${count} invitations`;
  }
  return 'Send invitation';
}

const STATUS_LOOK: Record<
  InviteStatus,
  { label: string; color: string; hasCheck: boolean }
> = {
  sent: {
    label: 'Invite sent',
    color: 'var(--muted-foreground)',
    hasCheck: false,
  },
  joined: { label: 'Joined', color: 'var(--success)', hasCheck: true },
};

function RecentRow({ invite }: { invite: RecentInvite }) {
  const person = PEOPLE.find((candidate) => candidate.email === invite.email);
  const look = STATUS_LOOK[invite.status];

  return (
    <div className='flex min-h-12 items-center gap-3 px-3 py-2'>
      {person && <PersonAvatar person={person} />}
      {!person && <PendingAvatar />}
      <p className='min-w-0 flex-1 truncate text-[13px]'>{invite.email}</p>
      <Chip color={look.color}>
        {look.hasCheck && <CheckIcon strokeWidth={2.5} />}
        {look.label}
      </Chip>
    </div>
  );
}

function SeatMeter({
  capacity,
  used,
  reserved,
  line,
  isShort,
  onAddSeats,
}: {
  capacity: number;
  used: number;
  reserved: number;
  line: string;
  isShort: boolean;
  onAddSeats: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const cellVariants = chipVariantsOf(shouldReduceMotion);
  const allowsLayout = !shouldReduceMotion;
  const labelId = useId();
  const addAction = useTimedAction();
  const seats = Array.from({ length: capacity }, (_, index) => index);

  function addSeats() {
    addAction.run(onAddSeats);
  }

  return (
    <div className='bg-foreground/[0.03] flex flex-col gap-3 rounded-xl p-4'>
      <div className='flex items-start gap-3'>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
          <p id={labelId} className='text-sm font-medium tabular-nums'>
            <MotionNumber value={used} />
            {' of '}
            <MotionNumber value={capacity} />
            {' seats used'}
          </p>
          <Swap
            swapKey={line}
            kind='label'
            className={cn(
              'flex min-w-0 text-xs',
              isShort && 'text-destructive-ink',
              !isShort && 'text-muted-foreground'
            )}
            contentClassName='max-w-full min-w-0 whitespace-normal'
          >
            {line}
          </Swap>
        </div>
        <ActionButton
          variant='outline'
          size='sm'
          state={addAction.state}
          onClick={addSeats}
          idleIcon={<PlusIcon />}
          labels={{
            idle: `Add ${SEATS_PER_STEP} seats`,
            working: 'Adding',
            done: 'Added',
          }}
        />
      </div>
      <div
        role='meter'
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={used}
        className='flex gap-1'
      >
        <AnimatePresence initial={false}>
          {seats.map((index) => {
            const seatState = seatStateOf(index, used, reserved);

            return (
              <motion.span
                key={index}
                layout={allowsLayout}
                variants={cellVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
                className={cn(
                  'h-2 min-w-0 flex-1 rounded-full border transition-[background-color,border-color] duration-300 ease-(--ease-out-strong)',
                  SEAT_CLASS[seatState]
                )}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InviteWithSeats() {
  const [capacity, setCapacity] = useState(10);
  const [recent, setRecent] = useState<RecentInvite[]>(RECENT_INVITES);
  const [addresses, setAddresses] = useState<string[]>([
    'ada.lindqvist@lattice.example',
    'bruno.costa@lattice.example',
    'lea.martin@lattice.example',
    'sami.k@lattice.example',
  ]);
  const action = useTimedAction();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const used = OTHER_MEMBERS + recent.length;
  const freeSeats = Math.max(0, capacity - used);
  const pendingEmails = new Set(recent.map((invite) => invite.email));
  const entries = entriesOf(addresses, pendingEmails, freeSeats);
  const seated = entries.filter((entry) => entry.hasSeat);
  const reserved = seated.length;
  const lackingEntries = entries.filter((entry) => {
    const isNew = entry.state === 'new';
    return isNew && !entry.hasSeat;
  });
  const lacking = lackingEntries.length;
  const isShort = lacking > 0;
  const line = seatLineOf(reserved, lacking, freeSeats);
  const chips: FieldChip[] = entries.map((entry) => ({
    email: entry.email,
    look: lookOf(entry),
  }));
  const canSend = reserved > 0;

  function addAddresses(text: string) {
    const added = splitAddresses(text);
    setAddresses((previous) => mergeAddresses(previous, added));
  }

  function removeAddress(email: string) {
    setAddresses((previous) => previous.filter((item) => item !== email));
  }

  function addSeats() {
    setCapacity((previous) => previous + SEATS_PER_STEP);
  }

  function commitSend() {
    const sentEmails = seated.map((entry) => entry.email);
    const created = sentEmails.map((email) => ({
      email,
      status: 'sent' as const,
    }));
    setRecent((previous) => [...created, ...previous]);
    setAddresses((previous) =>
      previous.filter((email) => !sentEmails.includes(email))
    );
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    action.run(commitSend);
  }

  function sendFromShortcut() {
    if (!canSend) {
      return;
    }
    action.run(commitSend);
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>{`Invite people to ${WORKSPACE_NAME}`}</ModalTitle>
        <ModalDescription>
          Everyone who joins or is invited takes one seat of your plan
        </ModalDescription>
      </ModalHeader>
      <SeatMeter
        capacity={capacity}
        used={used}
        reserved={reserved}
        line={line}
        isShort={isShort}
        onAddSeats={addSeats}
      />
      <form onSubmit={send} autoComplete='off' className='flex flex-col gap-2'>
        <AddressField
          label='E-mail addresses'
          chips={chips}
          onAdd={addAddresses}
          onRemove={removeAddress}
          onSubmitShortcut={sendFromShortcut}
          isInvalid={isShort}
        />
        <div className='flex justify-end'>
          <ActionButton
            type='submit'
            state={action.state}
            disabled={!canSend}
            idleIcon={<SendIcon />}
            labels={{
              idle: sendLabelOf(reserved),
              working: 'Sending',
              done: 'Sent',
            }}
          />
        </div>
      </form>
      <section className='flex flex-col gap-2'>
        <h3 className='text-muted-foreground text-xs font-medium'>
          Recent invitations
        </h3>
        <ul className='bg-card hairline-ring ring-border flex flex-col overflow-hidden rounded-xl py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <AnimatePresence initial={false}>
            {recent.map((invite) => (
              <motion.li
                key={invite.email}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <RecentRow invite={invite} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </>
  );
}

export default function Modal02() {
  return (
    <ModalPreview triggerLabel='Open the seat limit dialog' size='lg'>
      <InviteWithSeats />
    </ModalPreview>
  );
}
