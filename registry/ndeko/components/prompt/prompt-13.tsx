'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  hold,
  PRESS_LEAD_MS,
  pressedSolidOf,
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowUpIcon,
  CircleCheckIcon,
  EyeIcon,
  GitPullRequestIcon,
  ListChecksIcon,
  ListCollapseIcon,
  TriangleAlertIcon,
} from '@/registry/ndeko/lib/icons';
import {
  risePresenceOf,
  rowPresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Chip } from '@/registry/ndeko/ui/chip';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { ListKeys, type ListKey } from './_parts/list-keys';
import { includesQuery, Marked } from './_parts/marked';
import { activeIdOf, wrappedIndexOf } from './_parts/option-list';
import { useActiveRowInView } from './_parts/use-active-row';

export type SlashCommand = {
  id: string;
  /** The word after the slash: `test` for `/test`. */
  name: string;
  description: string;
  /** What follows the command, shown in a muted tone: `a path or a name`. */
  argument: string;
  /** The command cannot run without it. */
  isArgumentRequired?: boolean;
  icon: React.ReactNode;
};

export type SlashMessage = {
  /** Empty for a plain message. */
  command: SlashCommand | null;
  argument: string;
};

export type SlashComposerHandle = {
  move: (step: number) => void;
  pickHighlighted: () => void;
  send: () => void;
};

const SHELL = [
  'bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[input:focus]:ring-ring/25 relative flex items-center gap-1 rounded-xl p-1.5',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[input:focus]:ring-[3px]',
].join(' ');

const TILE =
  'keycap-3d text-muted-foreground flex shrink-0 items-center justify-center [&_svg:not([class*="size-"])]:size-3.5';

function queryOf(command: SlashCommand | null, value: string) {
  if (command !== null) {
    return null;
  }
  const startsWithSlash = value.startsWith('/');
  const hasSpace = /\s/.test(value);
  if (!startsWithSlash || hasSpace) {
    return null;
  }
  return value.slice(1);
}

function argumentLabelOf(command: SlashCommand) {
  if (command.isArgumentRequired) {
    return `<${command.argument}>`;
  }
  return `[${command.argument}]`;
}

function typedCommandOf(commands: SlashCommand[], value: string) {
  const match = /^\/(\w+)\s(.*)$/.exec(value);
  if (!match) {
    return null;
  }
  const command = commands.find((entry) => entry.name === match[1]);
  if (!command) {
    return null;
  }
  return { command, rest: match[2] };
}

function activeToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/5';
  }
  return undefined;
}

function shakeOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { x: 0 };
  }
  return { x: [0, -4, 4, -2, 0] };
}

function activeDescendantOf(
  isOpen: boolean,
  optionPrefix: string,
  activeId: string | null
) {
  if (!isOpen || activeId === null) {
    return undefined;
  }
  return `${optionPrefix}-${activeId}`;
}

type CommandRowProps = {
  command: SlashCommand;
  query: string;
  optionId: string;
  isActive: boolean;
  onHover: (commandId: string) => void;
  onPick: (command: SlashCommand) => void;
};

function CommandRow({
  command,
  query,
  optionId,
  isActive,
  onHover,
  onPick,
}: CommandRowProps) {
  return (
    <div
      id={optionId}
      role='option'
      aria-selected={isActive}
      onMouseMove={() => onHover(command.id)}
      onClick={() => onPick(command)}
      className={cn(
        'flex min-h-11 cursor-default items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-100',
        activeToneOf(isActive)
      )}
    >
      <span className={cn(TILE, 'size-7 rounded-md')}>{command.icon}</span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate font-mono text-[13px]'>
          <span className='font-medium'>
            /<Marked text={command.name} query={query} />
          </span>
          <span className='text-muted-foreground ms-1.5 text-xs'>
            {argumentLabelOf(command)}
          </span>
        </span>
        <span className='text-muted-foreground truncate text-xs'>
          {command.description}
        </span>
      </span>
    </div>
  );
}

