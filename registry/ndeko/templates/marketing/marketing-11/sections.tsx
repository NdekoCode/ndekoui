import { cn } from '@/registry/ndeko/lib/utils';

import { SECTIONS } from './data';
import { SectionCopy } from './section-copy';

function isShapeOnLeft(index: number) {
  return index % 2 === 1;
}

export function StudioSections() {
  return (
    <>
      {SECTIONS.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-title`}
          className='flex min-h-svh items-end px-4 py-14 pe-12 sm:px-6 sm:pe-14 lg:items-center lg:px-8 lg:pe-16'
        >
          <div className='mx-auto w-full max-w-6xl'>
            <div
              className={cn('max-w-md', isShapeOnLeft(index) && 'lg:ms-auto')}
            >
              <SectionCopy section={section} isFirst={index === 0} />
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
