'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
} from 'motion/react';
import { useRef, useState } from 'react';

import {
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { RollingCount } from './_parts/motion-parts';
import { actorNameOf, CURRENT_USER_ID, personOf } from './_parts/people';
import { PersonAvatar, StrikeTitle } from './_parts/subtask-parts';

type OpenGroup = 'prep' | 'launch';

type GroupId = OpenGroup | 'done';

type LiveItem = {
  id: string;
  title: string;
  group: OpenGroup;
  addedBy: string;
  isDone: boolean;
  doneBy?: string;
  doneOrder: number;
};

type Typing = {
  personId: string;
  group: OpenGroup;
};

const GROUPS: { id: GroupId; name: string; empty: string }[] = [
  { id: 'prep', name: 'Prep', empty: 'Nothing to prepare yet' },
  { id: 'launch', name: 'Launch', empty: 'Nothing planned for launch yet' },
  { id: 'done', name: 'Done', empty: 'Ticked items land here' },
];

const ADD_GROUPS: Segment<OpenGroup>[] = [
  { value: 'prep', label: 'Prep' },
  { value: 'launch', label: 'Launch' },
];

const MAX_ITEMS = 9;
const FRESH_FOR_MS = 1800;

const RESTING_ITEMS: LiveItem[] = [
  {
    id: 'prep-notes',
    title: 'Write the release notes',
    group: 'prep',
    addedBy: 'sana',
    isDone: false,
    doneOrder: 0,
  },
  {
    id: 'prep-pricing',
    title: 'Update the pricing page copy',
    group: 'prep',
    addedBy: 'leo',
    isDone: false,
    doneOrder: 0,
  },
  {
    id: 'launch-email',
    title: 'Schedule the announcement email',
    group: 'launch',
    addedBy: 'mei',
    isDone: false,
    doneOrder: 0,
  },
  {
    id: 'prep-freeze',
    title: 'Freeze the feature list',
    group: 'prep',
    addedBy: 'tomas',
    isDone: true,
    doneBy: 'tomas',
    doneOrder: 1,
  },
];

const TRAVEL: Transition = { type: 'spring', bounce: 0, duration: 0.35 };

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function layoutIdOf(id: string, shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return `live-${id}`;
}

function arrivalOf(isFresh: boolean) {
  if (isFresh) {
    return { opacity: 0 };
  }
  return false;
}

function groupOf(item: LiveItem): GroupId {
  if (item.isDone) {
    return 'done';
  }
  return item.group;
}

function itemsInGroup(items: LiveItem[], group: GroupId) {
  const inGroup = items.filter((item) => groupOf(item) === group);
  if (group !== 'done') {
    return inGroup;
  }
  return [...inGroup].sort(
    (first, second) => second.doneOrder - first.doneOrder
  );
}

function signatureOf(items: LiveItem[]) {
  return items.map((item) => `${item.id}:${groupOf(item)}`).join('|');
}

function metaPersonIdOf(item: LiveItem) {
  if (item.isDone && item.doneBy) {
    return item.doneBy;
  }
  return item.addedBy;
}

function metaLabelOf(item: LiveItem) {
  const name = actorNameOf(metaPersonIdOf(item));
  if (item.isDone) {
    return `Ticked by ${name}`;
  }
  return `Added by ${name}`;
}

function shortNameOf(personId: string) {
  if (personId === CURRENT_USER_ID) {
    return 'You';
  }
  return personOf(personId).firstName;
}

function withoutOldest(items: LiveItem[]) {
  const oldestDone = items.find((item) => item.isDone);
  const dropped = oldestDone ?? items[0];
  return items.filter((item) => item.id !== dropped.id);
}

function withCap(items: LiveItem[]) {
  if (items.length <= MAX_ITEMS) {
    return items;
  }
  return withoutOldest(items);
}

function groupNameOf(group: OpenGroup) {
  if (group === 'launch') {
    return 'Launch';
  }
  return 'Prep';
}

type LiveRowProps = {
  item: LiveItem;
  isFresh: boolean;
  signature: string;
  onToggle: () => void;
};

function LiveRow({ item, isFresh, signature, onToggle }: LiveRowProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const metaId = metaPersonIdOf(item);

  return (
    <motion.li
      layout='position'
      layoutId={layoutIdOf(item.id, shouldReduceMotion)}
      layoutDependency={signature}
      initial={arrivalOf(isFresh)}
      animate={{ opacity: 1 }}
      transition={travelOf(shouldReduceMotion)}
      data-fresh={isFresh}
      className='group/row'
    >
      <label className='hover:bg-foreground/[0.03] group-data-[fresh=true]/row:bg-primary/10 flex h-9 cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors duration-1000'>
        <Checkbox checked={item.isDone} onCheckedChange={onToggle} />
        <StrikeTitle title={item.title} isDone={item.isDone} />
        <span
          aria-label={metaLabelOf(item)}
          className='text-muted-foreground ms-auto flex shrink-0 items-center gap-1.5 text-xs'
        >
          <PersonAvatar person={personOf(metaId)} />
          <span className='hidden max-w-16 truncate @xs:inline'>
            {shortNameOf(metaId)}
          </span>
        </span>
      </label>
    </motion.li>
  );
}

type GroupProps = {
  name: string;
  empty: string;
  items: LiveItem[];
  freshId: string | null;
  signature: string;
  onToggle: (id: string) => void;
};

function Group({
  name,
  empty,
  items,
  freshId,
  signature,
  onToggle,
}: GroupProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const hasItems = items.length > 0;

  return (
    <section aria-label={name} className='flex flex-col'>
      <motion.div
        layout='position'
        layoutDependency={signature}
        transition={travelOf(shouldReduceMotion)}
        className='flex h-7 items-center justify-between px-3'
      >
        <h3 className='text-muted-foreground text-xs font-medium'>{name}</h3>
        <span className='text-muted-foreground text-xs'>
          <RollingCount value={items.length} />
        </span>
      </motion.div>
      <ul>
        {items.map((item) => (
          <LiveRow
            key={item.id}
            item={item}
            isFresh={item.id === freshId}
            signature={signature}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </ul>
      {!hasItems && (
        <p className='text-muted-foreground px-3 py-2 text-[13px]'>{empty}</p>
      )}
    </section>
  );
}

function enterScaleOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 1;
  }
  return 0.96;
}

function TypingStrip({ typing }: { typing: Typing | null }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const enter = { opacity: 0, y: 4, scale: enterScaleOf(shouldReduceMotion) };

  return (
    <div className='flex h-6 items-center px-3'>
      <AnimatePresence mode='popLayout' initial={false}>
        {typing && (
          <motion.span
            key={typing.personId}
            initial={enter}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className='text-muted-foreground flex items-center gap-1.5 text-xs'
          >
            <PersonAvatar person={personOf(typing.personId)} />
            {shortNameOf(typing.personId)} is adding to{' '}
            {groupNameOf(typing.group)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Subtask08() {
  const [items, setItems] = useState(RESTING_ITEMS);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [addGroup, setAddGroup] = useState<OpenGroup>('prep');
  const [announcement, setAnnouncement] = useState('');
  const counter = useRef({ items: 0, ticks: 1 });
  const { schedule, clearAll } = useTimeouts();
  const signature = signatureOf(items);
  const doneCount = items.filter((item) => item.isDone).length;

  function addItem(title: string, group: OpenGroup, personId: string) {
    counter.current.items += 1;
    const id = `live-${counter.current.items}`;
    const item: LiveItem = {
      id,
      title,
      group,
      addedBy: personId,
      isDone: false,
      doneOrder: 0,
    };
    setItems((current) => withCap([...current, item]));
    setTyping(null);
    setFreshId(id);
    schedule(() => setFreshId(null), FRESH_FOR_MS);
  }

  function setTicked(id: string, personId: string) {
    counter.current.ticks += 1;
    const order = counter.current.ticks;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        if (item.isDone) {
          return { ...item, isDone: false, doneBy: undefined, doneOrder: 0 };
        }
        return { ...item, isDone: true, doneBy: personId, doneOrder: order };
      })
    );
  }

  function toggleFromPerson(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    setTicked(id, CURRENT_USER_ID);
    if (!item) {
      return;
    }
    if (item.isDone) {
      setAnnouncement(`${item.title} is open again`);
      return;
    }
    setAnnouncement(`${item.title} moved to Done`);
  }

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title === '') {
      return;
    }
    addItem(title, addGroup, CURRENT_USER_ID);
    setDraft('');
    setAnnouncement(`${title} added to ${groupNameOf(addGroup)}`);
  }

  function startOver() {
    clearAll();
    setItems(RESTING_ITEMS);
    setTyping(null);
    setFreshId(null);
  }

  const steps: AutoplayStep[] = [
    { after: 2200, run: () => setTyping({ personId: 'leo', group: 'launch' }) },
    {
      after: 1100,
      run: () => addItem('Confirm the status page text', 'launch', 'leo'),
    },
    { after: 1800, run: () => setTicked('prep-notes', 'sana') },
    { after: 1600, run: () => setTyping({ personId: 'mei', group: 'prep' }) },
    {
      after: 1000,
      run: () => addItem('Book the launch call', 'prep', 'mei'),
    },
    { after: 1800, run: () => setTicked('launch-email', 'tomas') },
    { after: 1800, run: () => setTicked('prep-pricing', 'sana') },
    { after: 1600, run: hold },
  ];
  const { ref } = useAutoplay(steps, {
    loopAfter: 2600,
    onReset: startOver,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='bg-foreground/[0.025] @container flex h-[27rem] w-full max-w-md flex-col rounded-xl p-1'
    >
      <div className='flex items-baseline justify-between gap-2 px-3 pt-2 pb-1'>
        <h3 className='text-sm font-medium'>Launch checklist</h3>
        <span className='text-muted-foreground text-xs'>
          <RollingCount value={doneCount} /> of {items.length} done
        </span>
      </div>
      <LayoutGroup>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          {GROUPS.map((group) => (
            <Group
              key={group.id}
              name={group.name}
              empty={group.empty}
              items={itemsInGroup(items, group.id)}
              freshId={freshId}
              signature={signature}
              onToggle={toggleFromPerson}
            />
          ))}
        </div>
      </LayoutGroup>
      <TypingStrip typing={typing} />
      <form
        onSubmit={submitDraft}
        className='flex flex-wrap items-center gap-2 px-2 pt-1 pb-2'
      >
        <Input
          aria-label='New item'
          placeholder={`Add to ${groupNameOf(addGroup)}`}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          className='min-w-40 flex-1'
        />
        <Segments
          label='Group'
          value={addGroup}
          segments={ADD_GROUPS}
          onValueChange={setAddGroup}
        />
        <Button
          type='submit'
          size='icon'
          aria-label='Add item'
          disabled={draft.trim() === ''}
          className='shrink-0'
        >
          <PlusIcon />
        </Button>
      </form>
      <LiveRegion message={announcement} />
    </div>
  );
}
