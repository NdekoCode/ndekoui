'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { seriesColorOf, type SeriesSlot } from '@/registry/ndeko/lib/agent-run';
import { spokenUnless } from '@/registry/ndeko/lib/demonstration';
import { PauseIcon, PlayIcon } from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { delayWhile } from './_parts/delay';
import { degreesOf, rounded } from './_parts/geometry';
import { useScenePlay } from './_parts/use-scene-play';

type Chapter = {
  id: string;
  label: string;
  caption: string;
  durationMs: number;
};

/** A place on the stage, in hundredths of its width on both axes. */
type Place = {
  x: number;
  y: number;
};

type Chunk = {
  id: string;
  documentIndex: number;
  row: number;
  topic: number;
  home: Place;
  plane: Place;
};

type Hop = {
  from: Place;
  to: Place;
  leavesMs: number;
  arrivesMs: number;
};

type Result = {
  chunkId: string;
  documentIndex: number;
  chunkNumber: number;
  score: number;
};

const CHAPTERS: Chapter[] = [
  {
    id: 'chunk',
    label: 'Chunk',
    caption: 'Each document is cut into chunks small enough to embed',
    durationMs: 2800,
  },
  {
    id: 'embed',
    label: 'Embed',
    caption:
      'Every chunk becomes a point, and points about one topic land together',
    durationMs: 3000,
  },
  {
    id: 'index',
    label: 'Index',
    caption:
      'Each point is linked to its nearest neighbours, so a search can walk',
    durationMs: 2800,
  },
  {
    id: 'query',
    label: 'Query',
    caption:
      'The question becomes a point too, and the search walks the links towards it',
    durationMs: 3800,
  },
  {
    id: 'rank',
    label: 'Rank',
    caption: 'The closest chunks come back as sources, ranked by how near',
    durationMs: 3400,
  },
];

const CHUNK_CHAPTER = 0;

const EMBED_CHAPTER = 1;

const INDEX_CHAPTER = 2;

const QUERY_CHAPTER = 3;

const RANK_CHAPTER = 4;

const TOPIC_SERIES: SeriesSlot[] = [1, 2, 4];

const TOPIC_CENTRES: Place[] = [
  { x: 48, y: 19.5 },
  { x: 80, y: 24 },
  { x: 62, y: 45 },
];

const HALO_RADIUS = 9.5;

/** Where the four chunks of a topic sit around its centre. */
const TOPIC_SPREAD: Place[][] = [
  [
    { x: -4.5, y: -2.5 },
    { x: 3.5, y: -4 },
    { x: -1.5, y: 3.5 },
    { x: 5, y: 2 },
  ],
  [
    { x: -4, y: -3 },
    { x: 4, y: -2.5 },
    { x: -2.5, y: 4 },
    { x: 4.5, y: 3.5 },
  ],
  [
    { x: -5, y: -1.5 },
    { x: 0.5, y: -4.5 },
    { x: 4.5, y: 1 },
    { x: -1, y: 4 },
  ],
];

/** For each document, the topic of each of its four chunks and its seat in that topic. A document is mostly about one topic. */
const CHUNK_SEATS = [
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
  ],
  [
    [1, 1],
    [1, 2],
    [0, 2],
    [2, 1],
  ],
  [
    [2, 2],
    [2, 3],
    [1, 3],
    [0, 3],
  ],
];

/** Links between seats, as topic and seat on both ends: four inside each topic, then three bridges. */
const LINK_SEATS = [
  [0, 0, 0, 1],
  [0, 0, 0, 2],
  [0, 1, 0, 3],
  [0, 2, 0, 3],
  [1, 0, 1, 1],
  [1, 0, 1, 2],
  [1, 1, 1, 3],
  [1, 2, 1, 3],
  [2, 0, 2, 1],
  [2, 0, 2, 2],
  [2, 1, 2, 3],
  [2, 2, 2, 3],
  [0, 3, 2, 1],
  [0, 1, 1, 0],
  [2, 2, 1, 2],
];

const DOCUMENT_LEFT = 3;

const DOCUMENT_TOPS = [3.5, 23, 42.5];

const DOCUMENT_WIDTH = 24;

const DOCUMENT_HEIGHT = 16.5;

const LINE_LEFT = 5.5;

