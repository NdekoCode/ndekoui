'use client';

import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  typingSteps,
  useAutoplay,
  type AutoplayStep,
} from '@/registry/ndeko/hooks/use-autoplay';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { hold } from '@/registry/ndeko/lib/demonstration';
import { SmileIcon } from '@/registry/ndeko/lib/icons';
import { POPUP_TRANSITION } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { matchingEmoji, type Cell, type EmojiItem } from './_parts/emoji-data';
import { EmojiField, type EmojiFieldHandle } from './_parts/emoji-field';

type Draft = {
  text: string;
  caret: number;
};

type Flight = {
  id: number;
  char: string;
  from: Cell;
  to: Cell;
};

const FLIGHT_MS = 420;
const FLIGHT_SIZE_PX = 36;
const FLIGHT_START_SCALE = 1.5;
const FLIGHT_END_SCALE = 0.65;
const LANDING_GAP_PX = 8;

const INITIAL_TEXT = 'Great work on the launch ';

const REST_DRAFT: Draft = { text: INITIAL_TEXT, caret: INITIAL_TEXT.length };

const PARTY = '\u{1F389}';
const ROCKET = '\u{1F680}';
const HEART = '❤️';

let measuringContext: CanvasRenderingContext2D | null = null;

function textWidthOf(input: HTMLInputElement, text: string) {
  if (measuringContext === null) {
    measuringContext = document.createElement('canvas').getContext('2d');
  }
  if (measuringContext === null) {
    return 0;
  }
  const style = getComputedStyle(input);
  measuringContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return measuringContext.measureText(text).width;
}

function caretOffsetOf(input: HTMLInputElement, caret: number): Cell {
  const style = getComputedStyle(input);
  const paddingLeft = parseFloat(style.paddingLeft);
  const borderLeft = parseFloat(style.borderLeftWidth);
  const left = paddingLeft + borderLeft;
  const top = parseFloat(style.borderTopWidth);
  const width = textWidthOf(input, input.value.slice(0, caret));
  return {
    x: left + width - input.scrollLeft,
    y: top + input.clientHeight / 2,
  };
}

function withInserted(draft: Draft, char: string): Draft {
  const before = draft.text.slice(0, draft.caret);
  const after = draft.text.slice(draft.caret);
  return { text: `${before}${char}${after}`, caret: draft.caret + char.length };
}

type FlyingEmojiProps = {
  flight: Flight;
  onLanded: (id: number, char: string) => void;
};

function FlyingEmoji({ flight, onLanded }: FlyingEmojiProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const { from, to } = flight;
  const half = FLIGHT_SIZE_PX / 2;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }
    const start = `translate(${from.x - half}px, ${from.y - half}px) scale(${FLIGHT_START_SCALE})`;
    const landingX = to.x + LANDING_GAP_PX - half;
    const end = `translate(${landingX}px, ${to.y - half}px) scale(${FLIGHT_END_SCALE})`;
    const animation = element.animate(
      [{ transform: start }, { transform: end }],
      {
        duration: FLIGHT_MS,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        fill: 'forwards',
      }
    );
    animation.onfinish = () => onLanded(flight.id, flight.char);
    return () => animation.cancel();
  }, [flight, from, to, half, onLanded]);

  return (
    <span
      ref={elementRef}
      aria-hidden='true'
      className='pointer-events-none absolute top-0 left-0 z-[70] flex items-center justify-center text-xl'
      style={{
        width: FLIGHT_SIZE_PX,
        height: FLIGHT_SIZE_PX,
        transform: `translate(${from.x - half}px, ${from.y - half}px)`,
      }}
    >
      {flight.char}
    </span>
  );
}

