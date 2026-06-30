import { WordRotate } from '@/components/core/word-rotate';

const DOCUMENTS = [
  'release notes',
  'weekly updates',
  'design reviews',
  'onboarding guides',
];

export function WordRotateHeadline() {
  return (
    <h3 className='text-foreground text-center text-2xl font-semibold text-balance sm:text-3xl'>
      Write{' '}
      <WordRotate
        words={DOCUMENTS}
        className='text-primary-ink'
        accessibleText='release notes, weekly updates, design reviews and onboarding guides'
      />{' '}
      people finish reading
    </h3>
  );
}