const FIRST_LINE = 7.45;

const LINE_PITCH = 2;

/** Cut apart, the four lines of a document sit this much further from each other. */
const SPLIT_SPREAD = 1.2;

const SPLIT_AFTER_MS = 900;

const FLIGHT_STAGGER_MS = 45;

const LINK_STAGGER_MS = 70;

const RESULTS_AFTER_MS = 120;

const RESULT_STAGGER_MS = 90;

const QUESTION: Place = { x: 58, y: 52.5 };

const WALK_MS = 2600;

const WALKER_SHOWS_MS = 500;

const WALK_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

function seatPlaceOf(topic: number, seat: number): Place {
  const centre = TOPIC_CENTRES[topic];
  const spread = TOPIC_SPREAD[topic][seat];
  return { x: centre.x + spread.x, y: centre.y + spread.y };
}

function homeOf(documentIndex: number, row: number): Place {
  const top = DOCUMENT_TOPS[documentIndex];
  const firstLine = top + FIRST_LINE;
  return { x: LINE_LEFT, y: firstLine + row * LINE_PITCH };
}

function chunksOf() {
  const chunks: Chunk[] = [];
  CHUNK_SEATS.forEach((seats, documentIndex) => {
    seats.forEach(([topic, seat], row) => {
      chunks.push({
        id: `${documentIndex}-${row}`,
        documentIndex,
        row,
        topic,
        home: homeOf(documentIndex, row),
        plane: seatPlaceOf(topic, seat),
      });
    });
  });
  return chunks;
}

const CHUNKS = chunksOf();

/** The search enters the graph far from the question and follows a link at each step to a point that is nearer. */
const WALK: Hop[] = [
  {
    from: seatPlaceOf(0, 1),
    to: seatPlaceOf(0, 3),
    leavesMs: 800,
    arrivesMs: 1150,
  },
  {
    from: seatPlaceOf(0, 3),
    to: seatPlaceOf(2, 1),
    leavesMs: 1400,
    arrivesMs: 1850,
  },
  {
    from: seatPlaceOf(2, 1),
    to: seatPlaceOf(2, 3),
    leavesMs: 2100,
    arrivesMs: 2450,
  },
];

const WALK_START = WALK[0].from;

const WALK_END = WALK[WALK.length - 1].to;

/** The three chunks nearest the question, nearest first. The scores are illustrative. */
const RESULTS: Result[] = [
  { chunkId: '2-1', documentIndex: 2, chunkNumber: 2, score: 0.92 },
  { chunkId: '0-3', documentIndex: 0, chunkNumber: 4, score: 0.87 },
  { chunkId: '2-0', documentIndex: 2, chunkNumber: 1, score: 0.81 },
];

const NEAREST_IDS = RESULTS.map((result) => result.chunkId);

function lengthOf(value: number) {
  return `${rounded(value)}cqw`;
}

function translateOf(place: Place) {
  return `${lengthOf(place.x)} ${lengthOf(place.y)}`;
}

function cornerOf(place: Place) {
  return { left: lengthOf(place.x), top: lengthOf(place.y) };
}

const HALO_SIZE = lengthOf(HALO_RADIUS * 2);

const HALO_TOP = lengthOf(-HALO_RADIUS);

const DOCUMENT_SIZE = {
  width: lengthOf(DOCUMENT_WIDTH),
  height: lengthOf(DOCUMENT_HEIGHT),
};

function documentCornerOf(documentIndex: number) {
  return cornerOf({ x: DOCUMENT_LEFT, y: DOCUMENT_TOPS[documentIndex] });
}

function formatScore(score: number) {
  return score.toFixed(2);
}

function resultDelayOf(index: number) {
  return RESULTS_AFTER_MS + index * RESULT_STAGGER_MS;
}

function drawnScaleOf(isDrawn: boolean) {
  if (isDrawn) {
    return 1;
  }
  return 0;
}

/**
 * A line from one place to another that draws itself from its first end. The turn and the growth
 * share one transform, in that order, so the line grows along its own direction.
 */
function segmentStyleOf(from: Place, to: Place, isDrawn: boolean) {
  const across = to.x - from.x;
  const down = to.y - from.y;
  const length = Math.hypot(across, down);
  const radians = Math.atan2(down, across);
  const degrees = degreesOf(radians);
  const angle = rounded(degrees);
  const scale = drawnScaleOf(isDrawn);
  return {
    ...cornerOf(from),
    width: lengthOf(length),
    transform: `rotate(${angle}deg) scaleX(${scale})`,
  };
}

