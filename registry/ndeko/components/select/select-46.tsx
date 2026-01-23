'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/registry/ndeko/ui/combobox';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

type Framework = {
  value: string;
  label: string;
  disabled: boolean;
};

const FRAMEWORKS: Framework[] = [
  { value: 'nextjs', label: 'Next.js', disabled: false },
  { value: 'sveltekit', label: 'SvelteKit', disabled: false },
  { value: 'nuxt', label: 'Nuxt', disabled: true },
  { value: 'remix', label: 'Remix', disabled: false },
  { value: 'astro', label: 'Astro', disabled: false },
  { value: 'angular', label: 'Angular', disabled: false },
  { value: 'vue', label: 'Vue.js', disabled: false },
  { value: 'react', label: 'React', disabled: false },
  { value: 'ember', label: 'Ember.js', disabled: false },
  { value: 'gatsby', label: 'Gatsby', disabled: false },
  { value: 'eleventy', label: 'Eleventy', disabled: true },
  { value: 'solid', label: 'SolidJS', disabled: false },
  { value: 'preact', label: 'Preact', disabled: false },
  { value: 'qwik', label: 'Qwik', disabled: false },
  { value: 'alpine', label: 'Alpine.js', disabled: false },
  { value: 'lit', label: 'Lit', disabled: false },
];

const INITIAL_FRAMEWORKS = FRAMEWORKS.slice(0, 2);

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

function placeholderOf(selected: Framework[]) {
  if (selected.length > 0) {
    return '';
  }
  return 'Select frameworks';
}

export default function Select46() {
  const shouldReduceMotion = useReducedMotion();
  const chipVariants = chipVariantsOf(shouldReduceMotion);
  const isLayoutAnimated = !shouldReduceMotion;

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Frameworks</FieldLabel>
      <Combobox items={FRAMEWORKS} multiple defaultValue={INITIAL_FRAMEWORKS}>
        <ComboboxInputGroup>
          <ComboboxChips className='relative'>
            <ComboboxValue>
              {(selected: Framework[]) => (
                <>
                  <AnimatePresence mode='popLayout' initial={false}>
                    {selected.map((framework) => (
                      <ComboboxChip
                        key={framework.value}
                        aria-label={framework.label}
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
                        {framework.label}
                        <ComboboxChipRemove
                          aria-label={`Remove ${framework.label}`}
                        />
                      </ComboboxChip>
                    ))}
                  </AnimatePresence>
                  <ComboboxInput placeholder={placeholderOf(selected)} />
                </>
              )}
            </ComboboxValue>
          </ComboboxChips>
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No framework matches your search.</ComboboxEmpty>
          <ComboboxList className='empty:hidden'>
            {(framework: Framework) => (
              <ComboboxItem
                key={framework.value}
                value={framework}
                disabled={framework.disabled}
              >
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
