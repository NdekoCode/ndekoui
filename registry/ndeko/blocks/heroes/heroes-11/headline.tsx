import { Fragment } from 'react';

import {
  BotIcon,
  type Icon,
  RouteIcon,
  ShieldCheckIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

import { type MarkId, TOKENS } from './data';

const STAGGER_MS = 70;

/**
 * What each part does once on load: it sharpens and rises 12px. The starting values come from the
 * browser's first style, so nothing runs in script, and reduced motion keeps only the fade.
 */
export const LANDING =
  'transition-[opacity,translate,filter] duration-700 ease-(--ease-out-strong) starting:opacity-0 motion-safe:starting:translate-y-3 motion-safe:starting:blur-sm';

export function delayOf(index: number) {
  return { transitionDelay: `${index * STAGGER_MS}ms` };
}

const MARK_ICONS: Record<MarkId, Icon> = {
  plan: RouteIcon,
  agent: BotIcon,
  review: ShieldCheckIcon,
};

function MarkTile({ mark, index }: { mark: MarkId; index: number }) {
  const Glyph = MARK_ICONS[mark];

  return (
    <>
      <span className='sr-only'>, </span>
      <span
        aria-hidden='true'
        style={delayOf(index)}
        className={cn(
          'keycap-3d relative -top-[0.04em] inline-flex size-[0.72em] items-center justify-center rounded-[0.22em] align-middle',
          LANDING
        )}
      >
        <Glyph className='text-foreground/80 size-[0.42em]' />
      </span>
    </>
  );
}

export function Headline() {
  return (
    <>
      {TOKENS.map((token, index) => (
        <Fragment key={token.id}>
          {index > 0 && ' '}
          {token.kind === 'mark' && (
            <MarkTile mark={token.mark} index={index} />
          )}
          {token.kind === 'word' && (
            <span
              style={delayOf(index)}
              className={cn('inline-block', LANDING)}
            >
              {token.text}
            </span>
          )}
        </Fragment>
      ))}
    </>
  );
}