function shareOf(timeMs: number) {
  return rounded(timeMs / WALK_MS);
}

/** The walker fades in on the point where the search enters, then steps from point to point and waits on each. */
function walkKeyframesOf(): Keyframe[] {
  const start = translateOf(WALK_START);
  const frames: Keyframe[] = [
    { offset: 0, translate: start, opacity: 0 },
    { offset: shareOf(WALKER_SHOWS_MS), translate: start, opacity: 0 },
  ];
  for (const hop of WALK) {
    frames.push({
      offset: shareOf(hop.leavesMs),
      translate: translateOf(hop.from),
      opacity: 1,
      easing: WALK_EASE,
    });
    frames.push({
      offset: shareOf(hop.arrivesMs),
      translate: translateOf(hop.to),
      opacity: 1,
    });
  }
  frames.push({ offset: 1, translate: translateOf(WALK_END), opacity: 1 });
  return frames;
}

const WALK_KEYFRAMES = walkKeyframesOf();

function splitOf(isSplit: boolean, row: number) {
  if (!isSplit) {
    return '0cqw 0cqw';
  }
  const fromMiddle = row - 1.5;
  return `0cqw ${lengthOf(fromMiddle * SPLIT_SPREAD)}`;
}

function placeOfChunk(chunk: Chunk, isEmbedded: boolean) {
  if (isEmbedded) {
    return chunk.plane;
  }
  return chunk.home;
}

function nextChapterOf(chapter: number) {
  const next = chapter + 1;
  return next % CHAPTERS.length;
}

function currentStepOf(isCurrent: boolean) {
  if (isCurrent) {
    return 'step';
  }
  return undefined;
}

function playLabelOf(isPaused: boolean) {
  if (isPaused) {
    return 'Play';
  }
  return 'Pause';
}

function stepLabelOf(chapter: Chapter, index: number) {
  const position = index + 1;
  return `${chapter.label}, chapter ${position} of ${CHAPTERS.length}`;
}

/**
 * The chapter clock is not all that moves: a walk or a flight can still be under way. Paused or off
 * screen, all of it holds where it is, and it goes on from there. Under reduced motion nothing is
 * held: the theme already keeps transitions to fades.
 */
function holdStage(stage: HTMLElement, isHeld: boolean) {
  const animations = stage.getAnimations({ subtree: true });
  for (const animation of animations) {
    if (isHeld) {
      animation.pause();
      continue;
    }
    const wasHeld = animation.playState === 'paused';
    if (wasHeld) {
      animation.play();
    }
  }
}

/** A jump lands on its chapter: whatever was held half way from the chapter before ends where it was going. */
function finishHeld(stage: HTMLElement) {
  const animations = stage.getAnimations({ subtree: true });
  for (const animation of animations) {
    const isHeld = animation.playState === 'paused';
    if (isHeld) {
      animation.finish();
    }
  }
}

type ChapterFillProps = {
  durationMs: number;
  isRunning: boolean;
  onDone: () => void;
};

const EMPTY_BAR = 'scaleX(0)';

const FULL_BAR = 'scaleX(1)';

/**
 * The bar of the chapter that plays is also its clock: it fills once over the length of the chapter
 * and its end starts the next one. Paused, it holds its place and nothing else keeps time. The empty
 * bar is an inline transform, the property the animation writes: a scale utility would multiply
 * with it and keep the bar empty.
 */
function ChapterFill({ durationMs, isRunning, onDone }: ChapterFillProps) {
  const barRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<Animation | null>(null);
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) {
      return;
    }
    const fill = bar.animate(
      [{ transform: EMPTY_BAR }, { transform: FULL_BAR }],
      { duration: durationMs, easing: 'linear', fill: 'forwards' }
    );
    fill.pause();
    fill.onfinish = () => finish();
    fillRef.current = fill;
    return () => {
      fill.onfinish = null;
      fill.cancel();
      fillRef.current = null;
    };
  }, [durationMs]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) {
      return;
    }
    if (isRunning) {
      fill.play();
      return;
    }
    fill.pause();
  }, [isRunning]);

  return (
    <span
      ref={barRef}
      style={{ transform: EMPTY_BAR }}
      className='bg-primary absolute inset-0 origin-left rounded-full'
    />
  );
}

