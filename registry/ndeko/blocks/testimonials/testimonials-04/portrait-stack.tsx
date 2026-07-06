import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import type { Story } from './data';

function layerToneOf(isActive: boolean) {
  if (isActive) {
    return 'opacity-100';
  }
  return 'opacity-0';
}

type PortraitStackProps = {
  stories: readonly Story[];
  activeId: string;
};

/**
 * Every portrait is laid out at once and only the current one is opaque, so a change of person is
 * an opacity crossfade on the compositor and the frame never changes size.
 */
export function PortraitStack({ stories, activeId }: PortraitStackProps) {
  return (
    <div
      aria-hidden='true'
      className='relative aspect-[3/2] w-full @3xl:aspect-[4/5]'
    >
      {stories.map((story) => {
        const isActive = story.id === activeId;
        const { person } = story;

        return (
          <div
            key={story.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 ease-(--ease-out-strong)',
              layerToneOf(isActive)
            )}
          >
            <Avatar seed={person.name} className='size-full rounded-2xl' />
            <span className='bg-card/90 hairline-ring ring-border dark:bg-popover/90 absolute start-3 bottom-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg py-1.5 ps-1.5 pe-2.5 text-xs font-medium shadow-[0_1px_2px_rgb(0_0_0/0.06)]'>
              <CompanyMark seed={person.company} />
              <span className='truncate'>{person.company}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
