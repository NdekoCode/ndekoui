'use client';

import { useId, useImperativeHandle, useRef, useState } from 'react';

import type { AutoplayStep } from '@/registry/ndeko/hooks/use-autoplay';
import {
  PRESS_LEAD_MS,
  pressedQuietOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  BookmarkIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { depthOf, useDeck } from './_parts/deck';
import { holdFocusOutsideCards, isOnControl, sideStepOf } from './_parts/keys';
import { PEOPLE } from './_parts/people';
import { useCardDemo } from './_parts/use-card-demo';

export type Contact = {
  id: string;
  name: string;
  role: string;
  company: string;
};

/** The control a demonstration holds down before it acts. */
export type ContactStackPress = 'save' | 'next';

export type ContactStackHandle = {
  next: () => void;
  previous: () => void;
  toggleSaved: () => void;
};

const LAST_LAYER = 2;
const PEEK_PX = 10;
const SCALE_STEP = 0.05;
const DROP_PX = 44;
const DROP_TILT_DEG = 3;
const LEAVE_MS = 240;

const CARD = [
  'bg-card hairline-ring ring-border absolute inset-x-0 bottom-0 flex h-36 origin-top flex-col justify-between rounded-xl p-4',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] ease-(--ease-out-strong)',
].join(' ');

const FRONT = 'cursor-pointer hover:ring-foreground/25';

const TRAVELLING = 'transition-[transform,opacity] duration-300';

const PLACED = 'transition-none';

type Placement = { transform: string; opacity: number; zIndex: number };

function transformOf(offsetY: number, scale: number, tilt: number) {
  return `translateY(${offsetY}px) scale(${scale}) rotate(${tilt}deg)`;
}

function opacityOf(isShown: boolean) {
  if (isShown) {
    return 1;
  }
  return 0;
}

/** The front card sits lowest and largest; each card behind it shows a strip above it, and the fourth is hidden. */
function placementOf(depth: number, isOut: boolean, count: number): Placement {
  if (isOut) {
    const dropped = transformOf(DROP_PX, 1, DROP_TILT_DEG);
    const aboveAll = count + 1;
    return { transform: dropped, opacity: 0, zIndex: aboveAll };
  }
  const layer = Math.min(depth, LAST_LAYER);
  const lift = layer * -PEEK_PX;
  const shrink = layer * SCALE_STEP;
  const scale = 1 - shrink;
  const isShown = depth <= LAST_LAYER;
  const stackOrder = count - depth;
  return {
    transform: transformOf(lift, scale, 0),
    opacity: opacityOf(isShown),
    zIndex: stackOrder,
  };
}

function travelOf(isPlaced: boolean) {
  if (isPlaced) {
    return PLACED;
  }
  return TRAVELLING;
}

function saveLabelOf(isSaved: boolean) {
  if (isSaved) {
    return 'Saved';
  }
  return 'Save';
}

type ContactCardProps = {
  contact: Contact;
  placement: Placement;
  isFront: boolean;
  /** The card takes its pose at once, to travel from there on the next change. */
  isPlaced: boolean;
  /** A press on the card itself turns the stack: false for a stack of one. */
  canTurn: boolean;
  isSaved: boolean;
  isSavePressed: boolean;
  onToggleSaved: () => void;
  onTurn: () => void;
};

function ContactCard({
  contact,
  placement,
  isFront,
  isPlaced,
  canTurn,
  isSaved,
  isSavePressed,
  onToggleSaved,
  onTurn,
}: ContactCardProps) {
  const saveLabel = saveLabelOf(isSaved);
  const answersPress = isFront && canTurn;

  function turnFromCard(event: React.MouseEvent<HTMLLIElement>) {
    if (isOnControl(event.target)) {
      return;
    }
    onTurn();
  }

  return (
    <li
      style={placement}
      inert={!isFront}
      aria-hidden={!isFront}
      onClick={turnFromCard}
      className={cn(CARD, travelOf(isPlaced), answersPress && FRONT)}
    >
      <div className='flex items-center gap-3'>
        <Avatar seed={contact.name} className='size-10' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{contact.name}</p>
          <p className='text-muted-foreground truncate text-xs'>
            {contact.role}
          </p>
        </div>
      </div>
      <div className='flex items-center justify-between gap-3'>
        <p className='flex min-w-0 items-center gap-1.5 text-xs'>
          <CompanyMark seed={contact.company} size='sm' />
          <span className='truncate'>{contact.company}</span>
        </p>
        <Button
          type='button'
          size='sm'
          variant='outline'
          aria-pressed={isSaved}
          onClick={onToggleSaved}
          className={cn('w-[4.75rem]', pressedQuietOf(isSavePressed))}
        >
          <Swap swapKey={saveLabel}>
            {isSaved && <CheckIcon className='size-3.5' />}
            {!isSaved && <BookmarkIcon className='size-3.5' />}
          </Swap>
          {saveLabel}
        </Button>
      </div>
    </li>
  );
}