type ChunkMarkProps = {
  chunk: Chunk;
  order: number;
  chapter: number;
};

function ChunkMark({ chunk, order, chapter }: ChunkMarkProps) {
  const isSplit = chapter === CHUNK_CHAPTER;
  const isEmbedded = chapter >= EMBED_CHAPTER;
  const isQueried = chapter >= QUERY_CHAPTER;
  const isAsked = chapter === QUERY_CHAPTER;
  const isNearest = NEAREST_IDS.includes(chunk.id);
  const isMarked = isQueried && isNearest;
  const place = placeOfChunk(chunk, isEmbedded);
  const color = seriesColorOf(TOPIC_SERIES[chunk.topic]);
  const flightDelayMs = order * FLIGHT_STAGGER_MS;

  return (
    <span
      style={{
        translate: translateOf(place),
        ...delayWhile(isEmbedded, flightDelayMs),
      }}
      className='absolute top-0 left-0 transition-[translate] duration-700 ease-(--ease-in-out-strong)'
    >
      <span
        style={{
          translate: splitOf(isSplit, chunk.row),
          ...delayWhile(isSplit, SPLIT_AFTER_MS),
        }}
        className='absolute top-0 left-0 transition-[translate] duration-500 ease-(--ease-out-strong)'
      >
        <span
          data-embedded={isEmbedded}
          className='bg-foreground/20 absolute top-0 left-0 h-[1.7cqw] w-[16cqw] origin-left -translate-y-1/2 rounded-full transition-[opacity,scale] duration-500 ease-(--ease-out-strong) data-[embedded=true]:scale-x-[0.12] data-[embedded=true]:opacity-0'
        />
      </span>
      <span
        data-embedded={isEmbedded}
        style={{ backgroundColor: color }}
        className='absolute top-0 left-0 size-[2cqw] -translate-x-1/2 -translate-y-1/2 scale-50 rounded-full opacity-0 transition-[opacity,scale] duration-500 ease-(--ease-out-strong) data-[embedded=true]:scale-100 data-[embedded=true]:opacity-100'
      />
      <span
        data-marked={isMarked}
        style={delayWhile(isAsked, WALK_MS)}
        className='ring-primary absolute top-0 left-0 size-[4.2cqw] -translate-x-1/2 -translate-y-1/2 scale-75 rounded-full opacity-0 ring-[1.5px] transition-[opacity,scale] duration-300 ease-(--ease-out-strong) data-[marked=true]:scale-100 data-[marked=true]:opacity-100'
      />
    </span>
  );
}

export type VectorSearchProps = {
  /** The three documents that are cut into chunks. */
  documents?: [string, string, string];
  /** The three topics their chunks gather around. */
  topics?: [string, string, string];
  className?: string;
};

const DEFAULT_DOCUMENTS: [string, string, string] = [
  'refunds.md',
  'billing.md',
  'plans.md',
];

const DEFAULT_TOPICS: [string, string, string] = [
  'Refunds',
  'Invoices',
  'Plans',
];

