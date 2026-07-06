import { ArrowRightIcon, CalendarCheckIcon } from '@/registry/ndeko/lib/icons';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

import { FEATURE } from './data';

type FeatureNoteProps = {
  id: string;
  isOpen: boolean;
};

export function FeatureNote({ id, isOpen }: FeatureNoteProps) {
  return (
    <Fold open={isOpen} id={id}>
      <div className='pt-6'>
        <div className='bg-foreground/[0.04] flex items-start gap-3 rounded-xl p-4'>
          <span className='keycap-3d text-primary-ink flex size-9 shrink-0 items-center justify-center rounded-lg'>
            <CalendarCheckIcon />
          </span>
          <div className='flex min-w-0 flex-col items-start gap-1'>
            <p className='text-sm font-medium'>{FEATURE.name}</p>
            <p className='text-muted-foreground text-[13px] leading-5 text-pretty'>
              {FEATURE.text}
            </p>
            <a
              href={FEATURE.href}
              className='text-primary-ink focus-visible:ring-ring/25 -mx-1 mt-1 inline-flex items-center gap-1 rounded-sm px-1 text-[13px] font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
            >
              {FEATURE.linkLabel}
              <ArrowRightIcon className='size-3.5' />
            </a>
          </div>
        </div>
      </div>
    </Fold>
  );
}
