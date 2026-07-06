'use client';

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type Transition,
} from 'motion/react';
import { useId, useImperativeHandle, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
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
  spokenUnless,
  usePress,
} from '@/registry/ndeko/lib/demonstration';
import {
  ArrowUpIcon,
  BookOpenIcon,
  CodeIcon,
  FileTextIcon,
  GitCompareIcon,
  GlobeIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import {
  fadePresence,
  risePresenceOf,
  springOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Textarea } from '@/registry/ndeko/ui/textarea';

import { ListKeys, type ListKey } from './_parts/list-keys';
import { includesQuery, Marked } from './_parts/marked';
import { activeIdOf, wrappedIndexOf } from './_parts/option-list';
import { useActiveRowInView } from './_parts/use-active-row';
import { isSendKey, useAutosize } from './_parts/use-autosize';

export type MentionKind = 'file' | 'symbol' | 'diff' | 'doc' | 'page';

export type MentionItem = {
  id: string;
  kind: MentionKind;
  name: string;
  path: string;
  /** An estimate of what the item adds to the context. */
  tokens: number;
};

export type MentionMessage = {
  text: string;
  mentions: MentionItem[];
};

export type MentionComposerHandle = {
  move: (step: number) => void;
  jumpGroup: (step: number) => void;
  pickHighlighted: () => void;
};

type MentionToken = {
  start: number;
  end: number;
  query: string;
};

type MentionGroup = {
  kind: MentionKind;
  title: string;
  items: MentionItem[];
};

const KINDS: MentionKind[] = ['file', 'symbol', 'diff', 'doc', 'page'];

const KIND_TITLES: Record<MentionKind, string> = {
  file: 'Files',
  symbol: 'Symbols',
  diff: 'Diffs',
  doc: 'Docs',
  page: 'Pages',
};

const KIND_ICONS: Record<MentionKind, React.ReactNode> = {
  file: <FileTextIcon />,
  symbol: <CodeIcon />,
  diff: <GitCompareIcon />,
  doc: <BookOpenIcon />,
  page: <GlobeIcon />,
};

const SHELL = [
  'bg-card hairline-ring ring-foreground/12 dark:ring-foreground/15 has-[textarea:focus]:ring-ring/25 relative flex flex-col rounded-xl p-2',
  'shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-150 has-[textarea:focus]:ring-[3px]',
].join(' ');

const TILE =
  'keycap-3d text-muted-foreground flex shrink-0 items-center justify-center [&_svg:not([class*="size-"])]:size-3.5';

const TOKEN_FORMAT = new Intl.NumberFormat('en-US');

function tokenTextOf(tokens: number) {
  return TOKEN_FORMAT.format(tokens);
}

function totalTokensOf(mentions: MentionItem[]) {
  let total = 0;
  for (const mention of mentions) {
    total += mention.tokens;
  }
  return total;
}

function mentionTokenAt(value: string, cursor: number): MentionToken | null {
  const before = value.slice(0, cursor);
  const at = before.lastIndexOf('@');
  if (at < 0) {
    return null;
  }
  const previous = before[at - 1];
  const isAtStart = at === 0;
  const isAfterSpace = previous !== undefined && /\s/.test(previous);
  const startsWord = isAtStart || isAfterSpace;
  if (!startsWord) {
    return null;
  }
  const query = before.slice(at + 1);
  if (/\s/.test(query)) {
    return null;
  }
  return { start: at, end: cursor, query };
}

function textWithoutToken(value: string, token: MentionToken) {
  const before = value.slice(0, token.start);
  const after = value.slice(token.end);
  const endsWithSpace = /\s$/.test(before);
  const startsWithSpace = /^\s/.test(after);
  const hasDoubleSpace = endsWithSpace && startsWithSpace;
  if (hasDoubleSpace) {
    return { text: `${before}${after.slice(1)}`, caret: before.length };
  }
  return { text: `${before}${after}`, caret: before.length };
}

/** At the end of the text the caret is left unset, so text written from outside still lands after it. */
function caretAfterOf(next: { text: string; caret: number }) {
  const isAtEnd = next.caret >= next.text.length;
  if (isAtEnd) {
    return null;
  }
  return next.caret;
}

function matchesOf(
  items: MentionItem[],
  mentions: MentionItem[],
  query: string
) {
  const takenIds = mentions.map((mention) => mention.id);
  return items.filter((item) => {
    const isFree = !takenIds.includes(item.id);
    const haystack = `${item.name} ${item.path}`;
    return isFree && includesQuery(haystack, query);
  });
}

function groupsOf(matches: MentionItem[]) {
  const groups: MentionGroup[] = [];
  for (const kind of KINDS) {
    const items = matches.filter((item) => item.kind === kind);
    if (items.length > 0) {
      groups.push({ kind, title: KIND_TITLES[kind], items });
    }
  }
  return groups;
}

function groupIndexOf(groups: MentionGroup[], activeId: string | null) {
  return groups.findIndex((group) => {
    return group.items.some((item) => item.id === activeId);
  });
}

function stepOfTab(event: React.KeyboardEvent) {
  if (event.shiftKey) {
    return -1;
  }
  return 1;
}

function activeToneOf(isActive: boolean) {
  if (isActive) {
    return 'bg-foreground/5';
  }
  return undefined;
}

function sendLabelOf(hasContent: boolean) {
  if (hasContent) {
    return 'Send';
  }
  return 'Send, write something first';
}

type OptionRowProps = {
  item: MentionItem;
  query: string;
  optionId: string;
  isActive: boolean;
  glide: Transition;
  onHover: (itemId: string) => void;
  onPick: (item: MentionItem) => void;
};

function OptionRow({
  item,
  query,
  optionId,
  isActive,
  glide,
  onHover,
  onPick,
}: OptionRowProps) {
  return (
    <div
      id={optionId}
      role='option'
      aria-selected={isActive}
      onMouseMove={() => onHover(item.id)}
      onClick={() => onPick(item)}
      className={cn(
        'flex h-11 cursor-default items-center gap-2.5 rounded-lg px-2 transition-colors duration-100',
        activeToneOf(isActive)
      )}
    >
      <motion.span
        layoutId={`mention-tile-${item.id}`}
        transition={glide}
        className={cn(TILE, 'size-7 rounded-md')}
      >
        {KIND_ICONS[item.kind]}
      </motion.span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='truncate text-[13px] font-medium'>
          <Marked text={item.name} query={query} />
        </span>
        <span className='text-muted-foreground truncate font-mono text-[11px]'>
          <Marked text={item.path} query={query} />
        </span>
      </span>
      <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
        {tokenTextOf(item.tokens)}
      </span>
    </div>
  );
}

type MentionListProps = {
  groups: MentionGroup[];
  query: string;
  listId: string;
  activeId: string | null;
  optionIdOf: (itemId: string) => string;
  listRef: React.RefObject<HTMLDivElement | null>;
  pressedKey: ListKey | null;
  glide: Transition;
  onHover: (itemId: string) => void;
  onPick: (item: MentionItem) => void;
};

function MentionList({
  groups,
  query,
  listId,
  activeId,
  optionIdOf,
  listRef,
  pressedKey,
  glide,
  onHover,
  onPick,
}: MentionListProps) {
  const hasGroups = groups.length > 1;
  const isEmpty = groups.length === 0;

  return (
    <div className='surface-raised flex flex-col overflow-hidden rounded-xl'>
      <div
        ref={listRef}
        id={listId}
        role='listbox'
        aria-label='Context to attach'
        onMouseDown={(event) => event.preventDefault()}
        className='relative flex max-h-56 flex-col overflow-y-auto p-1'
      >
        {isEmpty && (
          <p className='text-muted-foreground px-2 py-6 text-center text-xs'>
            Nothing matches “{query}”. Keep typing, or press Escape.
          </p>
        )}
        {groups.map((group) => (
          <div
            key={group.kind}
            role='group'
            aria-label={group.title}
            className='flex flex-col'
          >
            <p
              aria-hidden='true'
              className='text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium'
            >
              {group.title}
            </p>
            {group.items.map((item) => (
              <OptionRow
                key={item.id}
                item={item}
                query={query}
                optionId={optionIdOf(item.id)}
                isActive={item.id === activeId}
                glide={glide}
                onHover={onHover}
                onPick={onPick}
              />
            ))}
          </div>
        ))}
      </div>
      <ListKeys
        pressed={pressedKey}
        hasGroups={hasGroups}
        enterLabel='attaches'
        className='bg-foreground/[0.03] px-3 py-2'
      />
    </div>
  );
}

type MentionChipProps = {
  item: MentionItem;
  glide: Transition;
  onRemove: (itemId: string) => void;
};

function MentionChip({ item, glide, onRemove }: MentionChipProps) {
  const fade = fadePresence();

  return (
    <motion.li
      {...fade}
      className='bg-foreground/[0.05] dark:bg-foreground/[0.07] flex h-8 max-w-full items-center gap-1.5 rounded-lg ps-1 pe-0.5'
    >
      <motion.span
        layoutId={`mention-tile-${item.id}`}
        transition={glide}
        className={cn(TILE, 'size-6 rounded-[5px]')}
      >
        {KIND_ICONS[item.kind]}
      </motion.span>
      <span className='min-w-0 truncate text-xs font-medium'>{item.name}</span>
      <Button
        type='button'
        variant='ghost'
        size='icon-sm'
        aria-label={`Remove ${item.name}`}
        onClick={() => onRemove(item.id)}
        className='text-muted-foreground size-6'
      >
        <XIcon className='size-3' />
      </Button>
    </motion.li>
  );
}

export type MentionComposerProps = {
  items: MentionItem[];
  value: string;
  onValueChange: (value: string) => void;
  mentions: MentionItem[];
  onMentionsChange: (mentions: MentionItem[]) => void;
  /** `floating` hangs the list over the page above the composer. `inline` draws it under the composer and keeps its place. */
  listPlacement?: 'inline' | 'floating';
  /** Shows the list without focus, for a demonstration or a preview nobody types in. */
  showsUnfocused?: boolean;
  onSend?: (message: MentionMessage) => void;
  handleRef?: React.Ref<MentionComposerHandle>;
  /** The key a demonstration is holding down in the list. */
  pressedKey?: ListKey | null;
  placeholder?: string;
  className?: string;
};

export function MentionComposer({
  items,
  value,
  onValueChange,
  mentions,
  onMentionsChange,
  listPlacement = 'floating',
  showsUnfocused = false,
  onSend,
  handleRef,
  pressedKey = null,
  placeholder = 'Ask something, or type @ to attach context',
  className,
}: MentionComposerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dismissedStart, setDismissedStart] = useState<number | null>(null);
  const [caret, setCaret] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const risePresence = risePresenceOf(shouldReduceMotion);
  const glide = springOf(shouldReduceMotion);
  const layoutGroup = useId();
  const listId = useId();
  const optionPrefix = useId();
  const cursor = Math.min(caret ?? value.length, value.length);
  const token = mentionTokenAt(value, cursor);
  const isDismissed = token !== null && token.start === dismissedStart;
  const isShowing = isFocused || showsUnfocused;
  const isOpen = token !== null && !isDismissed && isShowing;
  const query = token?.query ?? '';
  const matches = matchesOf(items, mentions, query);
  const groups = groupsOf(matches);
  const flat = groups.flatMap((group) => group.items);
  const activeId = activeIdOf(flat, highlightedId);
  const totalTokens = totalTokensOf(mentions);
  const hasMentions = mentions.length > 0;
  const hasContent = hasMentions || value.trim() !== '';
  const resultsMessage = resultsMessageOf(isOpen, flat.length, showsUnfocused);
  const activeDescendant = activeDescendantOf(isOpen, optionPrefix, activeId);
  useAutosize(textareaRef, value, 120);

  function optionIdOf(itemId: string) {
    return `${optionPrefix}-${itemId}`;
  }

  useActiveRowInView(listRef, activeDescendant);

  function move(step: number) {
    const ids = flat.map((item) => item.id);
    const current = ids.indexOf(activeId ?? '');
    const next = wrappedIndexOf(current, step, ids.length);
    const id = ids[next];
    if (id) {
      setHighlightedId(id);
    }
  }

  function jumpGroup(step: number) {
    const current = groupIndexOf(groups, activeId);
    const next = wrappedIndexOf(current, step, groups.length);
    const target = groups[next]?.items[0];
    if (target) {
      setHighlightedId(target.id);
    }
  }

  function pick(item: MentionItem) {
    if (!token) {
      return;
    }
    const next = textWithoutToken(value, token);
    onValueChange(next.text);
    onMentionsChange([...mentions, item]);
    setCaret(caretAfterOf(next));
    setDismissedStart(null);
    setNotice(`${item.name} attached`);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      const isTyping = document.activeElement === textarea;
      if (textarea && isTyping) {
        textarea.setSelectionRange(next.caret, next.caret);
      }
    });
  }

  function pickHighlighted() {
    const item = flat.find((entry) => entry.id === activeId);
    if (item) {
      pick(item);
    }
  }

  useImperativeHandle(handleRef, () => ({ move, jumpGroup, pickHighlighted }));

  function removeMention(itemId: string) {
    const removed = mentions.find((mention) => mention.id === itemId);
    onMentionsChange(mentions.filter((mention) => mention.id !== itemId));
    setNotice(`${removed?.name ?? 'Mention'} removed`);
  }

  function dismiss() {
    if (token) {
      setDismissedStart(token.start);
    }
  }

  function send() {
    if (!hasContent) {
      return;
    }
    const text = value.trim();
    onSend?.({ text, mentions });
    onValueChange('');
    onMentionsChange([]);
    setCaret(null);
    setNotice('Message sent');
  }

  function changeValue(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setCaret(event.target.selectionStart);
    setDismissedStart(null);
    onValueChange(event.target.value);
  }

  function followSelection(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    setCaret(event.currentTarget.selectionStart);
  }

  function handleKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isComposing = event.nativeEvent.isComposing;
    if (isComposing) {
      return;
    }
    if (isOpen) {
      const isEnter = event.key === 'Enter' && !event.shiftKey;
      const canJump = event.key === 'Tab' && groups.length > 1;
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
      if (isEnter) {
        event.preventDefault();
        pickHighlighted();
        return;
      }
      if (canJump) {
        event.preventDefault();
        jumpGroup(stepOfTab(event));
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
    }
    if (isSendKey(event)) {
      event.preventDefault();
      send();
      return;
    }
    const isBackspace = event.key === 'Backspace';
    const canRemoveLast = isBackspace && value === '' && hasMentions;
    if (canRemoveLast) {
      event.preventDefault();
      removeMention(mentions[mentions.length - 1].id);
    }
  }

  const list = (
    <MentionList
      groups={groups}
      query={query}
      listId={listId}
      activeId={activeId}
      optionIdOf={optionIdOf}
      listRef={listRef}
      pressedKey={pressedKey}
      glide={glide}
      onHover={setHighlightedId}
      onPick={pick}
    />
  );

  return (
    <LayoutGroup id={layoutGroup}>
      <div className={cn('relative flex w-full flex-col gap-2', className)}>
        <div className={SHELL}>
          <AnimatedSize>
            <ul
              aria-label='Attached context'
              className={cn(
                'flex flex-wrap gap-1.5',
                hasMentions && 'px-1 pt-1 pb-1.5'
              )}
            >
              <AnimatePresence initial={false}>
                {mentions.map((item) => (
                  <MentionChip
                    key={item.id}
                    item={item}
                    glide={glide}
                    onRemove={removeMention}
                  />
                ))}
              </AnimatePresence>
            </ul>
            <Textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={changeValue}
              onSelect={followSelection}
              onKeyDown={handleKeys}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              aria-label='Message'
              aria-autocomplete='list'
              aria-controls={listId}
              aria-activedescendant={activeDescendant}
              placeholder={placeholder}
              className='max-h-none min-h-10 border-0 bg-transparent px-2 py-1.5 shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent'
            />
          </AnimatedSize>
          <div className='flex items-center gap-2 pt-1'>
            <p className='text-muted-foreground flex min-w-0 flex-1 items-baseline gap-1 ps-2 text-xs'>
              {hasMentions && (
                <span className='truncate'>
                  <MotionNumber value={mentions.length} />{' '}
                  {nounOf(mentions.length, 'mention')}, about{' '}
                  <MotionNumber value={totalTokens} /> tokens
                </span>
              )}
              {!hasMentions && (
                <span className='truncate'>
                  <Kbd>@</Kbd> attaches files, symbols, diffs, docs and pages
                </span>
              )}
            </p>
            <Button
              type='button'
              size='icon'
              aria-label={sendLabelOf(hasContent)}
              disabled={!hasContent}
              focusableWhenDisabled
              onClick={send}
            >
              <ArrowUpIcon />
            </Button>
          </div>
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
    </LayoutGroup>
  );
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

