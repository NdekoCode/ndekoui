'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { LayersIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
} from '@/registry/ndeko/ui/combobox';
import { Kbd } from '@/registry/ndeko/ui/kbd';

import { CopyButton } from './_parts/copy-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { rowVariantsOf } from './_parts/motion';
import { CURRENT_USER, PEOPLE, type Person } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import {
  ACCESS_LEVELS,
  RoleSelect,
  type AccessLevel,
} from './_parts/role-select';

type ProjectMember = { personId: string; access: AccessLevel };

type Candidate = { value: string; label: string; person: Person };

const PROJECT_NAME = 'Atlas redesign';

const PROJECT_LINK = 'https://lattice.example/projects/atlas-redesign';

const INITIAL_MEMBERS: ProjectMember[] = [
  { personId: 'lucas', access: 'manage' },
  { personId: 'priya', access: 'edit' },
  { personId: 'zola', access: 'view' },
];

function personOf(personId: string) {
  return PEOPLE.find((person) => person.id === personId);
}

function candidateOf(person: Person): Candidate {
  return { value: person.id, label: person.name, person };
}

function isCandidate(value: unknown): value is Candidate {
  const isObject = typeof value === 'object' && value !== null;
  return isObject && 'person' in value;
}

function MemberRow({
  member,
  onAccessChange,
  onRemove,
}: {
  member: ProjectMember;
  onAccessChange: (personId: string, access: AccessLevel) => void;
  onRemove: (personId: string) => void;
}) {
  const person = personOf(member.personId);
  if (!person) {
    return null;
  }

  function changeAccess(access: AccessLevel) {
    onAccessChange(member.personId, access);
  }

  function remove() {
    onRemove(member.personId);
  }

  return (
    <div className='flex min-h-13 items-center gap-3 py-2 pr-1.5 pl-3'>
      <PersonAvatar person={person} presence={person.presence} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='truncate text-[13px] leading-tight font-medium'>
          {person.name}
        </p>
        <p className='text-muted-foreground truncate text-xs leading-tight'>
          {person.email}
        </p>
      </div>
      <RoleSelect
        label={`Access of ${person.name}`}
        value={member.access}
        options={ACCESS_LEVELS}
        onValueChange={changeAccess}
      />
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove ${person.name} from the project`}
        onClick={remove}
        className='text-muted-foreground'
      >
        <XIcon />
      </Button>
    </div>
  );
}

function OwnerRow() {
  return (
    <div className='flex min-h-13 items-center gap-3 py-2 pr-3 pl-3'>
      <PersonAvatar person={CURRENT_USER} presence={CURRENT_USER.presence} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <p className='flex items-center gap-1.5 text-[13px] leading-tight font-medium'>
          <span className='truncate'>{CURRENT_USER.name}</span>
          <Badge variant='secondary' className='text-muted-foreground'>
            You
          </Badge>
        </p>
        <p className='text-muted-foreground truncate text-xs leading-tight'>
          {CURRENT_USER.email}
        </p>
      </div>
      <span className='text-muted-foreground text-xs'>Owner</span>
    </div>
  );
}

function InviteToProject() {
  const [members, setMembers] = useState<ProjectMember[]>(INITIAL_MEMBERS);
  const [query, setQuery] = useState('');
  const [defaultAccess, setDefaultAccess] = useState<AccessLevel>('edit');
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const headingId = useId();
  const memberIds = members.map((member) => member.personId);
  const outsiders = PEOPLE.filter((person) => {
    const isOwner = person.id === CURRENT_USER.id;
    const isMember = memberIds.includes(person.id);
    return !isOwner && !isMember;
  });
  const candidates = outsiders.map(candidateOf);
  const memberCount = members.length + 1;
  const trimmedQuery = query.trim();

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
  }

  function addCandidate(value: unknown) {
    if (!isCandidate(value)) {
      return;
    }
    const added: ProjectMember = {
      personId: value.person.id,
      access: defaultAccess,
    };
    setMembers((previous) => [added, ...previous]);
    setQuery('');
  }

  function changeAccess(personId: string, access: AccessLevel) {
    setMembers((previous) =>
      previous.map((member) => {
        if (member.personId !== personId) {
          return member;
        }
        return { ...member, access };
      })
    );
  }

  function removeMember(personId: string) {
    setMembers((previous) =>
      previous.filter((member) => member.personId !== personId)
    );
  }

  return (
    <>
      <div className='flex items-start gap-3 pr-8'>
        <span className='gem-plate flex size-9 shrink-0 items-center justify-center rounded-lg [--gem:var(--info)]'>
          <LayersIcon className='size-4' strokeWidth={2.25} />
        </span>
        <ModalHeader className='pr-0'>
          <ModalTitle>{`Invite to ${PROJECT_NAME}`}</ModalTitle>
          <ModalDescription>
            Teammates get the tasks, files and discussions of the project
          </ModalDescription>
        </ModalHeader>
      </div>
      <Combobox
        items={candidates}
        value={null}
        onValueChange={addCandidate}
        inputValue={query}
        onInputValueChange={changeQuery}
      >
        <ComboboxInputGroup className='min-h-9 flex-nowrap gap-1.5 py-1 pr-1 pl-2.5'>
          <SearchIcon className='text-muted-foreground size-4 shrink-0' />
          <ComboboxInput
            aria-label='Add teammates by name or e-mail'
            placeholder='Add teammates by name or e-mail'
            className='h-7'
          />
          <RoleSelect
            label='Access of the people you add'
            value={defaultAccess}
            options={ACCESS_LEVELS}
            onValueChange={setDefaultAccess}
          />
        </ComboboxInputGroup>
        <ComboboxContent className='p-1'>
          <ComboboxEmpty>
            {`Nobody else in Lattice matches “${trimmedQuery}”`}
          </ComboboxEmpty>
          <ComboboxList className='max-h-64 overflow-y-auto empty:hidden'>
            {(candidate: Candidate) => (
              <ComboboxItem
                key={candidate.value}
                value={candidate}
                className='h-auto py-1.5'
              >
                <PersonAvatar
                  person={candidate.person}
                  size='sm'
                  presence={candidate.person.presence}
                />
                <span className='flex min-w-0 flex-col'>
                  <span className='truncate text-[13px]'>
                    {candidate.person.name}
                  </span>
                  <span className='text-muted-foreground truncate text-xs'>
                    {candidate.person.email}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <section aria-labelledby={headingId} className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <h3
            id={headingId}
            className='text-muted-foreground text-xs font-medium'
          >
            In this project
          </h3>
          <Kbd>
            <MotionNumber value={memberCount} />
          </Kbd>
        </div>
        <ul className='bg-card hairline-ring ring-border flex flex-col overflow-hidden rounded-xl py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
          <li>
            <OwnerRow />
          </li>
          <AnimatePresence initial={false}>
            {members.map((member) => (
              <motion.li
                key={member.personId}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <MemberRow
                  member={member}
                  onAccessChange={changeAccess}
                  onRemove={removeMember}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
      <ModalFooter className='sm:justify-between'>
        <CopyButton
          text={PROJECT_LINK}
          label='Copy project link'
          glyph='link'
          variant='ghost'
          announcement='Project link copied'
        />
        <ModalCloseButton>Done</ModalCloseButton>
      </ModalFooter>
    </>
  );
}

export default function Modal04() {
  return (
    <ModalPreview triggerLabel='Open the project invite dialog' size='lg'>
      <InviteToProject />
    </ModalPreview>
  );
}
