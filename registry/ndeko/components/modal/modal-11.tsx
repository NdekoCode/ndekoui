'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  AtSignIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
} from '@/registry/ndeko/lib/icons';
import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';

import {
  ModalDescription,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { chipVariantsOf } from './_parts/motion';
import { PEOPLE, type Person } from './_parts/people';
import { PendingAvatar, PersonAvatar } from './_parts/person-avatar';
import { Swap } from './_parts/swap';

type ResultKind = 'member' | 'pending' | 'guest';

type SearchResult = {
  id: string;
  kind: ResultKind;
  name: string;
  email: string;
  person: Person | null;
};

type ResultGroup = { kind: ResultKind; label: string; results: SearchResult[] };

type TextPart = { text: string; isMatch: boolean };

const GROUP_LABEL: Record<ResultKind, string> = {
  member: 'Members',
  pending: 'Pending invitations',
  guest: 'Guests',
};

const GROUP_ORDER: ResultKind[] = ['member', 'pending', 'guest'];

const GUESTS: Person[] = [
  {
    id: 'malia',
    name: 'Malia Fonoti',
    initials: 'MF',
    email: 'malia@fernwick.example',
    title: 'Client, Fernwick Studio',
    presence: 'offline',
  },
  {
    id: 'andres',
    name: 'Andrés Molina',
    initials: 'AM',
    email: 'andres@fernwick.example',
    title: 'Client, Fernwick Studio',
    presence: 'online',
  },
];

const PENDING_EMAILS = [
  'noor.haddad@lattice.example',
  'kofi.mensah@lattice.example',
  'mariam.saleh@northfield.example',
];

const EVERYONE: SearchResult[] = [
  ...PEOPLE.map((person) => ({
    id: person.id,
    kind: 'member' as const,
    name: person.name,
    email: person.email,
    person,
  })),
  ...PENDING_EMAILS.map((email) => ({
    id: email,
    kind: 'pending' as const,
    name: email,
    email,
    person: null,
  })),
  ...GUESTS.map((person) => ({
    id: person.id,
    kind: 'guest' as const,
    name: person.name,
    email: person.email,
    person,
  })),
];

const HIGHLIGHT_TRAVEL: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.18,
};

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return HIGHLIGHT_TRAVEL;
}

function matchesQuery(result: SearchResult, query: string) {
  const name = result.name.toLowerCase();
  const email = result.email.toLowerCase();
  const isNameMatch = name.includes(query);
  const isEmailMatch = email.includes(query);
  return isNameMatch || isEmailMatch;
}

function partsOf(text: string, query: string): TextPart[] {
  const start = text.toLowerCase().indexOf(query);
  const hasQuery = query.length > 0;
  const isFound = start >= 0;
  const hasMatch = hasQuery && isFound;
  if (!hasMatch) {
    return [{ text, isMatch: false }];
  }
  const end = start + query.length;
  return [
    { text: text.slice(0, start), isMatch: false },
    { text: text.slice(start, end), isMatch: true },
    { text: text.slice(end), isMatch: false },
  ];
}

function groupsOf(results: SearchResult[]) {
  const groups: ResultGroup[] = [];
  for (const kind of GROUP_ORDER) {
    const inGroup = results.filter((result) => result.kind === kind);
    if (inGroup.length === 0) {
      continue;
    }
    groups.push({ kind, label: GROUP_LABEL[kind], results: inGroup });
  }
  return groups;
}

function nextIndexOf(current: number, step: number, count: number) {
  const moved = current + step;
  return (moved + count) % count;
}

function pickedLineOf(picked: SearchResult | null) {
  if (!picked) {
    return 'Pick someone to mention in the comment';
  }
  return `${picked.name} is mentioned in the comment`;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = partsOf(text, query);

  return (
    <>
      {parts.map((part, index) => {
        if (part.isMatch) {
          return (
            <mark
              key={index}
              className='bg-primary/15 text-foreground rounded-[3px]'
            >
              {part.text}
            </mark>
          );
        }
        return <span key={index}>{part.text}</span>;
      })}
    </>
  );
}

