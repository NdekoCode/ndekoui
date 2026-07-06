'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  CircleCheckIcon,
  SearchIcon,
  UserRoundPlusIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Input } from '@/registry/ndeko/ui/input';

import {
  ActionButton,
  useTimedAction,
  type ActionLabels,
} from './_parts/action-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf, rowVariantsOf } from './_parts/motion';
import {
  PEOPLE,
  TEAM_NAME,
  WORKSPACE_NAME,
  firstNameOf,
  type Person,
} from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';

const TEAM_SIZE = 5;

const STACK_LIMIT = 4;

const OUTSIDE_THE_TEAM: Person[] = [
  {
    id: 'nia',
    name: 'Nia Adeyemi',
    email: 'nia@lattice.example',
    title: 'Sales engineer',
    presence: 'online',
  },
  {
    id: 'ravi',
    name: 'Ravi Menon',
    email: 'ravi@lattice.example',
    title: 'Security engineer',
    presence: 'tracking',
  },
  {
    id: 'elif',
    name: 'Elif Demir',
    email: 'elif@lattice.example',
    title: 'Finance lead',
    presence: 'away',
  },
];

const DIRECTORY: Person[] = [...PEOPLE.slice(TEAM_SIZE), ...OUTSIDE_THE_TEAM];

const FIRST_PICKS = ['zola', 'theo'];

function matchesQuery(person: Person, query: string) {
  const searchable = `${person.name} ${person.title}`;
  return searchable.toLowerCase().includes(query);
}

function addLabelOf(count: number) {
  if (count === 0) {
    return 'Add members';
  }
  if (count === 1) {
    return 'Add 1 member';
  }
  return `Add ${count} members`;
}

function labelsOf(count: number): ActionLabels {
  return { idle: addLabelOf(count), working: 'Adding', done: 'Added' };
}

function namesSentenceOf(people: Person[]) {
  const names = people.map(firstNameOf);
  if (names.length === 1) {
    return names[0];
  }
  const last = names.at(-1);
  const others = names.slice(0, -1).join(', ');
  return `${others} and ${last}`;
}

function availabilityOf(count: number) {
  if (count === 0) {
    return `Everyone in ${WORKSPACE_NAME} is in ${TEAM_NAME}`;
  }
  if (count === 1) {
    return `1 person in ${WORKSPACE_NAME} is not in ${TEAM_NAME}`;
  }
  return `${count} people in ${WORKSPACE_NAME} are not in ${TEAM_NAME}`;
}

function noteOf(joined: Person[], availableCount: number) {
  if (joined.length === 0) {
    return availabilityOf(availableCount);
  }
  return `${namesSentenceOf(joined)} joined ${TEAM_NAME}`;
}

