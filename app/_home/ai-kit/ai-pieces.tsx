import type { ComponentType } from 'react';

import { ComponentTile } from '@/app/components/_catalog/component-tile';
import { catalog } from '@/app/components/_generated/catalog';
import Agent01 from '@/registry/ndeko/components/agent/agent-01';
import Answer02 from '@/registry/ndeko/components/answer/answer-02';
import Prompt02 from '@/registry/ndeko/components/prompt/prompt-02';
import Prompt03 from '@/registry/ndeko/components/prompt/prompt-03';
import Review02 from '@/registry/ndeko/components/review/review-02';
import Voice02 from '@/registry/ndeko/components/voice/voice-02';
import { cn } from '@/registry/ndeko/lib/utils';

import { Turn, TurnTaking } from './turns';

type Piece = {
  name: string;
  Piece: ComponentType;
  placement?: string;
};

type Column = {
  className?: string;
  pieces: Piece[];
};

/** The last tile of a column takes what is left, so the three columns end on the same line. */
const FILLS_COLUMN = 'flex-1';
const FILLS_COLUMN_FROM_TABLET = 'hidden flex-1 md:flex';

/*
 * Each column pairs a short piece with a tall one, so the columns come out close in height and
 * no tile floats in empty space. A phone shows the first piece of the second column after the
 * first column, a tablet or a laptop the first two columns, a wide screen all three.
 */
/** The pieces that play a demonstration take turns, in reading order; the grounded answer waits for a person. */
const TURN_ORDER = [
  'prompt-02',
  'review-02',
  'voice-02',
  'agent-01',
  'prompt-03',
];

const TURN_MS = 9000;

const COLUMNS: Column[] = [
  {
    pieces: [
      { name: 'prompt-02', Piece: Prompt02 },
      { name: 'agent-01', Piece: Agent01, placement: FILLS_COLUMN },
    ],
  },
  {
    pieces: [
      { name: 'review-02', Piece: Review02 },
      {
        name: 'prompt-03',
        Piece: Prompt03,
        placement: FILLS_COLUMN_FROM_TABLET,
      },
    ],
  },
  {
    className: 'hidden xl:flex',
    pieces: [
      { name: 'voice-02', Piece: Voice02 },
      { name: 'answer-02', Piece: Answer02, placement: FILLS_COLUMN },
    ],
  },
];

function entryOf(name: string) {
  for (const category of catalog) {
    const entry = category.entries.find((candidate) => candidate.name === name);
    if (entry) {
      return entry;
    }
  }
  return undefined;
}

function PieceTile({ name, Piece, placement = '' }: Piece) {
  const entry = entryOf(name);
  if (!entry) {
    return null;
  }
  return (
    <ComponentTile
      entry={entry}
      preview={
        <Turn name={name}>
          <Piece />
        </Turn>
      }
      placement={placement}
      titleAs='h3'
    />
  );
}

/** Six AI components as they install, in the tiles of the catalogue, playing their demos in turn. */
export function AiPieces() {
  return (
    <TurnTaking
      order={TURN_ORDER}
      turnMs={TURN_MS}
      className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
    >
      {COLUMNS.map((column) => (
        <div
          key={column.pieces[0].name}
          className={cn('flex min-w-0 flex-col gap-4', column.className)}
        >
          {column.pieces.map((piece) => (
            <PieceTile key={piece.name} {...piece} />
          ))}
        </div>
      ))}
    </TurnTaking>
  );
}
