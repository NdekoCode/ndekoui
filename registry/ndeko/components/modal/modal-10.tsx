'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CalendarCheckIcon,
  CalendarIcon,
  PlusIcon,
  VideoIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Badge } from '@/registry/ndeko/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

import {
  ActionButton,
  useTimedAction,
  type ActionLabels,
} from './_parts/action-button';
import { ChoiceSegments, type SegmentOption } from './_parts/choice-segments';
import { CopyButton } from './_parts/copy-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf } from './_parts/motion';
import {
  CURRENT_USER,
  PEOPLE,
  firstNameOf,
  type Person,
} from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';

type Slot = { id: string; day: string; short: string; startMinutes: number };

type Duration = '30' | '45' | '60';

const SLOTS: Slot[] = [
  {
    id: 'tue-1000',
    day: 'Tuesday 10 November',
    short: 'Tue 10',
    startMinutes: 600,
  },
  {
    id: 'tue-1430',
    day: 'Tuesday 10 November',
    short: 'Tue 10',
    startMinutes: 870,
  },
  {
    id: 'wed-0930',
    day: 'Wednesday 11 November',
    short: 'Wed 11',
    startMinutes: 570,
  },
  {
    id: 'thu-1600',
    day: 'Thursday 12 November',
    short: 'Thu 12',
    startMinutes: 960,
  },
];

const DURATIONS: SegmentOption<Duration>[] = [
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
];

const FIRST_ATTENDEES = ['lucas', 'priya', 'hana'];

const MEETING_LINK = 'meet.lattice.example/prd-review-4821';

const MINUTES_PER_HOUR = 60;

const SCHEDULE_LABELS: ActionLabels = {
  idle: 'Schedule',
  working: 'Scheduling',
  done: 'Scheduled',
};

