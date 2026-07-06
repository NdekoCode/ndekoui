import { cn } from '@/registry/ndeko/lib/utils';
import { Wash } from '@/registry/ndeko/ui/wash';

import { APPS, HERO } from './data';
import { Orbit } from './orbit';
import { PromptBox } from './prompt-box';

const STAGE_FADE =
  '[mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]';

function spokenAppsOf(names: string[]) {
  const last = names[names.length - 1];
  const others = names.slice(0, -1);
  return `${others.join(', ')} and ${last}`;
}

export default function Heroes07() {
  const appNames = APPS.map((app) => app.name);
  const spokenApps = spokenAppsOf(appNames);

  return (
    <section className='@container'>
      <div className='relative isolate overflow-x-clip'>
        <Wash className='h-[28rem]' />
        <div className='mx-auto flex max-w-6xl flex-col items-center px-4 py-16 @2xl:px-6 @2xl:py-24'>
          <div className='flex max-w-3xl flex-col items-center gap-5 text-center'>
            <p className='text-primary-ink text-sm font-medium'>
              {HERO.eyebrow}
            </p>
            <h1 className='text-4xl font-semibold text-balance @2xl:text-5xl'>
              {HERO.title}
            </h1>
            <p className='text-muted-foreground max-w-xl text-base text-pretty'>
              {HERO.description}
            </p>
            <p className='sr-only'>Works with {spokenApps}</p>
          </div>
          <div
            className={cn(
              '@container relative mt-10 h-[22rem] w-full max-w-3xl overflow-hidden @2xl:h-[28rem]',
              STAGE_FADE
            )}
          >
            <Orbit />
            <div className='relative z-10 flex h-full items-center justify-center px-4'>
              <PromptBox />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