export type ContactStackProps = {
  contacts: Contact[];
  savedIds: readonly string[];
  onSavedChange: (contactId: string, isSaved: boolean) => void;
  /** Turns the stack or saves from outside, for a demonstration or a shortcut of the page. */
  handleRef?: React.Ref<ContactStackHandle>;
  /** Shows Save or Next held down, for a demonstration that presses it. */
  pressed?: ContactStackPress | null;
  /** Keeps the live region quiet while a demonstration turns the stack by itself. */
  isSilent?: boolean;
  label?: string;
  className?: string;
};

export function ContactStack({
  contacts,
  savedIds,
  onSavedChange,
  handleRef,
  pressed = null,
  isSilent = false,
  label = 'Contacts',
  className,
}: ContactStackProps) {
  const hintId = useId();
  const count = contacts.length;
  const deck = useDeck(count, LEAVE_MS);
  const frontContact = contacts[deck.front];
  const position = deck.front + 1;
  const canTurn = count > 1;
  const isSaveDown = pressed === 'save';
  const isNextDown = pressed === 'next';

  function isSavedContact(contact: Contact) {
    return savedIds.includes(contact.id);
  }

  function toggleSaved(contact: Contact) {
    const isSaved = isSavedContact(contact);
    onSavedChange(contact.id, !isSaved);
  }

  function toggleFrontSaved() {
    if (frontContact) {
      toggleSaved(frontContact);
    }
  }

  function turnWithKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = sideStepOf(event.key);
    if (step === 0) {
      return;
    }
    event.preventDefault();
    holdFocusOutsideCards(event.currentTarget);
    if (step === 1) {
      deck.next();
      return;
    }
    deck.previous();
  }

  useImperativeHandle(handleRef, () => ({
    next: deck.next,
    previous: deck.previous,
    toggleSaved: toggleFrontSaved,
  }));

  if (!frontContact) {
    return (
      <p className='hairline-border border-foreground/20 text-muted-foreground flex h-36 w-full items-center justify-center rounded-xl border-dashed text-[13px]'>
        No contacts yet
      </p>
    );
  }

  const announcement = `${frontContact.name}, ${frontContact.role} at ${frontContact.company}, ${position} of ${count}`;

  return (
    <div
      role='group'
      aria-roledescription='carousel'
      aria-label={label}
      aria-describedby={hintId}
      tabIndex={0}
      onKeyDown={turnWithKeys}
      className={cn(
        'flex w-full flex-col gap-3 rounded-xl',
        FOCUS_RING,
        className
      )}
    >
      <ul className='relative h-[10.25rem]'>
        {contacts.map((contact, index) => {
          const depth = depthOf(index, deck.front, count);
          const isOut = index === deck.out;
          const isFront = depth === 0;
          const isPlaced = isOut && deck.isReturning;
          const isSavePressed = isFront && isSaveDown;
          return (
            <ContactCard
              key={contact.id}
              contact={contact}
              placement={placementOf(depth, isOut, count)}
              isFront={isFront}
              isPlaced={isPlaced}
              canTurn={canTurn}
              isSaved={isSavedContact(contact)}
              isSavePressed={isSavePressed}
              onToggleSaved={() => toggleSaved(contact)}
              onTurn={deck.next}
            />
          );
        })}
      </ul>
      <div className='flex h-7 items-center justify-between gap-2 ps-1'>
        <p className='text-muted-foreground text-xs tabular-nums'>
          {position} of {count}
        </p>
        {canTurn && (
          <div className='flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Previous contact'
              onClick={deck.previous}
              className='text-muted-foreground'
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Next contact'
              onClick={deck.next}
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(isNextDown)
              )}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
      <span id={hintId} className='sr-only'>
        Left and Right arrows turn the stack
      </span>
      <LiveRegion message={spokenUnless(isSilent, announcement)} />
    </div>
  );
}

const CONTACTS: Contact[] = [
  PEOPLE.amara,
  PEOPLE.jonas,
  PEOPLE.mei,
  PEOPLE.rafael,
  PEOPLE.ingrid,
];

function withSaved(savedIds: string[], contactId: string, isSaved: boolean) {
  const others = savedIds.filter((savedId) => savedId !== contactId);
  if (isSaved) {
    return [...others, contactId];
  }
  return others;
}

export default function Card01() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const stack = useRef<ContactStackHandle>(null);
  const { pressed, press } = usePress<ContactStackPress>();

  function changeSaved(contactId: string, isSaved: boolean) {
    setSavedIds((current) => withSaved(current, contactId, isSaved));
  }

  const steps: AutoplayStep[] = [
    { after: 1500, run: () => press('save') },
    { after: PRESS_LEAD_MS, run: () => stack.current?.toggleSaved() },
    { after: 1200, run: () => press('next') },
    { after: PRESS_LEAD_MS, run: () => stack.current?.next() },
  ];
  const { ref, isAutoplaying } = useCardDemo(steps, {
    loopAfter: 700,
  });

  return (
    <div ref={ref} className='min-h-[12.75rem] w-full max-w-[21rem]'>
      <ContactStack
        contacts={CONTACTS}
        savedIds={savedIds}
        onSavedChange={changeSaved}
        handleRef={stack}
        pressed={pressed}
        isSilent={isAutoplaying}
      />
    </div>
  );
}
