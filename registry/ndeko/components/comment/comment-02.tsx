'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionProps,
} from 'motion/react';
import { useId, useRef, useState } from 'react';

import { AtSignIcon } from '@/registry/ndeko/lib/icons';
import { MENU_ITEM } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import {
  draftCommentOf,
  MENTION_TRIGGER,
  segmentsOf,
  type CommentItem,
} from './_parts/comment-model';
import { CommentBlock, PersonAvatar } from './_parts/comment-parts';
import { ENTER, EXIT, heightPresenceOf } from './_parts/motion-parts';
import { CURRENT_USER_ID, PEOPLE, type Person } from './_parts/people';

type MentionQuery = {
  start: number;
  text: string;
};

type TextEdit = {
  value: string;
  caret: number;
};

const MAX_QUERY_LENGTH = 24;

const MAX_SUGGESTIONS = 5;

const FIRST_COMMENTS: CommentItem[] = [
  {
    id: 'm1',
    authorId: 'leo',
    at: '2026-11-05T10:02:00',
    body: 'The column picker is in review. @Tomás Rivera has the dates part.',
  },
];

/** The field and the layer of marks under it share one box and one text setting, or the marks drift off the words. */
const FIELD_BOX =
  'col-start-1 row-start-1 max-h-40 min-h-16 w-full px-3 pt-2.5 pb-1';

const FIELD_TEXT =
  'text-base leading-5 whitespace-pre-wrap [overflow-wrap:anywhere] md:text-[13px]';

const MENTION_MARK =
  'rounded-[3px] bg-primary/15 text-transparent dark:bg-primary/25';

/** Keeps a last empty line drawn in the layer when the text ends with a line break. */
const MIRROR_TAIL = '​';

const POPUP_MOTION: MotionProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { ...EXIT, duration: 0.1 } },
  transition: { ...ENTER, duration: 0.15 },
};

const POPUP_FADE: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { ...EXIT, duration: 0.1 } },
  transition: { ...ENTER, duration: 0.15 },
};

function popupMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return POPUP_FADE;
  }
  return POPUP_MOTION;
}

function startsWord(text: string, index: number) {
  if (index === 0) {
    return true;
  }
  const previous = text.charAt(index - 1);
  return /\s/.test(previous);
}

function mentionQueryBefore(text: string, caret: number) {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf(MENTION_TRIGGER);
  if (start === -1) {
    return null;
  }
  if (!startsWord(text, start)) {
    return null;
  }
  const query = before.slice(start + MENTION_TRIGGER.length);
  const isShortEnough = query.length <= MAX_QUERY_LENGTH;
  const isOneLine = !query.includes('\n');
  const spaceCount = query.split(' ').length - 1;
  const isTwoWordsAtMost = spaceCount <= 1;
  const isQuery = isShortEnough && isOneLine && isTwoWordsAtMost;
  if (!isQuery) {
    return null;
  }
  const mention: MentionQuery = { start, text: query };
  return mention;
}

function matchesQuery(person: Person, query: string) {
  const lowered = query.toLowerCase();
  const name = person.name.toLowerCase();
  if (name.startsWith(lowered)) {
    return true;
  }
  const words = name.split(' ');
  return words.some((word) => word.startsWith(lowered));
}

function suggestionsOf(query: MentionQuery | null) {
  if (!query) {
    return [];
  }
  const others = PEOPLE.filter((person) => person.id !== CURRENT_USER_ID);
  const matching = others.filter((person) => matchesQuery(person, query.text));
  return matching.slice(0, MAX_SUGGESTIONS);
}

function wrappedIndex(index: number, count: number) {
  return (index + count) % count;
}

function triggerFor(text: string, caret: number) {
  if (startsWord(text, caret)) {
    return MENTION_TRIGGER;
  }
  return ` ${MENTION_TRIGGER}`;
}

function insertedAt(text: string, start: number, end: number, insert: string) {
  const value = text.slice(0, start) + insert + text.slice(end);
  const edit: TextEdit = { value, caret: start + insert.length };
  return edit;
}

function MentionLayer({
  text,
  layerRef,
}: {
  text: string;
  layerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const segments = segmentsOf(text);
  return (
    <div
      ref={layerRef}
      aria-hidden='true'
      className={cn(
        FIELD_BOX,
        FIELD_TEXT,
        'pointer-events-none overflow-hidden text-transparent'
      )}
    >
      {segments.map((segment, index) => {
        const key = `${index}-${segment.text}`;
        if (segment.isMention) {
          return (
            <mark key={key} className={MENTION_MARK}>
              {segment.text}
            </mark>
          );
        }
        return <span key={key}>{segment.text}</span>;
      })}
      {MIRROR_TAIL}
    </div>
  );
}

function SuggestionList({
  listId,
  people,
  activeIndex,
  onPick,
  onHighlight,
}: {
  listId: string;
  people: Person[];
  activeIndex: number;
  onPick: (person: Person) => void;
  onHighlight: (index: number) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      id={listId}
      role='listbox'
      aria-label='People to mention'
      {...popupMotionOf(shouldReduceMotion)}
      className='surface-raised absolute bottom-full left-0 z-20 mb-2 w-60 origin-bottom-left rounded-xl p-1'
    >
      {people.map((person, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={person.id}
            id={`${listId}-${index}`}
            role='option'
            tabIndex={-1}
            aria-selected={isActive}
            data-highlighted={isActive || undefined}
            onMouseDown={(event) => {
              event.preventDefault();
              onPick(person);
            }}
            onMouseEnter={() => onHighlight(index)}
            className={cn(MENU_ITEM, 'cursor-pointer')}
          >
            <PersonAvatar person={person} className='size-5 text-[9px]' />
            <span className='min-w-0 flex-1 truncate'>{person.name}</span>
          </div>
        );
      })}
    </motion.div>
  );
}