function resultsMessageOf(
  isOpen: boolean,
  count: number,
  isDemonstrating: boolean
) {
  if (!isOpen || isDemonstrating) {
    return '';
  }
  return countOf(count, 'result');
}

const ITEMS: MentionItem[] = [
  {
    id: 'invoice-file',
    kind: 'file',
    name: 'invoice.ts',
    path: 'src/lib/invoice.ts',
    tokens: 1240,
  },
  {
    id: 'invoice-test',
    kind: 'file',
    name: 'invoice-totals.test.ts',
    path: 'tests/invoice-totals.test.ts',
    tokens: 860,
  },
  {
    id: 'format-total',
    kind: 'symbol',
    name: 'formatInvoiceTotal',
    path: 'src/lib/money.ts:42',
    tokens: 180,
  },
  {
    id: 'round-cents',
    kind: 'symbol',
    name: 'roundToCents',
    path: 'src/lib/money.ts:18',
    tokens: 120,
  },
  {
    id: 'staged-diff',
    kind: 'diff',
    name: 'Invoice rounding, staged',
    path: '3 files changed',
    tokens: 540,
  },
  {
    id: 'last-commit',
    kind: 'diff',
    name: 'Last commit',
    path: '5 files changed',
    tokens: 1100,
  },
  {
    id: 'refund-policy',
    kind: 'doc',
    name: 'Refund policy',
    path: 'docs/refunds.md',
    tokens: 420,
  },
  {
    id: 'invoice-numbering',
    kind: 'doc',
    name: 'Invoice numbering',
    path: 'docs/invoice-numbering.md',
    tokens: 310,
  },
  {
    id: 'orders-page',
    kind: 'page',
    name: 'Orders dashboard',
    path: 'shop.example/admin/orders',
    tokens: 650,
  },
  {
    id: 'returns-page',
    kind: 'page',
    name: 'Returns policy',
    path: 'shop.example/returns-policy',
    tokens: 380,
  },
];

