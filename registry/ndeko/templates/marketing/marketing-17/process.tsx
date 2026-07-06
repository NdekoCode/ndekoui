import { StickyScroll } from '@/components/core/sticky-scroll';

import { PROCESS_ANCHOR, PROCESS_SECTION, PROCESS_STEPS } from './data';
import { ProcessVisual } from './process-visuals';

const STEPS = PROCESS_STEPS.map((step) => ({
  id: step.id,
  title: step.title,
  description: step.description,
  media: <ProcessVisual id={step.id} />,
}));

export function Process() {
  return (
    <section
      id={PROCESS_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-24 @5xl:px-8'
    >
      <div className='mx-auto max-w-6xl'>
        <h2 className='max-w-2xl text-3xl font-semibold text-balance @2xl:text-4xl'>
          {PROCESS_SECTION.title}
        </h2>
        <StickyScroll steps={STEPS} className='mt-10' />
      </div>
    </section>
  );
}
