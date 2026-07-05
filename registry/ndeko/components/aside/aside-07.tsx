'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';

import {
  AsideCloseButton,
  AsideDescription,
  AsidePreview,
  AsideTitle,
} from './_parts/aside-frame';
import { rowVariantsOf } from './_parts/motion';

/** Each stroke is a set of keys pressed together; several strokes are pressed one after the other. */
type Shortcut = { id: string; label: string; strokes: string[][] };

type ShortcutGroup = { id: string; title: string; shortcuts: Shortcut[] };

const GROUPS: ShortcutGroup[] = [
  {
    id: 'general',
    title: 'General',
    shortcuts: [
      { id: 'command', label: 'Open the command menu', strokes: [['⌘', 'K']] },
      { id: 'search', label: 'Search tasks', strokes: [['/']] },
      { id: 'shortcuts', label: 'Show keyboard shortcuts', strokes: [['?']] },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    shortcuts: [
      { id: 'go-inbox', label: 'Go to the inbox', strokes: [['G'], ['I']] },
      { id: 'go-tasks', label: 'Go to my tasks', strokes: [['G'], ['T']] },
      {
        id: 'go-timesheets',
        label: 'Go to timesheets',
        strokes: [['G'], ['S']],
      },
      { id: 'next', label: 'Next task', strokes: [['J']] },
      { id: 'previous', label: 'Previous task', strokes: [['K']] },
    ],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    shortcuts: [
      { id: 'create', label: 'Create a task', strokes: [['C']] },
      { id: 'assign', label: 'Assign to me', strokes: [['I']] },
      { id: 'status', label: 'Change the status', strokes: [['S']] },
      { id: 'priority', label: 'Set the priority', strokes: [['P']] },
      { id: 'timer', label: 'Start or stop the timer', strokes: [['T']] },
      { id: 'copy', label: 'Copy the task link', strokes: [['⌘', '⇧', 'C']] },
    ],
  },
];

function normalized(text: string) {
  const trimmed = text.trim();
  return trimmed.toLowerCase();
}

function matchesQuery(shortcut: Shortcut, query: string) {
  if (query.length === 0) {
    return true;
  }
  const label = shortcut.label.toLowerCase();
  return label.includes(query);
}

function matchCountLabel(count: number) {
  if (count === 1) {
    return '1 shortcut';
  }
  return `${count} shortcuts`;
}

function HighlightedLabel({ label, query }: { label: string; query: string }) {
  const lowerLabel = label.toLowerCase();
  const start = lowerLabel.indexOf(query);
  const hasMatch = query.length > 0 && start >= 0;
  if (!hasMatch) {
    return <span>{label}</span>;
  }
  const end = start + query.length;
  const before = label.slice(0, start);
  const match = label.slice(start, end);
  const after = label.slice(end);

  return (
    <span>
      {before}
      <mark className='bg-primary/15 text-foreground rounded-[3px]'>
        {match}
      </mark>
      {after}
    </span>
  );
}

function Strokes({ strokes }: { strokes: string[][] }) {
  return (
    <span className='flex shrink-0 items-center gap-1.5'>
      {strokes.map((keys, index) => {
        const isFollowUp = index > 0;

        return (
          <span key={keys.join('+')} className='flex items-center gap-1.5'>
            {isFollowUp && (
              <span className='text-muted-foreground text-[11px]'>then</span>
            )}
            <KbdGroup>
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </KbdGroup>
          </span>
        );
      })}
    </span>
  );
}

function KeyboardShortcuts() {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowVariants = rowVariantsOf(shouldReduceMotion);
  const normalizedQuery = normalized(query);
  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    shortcuts: group.shortcuts.filter((shortcut) =>
      matchesQuery(shortcut, normalizedQuery)
    ),
  }));
  let matchCount = 0;
  for (const group of visibleGroups) {
    matchCount += group.shortcuts.length;
  }
  const hasMatches = matchCount > 0;

  function changeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  function clearQuery() {
    setQuery('');
  }

  return (
    <div className='flex flex-col gap-5 p-5'>
      <div className='flex items-start gap-3'>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <AsideTitle>Keyboard shortcuts</AsideTitle>
          <AsideDescription>{matchCountLabel(matchCount)}</AsideDescription>
        </div>
        <AsideCloseButton label='Close shortcuts' className='-mt-1 -mr-2' />
      </div>
      <div className='relative'>
        <label htmlFor={searchId} className='sr-only'>
          Filter shortcuts
        </label>
        <SearchIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
        <Input
          id={searchId}
          type='search'
          value={query}
          placeholder='Filter by action'
          onChange={changeQuery}
          className='pl-8'
        />
      </div>
      <div className='-mt-3 flex flex-col'>
        <AnimatePresence initial={false}>
          {!hasMatches && (
            <motion.div
              key='empty'
              variants={rowVariants}
              initial='hidden'
              animate='shown'
              exit='hidden'
            >
              <div className='flex flex-col items-start gap-2 pt-3'>
                <p className='text-[13px]'>
                  {`No shortcut matches “${query.trim()}”`}
                </p>
                <Button variant='outline' size='sm' onClick={clearQuery}>
                  <XIcon />
                  Clear filter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {visibleGroups.map((group) => {
            const hasShortcuts = group.shortcuts.length > 0;
            if (!hasShortcuts) {
              return null;
            }

            return (
              <motion.section
                key={group.id}
                aria-label={group.title}
                variants={rowVariants}
                initial='hidden'
                animate='shown'
                exit='hidden'
              >
                <h3 className='text-muted-foreground pt-3 pb-1 text-xs font-medium'>
                  {group.title}
                </h3>
                <ul className='flex flex-col'>
                  <AnimatePresence initial={false}>
                    {group.shortcuts.map((shortcut) => (
                      <motion.li
                        key={shortcut.id}
                        variants={rowVariants}
                        initial='hidden'
                        animate='shown'
                        exit='hidden'
                      >
                        <div className='flex min-h-9 items-center gap-3 text-[13px]'>
                          <span className='min-w-0 flex-1'>
                            <HighlightedLabel
                              label={shortcut.label}
                              query={normalizedQuery}
                            />
                          </span>
                          <Strokes strokes={shortcut.strokes} />
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </motion.section>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Aside07() {
  return (
    <AsidePreview triggerLabel='Open keyboard shortcuts'>
      <KeyboardShortcuts />
    </AsidePreview>
  );
}
