import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import { DraftDemo } from './ability-draft';
import { NotesDemo } from './ability-notes';
import { PlanDemo } from './ability-plan';
import {
  ABILITIES,
  ABILITIES_ANCHOR,
  ABILITIES_SECTION,
  type AbilityId,
} from './data';

const DEMOS: Record<AbilityId, () => React.ReactNode> = {
  plan: PlanDemo,
  draft: DraftDemo,
  promises: NotesDemo,
};

function isMediaFirst(index: number) {
  return index % 2 === 1;
}

function AbilityDemo({ id }: { id: AbilityId }) {
  const Demo = DEMOS[id];

  return (
    <div className='bg-foreground/[0.03] flex min-h-72 items-center justify-center rounded-2xl p-4 sm:p-10'>
      <Demo />
    </div>
  );
}

export function Abilities() {
  return (
    <section
      id={ABILITIES_ANCHOR}
      className='px-4 py-16 sm:px-6 sm:py-24 lg:px-8'
    >
      <div className='mx-auto flex max-w-6xl flex-col gap-14 sm:gap-20'>
        <div className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance sm:text-3xl'>
            {ABILITIES_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {ABILITIES_SECTION.description}
          </p>
        </div>
        <ul className='flex flex-col gap-16 sm:gap-24'>
          {ABILITIES.map((ability, index) => (
            <li
              key={ability.id}
              className='grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16'
            >
              <div className='flex flex-col items-start gap-4'>
                <h3 className='text-xl font-semibold text-balance'>
                  {ability.title}
                </h3>
                <p className='text-muted-foreground max-w-md text-sm leading-relaxed text-pretty'>
                  {ability.description}
                </p>
                <Button
                  variant='link'
                  className='h-auto px-0'
                  nativeButton={false}
                  render={<a href='#' />}
                >
                  {ability.linkLabel}
                  <ArrowRightIcon className='size-3.5' />
                </Button>
              </div>
              <div className={cn(isMediaFirst(index) && 'lg:order-first')}>
                <AbilityDemo id={ability.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