export default function Popover10() {
  const [draft, setDraft] = useState(REST_DRAFT);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [focusesOnOpen, setFocusesOnOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const fieldRef = useRef<EmojiFieldHandle>(null);
  const flightCount = useRef(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const items = useMemo(() => matchingEmoji(query), [query]);
  const showsGhost = isOpen && !isFocused;

  const land = useCallback((id: number, char: string) => {
    setFlights((current) => current.filter((flight) => flight.id !== id));
    setDraft((current) => withInserted(current, char));
  }, []);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const ghost = ghostRef.current;
    if (!input || !ghost) {
      return;
    }
    const { x } = caretOffsetOf(input, draft.caret);
    ghost.style.transform = `translateX(${x}px)`;
  }, [draft, showsGhost]);

  function changeOpen(next: boolean) {
    if (next) {
      setFocusesOnOpen(true);
    }
    setIsOpen(next);
  }

  function launch(item: EmojiItem, source: DOMRect) {
    const input = inputRef.current;
    const root = rootRef.current;
    if (!input || !root || shouldReduceMotion) {
      setDraft((current) => withInserted(current, item.char));
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const inputBox = input.getBoundingClientRect();
    const caret = caretOffsetOf(input, draft.caret);
    const from = {
      x: source.left + source.width / 2 - rootBox.left,
      y: source.top + source.height / 2 - rootBox.top,
    };
    const to = {
      x: inputBox.left + caret.x - rootBox.left,
      y: inputBox.top + caret.y - rootBox.top,
    };
    flightCount.current += 1;
    const flight = { id: flightCount.current, char: item.char, from, to };
    setFlights((current) => [...current, flight]);
  }

  function pickFromField(item: EmojiItem, source: DOMRect) {
    launch(item, source);
    if (!isAutoplaying) {
      setAnnouncement(`${item.name} added to the message`);
    }
  }

  function keepCaret(event: React.SyntheticEvent<HTMLInputElement>) {
    const caret = event.currentTarget.selectionStart;
    if (caret === null) {
      return;
    }
    setDraft((current) => {
      if (current.caret === caret) {
        return current;
      }
      return { ...current, caret };
    });
  }

  function changeMessage(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.currentTarget.value;
    const caret = event.currentTarget.selectionStart ?? text.length;
    setDraft({ text, caret });
  }

  function focusSearchOnOpen() {
    if (!focusesOnOpen) {
      return false;
    }
    return searchRef.current;
  }

  function reachFieldFromSearch(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowDown') {
      return;
    }
    event.preventDefault();
    fieldRef.current?.focusFirst();
  }

  function startOver() {
    setDraft(REST_DRAFT);
    setQuery('');
    setFlights([]);
    setIsOpen(true);
  }

  const steps: AutoplayStep[] = [
    { after: 2600, run: () => fieldRef.current?.glideTo(PARTY) },
    { after: 1100, run: () => fieldRef.current?.pick(PARTY) },
    { after: 1900, run: () => fieldRef.current?.glideTo(ROCKET) },
    { after: 1100, run: () => fieldRef.current?.pick(ROCKET) },
    { after: 1700, run: hold },
    ...typingSteps('heart', setQuery, { startAfter: 300, characterMs: 110 }),
    { after: 1100, run: () => fieldRef.current?.pick(HEART) },
    { after: 1600, run: () => setQuery('') },
    { after: 1800, run: hold },
  ];
  const { ref: rootRef, isAutoplaying } = useAutoplay(steps, {
    loopAfter: 2000,
    onReset: startOver,
  });

  useKeptHeight(rootRef);

  return (
    <div ref={rootRef} className='relative min-h-[27rem] w-full max-w-xs'>
      <PopoverPrimitive.Root open={isOpen} onOpenChange={changeOpen}>
        <div className='relative'>
          <Input
            ref={inputRef}
            aria-label='Message'
            value={draft.text}
            onChange={changeMessage}
            onSelect={keepCaret}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete='off'
            className='pe-10'
          />
          {showsGhost && (
            <span
              ref={ghostRef}
              aria-hidden='true'
              className='bg-foreground/60 pointer-events-none absolute top-[7px] left-0 h-[18px] w-px'
            />
          )}
          <PopoverPrimitive.Trigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Add an emoji'
                className='text-muted-foreground hover:text-foreground absolute end-0.5 top-0.5 size-7'
              />
            }
          >
            <SmileIcon className='size-4' />
          </PopoverPrimitive.Trigger>
        </div>
        <PopoverPrimitive.Portal container={rootRef}>
          <PopoverPrimitive.Positioner
            side='bottom'
            align='end'
            sideOffset={8}
            className='z-50'
          >
            <PopoverPrimitive.Popup
              initialFocus={focusSearchOnOpen}
              finalFocus={focusesOnOpen}
              aria-label='Emoji'
              className={cn(
                'surface-raised flex w-[18.5rem] flex-col items-center gap-2 rounded-xl p-3 text-[13px] outline-none',
                POPUP_TRANSITION
              )}
            >
              <Input
                ref={searchRef}
                type='search'
                aria-label='Search emoji'
                placeholder='Search emoji'
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={reachFieldFromSearch}
                autoComplete='off'
              />
              <EmojiField
                items={items}
                query={query}
                onPick={pickFromField}
                handleRef={fieldRef}
              />
              <p className='text-muted-foreground text-xs'>
                Drag to move, tap or press Enter to add
              </p>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      {flights.map((flight) => (
        <FlyingEmoji key={flight.id} flight={flight} onLanded={land} />
      ))}
      <LiveRegion message={announcement} />
    </div>
  );
}
