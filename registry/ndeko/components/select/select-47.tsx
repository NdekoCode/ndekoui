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
  ComboboxClear,
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
};

const FRAMEWORKS: Framework[] = [
  { value: 'nextjs', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'react', label: 'React' },
  { value: 'ember', label: 'Ember.js' },
  { value: 'gatsby', label: 'Gatsby' },
  { value: 'eleventy', label: 'Eleventy' },
  { value: 'solid', label: 'SolidJS' },
  { value: 'preact', label: 'Preact' },
  { value: 'qwik', label: 'Qwik' },
  { value: 'alpine', label: 'Alpine.js' },
  { value: 'lit', label: 'Lit' },
];

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

export default function Select47() {
  const shouldReduceMotion = useReducedMotion();
  const chipVariants = chipVariantsOf(shouldReduceMotion);
  const isLayoutAnimated = !shouldReduceMotion;

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Frameworks</FieldLabel>
      <Combobox items={FRAMEWORKS} multiple>
        <ComboboxInputGroup>
          <ComboboxChips className='relative flex-1'>
            <ComboboxValue>
              {(selected: Framework[]) => (
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
              )}
            </ComboboxValue>
            <ComboboxInput placeholder='Select frameworks' />
          </ComboboxChips>
          <ComboboxClear label='Clear all frameworks' className='self-start' />
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxEmpty>No framework matches your search.</ComboboxEmpty>
          <ComboboxList className='empty:hidden'>
            {(framework: Framework) => (
              <ComboboxItem key={framework.value} value={framework}>
                {framework.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