const QUESTION = 'Why does the total differ by a cent?';

const START_VALUE = `${QUESTION} @`;

const AFTER_FIRST = `${QUESTION} `;

const RESTING_VALUE = `${QUESTION} @pol`;

const RESTING_MENTIONS = [ITEMS[0]];

const NO_MENTIONS: MentionItem[] = [];

function restingValueOf(isResting: boolean) {
  if (isResting) {
    return RESTING_VALUE;
  }
  return START_VALUE;
}

function restingMentionsOf(isResting: boolean) {
  if (isResting) {
    return RESTING_MENTIONS;
  }
  return NO_MENTIONS;
}

function footnoteOf(sentCount: number) {
  if (sentCount > 0) {
    return `Sent with ${countOf(sentCount, 'mention')}`;
  }
  return 'Illustrative token estimates on sample files';
}

function MentionDemo({ isResting }: { isResting: boolean }) {
  const [value, setValue] = useState(restingValueOf(isResting));
  const [mentions, setMentions] = useState(restingMentionsOf(isResting));
  const [sentCount, setSentCount] = useState(0);
  const composer = useRef<MentionComposerHandle>(null);
  const { pressed, press } = usePress<ListKey>();

  function resetDemo() {
    setValue(START_VALUE);
    setMentions(NO_MENTIONS);
  }

  function typeFirst(typed: string) {
    setValue(`${QUESTION} ${typed}`);
  }

  function typeSecond(typed: string) {
    setValue(`${AFTER_FIRST}${typed}`);
  }

  function noteSent(message: MentionMessage) {
    setSentCount(message.mentions.length);
  }

  const steps: AutoplayStep[] = [
    ...typingSteps('@inv', typeFirst, { startAfter: 1500, characterMs: 140 }),
    { after: 1000, run: () => press('move') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.move(1) },
    { after: 800, run: () => press('move') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.move(-1) },
    { after: 900, run: () => press('enter') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.pickHighlighted() },
    ...typingSteps('@pol', typeSecond, { startAfter: 1500, characterMs: 140 }),
    { after: 1000, run: () => press('tab') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.jumpGroup(1) },
    { after: 900, run: () => press('enter') },
    { after: PRESS_LEAD_MS, run: () => composer.current?.pickHighlighted() },
    { after: 2800, run: hold },
  ];
  const { ref, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 1600,
    onReset: resetDemo,
  });

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='@container flex min-h-[27rem] w-full max-w-[32rem] flex-col gap-2'
    >
      <MentionComposer
        items={ITEMS}
        value={value}
        onValueChange={setValue}
        mentions={mentions}
        onMentionsChange={setMentions}
        listPlacement='inline'
        showsUnfocused={isAutoplaying}
        onSend={noteSent}
        handleRef={composer}
        pressedKey={pressed}
      />
      <p className='text-muted-foreground h-5 px-1 text-xs'>
        {footnoteOf(sentCount)}
      </p>
    </div>
  );
}

export default function Prompt12() {
  const shouldReduceMotion = usePrefersReducedMotion();
  const restKey = String(shouldReduceMotion);

  return <MentionDemo key={restKey} isResting={shouldReduceMotion} />;
}