type CommandListProps = {
  matches: SlashCommand[];
  query: string;
  listId: string;
  activeId: string | null;
  optionIdOf: (commandId: string) => string;
  listRef: React.RefObject<HTMLDivElement | null>;
  pressedKey: ListKey | null;
  onHover: (commandId: string) => void;
  onPick: (command: SlashCommand) => void;
};

function CommandList({
  matches,
  query,
  listId,
  activeId,
  optionIdOf,
  listRef,
  pressedKey,
  onHover,
  onPick,
}: CommandListProps) {
  const isEmpty = matches.length === 0;

  return (
    <div className='surface-raised flex flex-col overflow-hidden rounded-xl'>
      <div
        ref={listRef}
        id={listId}
        role='listbox'
        aria-label='Commands'
        onMouseDown={(event) => event.preventDefault()}
        className='relative flex max-h-72 flex-col overflow-y-auto p-1'
      >
        {isEmpty && (
          <p className='text-muted-foreground px-2 py-6 text-center text-xs'>
            No command starts with “{query}”. Keep typing, or press Escape.
          </p>
        )}
        {matches.map((command) => (
          <CommandRow
            key={command.id}
            command={command}
            query={query}
            optionId={optionIdOf(command.id)}
            isActive={command.id === activeId}
            onHover={onHover}
            onPick={onPick}
          />
        ))}
      </div>
      <ListKeys
        pressed={pressedKey}
        enterLabel='inserts'
        className='bg-foreground/[0.03] px-3 py-2'
      />
    </div>
  );
}

type CommandTokenProps = {
  command: SlashCommand;
  glide: Transition;
  isReduced: boolean;
};

function CommandToken({ command, glide, isReduced }: CommandTokenProps) {
  const startScale = startScaleOf(isReduced);

  return (
    <motion.span
      initial={{ opacity: 0, scale: startScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: startScale }}
      transition={glide}
      className='inline-flex'
    >
      <Chip color='var(--primary)' className='h-6 px-2 font-mono text-[13px]'>
        /{command.name}
      </Chip>
    </motion.span>
  );
}

function startScaleOf(isReduced: boolean) {
  if (isReduced) {
    return 1;
  }
  return 0.86;
}

type SlashHintProps = {
  command: SlashCommand | null;
  isMissing: boolean;
  nudges: number;
};

function SlashHint({ command, isMissing, nudges }: SlashHintProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const shake = shakeOf(shouldReduceMotion);

  if (isMissing && command) {
    return (
      <motion.p
        key={nudges}
        animate={shake}
        transition={{ duration: 0.24 }}
        className='text-warning-foreground flex h-5 items-center gap-1.5 px-1 text-xs'
      >
        <TriangleAlertIcon className='size-3.5' />/{command.name} needs{' '}
        {command.argument}
      </motion.p>
    );
  }
  if (command) {
    return (
      <p className='text-muted-foreground flex h-5 items-center gap-1 px-1 text-xs'>
        <Kbd>Enter</Kbd> sends, <Kbd>Backspace</Kbd> takes the command back
      </p>
    );
  }
  return (
    <p className='text-muted-foreground flex h-5 items-center gap-1 px-1 text-xs'>
      <Kbd>/</Kbd> opens the commands, <Kbd>Enter</Kbd> sends
    </p>
  );
}

export type SlashComposerProps = {
  commands: SlashCommand[];
  /** What is typed: the command being searched for, or the argument once a command is chosen. */
  value: string;
  onValueChange: (value: string) => void;
  /** The command chosen, shown as a token before the argument. */
  command: SlashCommand | null;
  onCommandChange: (command: SlashCommand | null) => void;
  /** `floating` hangs the list over the page above the composer. `inline` draws it under the composer and keeps its place. */
  listPlacement?: 'inline' | 'floating';
  /** Shows the list without focus, for a demonstration or a preview nobody types in. */
  showsUnfocused?: boolean;
  onSend?: (message: SlashMessage) => void;
  handleRef?: React.Ref<SlashComposerHandle>;
  /** The key a demonstration is holding down in the list. */
  pressedKey?: ListKey | null;
  /** Shows Send held down, for a demonstration that presses it. */
  isSendPressed?: boolean;
  className?: string;
};

