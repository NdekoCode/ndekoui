import {
  ScrollVelocity,
  ScrollVelocityRow,
} from '@/components/core/scroll-velocity';

const FIRST_ROW = ['Plan the week', 'Write it down', 'Ship on Friday'];

const SECOND_ROW = ['Review in pairs', 'Keep the notes', 'Start again'];

function Phrases({ phrases }: { phrases: readonly string[] }) {
  return phrases.map((phrase) => (
    <span key={phrase} className='flex items-center gap-8 pr-8'>
      <span>{phrase}</span>
      <span
        aria-hidden='true'
        className='bg-foreground/15 size-2 rounded-full'
      />
    </span>
  ));
}

export function ScrollVelocityText() {
  return (
    <ScrollVelocity className='w-full gap-2 py-10'>
      <ScrollVelocityRow
        gap={0}
        className='text-foreground text-4xl font-semibold sm:text-6xl'
      >
        <Phrases phrases={FIRST_ROW} />
      </ScrollVelocityRow>
      <ScrollVelocityRow
        gap={0}
        direction='right'
        className='text-muted-foreground text-4xl font-semibold sm:text-6xl'
      >
        <Phrases phrases={SECOND_ROW} />
      </ScrollVelocityRow>
    </ScrollVelocity>
  );
}
