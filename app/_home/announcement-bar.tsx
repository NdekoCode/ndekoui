import Link from 'next/link';

import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';

/** One line of news above the header, on the home page only. */
export function AnnouncementBar() {
  return (
    <div className='dark bg-background text-foreground relative z-50 shadow-[0_1px_0_var(--border)]'>
      <p className='mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-[13px]'>
        <span className='text-muted-foreground'>
          New: the AI kit, with prompts, answers, agents, runs and reviews
        </span>
        <Link
          href='/components#ai'
          className='focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
        >
          See the AI kit
          <ArrowRightIcon className='size-3.5' />
        </Link>
      </p>
    </div>
  );
}
