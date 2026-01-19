'use client';

import type { BaseUIEvent } from '@base-ui/react/types';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useId, useState, type KeyboardEvent } from 'react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxInput,
  ComboboxInputGroup,
} from '@/registry/ndeko/ui/combobox';
import { Label } from '@/registry/ndeko/ui/label';

const INITIAL_TAGS = ['Red'];

const CHIP_TRANSITION: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };
const CHIP_EXIT_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.2, 0, 0, 1],
};

const CHIP_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  shown: { opacity: 1, scale: 1 },
  gone: { opacity: 0, scale: 0.9, transition: CHIP_EXIT_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
  gone: { opacity: 0, transition: CHIP_EXIT_TRANSITION },
};

function chipVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return CHIP_VARIANTS;
}

function hasTag(tags: string[], candidate: string) {
  const normalized = candidate.toLocaleLowerCase();
  return tags.some((tag) => tag.toLocaleLowerCase() === normalized);
}

export default function Input59() {
  const inputId = useId();
  const [tags, setTags] = useState(INITIAL_TAGS);
  const [draft, setDraft] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const chipVariants = chipVariantsOf(shouldReduceMotion);
  const isLayoutAnimated = !shouldReduceMotion;

  function changeTags(nextTags: string[]) {
    setTags(nextTags);
  }

  function handleKeyDown(event: BaseUIEvent<KeyboardEvent<HTMLInputElement>>) {
    if (event.key === 'Escape') {
      event.preventBaseUIHandler();
      setDraft('');
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    const tag = draft.trim();
    setDraft('');
    if (tag === '') {
      return;
    }
    if (hasTag(tags, tag)) {
      return;
    }
    setTags((current) => [...current, tag]);
  }

  return (
    <Combobox
      multiple
      open={false}
      value={tags}
      onValueChange={changeTags}
      inputValue={draft}
      onInputValueChange={setDraft}
    >
      <div className='flex w-full max-w-xs flex-col gap-1.5'>
        <Label htmlFor={inputId}>Colors</Label>
        <ComboboxInputGroup>
          <ComboboxChips className='relative'>
            <AnimatePresence mode='popLayout' initial={false}>
              {tags.map((tag) => (
                <ComboboxChip
                  key={tag}
                  aria-label={tag}
                  render={
                    <motion.div
                      layout={isLayoutAnimated}
                      variants={chipVariants}
                      initial='hidden'
                      animate='shown'
                      exit='gone'
                      transition={CHIP_TRANSITION}
                    />
                  }
                >
                  {tag}
                  <ComboboxChipRemove aria-label={`Remove ${tag}`} />
                </ComboboxChip>
              ))}
            </AnimatePresence>
            <ComboboxInput
              id={inputId}
              placeholder='Add a tag'
              onKeyDown={handleKeyDown}
            />
          </ComboboxChips>
        </ComboboxInputGroup>
      </div>
    </Combobox>
  );
}
