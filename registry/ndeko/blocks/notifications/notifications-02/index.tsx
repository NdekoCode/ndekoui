'use client';

import { toast } from 'sonner';

import { Button } from '@/registry/ndeko/ui/button';

import {
  ArchiveTile,
  EstimateTile,
  ExportTile,
  InviteTile,
} from './toast-tiles';

export default function Notifications02() {
  return (
    <div className='bg-background text-foreground min-h-svh px-4 py-8 sm:px-8 sm:py-10'>
      <div className='mx-auto max-w-3xl'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h1 className='text-sm font-semibold'>Toasts</h1>
            <p className='text-muted-foreground mt-0.5 text-[13px]'>
              Each toast states what happened, and a failure also says why
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => toast.dismiss()}
            className='text-muted-foreground'
          >
            Dismiss all
          </Button>
        </div>
        <div className='mt-6 grid gap-4 sm:grid-cols-2'>
          <InviteTile />
          <EstimateTile />
          <ExportTile />
          <ArchiveTile />
        </div>
      </div>
    </div>
  );
}
