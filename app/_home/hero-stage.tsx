import Link from 'next/link';
import type { ReactNode } from 'react';

import { BoardStage } from '@/registry/ndeko/blocks/heroes/heroes-02/board-stage';
import Activity05 from '@/registry/ndeko/components/activity/activity-05';
import Subtask01 from '@/registry/ndeko/components/subtask/subtask-01';
import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import { pieceHrefOf } from './showcase-pieces';

type FloatingPieceProps = {
  name: string;
  className: string;
  children: ReactNode;
};

/** A catalogue item laid over the edge of the board: live, clickable, and named so it can be found. */
function FloatingPiece({ name, className, children }: FloatingPieceProps) {
  return (
    <figure
      className={cn(
        'surface-raised absolute z-10 hidden flex-col gap-3 rounded-2xl p-4 xl:flex',
        className
      )}
    >
      <figcaption>
        <Link
          href={pieceHrefOf(name)}
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex items-center gap-1 rounded-sm font-mono text-xs transition-colors outline-none focus-visible:ring-[3px]'
        >
          {name}
          <ArrowUpRightIcon className='size-3' />
        </Link>
      </figcaption>
      {children}
    </figure>
  );
}

/**
 * The opening scene: a board whose card travels across the lanes on its own, a checklist that
 * answers clicks, and a feed that receives a new event every few seconds. All three are catalogue
 * items, rendered as they install.
 */
export function HeroStage() {
  return (
    <div className='relative mx-auto w-full text-left'>
      <div className='relative mx-auto w-full max-w-3xl xl:max-w-[41rem]'>
        <BoardStage />
      </div>
      <FloatingPiece name='subtask-01' className='-bottom-8 left-0 w-[19rem]'>
        <Subtask01 />
      </FloatingPiece>
      <FloatingPiece name='activity-05' className='-top-6 right-0 w-[20rem]'>
        <Activity05 />
      </FloatingPiece>
    </div>
  );
}
