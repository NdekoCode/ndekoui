'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { WordRoll } from '@/components/core/word-roll';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

const TOGGLE_LABELS = ['Read more', 'Show less'];

function toggleLabelOf(isOpen: boolean) {
  if (isOpen) {
    return 'Show less';
  }
  return 'Read more';
}

function clampOf(isOpen: boolean) {
  if (isOpen) {
    return 'line-clamp-none';
  }
  return 'line-clamp-3';
}

/**
 * Read more shows only when the clamp hides something, measured again at every width. While the
 * bio is open there is nothing to measure, so the last answer stands.
 */
function useCanExpand(
  textRef: RefObject<HTMLParagraphElement | null>,
  isOpen: boolean
) {
  const [canExpand, setCanExpand] = useState(true);

  const measure = useEffectEvent(() => {
    const text = textRef.current;
    if (!text || isOpen) {
      return;
    }
    const isCut = text.scrollHeight > text.clientHeight;
    setCanExpand(isCut);
  });

  useEffect(() => {
    const text = textRef.current;
    if (!text) {
      return;
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(text);
    return () => observer.disconnect();
  }, [textRef]);

  return canExpand;
}

type MemberBioProps = {
  name: string;
  bio: string;
  isOpen: boolean;
  isPressed: boolean;
  onToggle: () => void;
};

export function MemberBio({
  name,
  bio,
  isOpen,
  isPressed,
  onToggle,
}: MemberBioProps) {
  const bioId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const canExpand = useCanExpand(textRef, isOpen);
  const showsToggle = canExpand || isOpen;

  return (
    <div className='flex flex-col items-start gap-1'>
      <AnimatedSize className='w-full'>
        <p
          ref={textRef}
          id={bioId}
          className={cn(
            'text-muted-foreground text-[13px] leading-5 text-pretty',
            clampOf(isOpen)
          )}
        >
          {bio}
        </p>
      </AnimatedSize>
      {showsToggle && (
        <Button
          type='button'
          variant='link'
          size='sm'
          aria-expanded={isOpen}
          aria-controls={bioId}
          onClick={onToggle}
          className={cn(
            '-mx-1 h-6 px-1 text-[13px]',
            pressedQuietOf(isPressed)
          )}
        >
          <WordRoll text={toggleLabelOf(isOpen)} labels={TOGGLE_LABELS} />
          <span className='sr-only'> about {name}</span>
        </Button>
      )}
    </div>
  );
}
