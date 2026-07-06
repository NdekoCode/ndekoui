'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { CopyButton } from '@/registry/ndeko/ui/copy-button';

export const CODE_TRAY = 'bg-foreground/[0.04] rounded-lg';

export function CodeBlock({ code }: { code: string }) {
  return (
    <div className='relative'>
      <pre
        tabIndex={0}
        className={cn(
          CODE_TRAY,
          'focus-visible:ring-ring/25 relative overflow-x-auto py-2.5 ps-3 pe-10 font-mono text-[12.5px] leading-relaxed outline-none focus-visible:ring-[3px]'
        )}
      >
        <code>{code}</code>
      </pre>
      <CopyButton
        text={code}
        label='Copy the code'
        className='absolute end-1.5 top-1.5'
      />
    </div>
  );
}