export function SlashComposer({
  commands,
  value,
  onValueChange,
  command,
  onCommandChange,
  listPlacement = 'floating',
  showsUnfocused = false,
  onSend,
  handleRef,
  pressedKey = null,
  isSendPressed = false,
  className,
}: SlashComposerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [nudges, setNudges] = useState(0);
  const [notice, setNotice] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const glide = springOf(shouldReduceMotion);
  const listId = useId();
  const optionPrefix = useId();
  const query = queryOf(command, value);
  const isSearching = query !== null;
  const isShowing = isFocused || showsUnfocused;
  const isOpen = isSearching && !isDismissed && isShowing;
  const matches = commandMatchesOf(commands, query);
  const activeId = activeIdOf(matches, highlightedId);
  const activeDescendant = activeDescendantOf(isOpen, optionPrefix, activeId);
  const hasArgument = value.trim() !== '';
  const hasContent = command !== null || hasArgument;
  const showsArgumentHint = command !== null && value === '';
  const isMissing = command?.isArgumentRequired === true && !hasArgument;
  const resultsMessage = resultsMessageOf(
    isOpen,
    matches.length,
    showsUnfocused
  );
  useActiveRowInView(listRef, activeDescendant);

  function optionIdOf(commandId: string) {
    return `${optionPrefix}-${commandId}`;
  }

  function move(step: number) {
    const ids = matches.map((entry) => entry.id);
    const current = ids.indexOf(activeId ?? '');
    const next = wrappedIndexOf(current, step, ids.length);
    const id = ids[next];
    if (id) {
      setHighlightedId(id);
    }
  }

  function pick(chosen: SlashCommand) {
    onCommandChange(chosen);
    onValueChange('');
    setHighlightedId(null);
    setIsDismissed(false);
    setNotice(`/${chosen.name} chosen, ${chosen.argument} comes next`);
  }

  function pickHighlighted() {
    const chosen = matches.find((entry) => entry.id === activeId);
    if (chosen) {
      pick(chosen);
    }
  }

  function send() {
    if (!hasContent) {
      return;
    }
    if (isMissing) {
      setNudges((current) => current + 1);
      setNotice(`/${command?.name} needs ${command?.argument}`);
      return;
    }
    onSend?.({ command, argument: value.trim() });
    onCommandChange(null);
    onValueChange('');
    setNotice('Sent');
  }

  useImperativeHandle(handleRef, () => ({ move, pickHighlighted, send }));

  function takeCommandBack() {
    if (!command) {
      return;
    }
    onCommandChange(null);
    onValueChange(`/${command.name}`);
    setIsDismissed(false);
    setNotice(`/${command.name} taken back`);
  }

  function changeValue(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setIsDismissed(false);
    const typed = typedCommandOf(commands, next);
    if (command === null && typed) {
      onCommandChange(typed.command);
      onValueChange(typed.rest);
      return;
    }
    onValueChange(next);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLInputElement>) {
    const isComposing = event.nativeEvent.isComposing;
    if (isComposing) {
      return;
    }
    if (isOpen) {
      const picksWithTab = event.key === 'Tab' && !event.shiftKey;
      const picksWithEnter = event.key === 'Enter';
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        move(-1);
        return;
      }
      if (picksWithEnter || picksWithTab) {
        event.preventDefault();
        pickHighlighted();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsDismissed(true);
        return;
      }
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      send();
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const canTakeBack = isBackspace && value === '' && command !== null;
    if (canTakeBack) {
      event.preventDefault();
      takeCommandBack();
    }
  }

  const list = (
    <CommandList
      matches={matches}
      query={query ?? ''}
      listId={listId}
      activeId={activeId}
      optionIdOf={optionIdOf}
      listRef={listRef}
      pressedKey={pressedKey}
      onHover={setHighlightedId}
      onPick={pick}
    />
  );

  return (
    <div className={cn('relative flex w-full flex-col gap-2', className)}>
      <div className='flex flex-col gap-1.5'>
        <div className={SHELL}>
          <AnimatedSize as='span' axis='width' className='shrink-0'>
            <AnimatePresence initial={false}>
              {command && (
                <CommandToken
                  key={command.id}
                  command={command}
                  glide={glide}
                  isReduced={shouldReduceMotion}
                />
              )}
            </AnimatePresence>
          </AnimatedSize>
          <div className='relative min-w-0 flex-1'>
            <input
              type='text'
              role='combobox'
              value={value}
              onChange={changeValue}
              onKeyDown={handleKeys}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label='Message'
              aria-expanded={isOpen}
              aria-controls={listId}
              aria-autocomplete='list'
              aria-activedescendant={activeDescendant}
              autoComplete='off'
              spellCheck={false}
              placeholder={placeholderOf(command)}
              className={cn(
                'h-8 w-full min-w-0 bg-transparent px-2 text-base outline-none md:text-[13px]',
                placeholderToneOf(showsArgumentHint)
              )}
            />
            {showsArgumentHint && (
              <span
                aria-hidden='true'
                className='pointer-events-none absolute inset-y-0 start-2 flex items-center transition-opacity delay-150 duration-200 starting:opacity-0'
              >
                <span className='bg-primary/20 rounded-[4px] px-1 text-base md:text-[13px]'>
                  {command.argument}
                </span>
              </span>
            )}
          </div>
          <Button
            type='button'
            size='icon'
            aria-label={sendLabelOf(hasContent)}
            disabled={!hasContent}
            focusableWhenDisabled
            onClick={send}
            className={pressedSolidOf(isSendPressed)}
          >
            <ArrowUpIcon />
          </Button>
        </div>
        <SlashHint command={command} isMissing={isMissing} nudges={nudges} />
      </div>
      <AnimatePresence initial={false}>
        {isOpen && listPlacement === 'inline' && (
          <motion.div key='list' {...risePresence}>
            {list}
          </motion.div>
        )}
        {isOpen && listPlacement === 'floating' && (
          <motion.div
            key='list'
            {...risePresence}
            className='absolute inset-x-0 bottom-full z-20 mb-2'
          >
            {list}
          </motion.div>
        )}
      </AnimatePresence>
      <LiveRegion message={resultsMessage} />
      <LiveRegion message={spokenUnless(showsUnfocused, notice)} />
    </div>
  );
}