function PostedComment({ comment }: { comment: CommentItem }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.li
      {...heightPresenceOf(shouldReduceMotion)}
      className='overflow-hidden'
    >
      <CommentBlock comment={comment} className='pb-4' />
    </motion.li>
  );
}

export default function Comment02() {
  const listId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState(FIRST_COMMENTS);
  const [body, setBody] = useState('');
  const [query, setQuery] = useState<MentionQuery | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = suggestionsOf(query);
  const showsSuggestions = suggestions.length > 0;
  const highlighted = Math.min(activeIndex, suggestions.length - 1);
  const trimmed = body.trim();
  const canSend = trimmed.length > 0;
  let activeOptionId: string | undefined;
  if (showsSuggestions) {
    activeOptionId = `${listId}-${highlighted}`;
  }

  function readQuery(text: string, caret: number) {
    setQuery(mentionQueryBefore(text, caret));
    setActiveIndex(0);
  }

  function apply(edit: TextEdit) {
    setBody(edit.value);
    readQuery(edit.value, edit.caret);
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      field?.focus();
      field?.setSelectionRange(edit.caret, edit.caret);
    });
  }

  function caretOf() {
    const field = fieldRef.current;
    if (!field) {
      return body.length;
    }
    return field.selectionStart;
  }

  function pick(person: Person) {
    if (!query) {
      return;
    }
    const mention = `${MENTION_TRIGGER}${person.name} `;
    apply(insertedAt(body, query.start, caretOf(), mention));
  }

  function startMention() {
    const caret = caretOf();
    apply(insertedAt(body, caret, caret, triggerFor(body, caret)));
  }

  function send() {
    if (!canSend) {
      return;
    }
    setComments((current) => [...current, draftCommentOf(trimmed)]);
    setBody('');
    setQuery(null);
  }

  function handleSuggestionKey(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(wrappedIndex(highlighted + 1, suggestions.length));
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(wrappedIndex(highlighted - 1, suggestions.length));
      return true;
    }
    const isPickKey = event.key === 'Enter' || event.key === 'Tab';
    if (isPickKey) {
      event.preventDefault();
      pick(suggestions[highlighted]);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setQuery(null);
      return true;
    }
    return false;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showsSuggestions) {
      const isHandled = handleSuggestionKey(event);
      if (isHandled) {
        return;
      }
    }
    const isCommand = event.metaKey || event.ctrlKey;
    const isSendKey = isCommand && event.key === 'Enter';
    if (isSendKey) {
      event.preventDefault();
      send();
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const field = event.target;
    setBody(field.value);
    readQuery(field.value, field.selectionStart);
  }

  function handleSelect(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    const field = event.currentTarget;
    setQuery(mentionQueryBefore(field.value, field.selectionStart));
  }

  function syncLayer(event: React.UIEvent<HTMLTextAreaElement>) {
    const layer = layerRef.current;
    if (layer) {
      layer.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send();
  }

  return (
    <section aria-label='Comments' className='w-full max-w-md'>
      <ul>
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <PostedComment key={comment.id} comment={comment} />
          ))}
        </AnimatePresence>
      </ul>
      <form
        onSubmit={handleSubmit}
        className='bg-card hairline-ring ring-foreground/12 focus-within:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/15 relative rounded-lg shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-shadow duration-150 focus-within:ring-[3px]'
      >
        <div className='grid'>
          <MentionLayer text={body} layerRef={layerRef} />
          <textarea
            ref={fieldRef}
            value={body}
            onChange={handleChange}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onScroll={syncLayer}
            onBlur={() => setQuery(null)}
            rows={2}
            aria-label='Comment, type @ to mention someone'
            aria-autocomplete='list'
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            placeholder='Comment or type @ to mention someone'
            className={cn(
              FIELD_BOX,
              FIELD_TEXT,
              'placeholder:text-muted-foreground/75 relative resize-none bg-transparent outline-none'
            )}
          />
        </div>
        <div className='flex items-center justify-between px-1.5 pb-1.5'>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label='Mention someone'
            onClick={startMention}
            className='text-muted-foreground'
          >
            <AtSignIcon />
          </Button>
          <Button type='submit' size='sm' disabled={!canSend}>
            Comment
          </Button>
        </div>
        <AnimatePresence>
          {showsSuggestions && (
            <SuggestionList
              key='suggestions'
              listId={listId}
              people={suggestions}
              activeIndex={highlighted}
              onPick={pick}
              onHighlight={setActiveIndex}
            />
          )}
        </AnimatePresence>
      </form>
    </section>
  );
}
