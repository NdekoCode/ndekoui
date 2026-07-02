import type { ReactNode } from 'react';

import { CursorMark, V0Mark } from '@/app/_site/open-in/tool-marks';
import {
  ClaudeCodeMark,
  GeminiMark,
  WindsurfMark,
  ZedMark,
  type MarkComponent,
} from '@/app/mcp/_components/client-marks';
import { ScrollTextMarquee } from '@/components/core/scroll-text-marquee';
import { cn } from '@/registry/ndeko/lib/utils';

type EditorTileProps = {
  Mark: MarkComponent;
  /** How the tile sits in the line: a small turn and a nudge up or down. */
  pose: string;
};

/** An editor's mark on a plate in the brand hue, set in the line of text like a key among letters. */
function EditorTile({ Mark, pose }: EditorTileProps) {
  return (
    <span
      className={cn(
        'gem-plate relative mx-[0.12em] inline-flex size-[0.8em] items-center justify-center rounded-[0.2em] align-[-0.08em] [--gem:var(--primary)]',
        pose
      )}
    >
      <Mark className='size-[0.44em] text-white' />
    </span>
  );
}

function Phrase({ children }: { children: ReactNode }) {
  return <span className='mx-[0.1em]'>{children}</span>;
}

/** One giant line that runs with the scroll: what an editor does with the library, and the editors that do it. */
export function EditorMarquee() {
  return (
    <ScrollTextMarquee
      speed={48}
      bidirectional
      repeat={3}
      className='py-[0.12em] text-[4.5rem] leading-[1.2] sm:text-[8rem] lg:text-[10.5rem]'
    >
      <Phrase>Search it</Phrase>
      <EditorTile
        Mark={ClaudeCodeMark}
        pose='-rotate-6 -translate-y-[0.06em]'
      />
      <Phrase>fetch it</Phrase>
      <EditorTile Mark={CursorMark} pose='rotate-3 translate-y-[0.05em]' />
      <Phrase>install it</Phrase>
      <EditorTile Mark={WindsurfMark} pose='-rotate-3' />
      <Phrase>from your editor</Phrase>
      <EditorTile Mark={ZedMark} pose='rotate-6 -translate-y-[0.05em]' />
      <EditorTile Mark={GeminiMark} pose='-rotate-12 translate-y-[0.06em]' />
      <EditorTile Mark={V0Mark} pose='rotate-3' />
    </ScrollTextMarquee>
  );
}
