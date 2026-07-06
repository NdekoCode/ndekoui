'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { DownloadIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { MorphButton, type MorphState } from '@/registry/ndeko/ui/morph-button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/ndeko/ui/table';

import { INVOICES, type Invoice, type InvoiceStatus } from './data';
import type { DownloadStatus } from './session';
import { SURFACE } from './settings-frame';

export const DOLLARS = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const DOWNLOAD_LABELS: Record<MorphState, string> = {
  idle: 'Download',
  busy: 'Preparing',
  done: 'Downloaded',
};

const MORPH_OF: Record<DownloadStatus, MorphState> = {
  idle: 'idle',
  busy: 'busy',
  done: 'done',
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: 'Paid',
  refunded: 'Refunded',
};

const STATUS_VARIANT: Record<InvoiceStatus, 'success' | 'secondary'> = {
  paid: 'success',
  refunded: 'secondary',
};

/** The name follows the state of the button, so it always holds the words it shows. */
function downloadLabelOf(status: DownloadStatus, invoiceId: string) {
  const words = DOWNLOAD_LABELS[MORPH_OF[status]];
  return `${words} ${invoiceId}`;
}

type InvoicesProps = {
  downloads: Record<string, DownloadStatus>;
  pressed: string | null;
  onDownload: (invoice: Invoice) => void;
};

/** A wide table scrolls inside its own frame on a phone, never the page. */
export function Invoices({ downloads, pressed, onDownload }: InvoicesProps) {
  return (
    <div className={cn(SURFACE, 'overflow-hidden')}>
      <Table className='min-w-[30rem]'>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className='ps-4'>Date</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead className='text-end'>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='pe-4 text-end'>
              <span className='sr-only'>Download</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {INVOICES.map((invoice) => {
            const status = downloads[invoice.id] ?? 'idle';
            return (
              <TableRow key={invoice.id}>
                <TableCell className='ps-4 whitespace-nowrap'>
                  {invoice.date}
                </TableCell>
                <TableCell className='font-mono text-xs'>
                  {invoice.id}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {DOLLARS.format(invoice.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[invoice.status]}>
                    {STATUS_LABEL[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className='pe-2 text-end'>
                  <MorphButton
                    type='button'
                    variant='ghost'
                    size='sm'
                    state={MORPH_OF[status]}
                    labels={DOWNLOAD_LABELS}
                    idleIcon={<DownloadIcon />}
                    aria-label={downloadLabelOf(status, invoice.id)}
                    onClick={() => onDownload(invoice)}
                    className={cn(
                      'text-muted-foreground',
                      pressedQuietOf(pressed === `download-${invoice.id}`)
                    )}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
