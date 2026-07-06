'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  emptyRun,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  CheckIcon,
  EraserIcon,
  FileTextIcon,
  HistoryIcon,
  MessageCircleIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  RotateCcwIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf, springOf } from '@/registry/ndeko/lib/motion-presets';
import { applyBatchAt, restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { countOf, nounOf } from '@/registry/ndeko/lib/words';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/ndeko/ui/dropdown-menu';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';
import { Textarea } from '@/registry/ndeko/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/registry/ndeko/ui/toggle-group';

import { focusLater } from './_parts/focus-later';
import { RelativeTime } from './_parts/relative-time';

export type MemoryScope = 'project' | 'everywhere';

export type MemorySource = {
  id: string;
  kind: 'conversation' | 'file';
  title: string;
};

export type AgentMemoryItem = {
  id: string;
  text: string;
  scope: MemoryScope;
  source: MemorySource;
  isPinned: boolean;
  lastUsedAt: number;
  /** The recall of the turn that used it last, for "Why was this used?". */
  usedBy?: ToolCall;
};

export type MemoryVariant = 'full' | 'compact';

type PendingForget = {
  key: string;
  memoryIds: string[];
  anchorId: string;
  label: string;
};

type ListEntry =
  | { kind: 'heading'; key: string; label: string }
  | { kind: 'memory'; key: string; memory: AgentMemoryItem }
  | { kind: 'undo'; key: string; pending: PendingForget };

const UNDO_MS = 5000;

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

const COMPACT_LIMIT = 5;

const SCOPE_LABEL: Record<MemoryScope, string> = {
  project: 'This project',
  everywhere: 'Everywhere',
};

const SCOPES: MemoryScope[] = ['project', 'everywhere'];

const ALL_SCOPES: MemoryScope[] = ['project', 'everywhere'];

const SOURCE_GLYPH: Record<MemorySource['kind'], React.ReactNode> = {
  conversation: <MessageCircleIcon />,
  file: <FileTextIcon />,
};

type TextPiece = { text: string; isMatch: boolean };

function piecesOf(text: string, query: string): TextPiece[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return [{ text, isMatch: false }];
  }
  const haystack = text.toLowerCase();
  const pieces: TextPiece[] = [];
  let cursor = 0;
  let found = haystack.indexOf(needle, cursor);
  while (found >= 0) {
    const before = text.slice(cursor, found);
    const matchEnd = found + needle.length;
    const match = text.slice(found, matchEnd);
    if (before !== '') {
      pieces.push({ text: before, isMatch: false });
    }
    pieces.push({ text: match, isMatch: true });
    cursor = matchEnd;
    found = haystack.indexOf(needle, cursor);
  }
  const rest = text.slice(cursor);
  if (rest !== '') {
    pieces.push({ text: rest, isMatch: false });
  }
  return pieces;
}

function Marked({ text, query }: { text: string; query: string }) {
  const pieces = piecesOf(text, query);

  return (
    <>
      {pieces.map((piece, index) => {
        if (piece.isMatch) {
          return (
            <mark
              key={index}
              className='bg-warning/25 text-foreground rounded-[3px] px-px'
            >
              {piece.text}
            </mark>
          );
        }
        return <span key={index}>{piece.text}</span>;
      })}
    </>
  );
}

function matchesQuery(memory: AgentMemoryItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return true;
  }
  const text = memory.text.toLowerCase();
  const source = memory.source.title.toLowerCase();
  const isInText = text.includes(needle);
  const isInSource = source.includes(needle);
  return isInText || isInSource;
}

function byPinThenUse(first: AgentMemoryItem, second: AgentMemoryItem) {
  const pinOrder = Number(second.isPinned) - Number(first.isPinned);
  if (pinOrder !== 0) {
    return pinOrder;
  }
  return second.lastUsedAt - first.lastUsedAt;
}

function isRecent(memory: AgentMemoryItem, newest: number) {
  const age = newest - memory.lastUsedAt;
  return age < RECENT_MS;
}

function newestUseOf(memories: AgentMemoryItem[]) {
  let newest = 0;
  for (const memory of memories) {
    newest = Math.max(newest, memory.lastUsedAt);
  }
  return newest;
}