function ResultAvatar({ result }: { result: SearchResult }) {
  if (result.person) {
    return (
      <PersonAvatar
        person={result.person}
        size='sm'
        presence={result.person.presence}
      />
    );
  }
  return <PendingAvatar email={result.email} size='sm' />;
}

function ResultRow({
  result,
  optionId,
  query,
  isActive,
  isPicked,
  highlightId,
  onHover,
  onPick,
}: {
  result: SearchResult;
  optionId: string;
  query: string;
  isActive: boolean;
  isPicked: boolean;
  highlightId: string;
  onHover: (resultId: string) => void;
  onPick: (resultId: string) => void;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const travel = travelOf(shouldReduceMotion);
  const isPending = result.kind === 'pending';
  const isGuest = result.kind === 'guest';
  const showsEmail = !isPending;

  function hover() {
    onHover(result.id);
  }

  function pick() {
    onPick(result.id);
  }

  return (
    <li
      id={optionId}
      role='option'
      aria-selected={isActive}
      onPointerMove={hover}
      onClick={pick}
      className='relative isolate flex h-10 cursor-pointer items-center gap-2.5 rounded-md px-2'
    >
      {isActive && (
        <motion.span
          layoutId={highlightId}
          transition={travel}
          aria-hidden='true'
          className='bg-foreground/[0.05] absolute inset-0 -z-10 rounded-md'
        />
      )}
      <ResultAvatar result={result} />
      <span className='flex min-w-0 flex-1 items-baseline gap-2'>
        <span className='truncate text-[13px] font-medium'>
          <Highlighted text={result.name} query={query} />
        </span>
        {showsEmail && (
          <span className='text-muted-foreground truncate text-xs'>
            <Highlighted text={result.email} query={query} />
          </span>
        )}
      </span>
      {isGuest && (
        <Badge
          variant='secondary'
          className='text-muted-foreground font-normal'
        >
          Guest
        </Badge>
      )}
      {isPicked && <SelectedMark label='Mentioned' />}
    </li>
  );
}

function MentionToken() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = chipVariantsOf(shouldReduceMotion);

  return (
    <motion.span
      variants={variants}
      initial='hidden'
      animate='shown'
      exit='hidden'
      className='flex'
    >
      <Chip color='var(--primary)' className='h-6 gap-0.5 px-1.5 text-[13px]'>
        <AtSignIcon className='size-3.5' />
        People
      </Chip>
    </motion.span>
  );
}