function commandMatchesOf(commands: SlashCommand[], query: string | null) {
  if (query === null) {
    return [];
  }
  return commands.filter((entry) => includesQuery(entry.name, query));
}

function placeholderToneOf(showsArgumentHint: boolean) {
  if (showsArgumentHint) {
    return 'placeholder:text-transparent';
  }
  return 'placeholder:text-muted-foreground/75';
}

function placeholderOf(command: SlashCommand | null) {
  if (command) {
    return command.argument;
  }
  return 'Ask something, or type / for commands';
}

function sendLabelOf(hasContent: boolean) {
  if (hasContent) {
    return 'Send';
  }
  return 'Send, write something first';
}

function resultsMessageOf(
  isOpen: boolean,
  count: number,
  isDemonstrating: boolean
) {
  if (!isOpen || isDemonstrating) {
    return '';
  }
  if (count === 1) {
    return '1 command';
  }
  return `${count} commands`;
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'plan',
    name: 'plan',
    description: 'Write a plan before changing anything',
    argument: 'what to plan',
    isArgumentRequired: true,
    icon: <ListChecksIcon />,
  },
  {
    id: 'review',
    name: 'review',
    description: 'Read the changes and list what to fix',
    argument: 'a file or a pull request',
    icon: <EyeIcon />,
  },
  {
    id: 'compact',
    name: 'compact',
    description: 'Summarize the conversation to free up room',
    argument: 'what to keep',
    icon: <ListCollapseIcon />,
  },
  {
    id: 'test',
    name: 'test',
    description: 'Run the tests for what changed',
    argument: 'a path or a name',
    icon: <CircleCheckIcon />,
  },
  {
    id: 'pr',
    name: 'pr',
    description: 'Open a pull request from this branch',
    argument: 'a title',
    icon: <GitPullRequestIcon />,
  },
];