function PickedStack({
  picked,
  onClear,
}: {
  picked: Person[];
  onClear: () => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);
  const allowsLayout = !shouldReduceMotion;
  const shown = picked.slice(0, STACK_LIMIT);
  const hiddenCount = picked.length - shown.length;
  const hasHidden = hiddenCount > 0;
  const hasPicked = picked.length > 0;
  const lineKey = String(hasPicked);

  return (
    <div className='flex h-8 items-center gap-2.5'>
      <div className='relative flex items-center -space-x-1.5'>
        <AnimatePresence initial={false} mode='popLayout'>
          {shown.map((person) => (
            <motion.span
              key={person.id}
              layout={allowsLayout}
              variants={variants}
              initial='hidden'
              animate='shown'
              exit='hidden'
              className='ring-popover flex rounded-full ring-2'
            >
              <PersonAvatar person={person} size='sm' />
            </motion.span>
          ))}
        </AnimatePresence>
        {hasHidden && (
          <span className='keycap-3d ring-popover text-muted-foreground flex size-6 items-center justify-center rounded-full text-[10px] font-medium ring-2'>
            +
            <MotionNumber value={hiddenCount} />
          </span>
        )}
      </div>
      <Swap swapKey={lineKey} kind='label' className='text-xs'>
        {hasPicked && (
          <span className='text-foreground flex items-center gap-1 font-medium'>
            <MotionNumber value={picked.length} />
            picked
          </span>
        )}
        {!hasPicked && (
          <span className='text-muted-foreground'>Pick the people to add</span>
        )}
      </Swap>
      {hasPicked && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onClear}
          className='text-muted-foreground ml-auto'
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function DirectoryRow({
  person,
  isPicked,
  isHidden,
  isDisabled,
  onToggle,
}: {
  person: Person;
  isPicked: boolean;
  isHidden: boolean;
  isDisabled: boolean;
  onToggle: (personId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = rowVariantsOf(shouldReduceMotion);

  function toggle() {
    onToggle(person.id);
  }

  return (
    <motion.li
      hidden={isHidden}
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
    >
      <label className='hover:bg-foreground/[0.03] has-data-checked:bg-primary/[0.05] flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150'>
        <Checkbox
          checked={isPicked}
          disabled={isDisabled}
          onCheckedChange={toggle}
        />
        <PersonAvatar person={person} presence={person.presence} />
        <span className='flex min-w-0 flex-1 flex-col'>
          <span className='truncate text-[13px] font-medium'>
            {person.name}
          </span>
          <span className='text-muted-foreground truncate text-xs'>
            {person.title}
          </span>
        </span>
      </label>
    </motion.li>
  );
}

function NoMatch({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className='flex flex-col items-center gap-3 py-8 text-center'>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium'>
          {`No one in ${WORKSPACE_NAME} matches “${query}”`}
        </p>
        <p className='text-muted-foreground text-[13px]'>
          Search by first name, last name or job title
        </p>
      </div>
      <Button variant='outline' size='sm' onClick={onClear}>
        <XIcon />
        Clear search
      </Button>
    </div>
  );
}

function EveryoneIn() {
  return (
    <div className='flex flex-col items-center gap-1 py-8 text-center'>
      <p className='text-sm font-medium'>
        {`Everyone in ${WORKSPACE_NAME} is in ${TEAM_NAME}`}
      </p>
      <p className='text-muted-foreground text-[13px]'>
        Invite people by e-mail to grow the team
      </p>
    </div>
  );
}

function AddMembersContent() {
  const [directory, setDirectory] = useState<Person[]>(DIRECTORY);
  const [pickedIds, setPickedIds] = useState<string[]>(FIRST_PICKS);
  const [joined, setJoined] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const { state, run, isBusy } = useTimedAction();
  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;
  const matchCount = directory.filter((person) =>
    matchesQuery(person, normalizedQuery)
  ).length;
  const hasNoMatch = hasQuery && matchCount === 0;
  const isDirectoryEmpty = directory.length === 0;
  const picked = directory.filter((person) => pickedIds.includes(person.id));
  const hasPicked = picked.length > 0;
  const isIdle = state === 'idle';
  const isAddDisabled = isIdle && !hasPicked;
  const hasJoined = joined.length > 0;
  const note = noteOf(joined, directory.length);

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearQuery() {
    setQuery('');
  }

  function clearPicks() {
    setPickedIds([]);
  }

  function togglePerson(personId: string) {
    setPickedIds((previous) => {
      if (previous.includes(personId)) {
        return previous.filter((id) => id !== personId);
      }
      return [...previous, personId];
    });
  }

  function addPicked() {
    run(() => {
      setDirectory((previous) =>
        previous.filter((person) => !pickedIds.includes(person.id))
      );
      setJoined(picked);
      setPickedIds([]);
    });
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>{`Add members to ${TEAM_NAME}`}</ModalTitle>
        <ModalDescription>
          {`People already in ${WORKSPACE_NAME} join the team at once, without an e-mail`}
        </ModalDescription>
      </ModalHeader>
      <div className='relative'>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
        <Input
          type='search'
          value={query}
          placeholder='Search by name or job title'
          aria-label={`Search people in ${WORKSPACE_NAME}`}
          onChange={changeQuery}
          className='pl-8'
        />
      </div>
      <PickedStack picked={picked} onClear={clearPicks} />
      {hasNoMatch && <NoMatch query={query.trim()} onClear={clearQuery} />}
      {isDirectoryEmpty && <EveryoneIn />}
      <ul
        aria-label={`People in ${WORKSPACE_NAME} outside ${TEAM_NAME}`}
        className='-mx-2 -mt-2 flex max-h-64 flex-col overflow-y-auto'
      >
        <AnimatePresence initial={false}>
          {directory.map((person) => {
            const isPicked = pickedIds.includes(person.id);
            const isMatch = matchesQuery(person, normalizedQuery);

            return (
              <DirectoryRow
                key={person.id}
                person={person}
                isPicked={isPicked}
                isHidden={!isMatch}
                isDisabled={isBusy}
                onToggle={togglePerson}
              />
            );
          })}
        </AnimatePresence>
      </ul>
      <ModalFooter>
        <p className='text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs sm:mr-auto'>
          {hasJoined && (
            <CircleCheckIcon className='text-success-foreground size-3.5 shrink-0' />
          )}
          <Swap swapKey={note} kind='label' className='min-w-0'>
            <span className='truncate'>{note}</span>
          </Swap>
        </p>
        <ModalCloseButton variant='ghost'>Done</ModalCloseButton>
        <ActionButton
          state={state}
          labels={labelsOf(picked.length)}
          idleIcon={<UserRoundPlusIcon />}
          disabled={isAddDisabled}
          onClick={addPicked}
        />
      </ModalFooter>
    </>
  );
}

export default function Modal08() {
  return (
    <ModalPreview triggerLabel='Open add members' size='md'>
      <AddMembersContent />
    </ModalPreview>
  );
}
