import Link from 'next/link';

import { MCP_PAGE_PATH } from '@/app/mcp/_shared/mcp-config';
import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';

/** One line of news above the header, on the home page only. */
export function AnnouncementBar() {
  return (
    <div className='dark bg-background text-foreground relative z-50 shadow-[0_1px_0_var(--border)]'>
      <p className='mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-[13px]'>
        <span className='bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[11px] font-semibold'>
          New
        </span>
        <span className='text-muted-foreground'>
          Your editor can now search and install Ndeko UI through MCP.
        </span>
        <Link
          href={MCP_PAGE_PATH}
          className='focus-visible:ring-ring/50 inline-flex items-center gap-1 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
        >
          Connect it
          <ArrowRightIcon className='size-3.5' />
        </Link>
      </p>
    </div>
  );
}