function compactOf(sorted: AgentMemoryItem[]) {
  const newest = newestUseOf(sorted);
  const kept = sorted.filter((memory) => {
    const isKept = memory.isPinned || isRecent(memory, newest);
    return isKept;
  });
  return kept.slice(0, COMPACT_LIMIT);
}

function hiddenIdsOf(pending: PendingForget[]) {
  const ids = new Set<string>();
  for (const forget of pending) {
    for (const memoryId of forget.memoryIds) {
      ids.add(memoryId);
    }
  }
  return ids;
}

function pendingAt(pending: PendingForget[], memoryId: string) {
  return pending.filter((forget) => forget.anchorId === memoryId);
}

type MemoryGroup = 'pinned' | 'other';

function groupOf(memory: AgentMemoryItem): MemoryGroup {
  if (memory.isPinned) {
    return 'pinned';
  }
  return 'other';
}

/** Pinned first under its heading, then the rest; a forgotten row leaves its Undo line in its place. */
function entriesOf(
  ordered: AgentMemoryItem[],
  pending: PendingForget[],
  otherLabel: string
) {
  const hiddenIds = hiddenIdsOf(pending);
  const entries: ListEntry[] = [];
  let lastGroup: MemoryGroup | null = null;
  for (const memory of ordered) {
    const group = groupOf(memory);
    const isNewGroup = group !== lastGroup;
    if (isNewGroup) {
      entries.push(headingOf(group, otherLabel));
      lastGroup = group;
    }
    const undoLines = pendingAt(pending, memory.id);
    for (const forget of undoLines) {
      entries.push({ kind: 'undo', key: forget.key, pending: forget });
    }
    const isHidden = hiddenIds.has(memory.id);
    if (!isHidden) {
      entries.push({ kind: 'memory', key: memory.id, memory });
    }
  }
  return entries;
}

function headingOf(group: MemoryGroup, otherLabel: string): ListEntry {
  if (group === 'pinned') {
    return { kind: 'heading', key: 'heading-pinned', label: 'Pinned' };
  }
  return { kind: 'heading', key: 'heading-other', label: otherLabel };
}

function otherLabelOf(isCompact: boolean) {
  if (isCompact) {
    return 'Recent';
  }
  return 'Everything else';
}

function pinLabelOf(isPinned: boolean) {
  if (isPinned) {
    return 'Unpin this memory';
  }
  return 'Pin this memory';
}

function queryOf(call: ToolCall | undefined) {
  const query = call?.input?.query;
  if (typeof query === 'string') {
    return query;
  }
  return '';
}

