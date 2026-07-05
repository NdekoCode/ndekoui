'use client';

import { motion, type Transition } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  GlobeIcon,
  LayersIcon,
  LinkIcon,
  LockIcon,
  UsersIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

import { CopyButton } from './_parts/copy-button';
import {
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalPreview,
  ModalTitle,
} from './_parts/modal-frame';
import { PEOPLE, WORKSPACE_NAME } from './_parts/people';
import { PersonAvatar } from './_parts/person-avatar';
import {
  ACCESS_LEVELS,
  RoleSelect,
  type AccessLevel,
} from './_parts/role-select';
import { Swap } from './_parts/swap';

type GeneralAccess = 'invited' | 'workspace' | 'link';

type AccessOption = {
  value: GeneralAccess;
  label: string;
  line: string;
  icon: Icon;
};

const PROJECT_NAME = 'Atlas redesign';

const PROJECT_LINK = 'lattice.example/p/atlas-redesign';

const WORKSPACE_SIZE = 42;

const INVITED_PEOPLE = PEOPLE.slice(0, 6);

const SHOWN_AVATARS = 4;

const ACCESS_OPTIONS: AccessOption[] = [
  {
    value: 'invited',
    label: 'Only people invited',
    line: `${INVITED_PEOPLE.length} people can open it`,
    icon: LockIcon,
  },
  {
    value: 'workspace',
    label: `Everyone in ${WORKSPACE_NAME}`,
    line: `${WORKSPACE_SIZE} people in the workspace can open it`,
    icon: UsersIcon,
  },
  {
    value: 'link',
    label: 'Anyone with the link',
    line: 'Opens without signing in, so share it with care',
    icon: GlobeIcon,
  },
];

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

const NO_TRAVEL: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return NO_TRAVEL;
  }
  return TRAVEL;
}

function isGeneralAccess(value: unknown): value is GeneralAccess {
  return ACCESS_OPTIONS.some((option) => option.value === value);
}

function audienceOf(access: GeneralAccess) {
  if (access === 'workspace') {
    return `Everyone in ${WORKSPACE_NAME}`;
  }
  if (access === 'link') {
    return 'Anyone with the link';
  }
  return 'Only people invited';
}

function AccessRow({
  option,
  isPicked,
  tintId,
}: {
  option: AccessOption;
  isPicked: boolean;
  tintId: string;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const OptionGlyph = option.icon;

  return (
    <label className='relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5'>
      {isPicked && (
        <motion.span
          layoutId={tintId}
          aria-hidden='true'
          transition={travelOf(shouldReduceMotion)}
          className='bg-primary/[0.07] absolute inset-0 rounded-lg'
        />
      )}
      <span className='keycap-3d text-muted-foreground relative flex size-8 shrink-0 items-center justify-center rounded-lg'>
        <OptionGlyph className='size-4' />
      </span>
      <span className='relative flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='text-[13px] font-medium'>{option.label}</span>
        <span className='text-muted-foreground text-xs'>{option.line}</span>
      </span>
      <RadioGroupItem value={option.value} className='relative' />
    </label>
  );
}

function PeopleWithAccess() {
  const shown = INVITED_PEOPLE.slice(0, SHOWN_AVATARS);
  const hiddenCount = INVITED_PEOPLE.length - SHOWN_AVATARS;
  const hasHidden = hiddenCount > 0;
  const [first, second] = INVITED_PEOPLE;
  const othersCount = INVITED_PEOPLE.length - 2;

  return (
    <div className='flex items-center gap-3'>
      <div className='flex -space-x-2'>
        {shown.map((person) => (
          <PersonAvatar
            key={person.id}
            person={person}
            size='sm'
            className='ring-popover rounded-full ring-2'
          />
        ))}
        {hasHidden && (
          <span className='keycap-3d text-muted-foreground ring-popover relative flex size-6 items-center justify-center rounded-full text-[10px] font-medium tabular-nums ring-2'>
            {`+${hiddenCount}`}
          </span>
        )}
      </div>
      <p className='text-muted-foreground min-w-0 text-xs'>
        {`${first.name}, ${second.name} and ${othersCount} others were invited`}
      </p>
    </div>
  );
}

function ShareProject() {
  const [access, setAccess] = useState<GeneralAccess>('invited');
  const [linkLevel, setLinkLevel] = useState<AccessLevel>('view');
  const tintId = useId();
  const groupLabelId = useId();
  const isOpenBeyondInvites = access !== 'invited';
  const audience = audienceOf(access);
  const linkLevels = ACCESS_LEVELS.filter((level) => level.value !== 'manage');

  function changeAccess(value: unknown) {
    if (isGeneralAccess(value)) {
      setAccess(value);
    }
  }

  return (
    <>
      <div className='flex flex-col gap-3'>
        <span className='gem-plate flex size-10 items-center justify-center rounded-xl [--gem:var(--info)]'>
          <LayersIcon className='size-5' strokeWidth={2.25} />
        </span>
        <ModalHeader>
          <ModalTitle>{`Share ${PROJECT_NAME}`}</ModalTitle>
          <ModalDescription>
            Pick who can open the project, then send them the link
          </ModalDescription>
        </ModalHeader>
      </div>
      <div className='flex flex-col gap-2'>
        <p id={groupLabelId} className='text-[13px] font-medium'>
          Who can open it
        </p>
        <RadioGroup
          aria-labelledby={groupLabelId}
          value={access}
          onValueChange={changeAccess}
          className='bg-card hairline-ring ring-border gap-0 rounded-xl p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
        >
          {ACCESS_OPTIONS.map((option) => (
            <AccessRow
              key={option.value}
              option={option}
              isPicked={option.value === access}
              tintId={tintId}
            />
          ))}
        </RadioGroup>
        <AnimatedSize>
          {isOpenBeyondInvites && (
            <div className='flex items-center justify-between gap-3 pt-1 pl-3'>
              <Swap
                swapKey={audience}
                kind='label'
                className='text-muted-foreground flex min-w-0 text-xs'
              >
                {`${audience} can`}
              </Swap>
              <RoleSelect
                label='What people who open the link can do'
                value={linkLevel}
                options={linkLevels}
                onValueChange={setLinkLevel}
              />
            </div>
          )}
        </AnimatedSize>
      </div>
      <div className='bg-foreground/[0.03] flex items-center gap-3 rounded-xl p-2 pl-3'>
        <LinkIcon className='text-muted-foreground size-4 shrink-0' />
        <p className='text-muted-foreground min-w-0 flex-1 truncate text-[13px]'>
          {PROJECT_LINK}
        </p>
        <CopyButton
          text={`https://${PROJECT_LINK}`}
          label='Copy link'
          announcement='Project link copied'
        />
      </div>
      <PeopleWithAccess />
      <ModalFooter>
        <ModalCloseButton>Done</ModalCloseButton>
      </ModalFooter>
    </>
  );
}

export default function Modal05() {
  return (
    <ModalPreview triggerLabel='Open the share dialog' size='md'>
      <ShareProject />
    </ModalPreview>
  );
}
