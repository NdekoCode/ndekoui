'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { XIcon } from '@/registry/ndeko/lib/icons';
import { Chip } from '@/registry/ndeko/ui/chip';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const INITIAL_TAGS = ['Sport', 'Coding', 'Travel'];

const LIST_TRANSITION: Transition = { duration: 0.2, ease: [0.2, 0, 0, 1] };
const EXIT_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const TAG_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8, transition: EXIT_TRANSITION },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT_TRANSITION },
};

function tagVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TAG_VARIANTS;
}

function hasTag(tags: string[], candidate: string) {
  const normalized = candidate.toLocaleLowerCase();
  return tags.some((tag) => tag.toLocaleLowerCase() === normalized);
}

export default function Input58() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState(INITIAL_TAGS);
  const [draft, setDraft] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const tagVariants = tagVariantsOf(shouldReduceMotion);

  function changeDraft(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.currentTarget.value);
  }

  function addDraftTag(event: KeyboardEvent<HTMLInputElement>) {
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

  function removeTag(tagToRemove: string) {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
    inputRef.current?.focus();
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Interests</FieldLabel>
      <Input
        ref={inputRef}
        placeholder='Add a tag and press Enter'
        value={draft}
        onChange={changeDraft}
        onKeyDown={addDraftTag}
      />
      <ul
        className='relative mt-1 flex flex-wrap gap-1 empty:hidden'
        aria-label='Tags'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {tags.map((tag) => (
            <motion.li
              key={tag}
              layout={!shouldReduceMotion}
              className='flex'
              variants={tagVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={LIST_TRANSITION}
            >
              <Chip className='h-6 gap-0.5 pe-0.5'>
                {tag}
                <button
                  type='button'
                  className='focus-visible:ring-ring/50 flex size-5 cursor-pointer items-center justify-center rounded-[5px] opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2'
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  <XIcon />
                </button>
              </Chip>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Field>
  );
}
