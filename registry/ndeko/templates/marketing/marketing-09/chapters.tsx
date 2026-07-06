'use client';

import { type ComponentType } from 'react';

import { Chapter } from './chapter';
import { CostVisual } from './cost-visual';
import { type ChapterId, CHAPTERS } from './data';
import { FolderVisual } from './folder-visual';
import { MemoVisual } from './memo-visual';
import { RolesVisual } from './roles-visual';
import { SwapVisual } from './swap-visual';
import { type VisualProps } from './visual-props';

const VISUALS: Record<ChapterId, ComponentType<VisualProps>> = {
  memo: MemoVisual,
  cost: CostVisual,
  swap: SwapVisual,
  people: RolesVisual,
  folder: FolderVisual,
};

export function Chapters() {
  return (
    <>
      {CHAPTERS.map((chapter, index) => (
        <Chapter
          key={chapter.id}
          chapter={chapter}
          number={index + 1}
          total={CHAPTERS.length}
          Visual={VISUALS[chapter.id]}
        />
      ))}
    </>
  );
}
