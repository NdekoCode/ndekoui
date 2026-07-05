'use client';

import { useId, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { hatchOf } from '@/registry/ndeko/lib/hatch';
import {
  FileTextIcon,
  MailIcon,
  MessageSquareTextIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';

import { LabTile } from './_parts/lab-tile';
import { countOf, nounOf } from './_parts/words';

export type GroundingSourceKind = 'pdf' | 'email' | 'notes';

export type GroundingSource = {
  id: string;
  kind: GroundingSourceKind;
  title: string;
  /** Where in the source, in a few words: "PDF, clause 4". */
  meta: string;
};

export type GroundedSentence = {
  id: string;
  text: string;
  /** Left out, the sentence is a claim nothing backs. */
  citation?: {
    sourceId: string;
    /** The passage of the source the sentence rests on. */
    passage: string;
  };
};

type PassagePiece = {
  text: string;
  isShared: boolean;
};

const KIND_ICON: Record<GroundingSourceKind, Icon> = {
  pdf: FileTextIcon,
  email: MailIcon,
  notes: MessageSquareTextIcon,
};

const STOP_WORDS = new Set([
  'a',
  'also',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'each',
  'for',
  'from',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'up',
  'was',
  'will',
  'with',
  'your',
]);

const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

const SPACE_RUN = /(\s+)/;

function normalWordOf(word: string) {
  const lower = word.toLowerCase();
  return lower.replace(EDGE_PUNCTUATION, '');
}

function isKeyWord(normal: string) {
  const isStopWord = STOP_WORDS.has(normal);
  const isTooShort = normal.length < 2;
  const isNoise = isStopWord || isTooShort;
  return !isNoise;
}

function keyWordsOf(text: string) {
  const keys = new Set<string>();
  const words = text.split(/\s+/);
  for (const word of words) {
    const normal = normalWordOf(word);
    if (isKeyWord(normal)) {
      keys.add(normal);
    }
  }
  return keys;
}

export function passagePiecesOf(passage: string, sentence: string) {
  const keys = keyWordsOf(sentence);
  const pieces: PassagePiece[] = [];
  const parts = passage.split(SPACE_RUN);
  for (const part of parts) {
    if (part === '') {
      continue;
    }
    const normal = normalWordOf(part);
    const isShared = keys.has(normal);
    pieces.push({ text: part, isShared });
  }
  return pieces;
}

function sharedCountOf(pieces: PassagePiece[]) {
  const shared = pieces.filter((piece) => piece.isShared);
  return shared.length;
}

function isBacked(sentence: GroundedSentence) {
  return sentence.citation !== undefined;
}

function sourceNumberOf(sources: GroundingSource[], sourceId: string) {
  const index = sources.findIndex((source) => source.id === sourceId);
  return index + 1;
}

function backingWordsOf(total: number) {
  const noun = nounOf(total, 'sentence');
  return `of ${total} ${noun} backed by a source`;
}

function tintOf(isLit: boolean) {
  if (isLit) {
    return 'bg-primary/12';
  }
  return 'bg-transparent';
}

function markToneOf(isLit: boolean) {
  if (isLit) {
    return 'text-primary-ink';
  }
  return 'text-muted-foreground';
}

function overlayOf(isLit: boolean) {
  if (isLit) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

function segmentToneOf(isLit: boolean, hasActive: boolean) {
  if (isLit) {
    return 'opacity-100 scale-y-150';
  }
  if (hasActive) {
    return 'opacity-45';
  }
  return 'opacity-100';
}

function segmentStyleOf(sentence: GroundedSentence) {
  if (isBacked(sentence)) {
    return undefined;
  }
  const style: React.CSSProperties = {
    backgroundImage: hatchOf('var(--muted-foreground)', 55),
  };
  return style;
}

function segmentFillOf(sentence: GroundedSentence) {
  if (isBacked(sentence)) {
    return 'bg-primary';
  }
  return 'bg-foreground/[0.06]';
}

type BackingLineProps = {
  sentences: GroundedSentence[];
  activeSentenceId: string | null;
};

function BackingLine({ sentences, activeSentenceId }: BackingLineProps) {
  const backedCount = sentences.filter(isBacked).length;
  const words = backingWordsOf(sentences.length);
  const hasActive = activeSentenceId !== null;

  return (
    <div className='flex flex-col gap-2'>
      <p className='text-muted-foreground text-xs'>
        <MotionNumber value={backedCount} className='text-foreground' /> {words}
      </p>
      <span aria-hidden='true' className='flex h-2 items-center gap-1'>
        {sentences.map((sentence) => {
          const isLit = sentence.id === activeSentenceId;
          return (
            <span
              key={sentence.id}
              style={segmentStyleOf(sentence)}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-[opacity,scale] duration-200 ease-(--ease-out-strong)',
                segmentFillOf(sentence),
                segmentToneOf(isLit, hasActive)
              )}
            />
          );
        })}
      </span>
    </div>
  );
}

type GroundingMarkProps = {
  number: number;
  source: GroundingSource;
  isLit: boolean;
  cardId: string;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
};

function GroundingMark({
  number,
  source,
  isLit,
  cardId,
  onEnter,
  onLeave,
  onToggle,
}: GroundingMarkProps) {
  return (
    <button
      type='button'
      aria-label={`Source ${number}: ${source.title}`}
      aria-expanded={isLit}
      aria-controls={cardId}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onToggle}
      className={cn(
        'keycap-3d focus-visible:ring-ring/25 relative ms-1 inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-[4px] px-1 align-[0.12em] text-[10px] leading-none font-medium tabular-nums transition-colors duration-150 outline-none focus-visible:ring-[3px]',
        markToneOf(isLit)
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'bg-primary/15 pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-150',
          overlayOf(isLit)
        )}
      />
      <span className='relative'>{number}</span>
    </button>
  );
}