export function VectorSearch({
  documents = DEFAULT_DOCUMENTS,
  topics = DEFAULT_TOPICS,
  className,
}: VectorSearchProps) {
  const { ref, isPlaying, isStill } = useScenePlay();
  const stageRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLSpanElement>(null);
  const [chapter, setChapter] = useState(RANK_CHAPTER);
  const [round, setRound] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasTakenOver, setHasTakenOver] = useState(false);
  const current = CHAPTERS[chapter];
  const isRunning = isPlaying && !isPaused;
  const isStageHeld = !isRunning && !isStill;
  const isEmbedded = chapter >= EMBED_CHAPTER;
  const isIndexed = chapter >= INDEX_CHAPTER;
  const isQueried = chapter >= QUERY_CHAPTER;
  const isAsked = chapter === QUERY_CHAPTER;
  const isRanked = chapter >= RANK_CHAPTER;
  const presence = risePresenceOf(isStill);

  // Before the paint: one frame later the walker would show on its last point first.
  useLayoutEffect(() => {
    const walker = walkerRef.current;
    const isWalking = isAsked && !isStill;
    if (!walker || !isWalking) {
      return;
    }
    const walk = walker.animate(WALK_KEYFRAMES, { duration: WALK_MS });
    return () => walk.cancel();
  }, [isAsked, isStill, round]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }
    holdStage(stage, isStageHeld);
  }, [isStageHeld]);

  function advance() {
    setChapter(nextChapterOf(chapter));
  }

  function jumpTo(index: number) {
    const stage = stageRef.current;
    if (stage) {
      finishHeld(stage);
    }
    setChapter(index);
    setRound((count) => count + 1);
    setHasTakenOver(true);
  }

  function togglePause() {
    setIsPaused((paused) => !paused);
    setHasTakenOver(true);
  }

  return (
    <div
      ref={ref}
      className={cn('flex w-full max-w-[34rem] flex-col gap-3', className)}
    >
      <div
        ref={stageRef}
        aria-hidden='true'
        className='@container relative aspect-[16/10] w-full'
      >
        <div className='bg-foreground/[0.03] absolute top-[3.5cqw] left-[30cqw] h-[55.5cqw] w-[67cqw] rounded-lg' />
        <span className='text-muted-foreground absolute top-[5cqw] right-[4.5cqw] text-[10px] leading-3'>
          Vector space
        </span>
        {TOPIC_CENTRES.map((centre, topic) => (
          <span
            key={topic}
            data-shown={isEmbedded}
            style={{ translate: translateOf(centre) }}
            className='absolute top-0 left-0 opacity-0 transition-opacity duration-500 ease-(--ease-out-strong) data-[shown=true]:opacity-100 data-[shown=true]:delay-300'
          >
            <span
              style={{
                backgroundColor: seriesColorOf(TOPIC_SERIES[topic]),
                width: HALO_SIZE,
                height: HALO_SIZE,
              }}
              className='absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10'
            />
            <span
              style={{ top: HALO_TOP }}
              className='text-muted-foreground absolute left-0 -translate-x-1/2 -translate-y-full pb-0.5 text-[10px] leading-3 whitespace-nowrap'
            >
              {topics[topic]}
            </span>
          </span>
        ))}
        {documents.map((name, index) => (
          <div
            key={index}
            style={{ ...documentCornerOf(index), ...DOCUMENT_SIZE }}
            className='bg-card hairline-ring ring-border absolute rounded-md px-[2.5cqw] pt-[1cqw] shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
          >
            <p className='text-muted-foreground truncate text-[10px] leading-3'>
              {name}
            </p>
          </div>
        ))}
        {CHUNKS.map((chunk) => (
          <span
            key={chunk.id}
            style={cornerOf(chunk.home)}
            className='bg-foreground/[0.06] absolute h-[1.7cqw] w-[16cqw] -translate-y-1/2 rounded-full'
          />
        ))}
        {LINK_SEATS.map(([fromTopic, fromSeat, toTopic, toSeat], index) => {
          const from = seatPlaceOf(fromTopic, fromSeat);
          const to = seatPlaceOf(toTopic, toSeat);
          const drawDelayMs = index * LINK_STAGGER_MS;

          return (
            <span
              key={`${fromTopic}${fromSeat}${toTopic}${toSeat}`}
              style={{
                ...segmentStyleOf(from, to, isIndexed),
                ...delayWhile(isIndexed, drawDelayMs),
              }}
              className='bg-foreground/15 absolute h-px origin-left transition-transform duration-300 ease-(--ease-out-strong)'
            />
          );
        })}
        {WALK.map((hop) => (
          <span
            key={hop.leavesMs}
            style={{
              ...segmentStyleOf(hop.from, hop.to, isQueried),
              ...delayWhile(isAsked, hop.leavesMs),
            }}
            className='bg-primary absolute -mt-px h-0.5 origin-left rounded-full transition-transform duration-300 ease-(--ease-in-out-strong)'
          />
        ))}
        {CHUNKS.map((chunk, index) => (
          <ChunkMark
            key={chunk.id}
            chunk={chunk}
            order={index}
            chapter={chapter}
          />
        ))}
        <span
          data-shown={isQueried}
          style={{ translate: translateOf(QUESTION) }}
          className='absolute top-0 left-0 opacity-0 transition-opacity duration-300 ease-(--ease-out-strong) data-[shown=true]:opacity-100'
        >
          <span className='bg-primary ring-primary/25 absolute top-0 left-0 size-[2.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px]' />
          <span className='text-primary-ink absolute top-0 left-[2.6cqw] -translate-y-1/2 text-[10px] leading-3 font-medium whitespace-nowrap'>
            Question
          </span>
        </span>
        <span
          ref={walkerRef}
          data-shown={isQueried}
          style={{ translate: translateOf(WALK_END) }}
          className='absolute top-0 left-0 opacity-0 data-[shown=true]:opacity-100'
        >
          <span className='ring-primary absolute top-0 left-0 size-[3.2cqw] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2' />
        </span>
        <div
          data-shown={isRanked}
          className='surface-raised absolute bottom-[3.5cqw] left-[3cqw] w-[44cqw] max-w-52 min-w-32 translate-y-2 rounded-lg p-2 opacity-0 transition-[opacity,translate] duration-200 ease-(--ease-out-strong) data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100 data-[shown=true]:duration-300'
        >
          <p className='text-muted-foreground flex items-baseline justify-between gap-2 text-[10px] leading-3'>
            Top matches
            <span>Illustrative</span>
          </p>
          <ol className='mt-1.5 flex flex-col gap-1'>
            {RESULTS.map((result, index) => (
              <li
                key={result.chunkId}
                data-shown={isRanked}
                style={delayWhile(isRanked, resultDelayOf(index))}
                className='flex -translate-x-1.5 items-center gap-1.5 text-[10px] leading-4 opacity-0 transition-[opacity,translate] duration-300 ease-(--ease-out-strong) data-[shown=true]:translate-x-0 data-[shown=true]:opacity-100'
              >
                <span className='text-muted-foreground tabular-nums'>
                  {index + 1}
                </span>
                <span className='min-w-0 flex-1 truncate font-medium'>
                  {documents[result.documentIndex]}
                </span>
                <span className='text-muted-foreground hidden @md:inline'>
                  chunk {result.chunkNumber}
                </span>
                <span className='tabular-nums'>
                  {formatScore(result.score)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className='flex min-h-10 items-start'>
        <AnimatePresence mode='wait' initial={false}>
          <motion.p
            key={current.id}
            className='text-muted-foreground text-[13px] leading-5 text-balance'
            {...presence}
          >
            {current.caption}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className='flex items-center gap-2'>
        {!isStill && (
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            aria-label={playLabelOf(isPaused)}
            onClick={togglePause}
            className='shrink-0'
          >
            <Swap swapKey={playLabelOf(isPaused)}>
              {isPaused && <PlayIcon />}
              {!isPaused && <PauseIcon />}
            </Swap>
          </Button>
        )}
        <ol className='grid min-w-0 flex-1 grid-cols-5 gap-1.5'>
          {CHAPTERS.map((item, index) => {
            const isCurrent = index === chapter;
            const isPast = index < chapter;
            const isHeldFull = isCurrent && isStill;
            const isFull = isPast || isHeldFull;
            const isTiming = isCurrent && !isStill;

            return (
              <li key={item.id} className='min-w-0'>
                <button
                  type='button'
                  aria-current={currentStepOf(isCurrent)}
                  aria-label={stepLabelOf(item, index)}
                  data-current={isCurrent}
                  onClick={() => jumpTo(index)}
                  className='group/step text-muted-foreground hover:text-foreground data-[current=true]:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background flex w-full cursor-pointer flex-col gap-1.5 rounded-md py-1 text-start text-[11px] leading-4 font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                >
                  <span className='truncate'>{item.label}</span>
                  <span className='bg-foreground/10 group-hover/step:bg-foreground/15 relative block h-0.5 overflow-hidden rounded-full transition-colors duration-150'>
                    {isFull && (
                      <span className='bg-primary absolute inset-0 rounded-full' />
                    )}
                    {isTiming && (
                      <ChapterFill
                        key={round}
                        durationMs={item.durationMs}
                        isRunning={isRunning}
                        onDone={advance}
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <LiveRegion message={spokenUnless(!hasTakenOver, current.caption)} />
    </div>
  );
}

export default function Illustration08() {
  return <VectorSearch />;
}