const RESULTS: Record<string, string> = {
  plan: 'Plan ready, 4 steps',
  review: '3 things to fix',
  compact: 'Conversation compacted',
  test: '24 tests passed',
  pr: 'Draft pull request opened',
};

type SentEntry = {
  id: number;
  command: SlashCommand;
  argument: string;
};

const MAX_SENT = 2;

function SentList({ entries }: { entries: SentEntry[] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <ul aria-label='Sent commands' className='flex min-h-[4.5rem] flex-col'>
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.li
            key={entry.id}
            className='overflow-hidden'
            {...rowPresence}
          >
            <div className='flex items-center gap-2.5 px-1 py-1.5 text-xs'>
              <DrawnCheck tone='success' entrance='draw' />
              <p className='min-w-0 flex-1 truncate'>
                <span className='font-mono font-medium'>
                  /{entry.command.name}
                </span>{' '}
                <span className='text-muted-foreground'>{entry.argument}</span>
              </p>
              <span className='text-muted-foreground shrink-0'>
                {RESULTS[entry.command.id]}
              </span>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

const START_VALUE = '/';

const NO_SENT: SentEntry[] = [];

function SlashDemo() {
  const [value, setValue] = useState(START_VALUE);
  const [command, setCommand] = useState<SlashCommand | null>(null);
  const [sent, setSent] = useState(NO_SENT);
  const composer = useRef<SlashComposerHandle>(null);
  const { pressed, press } = usePress<ListKey | 'send'>();
  const pressedKey = listKeyOf(pressed);

  function resetDemo() {
    setValue(START_VALUE);
    setCommand(null);
    setSent(NO_SENT);
  }

  function typeFirst(typed: string) {
    setValue(`/${typed}`);
  }

  function noteSent(message: SlashMessage) {
    const sentCommand = message.command;
    if (!sentCommand) {
      return;
    }
    const entry = {
      id: Date.now(),
      command: sentCommand,
      argument: message.argument,
    };
    setSent((current) => [...current, entry].slice(-MAX_SENT));
  }

  const steps: AutoplayStep[] = [
    ...typingSteps('te', typeFirst, { startAfter: 1500, characterMs: 150 }),
    { after: 1000, run: () => press('enter') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.pickHighlighted() },
    ...typingSteps('checkout flow', setValue, {
      startAfter: 1200,
      characterMs: 65,
    }),
    { after: 900, run: () => press('send') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.send() },
    ...typingSteps('/com', setValue, { startAfter: 1800, characterMs: 150 }),
    { after: 1000, run: () => press('enter') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.pickHighlighted() },
    { after: 1400, run: () => press('send') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.send() },
    { after: 2600, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[28rem] w-full max-w-[32rem] flex-col gap-2'
    >
      <SentList entries={sent} />
      <SlashComposer
        commands={COMMANDS}
        value={value}
        onValueChange={setValue}
        command={command}
        onCommandChange={setCommand}
        listPlacement='inline'
        showsUnfocused={isAutoplaying}
        onSend={noteSent}
        handleRef={composer}
        pressedKey={pressedKey}
        isSendPressed={pressed === 'send'}
      />
      <p className='text-muted-foreground px-1 text-xs'>
        Illustrative commands on sample work
      </p>
    </div>
  );
}

function listKeyOf(pressed: ListKey | 'send' | null) {
  if (pressed === 'send') {
    return null;
  }
  return pressed;
}

export default function Prompt13() {
  return <SlashDemo />;
}