type SourceCardProps = {
  source: GroundingSource;
  number: number;
  cardId: string;
  activeSentence: GroundedSentence | null;
};

function SourceCard({
  source,
  number,
  cardId,
  activeSentence,
}: SourceCardProps) {
  const KindIcon = KIND_ICON[source.kind];
  const shown = shownPassageOf(source, activeSentence);
  const isRaised = shown !== null;

  return (
    <li
      id={cardId}
      className={cn(
        'rounded-xl p-3 transition-[background-color,box-shadow,translate] duration-200 ease-(--ease-out-strong)',
        sourceSurfaceOf(isRaised)
      )}
    >
      <AnimatedSize>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <span className='keycap-3d text-muted-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md'>
              <KindIcon className='size-3.5' />
            </span>
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-[13px] font-medium'>
                {source.title}
              </span>
              <span className='text-muted-foreground truncate text-xs'>
                {source.meta}
              </span>
            </span>
            <span className='keycap-3d text-muted-foreground inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-[4px] px-1 text-[10px] tabular-nums'>
              {number}
            </span>
          </div>
          {shown && (
            <Passage passage={shown.passage} sentence={shown.sentence} />
          )}
        </div>
      </AnimatedSize>
    </li>
  );
}

function shownPassageOf(
  source: GroundingSource,
  sentence: GroundedSentence | null
) {
  const citation = sentence?.citation;
  if (!citation) {
    return null;
  }
  if (citation.sourceId !== source.id) {
    return null;
  }
  return { passage: citation.passage, sentence: sentence.text };
}

function sourceSurfaceOf(isRaised: boolean) {
  if (isRaised) {
    return 'surface-raised -translate-y-0.5';
  }
  return 'bg-foreground/[0.03] dark:bg-foreground/[0.05] translate-y-0';
}

function Passage({ passage, sentence }: { passage: string; sentence: string }) {
  const pieces = passagePiecesOf(passage, sentence);
  const sharedCount = sharedCountOf(pieces);
  const sharedLine = `${countOf(sharedCount, 'word')} shared with the sentence`;

  return (
    <div className='flex flex-col gap-1.5 transition-opacity duration-200 starting:opacity-0'>
      <blockquote className='border-foreground/10 text-foreground/85 border-s-2 ps-3 text-[13px] leading-relaxed'>
        {pieces.map((piece, index) => {
          if (piece.isShared) {
            return (
              <mark
                key={index}
                className='bg-primary/15 text-foreground rounded-[3px] px-px'
              >
                {piece.text}
              </mark>
            );
          }
          return <span key={index}>{piece.text}</span>;
        })}
      </blockquote>
      <p className='text-muted-foreground text-xs'>{sharedLine}</p>
    </div>
  );
}

function sentenceOf(sentences: GroundedSentence[], id: string | null) {
  if (id === null) {
    return null;
  }
  const match = sentences.find((sentence) => sentence.id === id);
  return match ?? null;
}

function announcementOf(
  sentence: GroundedSentence | null,
  sources: GroundingSource[]
) {
  const citation = sentence?.citation;
  if (!citation) {
    return '';
  }
  const source = sources.find(
    (candidate) => candidate.id === citation.sourceId
  );
  if (!source) {
    return '';
  }
  return `${source.title}: ${citation.passage}`;
}

export type GroundedAnswerProps = {
  sentences: GroundedSentence[];
  sources: GroundingSource[];
  className?: string;
};