function WhyUsed({ memory }: { memory: AgentMemoryItem }) {
  const call = memory.usedBy;
  if (!call) {
    return null;
  }
  const query = queryOf(call);
  const hasQuery = query !== '';

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Why was this used?'
            className='text-muted-foreground'
          />
        }
      >
        <HistoryIcon />
      </PopoverTrigger>
      <PopoverContent align='end' className='flex w-72 flex-col gap-2 p-3'>
        <PopoverTitle className='text-muted-foreground text-xs font-normal'>
          Used while answering
        </PopoverTitle>
        <p className='text-[13px] leading-5 font-medium text-balance'>
          {call.label}
        </p>
        {hasQuery && (
          <p className='text-muted-foreground text-xs leading-5'>
            Memory was searched for &ldquo;{query}&rdquo;,{' '}
            <RelativeTime at={call.startedAt ?? 0} />
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function usedKeyOf(memory: AgentMemoryItem) {
  return memory.usedBy?.id ?? 'never';
}

/**
 * A memory lights for a moment when a turn uses it, then the tint leaves: one transition on its
 * colour, started by the row being keyed on the turn. Nothing lights when the list is first shown.
 */
const USED_FLASH =
  'bg-primary/0 pointer-events-none absolute inset-x-0 inset-y-0.5 -z-10 rounded-lg transition-colors duration-[1600ms] ease-linear starting:bg-primary/[0.09]';

type MemoryRowProps = {
  memory: AgentMemoryItem;
  query: string;
  sourceCount: number;
  isEditing: boolean;
  isConfirmingSource: boolean;
  /** True once a turn used the memory after the list was shown: the row lights for that turn. */
  showsUse: boolean;
  isPinPressed: boolean;
  onStartEdit: (memoryId: string) => void;
  onEndEdit: (memoryId: string, text: string | null) => void;
  onPin: (memoryId: string, isPinned: boolean) => void;
  onForget: (memory: AgentMemoryItem) => void;
  onAskForgetSource: (memoryId: string) => void;
  onCancelForgetSource: (memoryId: string) => void;
  onForgetSource: (memory: AgentMemoryItem) => void;
};

function MemoryRow({
  memory,
  query,
  sourceCount,
  isEditing,
  isConfirmingSource,
  showsUse,
  isPinPressed,
  onStartEdit,
  onEndEdit,
  onPin,
  onForget,
  onAskForgetSource,
  onCancelForgetSource,
  onForgetSource,
}: MemoryRowProps) {
  const [draft, setDraft] = useState(memory.text);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const fieldId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const usedKey = usedKeyOf(memory);
  const sourceWord = countOf(sourceCount, 'memory', 'memories');
  const isBlank = draft.trim() === '';

  function startEdit() {
    setDraft(memory.text);
    onStartEdit(memory.id);
  }

  function save() {
    if (isBlank) {
      return;
    }
    onEndEdit(memory.id, draft.trim());
  }

  function cancel() {
    onEndEdit(memory.id, null);
  }

  function handleFieldKeys(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
      return;
    }
    const hasCommandKey = event.metaKey || event.ctrlKey;
    const isSaveKey = event.key === 'Enter' && hasCommandKey;
    if (isSaveKey) {
      event.preventDefault();
      save();
    }
  }

  return (
    <div data-memory={memory.id} className='relative isolate px-2 py-2.5'>
      {showsUse && (
        <span key={usedKey} aria-hidden='true' className={USED_FLASH} />
      )}
      {memory.isPinned && <span className='sr-only'>Pinned. </span>}
      {isEditing && (
        <div className='flex flex-col gap-2'>
          <label htmlFor={fieldId} className='sr-only'>
            Edit the memory
          </label>
          <Textarea
            id={fieldId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleFieldKeys}
            aria-invalid={isBlank}
            autoFocus
            className='min-h-14'
          />
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              size='sm'
              onClick={save}
              disabled={isBlank}
              focusableWhenDisabled
            >
              <CheckIcon />
              Save
            </Button>
            <Button type='button' variant='ghost' size='sm' onClick={cancel}>
              Cancel
            </Button>
            <span className='text-muted-foreground ms-auto hidden items-center gap-1 text-xs @sm:flex'>
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd> saves
            </span>
          </div>
        </div>
      )}
      {!isEditing && (
        <p className='text-[13px] leading-5 text-pretty'>
          <Marked text={memory.text} query={query} />
        </p>
      )}
      <div className='mt-1 flex items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type='button'
                aria-label={`Source: ${memory.source.title}, more actions`}
                data-action='source'
                className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 -ms-1 flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-xs outline-none focus-visible:ring-[3px] [&_svg]:size-3.5 [&_svg]:shrink-0'
              />
            }
          >
            {SOURCE_GLYPH[memory.source.kind]}
            <span className='truncate'>
              <Marked text={memory.source.title} query={query} />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='start'
            finalFocus={() => confirmRef.current ?? true}
          >
            <DropdownMenuItem
              variant='destructive'
              onClick={() => onAskForgetSource(memory.id)}
            >
              <EraserIcon />
              Forget everything from this source
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className='text-muted-foreground shrink-0 text-xs'>
          used <RelativeTime at={memory.lastUsedAt} />
        </span>
        {!isEditing && (
          <span className='ms-auto flex shrink-0 items-center'>
            <WhyUsed memory={memory} />
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={pinLabelOf(memory.isPinned)}
              onClick={() => onPin(memory.id, !memory.isPinned)}
              data-action='pin'
              className={cn(
                'text-muted-foreground',
                pressedQuietOf(isPinPressed)
              )}
            >
              <Swap swapKey={String(memory.isPinned)}>
                {memory.isPinned && <PinOffIcon />}
                {!memory.isPinned && <PinIcon />}
              </Swap>
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Edit this memory'
              onClick={startEdit}
              data-action='edit'
              className='text-muted-foreground'
            >
              <PencilIcon />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label='Forget this memory'
              onClick={() => onForget(memory)}
              data-action='forget'
              className='text-muted-foreground hover:text-destructive-ink'
            >
              <TrashIcon />
            </Button>
          </span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {isConfirmingSource && (
          <motion.div
            key='confirm'
            className='overflow-hidden'
            {...rowPresence}
          >
            <div className='bg-destructive/[0.06] mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-3 py-2'>
              <p className='min-w-0 flex-1 text-xs leading-5'>
                Forget all {sourceWord} from {memory.source.title}?
              </p>
              <div className='flex items-center gap-1.5'>
                <Button
                  ref={confirmRef}
                  type='button'
                  size='sm'
                  variant='destructive'
                  onClick={() => onForgetSource(memory)}
                >
                  Forget {sourceWord}
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  onClick={() => onCancelForgetSource(memory.id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UndoLine({
  pending,
  onUndo,
}: {
  pending: PendingForget;
  onUndo: (key: string) => void;
}) {
  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] my-1.5 flex items-center gap-3 rounded-lg py-1.5 ps-3 pe-1.5'>
      <p className='text-muted-foreground min-w-0 flex-1 truncate text-xs'>
        {pending.label}
      </p>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={() => onUndo(pending.key)}
        data-undo={pending.key}
        className='relative shrink-0 overflow-hidden'
      >
        <RotateCcwIcon />
        Undo
        <span
          aria-hidden='true'
          className='bg-foreground/25 absolute inset-x-2 bottom-1 h-px origin-left scale-x-0 transition-transform duration-[5000ms] ease-linear starting:scale-x-100'
        />
      </Button>
    </div>
  );
}

function quoteOf(text: string) {
  const isLong = text.length > 42;
  if (isLong) {
    const cut = text.slice(0, 40).trimEnd();
    return `“${cut}…”`;
  }
  return `“${text}”`;
}

function changeScopes(
  values: unknown[],
  onChange: (scopes: MemoryScope[]) => void
) {
  const scopes = SCOPES.filter((scope) => values.includes(scope));
  onChange(scopes);
}

function countInScope(memories: AgentMemoryItem[], scope: MemoryScope) {
  const inScope = memories.filter((memory) => memory.scope === scope);
  return inScope.length;
}

function emptyLineOf(query: string, hasScopes: boolean) {
  if (!hasScopes) {
    return 'Turn a scope back on to see memories';
  }
  const trimmed = query.trim();
  if (trimmed !== '') {
    return `No memory mentions “${trimmed}”`;
  }
  return 'Nothing remembered yet';
}

const NO_PENDING: PendingForget[] = [];

export type AgentMemoryProps = {
  memories: AgentMemoryItem[];
  variant?: MemoryVariant;
  agentName?: string;
  onEdit?: (memoryId: string, text: string) => void;
  onPinChange?: (memoryId: string, isPinned: boolean) => void;
  /** Called once the Undo window has closed. */
  onForget?: (memoryIds: string[]) => void;
  /** The memory whose pin a demonstration holds down. */
  pressedPinId?: string | null;
  className?: string;
};

function usedKeysOf(memories: AgentMemoryItem[]) {
  const keys = memories.map(usedKeyOf);
  return new Set(keys);
}

/** The order of the rows: a row travels to a new place only when it changes. */
function orderKeyOf(entries: ListEntry[]) {
  const keys = entries.map((entry) => entry.key);
  return keys.join(' ');
}

export function AgentMemory({
  memories,
  variant = 'full',
  agentName = 'The agent',
  onEdit,
  onPinChange,
  onForget,
  pressedPinId = null,
  className,
}: AgentMemoryProps) {
  const [query, setQuery] = useState('');
  const [scopes, setScopes] = useState<MemoryScope[]>(ALL_SCOPES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingForget[]>(NO_PENDING);
  const [quietUseKeys] = useState(() => usedKeysOf(memories));
  const rootRef = useRef<HTMLElement>(null);
  const undoneKeys = useRef(new Set<string>());
  const searchId = useId();
  const { schedule } = useTimeouts();
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);
  const spring = springOf(shouldReduceMotion);
  const rowTransition = { ...rowPresence.transition, layout: spring };
  const isCompact = variant === 'compact';
  const sorted = [...memories].sort(byPinThenUse);
  const inScopes = sorted.filter((memory) => scopes.includes(memory.scope));
  const matching = inScopes.filter((memory) => matchesQuery(memory, query));
  const shown = compactOrAll(isCompact, sorted, matching);
  const otherLabel = otherLabelOf(isCompact);
  const entries = entriesOf(shown, pending, otherLabel);
  const orderKey = orderKeyOf(entries);
  const hiddenIds = hiddenIdsOf(pending);
  const visibleMemories = shown.filter((memory) => !hiddenIds.has(memory.id));
  const isEmpty = visibleMemories.length === 0;
  const hasPending = pending.length > 0;
  const showsEmpty = isEmpty && !hasPending;
  const hasScopes = scopes.length > 0;
  const hasQuery = query !== '';

  function closeUndo(key: string) {
    setPending((current) => current.filter((forget) => forget.key !== key));
  }

  function commit(forget: PendingForget) {
    const wasUndone = undoneKeys.current.has(forget.key);
    if (wasUndone) {
      return;
    }
    closeUndo(forget.key);
    onForget?.(forget.memoryIds);
  }

  function holdForget(forget: PendingForget) {
    setPending((current) => [...current, forget]);
    setConfirmingId(null);
    focusLater(rootRef, `[data-undo="${forget.key}"]`);
    schedule(() => commit(forget), UNDO_MS);
  }

  function forgetOne(memory: AgentMemoryItem) {
    holdForget({
      key: `one-${memory.id}-${Date.now()}`,
      memoryIds: [memory.id],
      anchorId: memory.id,
      label: `Forgot ${quoteOf(memory.text)}`,
    });
  }

  function forgetSource(memory: AgentMemoryItem) {
    const fromSource = memories.filter(
      (candidate) => candidate.source.id === memory.source.id
    );
    const memoryIds = fromSource.map((candidate) => candidate.id);
    const word = countOf(memoryIds.length, 'memory', 'memories');
    holdForget({
      key: `source-${memory.source.id}-${Date.now()}`,
      memoryIds,
      anchorId: memory.id,
      label: `Forgot ${word} from ${memory.source.title}`,
    });
  }

  function undo(key: string) {
    const forget = pending.find((candidate) => candidate.key === key);
    undoneKeys.current.add(key);
    closeUndo(key);
    if (forget) {
      focusLater(
        rootRef,
        `[data-memory="${forget.anchorId}"] [data-action="forget"]`
      );
    }
  }

  function cancelForgetSource(memoryId: string) {
    setConfirmingId(null);
    focusLater(rootRef, `[data-memory="${memoryId}"] [data-action="source"]`);
  }

  function startEdit(memoryId: string) {
    setEditingId(memoryId);
    setConfirmingId(null);
  }

  function endEdit(memoryId: string, text: string | null) {
    setEditingId(null);
    if (text !== null) {
      onEdit?.(memoryId, text);
    }
    focusLater(rootRef, `[data-memory="${memoryId}"] [data-action="edit"]`);
  }

  function pin(memoryId: string, isPinned: boolean) {
    onPinChange?.(memoryId, isPinned);
    focusLater(rootRef, `[data-memory="${memoryId}"] [data-action="pin"]`);
  }

  function clearSearch() {
    setQuery('');
    setScopes(ALL_SCOPES);
  }

  function sourceCountOf(memory: AgentMemoryItem) {
    const fromSource = memories.filter(
      (candidate) => candidate.source.id === memory.source.id
    );
    return fromSource.length;
  }

  return (
    <section
      ref={rootRef}
      aria-label={`What ${agentName} remembers`}
      className={cn(
        'bg-card hairline-ring ring-border @container flex flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <header className='flex items-baseline justify-between gap-3'>
        <h3 className='text-sm font-medium'>Memory</h3>
        <p className='text-muted-foreground text-xs'>
          <MotionNumber value={memories.length} />{' '}
          {nounOf(memories.length, 'memory', 'memories')}
        </p>
      </header>
      {!isCompact && (
        <div className='flex flex-col gap-2'>
          <div className='relative'>
            <label htmlFor={searchId} className='sr-only'>
              Search the memories
            </label>
            <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
            <Input
              id={searchId}
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search what it remembers'
              className='ps-8 pe-8'
            />
            {hasQuery && (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label='Clear the search'
                onClick={() => setQuery('')}
                className='text-muted-foreground absolute end-0.5 top-1/2 size-7 -translate-y-1/2'
              >
                <XIcon />
              </Button>
            )}
          </div>
          <ToggleGroup
            multiple
            aria-label='Scopes'
            value={scopes}
            onValueChange={(values) => changeScopes(values, setScopes)}
            size='sm'
            className='gap-1'
          >
            {SCOPES.map((scope) => (
              <ToggleGroupItem
                key={scope}
                value={scope}
                variant='outline'
                className='rounded-full px-3 text-xs'
              >
                {SCOPE_LABEL[scope]}
                <span className='text-muted-foreground tabular-nums'>
                  <MotionNumber value={countInScope(memories, scope)} />
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
      <ul aria-label='Memories' className='-mx-2 flex flex-col'>
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.li
              key={entry.key}
              layout='position'
              layoutDependency={orderKey}
              className='overflow-hidden'
              {...rowPresence}
              transition={rowTransition}
            >
              {entry.kind === 'heading' && (
                <p
                  aria-hidden='true'
                  className='text-muted-foreground px-2 pt-2 pb-0.5 text-xs font-medium'
                >
                  {entry.label}
                </p>
              )}
              {entry.kind === 'undo' && (
                <UndoLine pending={entry.pending} onUndo={undo} />
              )}
              {entry.kind === 'memory' && (
                <MemoryRow
                  memory={entry.memory}
                  query={query}
                  sourceCount={sourceCountOf(entry.memory)}
                  isEditing={editingId === entry.memory.id}
                  isConfirmingSource={confirmingId === entry.memory.id}
                  showsUse={!quietUseKeys.has(usedKeyOf(entry.memory))}
                  isPinPressed={pressedPinId === entry.memory.id}
                  onStartEdit={startEdit}
                  onEndEdit={endEdit}
                  onPin={pin}
                  onForget={forgetOne}
                  onAskForgetSource={setConfirmingId}
                  onCancelForgetSource={cancelForgetSource}
                  onForgetSource={forgetSource}
                />
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <AnimatePresence initial={false}>
        {showsEmpty && (
          <motion.div key='empty' className='overflow-hidden' {...rowPresence}>
            <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col items-center gap-3 rounded-lg px-4 py-6 text-center'>
              <p className='text-muted-foreground text-[13px]'>
                {emptyLineOf(query, hasScopes)}
              </p>
              {!isCompact && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={clearSearch}
                >
                  Show every memory
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function compactOrAll(
  isCompact: boolean,
  sorted: AgentMemoryItem[],
  matching: AgentMemoryItem[]
) {
  if (isCompact) {
    return compactOf(sorted);
  }
  return matching;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;

const LOADED_AT = Date.now();

const KICKOFF: MemorySource = {
  id: 'kickoff',
  kind: 'conversation',
  title: 'Kickoff call, Oct 2',
};

const CONTACTS: MemorySource = {
  id: 'contacts',
  kind: 'file',
  title: 'vendor-contacts.csv',
};

const STYLE_NOTES: MemorySource = {
  id: 'style',
  kind: 'conversation',
  title: 'Style notes with Ines',
};

const WRITING_GUIDE: MemorySource = {
  id: 'guide',
  kind: 'file',
  title: 'writing-guide.md',
};

function earlierRecall(
  id: string,
  question: string,
  query: string,
  at: number
): ToolCall {
  return {
    id,
    tool: 'recall',
    label: question,
    status: 'done',
    agentId: 'writer',
    input: { query },
    startedAt: at,
    endedAt: at,
  };
}

const MEMORIES: AgentMemoryItem[] = [
  {
    id: 'terms',
    text: 'Brightmoor bills at 45 days, not 30. Ask before assuming a late fee.',
    scope: 'project',
    source: KICKOFF,
    isPinned: true,
    lastUsedAt: LOADED_AT - 3 * DAY_MS,
    usedBy: earlierRecall(
      'earlier-terms',
      'When is the Brightmoor invoice of October due?',
      'Brightmoor payment terms',
      LOADED_AT - 3 * DAY_MS
    ),
  },
  {
    id: 'contact',
    text: 'Dana Ruiz handles credits at Brightmoor: accounts@brightmoor-supply.example',
    scope: 'project',
    source: CONTACTS,
    isPinned: false,
    lastUsedAt: LOADED_AT - 6 * DAY_MS,
  },
  {
    id: 'money',
    text: 'Write money with two decimals in every report: $1,840.20, never $1,840.',
    scope: 'everywhere',
    source: STYLE_NOTES,
    isPinned: false,
    lastUsedAt: LOADED_AT - 2 * HOUR_MS,
    usedBy: earlierRecall(
      'earlier-money',
      'Write the Q3 spend summary for finance',
      'how to write amounts in reports',
      LOADED_AT - 2 * HOUR_MS
    ),
  },
  {
    id: 'ostrava',
    text: 'We stopped ordering from Ostrava Supply in August.',
    scope: 'project',
    source: KICKOFF,
    isPinned: false,
    lastUsedAt: LOADED_AT - 12 * DAY_MS,
  },
  {
    id: 'tone',
    text: 'Keep vendor emails short and polite, under 150 words.',
    scope: 'everywhere',
    source: WRITING_GUIDE,
    isPinned: false,
    lastUsedAt: LOADED_AT - 20 * DAY_MS,
  },
  {
    id: 'fiscal',
    text: 'Our fiscal year starts on February 1.',
    scope: 'everywhere',
    source: STYLE_NOTES,
    isPinned: false,
    lastUsedAt: LOADED_AT - 41 * DAY_MS,
  },
];

function recall(
  id: string,
  question: string,
  query: string,
  memoryIds: string[]
): RunEvent {
  return {
    type: 'call.started',
    call: {
      id,
      tool: 'recall',
      label: question,
      status: 'running',
      agentId: 'writer',
      input: { query, memoryIds },
    },
  };
}

function recalled(id: string): RunEvent {
  return { type: 'call.updated', id, patch: { status: 'done' } };
}

const CREDIT_THREAD: MemorySource = {
  id: 'credit-thread',
  kind: 'conversation',
  title: 'Credit request, today',
};

const SAVED_ID = 'credit-on-invoice';

const SAVED_TEXT =
  'Brightmoor settles a credit on the next invoice, never as a refund.';

type MemoryState = {
  run: RunSnapshot;
  memories: AgentMemoryItem[];
  /** What the agent last did with its memory, for the live region. */
  note: string;
};

type MemoryAction =
  | { type: 'events'; events: RunEvent[] }
  | { type: 'save' }
  | { type: 'edit'; memoryId: string; text: string }
  | { type: 'pin'; memoryId: string; isPinned: boolean }
  | { type: 'forget'; memoryIds: string[] };

type MemoryStep = SessionStep<MemoryState, MemoryAction>;

const INITIAL_RUN = emptyRun({ id: 'memory' });

const INITIAL: MemoryState = { run: INITIAL_RUN, memories: MEMORIES, note: '' };

function withChange(
  state: MemoryState,
  memoryId: string,
  change: Partial<AgentMemoryItem>
) {
  const memories = state.memories.map((memory) => {
    if (memory.id !== memoryId) {
      return memory;
    }
    return { ...memory, ...change };
  });
  return { ...state, memories };
}

/** The agent keeps what it just learned: the memory joins the list, used a moment ago. */
function withSaved(state: MemoryState, now: number) {
  const isKnown = state.memories.some((memory) => memory.id === SAVED_ID);
  if (isKnown) {
    return state;
  }
  const saved: AgentMemoryItem = {
    id: SAVED_ID,
    text: SAVED_TEXT,
    scope: 'project',
    source: CREDIT_THREAD,
    isPinned: false,
    lastUsedAt: now,
  };
  const memories = [...state.memories, saved];
  const note = `Writer saved a memory: ${SAVED_TEXT}`;
  return { ...state, memories, note };
}

function applyAt(
  state: MemoryState,
  action: MemoryAction,
  now: number
): MemoryState {
  if (action.type === 'save') {
    return withSaved(state, now);
  }
  if (action.type === 'edit') {
    return withChange(state, action.memoryId, { text: action.text });
  }
  if (action.type === 'pin') {
    return withChange(state, action.memoryId, { isPinned: action.isPinned });
  }
  if (action.type === 'forget') {
    const memories = state.memories.filter(
      (memory) => !action.memoryIds.includes(memory.id)
    );
    return { ...state, memories };
  }
  const run = applyBatchAt(state.run, action, now);
  const note = announcementOf(run.calls);
  return { ...state, run, note };
}

/** Times are stamped when an action lands, as a backend would stream it. */
function reducer(state: MemoryState, action: MemoryAction) {
  return applyAt(state, action, Date.now());
}

/** The memories were used days ago, so the resting state is stamped on the same clock as they are. */
function applyAfterLoading(
  state: MemoryState,
  action: MemoryAction,
  sinceStart: number
) {
  return applyAt(state, action, LOADED_AT + sinceStart);
}

function landing(after: number, ...events: RunEvent[]): MemoryStep {
  return { after, action: { type: 'events', events } };
}

const SCRIPT: MemoryStep[] = [
  landing(
    1800,
    recall(
      'turn-1',
      'Draft the credit request to Brightmoor',
      'Brightmoor payment terms and contacts',
      ['terms', 'contact']
    )
  ),
  landing(500, recalled('turn-1')),
  { after: 2600, action: { type: 'save' } },
  {
    after: 2400,
    by: 'demo',
    press: 'pin',
    action: { type: 'pin', memoryId: SAVED_ID, isPinned: true },
  },
  landing(
    2600,
    recall(
      'turn-2',
      'Which vendors changed their prices in Q3?',
      'vendors we still order from',
      ['ostrava', 'money']
    )
  ),
  landing(500, recalled('turn-2')),
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, applyAfterLoading),
  script: SCRIPT,
  loopAfter: 3400,
};

function pressedPinOf(pressed: string | null) {
  if (pressed === 'pin') {
    return SAVED_ID;
  }
  return null;
}

function memoryIdsOf(call: ToolCall) {
  const memoryIds = call.input?.memoryIds;
  if (!Array.isArray(memoryIds)) {
    return [];
  }
  return memoryIds.filter((value) => typeof value === 'string');
}

function lastRecallOf(calls: ToolCall[], memoryId: string) {
  const recalls = calls.filter((call) => {
    const memoryIds = memoryIdsOf(call);
    return memoryIds.includes(memoryId);
  });
  return recalls.at(-1);
}

function withRecalls(memories: AgentMemoryItem[], calls: ToolCall[]) {
  return memories.map((memory) => {
    const recall = lastRecallOf(calls, memory.id);
    const usedBy = recall ?? memory.usedBy;
    const usedAt = usedBy?.startedAt ?? 0;
    const lastUsedAt = Math.max(memory.lastUsedAt, usedAt);
    return { ...memory, usedBy, lastUsedAt };
  });
}

const VARIANTS: Segment<MemoryVariant>[] = [
  { value: 'full', label: 'Full' },
  { value: 'compact', label: 'Compact' },
];

function announcementOf(calls: ToolCall[]) {
  const latest = calls.at(-1);
  if (!latest) {
    return '';
  }
  const memoryIds = memoryIdsOf(latest);
  const word = countOf(memoryIds.length, 'memory', 'memories');
  return `Writer used ${word} to answer: ${latest.label}`;
}

export default function Agent08() {
  const [variant, setVariant] = useState<MemoryVariant>('full');
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(0);
  const { ref, isInView, isAutoplaying, state, act, pressed, restart } =
    useSession(SESSION);
  const shown = withRecalls(state.memories, state.run.calls);

  function edit(memoryId: string, text: string) {
    act({ type: 'edit', memoryId, text });
    setMessage('Memory saved');
  }

  function changePin(memoryId: string, isPinned: boolean) {
    act({ type: 'pin', memoryId, isPinned });
    setMessage(pinMessageOf(isPinned));
  }

  function forget(memoryIds: string[]) {
    act({ type: 'forget', memoryIds });
    const word = countOf(memoryIds.length, 'memory', 'memories');
    setMessage(`Forgot ${word} for good`);
  }

  function startOver() {
    setMessage('Every memory is back');
    setRound((current) => current + 1);
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[50.5rem] w-full max-w-[32rem] flex-col gap-3'
    >
      <Segments
        value={variant}
        segments={VARIANTS}
        onValueChange={setVariant}
        label='Variant'
        className='w-40 self-end'
      />
      <ClockGate isActive={isInView}>
        <AgentMemory
          key={round}
          memories={shown}
          variant={variant}
          agentName='Writer'
          onEdit={edit}
          onPinChange={changePin}
          onForget={forget}
          pressedPinId={pressedPinOf(pressed)}
        />
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={startOver}
          className='text-muted-foreground'
        >
          <RotateCcwIcon />
          Start over
        </Button>
      </div>
      <LiveRegion message={message} />
      <LiveRegion message={spokenUnless(isAutoplaying, state.note)} />
    </div>
  );
}

function pinMessageOf(isPinned: boolean) {
  if (isPinned) {
    return 'Pinned. It moved to the Pinned group';
  }
  return 'Unpinned';
}
