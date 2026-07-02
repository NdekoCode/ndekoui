import type { CSSProperties, ReactNode } from 'react';

import { CursorMark, V0Mark } from '@/app/_site/open-in/tool-marks';
import {
  ClaudeCodeMark,
  GeminiMark,
  WarpMark,
  WindsurfMark,
  ZedMark,
  type MarkComponent,
} from '@/app/mcp/_components/client-marks';
import { ScrollTextMarquee } from '@/components/core/scroll-text-marquee';
import { cn } from '@/registry/ndeko/lib/utils';

/* Brand colours from Simple Icons 16.33.0, the same set the marks come from. */
const CLAUDE_CODE = '#D97757';
const CURSOR = '#000000';
const WINDSURF = '#0B100F';
const ZED = '#084CCF';
const GEMINI = '#8E75B2';
const V0 = '#000000';
const WARP = '#01A4FF';

type EditorTileProps = {
  Mark: MarkComponent;
  colour: string;
  /** How the tile sits in the line: a small turn and a nudge up or down. */
  pose: string;
};

function tileStyleOf(colour: string) {
  return { '--tile': colour } as CSSProperties;
}

/** An editor's mark on a tile in its own colour, set in the line of text like an app icon among letters. */
function EditorTile({ Mark, colour, pose }: EditorTileProps) {
  return (
    <span
      style={tileStyleOf(colour)}
      className={cn(
        'relative mx-[0.12em] inline-flex size-[0.8em] items-center justify-center rounded-[0.22em] bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--tile)_82%,white),var(--tile))] align-[-0.08em] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),inset_0_0_0_1px_rgb(255_255_255/0.08),0_0.08em_0.2em_rgb(0_0_0/0.35)]',
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
      className='py-[0.12em] text-[4.5rem] leading-[1.2] tracking-[-0.03em] sm:text-[8rem] lg:text-[10.5rem]'
    >
      <Phrase>Search it</Phrase>
      <EditorTile
        Mark={ClaudeCodeMark}
        colour={CLAUDE_CODE}
        pose='-rotate-6 -translate-y-[0.06em]'
      />
      <Phrase>fetch it</Phrase>
      <EditorTile
        Mark={CursorMark}
        colour={CURSOR}
        pose='rotate-3 translate-y-[0.05em]'
      />
      <Phrase>install it</Phrase>
      <EditorTile Mark={WindsurfMark} colour={WINDSURF} pose='-rotate-3' />
      <Phrase>from your editor</Phrase>
      <EditorTile
        Mark={ZedMark}
        colour={ZED}
        pose='rotate-6 -translate-y-[0.05em]'
      />
      <EditorTile
        Mark={GeminiMark}
        colour={GEMINI}
        pose='-rotate-12 translate-y-[0.06em]'
      />
      <EditorTile Mark={V0Mark} colour={V0} pose='rotate-3' />
      <EditorTile
        Mark={WarpMark}
        colour={WARP}
        pose='-rotate-6 -translate-y-[0.04em]'
      />
    </ScrollTextMarquee>
  );
}