export function GroundedAnswer({
  sentences,
  sources,
  className,
}: GroundedAnswerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const baseId = useId();
  const activeId = hoveredId ?? pinnedId;
  const activeSentence = sentenceOf(sentences, activeId);
  const announcement = announcementOf(activeSentence, sources);

  function cardIdOf(sourceId: string) {
    return `${baseId}-source-${sourceId}`;
  }

  function enter(sentenceId: string) {
    setHoveredId(sentenceId);
  }

  function leave(sentenceId: string) {
    setHoveredId((current) => {
      if (current === sentenceId) {
        return null;
      }
      return current;
    });
  }

  function togglePin(sentenceId: string) {
    setPinnedId((current) => {
      if (current === sentenceId) {
        return null;
      }
      return sentenceId;
    });
  }

  function unpinOnEscape(event: React.KeyboardEvent<HTMLDivElement>) {
    const isEscape = event.key === 'Escape';
    const hasPin = pinnedId !== null;
    if (isEscape && hasPin) {
      event.preventDefault();
      setPinnedId(null);
    }
  }

  return (
    <div onKeyDown={unpinOnEscape} className={cn('@container', className)}>
      <div className='grid grid-cols-1 gap-4 @xl:grid-cols-[minmax(0,1fr)_15rem]'>
        <div className='flex min-w-0 flex-col gap-3'>
          <BackingLine sentences={sentences} activeSentenceId={activeId} />
          <p className='text-sm leading-7'>
            {sentences.map((sentence, index) => {
              const citation = sentence.citation;
              const isLit = sentence.id === activeId;
              const leadingSpace = leadingSpaceOf(index);
              if (!citation) {
                return (
                  <span key={sentence.id}>
                    {leadingSpace}
                    <span className='decoration-muted-foreground/70 underline decoration-dotted decoration-1 underline-offset-4'>
                      {sentence.text}
                    </span>
                    <span className='sr-only'> (no source backs this)</span>
                  </span>
                );
              }
              const number = sourceNumberOf(sources, citation.sourceId);
              const source = sources[number - 1];
              return (
                <span key={sentence.id}>
                  {leadingSpace}
                  <span
                    className={cn(
                      'rounded-[4px] box-decoration-clone px-0.5 transition-colors duration-200 ease-(--ease-out-strong)',
                      tintOf(isLit)
                    )}
                  >
                    {sentence.text}
                  </span>
                  {source && (
                    <GroundingMark
                      number={number}
                      source={source}
                      isLit={isLit}
                      cardId={cardIdOf(source.id)}
                      onEnter={() => enter(sentence.id)}
                      onLeave={() => leave(sentence.id)}
                      onToggle={() => togglePin(sentence.id)}
                    />
                  )}
                </span>
              );
            })}
          </p>
          <p className='text-muted-foreground text-xs'>
            Point at or focus a mark to see its passage. A click keeps it open,
            Escape lets it go.
          </p>
        </div>
        <ul aria-label='Sources' className='flex flex-col gap-2 self-start'>
          {sources.map((source, index) => (
            <SourceCard
              key={source.id}
              source={source}
              number={index + 1}
              cardId={cardIdOf(source.id)}
              activeSentence={activeSentence}
            />
          ))}
        </ul>
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}

function leadingSpaceOf(index: number) {
  if (index === 0) {
    return '';
  }
  return ' ';
}

const SOURCES: GroundingSource[] = [
  {
    id: 'contract',
    kind: 'pdf',
    title: 'Q3 supply contract',
    meta: 'PDF, clause 4',
  },
  {
    id: 'email',
    kind: 'email',
    title: 'Email from Dana Reyes',
    meta: 'Email, 14 Oct',
  },
  {
    id: 'notes',
    kind: 'notes',
    title: 'Account review call',
    meta: 'Call notes, 20 Oct',
  },
];

const SENTENCES: GroundedSentence[] = [
  {
    id: 'fee',
    text: 'The Q3 contract moves bulk orders to a flat pallet fee of 18.40 EUR.',
    citation: {
      sourceId: 'contract',
      passage:
        '4.2 From 1 October, bulk orders of 40 pallets or more are billed a flat pallet fee of 18.40 EUR.',
    },
  },
  {
    id: 'tiers',
    text: 'Orders under 40 pallets keep the tiered rate from Annex B.',
    citation: {
      sourceId: 'contract',
      passage:
        '4.3 Orders under 40 pallets keep the tiered rate set out in Annex B.',
    },
  },
  {
    id: 'terms',
    text: 'Payment terms move from 30 to 45 days, starting with the October invoices.',
    citation: {
      sourceId: 'email',
      passage:
        'We can move your payment terms from 30 to 45 days, starting with the October invoices.',
    },
  },
  {
    id: 'returns',
    text: 'Brightmoor also covers returns damaged in transit, up to 2% of each order.',
    citation: {
      sourceId: 'notes',
      passage:
        'Dana confirmed Brightmoor will cover returns damaged in transit, up to 2% of each order value.',
    },
  },
  {
    id: 'cheapest',
    text: 'That makes Brightmoor the cheapest supplier in the region.',
  },
];

const QUESTION = 'What changed in the Brightmoor contract for Q3?';

export default function Answer02() {
  return (
    <div className='bg-card hairline-ring ring-border flex w-full max-w-[44rem] flex-col gap-4 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      <div className='flex justify-end'>
        <p className='bg-foreground/[0.05] dark:bg-foreground/[0.07] max-w-[85%] rounded-xl px-3.5 py-2 text-sm leading-relaxed text-balance'>
          {QUESTION}
        </p>
      </div>
      <div className='flex items-start gap-2.5'>
        <LabTile lab='lumen' className='mt-0.5' />
        <GroundedAnswer
          sentences={SENTENCES}
          sources={SOURCES}
          className='min-w-0 flex-1'
        />
      </div>
    </div>
  );
}