const SLOT_CHIP = [
  'flex h-7 cursor-pointer items-center gap-1.5 rounded-full bg-card px-3 text-xs font-medium tabular-nums text-muted-foreground',
  'shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 transition-[color,background-color,box-shadow] duration-150',
  'hover:text-foreground dark:bg-foreground/[0.04]',
  'has-data-checked:bg-primary/10 has-data-checked:text-primary-ink has-data-checked:ring-primary/35',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

function padded(value: number) {
  return String(value).padStart(2, '0');
}

function clockOf(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return `${padded(hours)}:${padded(minutes)}`;
}

function peopleLineOf(count: number) {
  if (count === 0) {
    return 'just you';
  }
  if (count === 1) {
    return 'with 1 person';
  }
  return `with ${count} people`;
}

function summaryOf(slot: Slot, duration: Duration, attendeeCount: number) {
  const endMinutes = slot.startMinutes + Number(duration);
  const start = clockOf(slot.startMinutes);
  const end = clockOf(endMinutes);
  const people = peopleLineOf(attendeeCount);
  return `${slot.day}, ${start} to ${end}, ${people}`;
}

function slotById(slotId: string) {
  return SLOTS.find((slot) => slot.id === slotId) ?? SLOTS[0];
}

function AttendeeChip({
  person,
  allowsLayout,
  onRemove,
}: {
  person: Person;
  allowsLayout: boolean;
  onRemove: (personId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const firstName = firstNameOf(person);

  function remove() {
    onRemove(person.id);
  }

  return (
    <motion.li
      layout={allowsLayout}
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='flex'
    >
      <Badge
        variant='secondary'
        className='h-7 gap-1.5 rounded-full pr-0.5 pl-0.5 text-[13px]'
      >
        <Avatar className='size-5 text-[9px]'>
          {person.avatar && <AvatarImage src={person.avatar} alt='' />}
          <AvatarFallback>{person.initials}</AvatarFallback>
        </Avatar>
        {firstName}
        <button
          type='button'
          aria-label={`Remove ${person.name}`}
          onClick={remove}
          className='hover:bg-foreground/10 focus-visible:ring-ring/25 flex size-6 cursor-pointer items-center justify-center rounded-full opacity-70 transition-[opacity,background-color] duration-150 outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]'
        >
          <XIcon className='size-3' />
        </button>
      </Badge>
    </motion.li>
  );
}

function AddAttendeeSlot({
  candidates,
  onAdd,
}: {
  candidates: Person[];
  onAdd: (personId: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type='button'
            aria-label='Add an attendee'
            className='hairline-border border-foreground/25 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-ring/25 data-popup-open:bg-foreground/5 flex size-7 cursor-pointer items-center justify-center rounded-full border-dashed outline-none focus-visible:ring-[3px]'
          />
        }
      >
        <PlusIcon className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Invite to the meeting</DropdownMenuLabel>
        {candidates.map((person) => {
          function add() {
            onAdd(person.id);
          }

          return (
            <DropdownMenuItem key={person.id} onClick={add}>
              <PersonAvatar person={person} size='sm' />
              {person.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ScheduleContent() {
  const [title, setTitle] = useState('Review the onboarding checklist');
  const [attendeeIds, setAttendeeIds] = useState<string[]>(FIRST_ATTENDEES);
  const [slotId, setSlotId] = useState(SLOTS[0].id);
  const [duration, setDuration] = useState<Duration>('30');
  const { state, run } = useTimedAction();
  const shouldReduceMotion = usePrefersReducedMotion();
  const allowsLayout = !shouldReduceMotion;
  const titleId = useId();
  const attendeesId = useId();
  const slotsId = useId();
  const linkId = useId();
  const others = PEOPLE.filter((person) => person.id !== CURRENT_USER.id);
  const attendees = others.filter((person) => attendeeIds.includes(person.id));
  const candidates = others.filter(
    (person) => !attendeeIds.includes(person.id)
  );
  const hasCandidates = candidates.length > 0;
  const slot = slotById(slotId);
  const summary = summaryOf(slot, duration, attendees.length);
  const hasTitle = title.trim().length > 0;
  const hasAttendees = attendees.length > 0;
  const isReady = hasTitle && hasAttendees;
  const isIdle = state === 'idle';
  const isScheduleDisabled = isIdle && !isReady;

  function changeTitle(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function addAttendee(personId: string) {
    setAttendeeIds((previous) => [...previous, personId]);
  }

  function removeAttendee(personId: string) {
    setAttendeeIds((previous) => previous.filter((id) => id !== personId));
  }

  function changeSlot(value: unknown) {
    const picked = SLOTS.find((candidate) => candidate.id === value);
    if (picked) {
      setSlotId(picked.id);
    }
  }

  function schedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReady) {
      return;
    }
    run(() => {});
  }

  return (
    <form onSubmit={schedule} className='flex flex-col gap-5'>
      <ModalHeader>
        <ModalTitle>Schedule a meeting</ModalTitle>
        <ModalDescription>
          Everyone gets an invitation with the link and the agenda
        </ModalDescription>
      </ModalHeader>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={titleId} className='text-[13px] font-medium'>
          Title
        </label>
        <Input id={titleId} value={title} onChange={changeTitle} />
      </div>
      <div className='flex flex-col gap-2'>
        <span id={attendeesId} className='text-[13px] font-medium'>
          Attendees
        </span>
        <ul
          aria-labelledby={attendeesId}
          className='relative flex flex-wrap items-center gap-1.5'
        >
          <AnimatePresence initial={false} mode='popLayout'>
            {attendees.map((person) => (
              <AttendeeChip
                key={person.id}
                person={person}
                allowsLayout={allowsLayout}
                onRemove={removeAttendee}
              />
            ))}
          </AnimatePresence>
          {hasCandidates && (
            <motion.li layout={allowsLayout} className='flex'>
              <AddAttendeeSlot candidates={candidates} onAdd={addAttendee} />
            </motion.li>
          )}
        </ul>
      </div>
      <div className='flex flex-col gap-2'>
        <div className='flex items-baseline justify-between gap-3'>
          <span id={slotsId} className='text-[13px] font-medium'>
            Next free slots for everyone
          </span>
          <span className='text-muted-foreground text-xs'>Your time, CET</span>
        </div>
        <RadioGroup
          aria-labelledby={slotsId}
          value={slotId}
          onValueChange={changeSlot}
          className='flex flex-wrap gap-1.5'
        >
          {SLOTS.map((candidate) => (
            <label key={candidate.id} className={SLOT_CHIP}>
              <RadioGroupItem value={candidate.id} className='sr-only' />
              {`${candidate.short} · ${clockOf(candidate.startMinutes)}`}
            </label>
          ))}
        </RadioGroup>
      </div>
      <div className='flex flex-col gap-2'>
        <span className='text-[13px] font-medium'>Duration</span>
        <ChoiceSegments
          label='Duration'
          value={duration}
          options={DURATIONS}
          onValueChange={setDuration}
        />
      </div>
      <div className='flex flex-col gap-1.5'>
        <label htmlFor={linkId} className='text-[13px] font-medium'>
          Meeting link
        </label>
        <div className='flex items-center gap-2'>
          <div className='relative min-w-0 flex-1'>
            <VideoIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
            <Input
              id={linkId}
              readOnly
              value={MEETING_LINK}
              className='text-muted-foreground pl-8'
            />
          </div>
          <CopyButton
            text={`https://${MEETING_LINK}`}
            size='icon'
            aria-label='Copy the meeting link'
            announcement='Meeting link copied'
          />
        </div>
      </div>
      <p className='flex items-start gap-2 text-[13px]'>
        <CalendarIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
        <Swap swapKey={summary} kind='label'>
          {summary}
        </Swap>
      </p>
      <ModalFooter>
        <ModalCloseButton type='button' variant='ghost'>
          Cancel
        </ModalCloseButton>
        <ActionButton
          type='submit'
          state={state}
          labels={SCHEDULE_LABELS}
          idleIcon={<CalendarCheckIcon />}
          disabled={isScheduleDisabled}
        />
      </ModalFooter>
    </form>
  );
}

export default function Modal10() {
  return (
    <ModalPreview triggerLabel='Open schedule a meeting' size='md'>
      <ScheduleContent />
    </ModalPreview>
  );
}