function SearchPeopleContent() {
  const [query, setQuery] = useState('ma');
  const [hasToken, setHasToken] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string | null>('priya');
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = useId();
  const highlightId = useId();
  const normalizedQuery = query.trim().toLowerCase();
  const results = EVERYONE.filter((result) =>
    matchesQuery(result, normalizedQuery)
  );
  const groups = groupsOf(results);
  const hasResults = results.length > 0;
  const showsResults = hasToken && hasResults;
  const showsNoMatch = hasToken && !hasResults;
  const activeResult = results.find((result) => result.id === activeId);
  const shownActive = activeResult ?? results[0] ?? null;
  const shownActiveId = shownActive?.id ?? null;
  const picked = EVERYONE.find((result) => result.id === pickedId) ?? null;
  const pickedLine = pickedLineOf(picked);

  function optionIdOf(resultId: string) {
    return `${baseId}-${resultId}`;
  }

  const activeOptionId = shownActiveId && optionIdOf(shownActiveId);

  function focusInput() {
    inputRef.current?.focus();
  }

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const typesTheToken = !hasToken && value.startsWith('@');
    if (typesTheToken) {
      setHasToken(true);
      setQuery(value.slice(1));
      return;
    }
    setQuery(value);
  }

  function moveActive(step: number) {
    if (!hasResults) {
      return;
    }
    const currentIndex = results.findIndex(
      (result) => result.id === shownActiveId
    );
    const nextIndex = nextIndexOf(currentIndex, step, results.length);
    const next = results[nextIndex];
    setActiveId(next.id);
    const option = document.getElementById(optionIdOf(next.id));
    option?.scrollIntoView({ block: 'nearest' });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    const isEnter = event.key === 'Enter';
    if (isEnter && shownActive) {
      event.preventDefault();
      setPickedId(shownActive.id);
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const removesToken = isBackspace && query.length === 0;
    if (removesToken) {
      setHasToken(false);
    }
  }

  return (
    <>
      <ModalHeader>
        <ModalTitle>Mention someone</ModalTitle>
        <ModalDescription>
          Members, people invited and guests of the project
        </ModalDescription>
      </ModalHeader>
      <div
        role='presentation'
        onClick={focusInput}
        className={cn(
          CONTROL_RECIPE,
          'flex h-9 cursor-text items-center gap-1.5 px-2',
          'focus-within:border-foreground/30 focus-within:ring-ring/25 focus-within:ring-[3px]'
        )}
      >
        <SearchIcon className='text-muted-foreground size-4 shrink-0' />
        <AnimatePresence initial={false} mode='popLayout'>
          {hasToken && <MentionToken key='token' />}
        </AnimatePresence>
        <input
          ref={inputRef}
          role='combobox'
          aria-label='Search people'
          aria-expanded={showsResults}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId || undefined}
          autoComplete='off'
          spellCheck={false}
          value={query}
          placeholder='Type @ to search people'
          onChange={changeQuery}
          onKeyDown={handleKeyDown}
          className='placeholder:text-muted-foreground/75 h-7 min-w-0 flex-1 bg-transparent text-base outline-none md:text-[13px]'
        />
      </div>
      <div
        id={listboxId}
        role='listbox'
        aria-label='People'
        className='-mx-2 flex max-h-72 flex-col gap-3 overflow-y-auto px-2'
      >
        {showsResults &&
          groups.map((group) => {
            const headingId = `${baseId}-${group.kind}`;

            return (
              <div
                key={group.kind}
                role='group'
                aria-labelledby={headingId}
                className='flex flex-col gap-0.5'
              >
                <div className='flex items-center gap-2 px-2 pb-1'>
                  <span
                    id={headingId}
                    className='text-muted-foreground text-xs font-medium'
                  >
                    {group.label}
                  </span>
                  <Kbd>{group.results.length}</Kbd>
                </div>
                <ul className='flex flex-col'>
                  {group.results.map((result) => (
                    <ResultRow
                      key={result.id}
                      result={result}
                      optionId={optionIdOf(result.id)}
                      query={normalizedQuery}
                      isActive={result.id === shownActiveId}
                      isPicked={result.id === pickedId}
                      highlightId={highlightId}
                      onHover={setActiveId}
                      onPick={setPickedId}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        {showsNoMatch && (
          <div className='flex flex-col items-center gap-1 py-8 text-center'>
            <p className='text-sm font-medium'>
              {`No one matches “${query.trim()}”`}
            </p>
            <p className='text-muted-foreground text-[13px]'>
              Search by name or e-mail address
            </p>
          </div>
        )}
        {!hasToken && (
          <p className='text-muted-foreground py-8 text-center text-[13px]'>
            Type @ to search the people of the project
          </p>
        )}
      </div>
      <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs'>
        <span className='flex items-center gap-1.5'>
          <Kbd>
            <ChevronUpIcon />
            <span className='sr-only'>Up arrow</span>
          </Kbd>
          <Kbd>
            <ChevronDownIcon />
            <span className='sr-only'>Down arrow</span>
          </Kbd>
          to move
        </span>
        <span className='flex items-center gap-1.5'>
          <Kbd>Enter</Kbd>
          to pick
        </span>
        <span className='ml-auto min-w-0'>
          <Swap swapKey={pickedLine} kind='label'>
            {pickedLine}
          </Swap>
        </span>
      </div>
    </>
  );
}

export default function Modal11() {
  return (
    <ModalPreview triggerLabel='Open mention search' size='md'>
      <SearchPeopleContent />
    </ModalPreview>
  );
}
