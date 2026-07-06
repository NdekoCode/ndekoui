import { BENTO } from './data';
import { ExperienceCard } from './experience-card';
import { MethodCard } from './method-card';
import { PlaceCard } from './place-card';
import { ReadingCard } from './reading-card';
import { TerminalCard } from './terminal-card';

export function Bento() {
  return (
    <section className='px-4 py-12 sm:px-6 sm:py-16 lg:px-8'>
      <div className='mx-auto flex max-w-6xl flex-col gap-8'>
        <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
          {BENTO.title}
        </h2>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-12'>
          <TerminalCard className='md:col-span-2 lg:col-span-7' />
          <ExperienceCard className='lg:col-span-5' />
          <ReadingCard className='lg:col-span-4' />
          <PlaceCard className='lg:col-span-3' />
          <MethodCard className='md:col-span-2 lg:col-span-5' />
        </div>
      </div>
    </section>
  );
}
