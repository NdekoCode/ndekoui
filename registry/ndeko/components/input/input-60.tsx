'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { EyeIcon, EyeOffIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

type Morph = { id: number; durationMs: number };

const SWAP_MS = 150;
const STAGGER_MS = 14;
const MAX_STAGGER_MS = 210;

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

const OVERLAY =
  'text-foreground pointer-events-none absolute inset-y-0 start-px end-8 flex items-center overflow-hidden ps-2.5 font-mono text-base md:text-[13px]';

const SWAP_TRANSITION: Transition = {
  duration: SWAP_MS / 1000,
  ease: [0.2, 0, 0, 1],
};

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function inputTypeOf(isVisible: boolean) {
  if (isVisible) {
    return 'text';
  }
  return 'password';
}

function visibilityGlyphOf(isVisible: boolean) {
  if (isVisible) {
    return { key: 'hide', icon: <EyeOffIcon className='size-4' /> };
  }
  return { key: 'show', icon: <EyeIcon className='size-4' /> };
}

function staggerOf(index: number) {
  const stagger = index * STAGGER_MS;
  return Math.min(stagger, MAX_STAGGER_MS);
}

function cellTransitionOf(index: number): Transition {
  const delay = staggerOf(index) / 1000;
  return { ...SWAP_TRANSITION, delay };
}

function nextMorphOf(current: Morph | null, length: number): Morph {
  const previousId = current?.id ?? 0;
  const lastStagger = staggerOf(length);
  return { id: previousId + 1, durationMs: lastStagger + SWAP_MS };
}

function MaskCell({
  character,
  index,
  isVisible,
}: {
  character: string;
  index: number;
  isVisible: boolean;
}) {
  if (isVisible) {
    return (
      <MorphingCell index={index} cellKey='character'>
        {character}
      </MorphingCell>
    );
  }
  return (
    <MorphingCell index={index} cellKey='dot'>
      <span className='size-[0.35em] rounded-full bg-current' />
    </MorphingCell>
  );
}

function MorphingCell({
  index,
  cellKey,
  children,
}: {
  index: number;
  cellKey: string;
  children: React.ReactNode;
}) {
  return (
    <span className='relative inline-flex w-[1ch] items-center justify-center'>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={cellKey}
          className='inline-flex items-center justify-center'
          variants={SWAP_VARIANTS}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={cellTransitionOf(index)}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Input60() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [morph, setMorph] = useState<Morph | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const visibilityGlyph = visibilityGlyphOf(isVisible);
  const characters = Array.from(password);
  const isMorphing = morph !== null;
  const rendersOverlay = !shouldReduceMotion;
  const rowOffset = -scrollOffset;
  const rowStyle = { translate: `${rowOffset}px 0` };

  useEffect(() => {
    if (!morph) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setMorph(null);
    }, morph.durationMs);
    return () => window.clearTimeout(timeout);
  }, [morph]);

  function changePassword(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.currentTarget.value);
  }

  function toggleVisibility() {
    setIsVisible((current) => !current);
    if (shouldReduceMotion) {
      return;
    }
    const scrollLeft = inputRef.current?.scrollLeft ?? 0;
    setScrollOffset(scrollLeft);
    setMorph((current) => nextMorphOf(current, characters.length));
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Password</FieldLabel>
      <div className='relative'>
        <Input
          ref={inputRef}
          id={inputId}
          className={cn(
            'caret-foreground pe-8 font-mono',
            isMorphing && 'text-transparent'
          )}
          type={inputTypeOf(isVisible)}
          autoComplete='new-password'
          spellCheck={false}
          placeholder='At least 12 characters'
          value={password}
          onChange={changePassword}
        />
        {rendersOverlay && (
          <span
            aria-hidden='true'
            className={cn(OVERLAY, !isMorphing && 'invisible')}
          >
            <span className='flex whitespace-pre' style={rowStyle}>
              {characters.map((character, index) => (
                <MaskCell
                  key={index}
                  character={character}
                  index={index}
                  isVisible={isVisible}
                />
              ))}
            </span>
          </span>
        )}
        <button
          type='button'
          className={FIELD_BUTTON}
          onClick={toggleVisibility}
          aria-label='Show password'
          aria-pressed={isVisible}
          aria-controls={inputId}
        >
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={visibilityGlyph.key}
              className='flex'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {visibilityGlyph.icon}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </Field>
  );
}
