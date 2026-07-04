import { RepeatIcon } from '@/registry/ndeko/lib/icons';

import { Reveal } from '../reveal';
import { SectionHeading } from '../section-heading';
import { StateShowcase } from './state-showcase';

export function StatesSection({ className }: { className: string }) {
  return (
    <section aria-labelledby='states-title' className={className}>
      <SectionHeading
        id='states-title'
        icon={RepeatIcon}
        eyebrow='Every state'
        lead='See what changes'
        title='from one state to the next'
        description='Each component plays through its states here: queued, running, waiting on you, done, failed. Pick one to hold it. The motion between two states is part of what you install.'
      />
      <Reveal isLarge>
        <StateShowcase />
      </Reveal>
    </section>
  );
}
