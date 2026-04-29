import { SYSTEM_FONT_CLASS } from '@/lib/site';
import { Toaster } from '@/registry/ndeko/ui/sonner';
import { TooltipProvider } from '@/registry/ndeko/ui/tooltip';

import { SiteHeader } from './site-header';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div
        className={`${SYSTEM_FONT_CLASS} bg-background text-foreground min-h-screen antialiased`}
      >
        <SiteHeader />
        <main className='mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10'>
          {children}
        </main>
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export function BareShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div
        className={`${SYSTEM_FONT_CLASS} bg-background text-foreground min-h-screen antialiased`}
      >
        {children}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
