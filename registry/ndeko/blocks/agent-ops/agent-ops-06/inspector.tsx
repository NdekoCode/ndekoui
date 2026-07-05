'use client';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { JsonView } from '@/registry/ndeko/ui/json-view';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

import { headersOf, type Delivery, type DeliveryStatus } from './data';
import type { InspectorTab } from './session';

const TABS: InspectorTab[] = ['payload', 'headers'];

const CODE_VARIANT: Record<DeliveryStatus, 'success' | 'destructive' | 'info'> =
  {
    done: 'success',
    failed: 'destructive',
    pending: 'info',
  };

const CODE_PHRASE: Record<number, string> = {
  200: '200 OK',
  500: '500 Internal Server Error',
};

export function codeVariantOf(status: DeliveryStatus) {
  return CODE_VARIANT[status];
}

/** 200, 500, or Sending while the endpoint has not answered. */
export function codeWordOf(delivery: Delivery) {
  if (delivery.code === null) {
    return 'Sending';
  }
  return String(delivery.code);
}

function codePhraseOf(delivery: Delivery) {
  if (delivery.code === null) {
    return 'Sending';
  }
  return CODE_PHRASE[delivery.code] ?? String(delivery.code);
}

function attemptWordOf(attempt: number) {
  if (attempt === 1) {
    return 'First attempt';
  }
  return `Attempt ${attempt}`;
}

function timingOf(delivery: Delivery) {
  const attempt = attemptWordOf(delivery.attempt);
  if (delivery.ms === null) {
    return attempt;
  }
  return `${attempt} · ${delivery.ms} ms`;
}

function responseBodyOf(delivery: Delivery) {
  if (delivery.status === 'pending') {
    return 'Waiting for the endpoint to answer';
  }
  return delivery.responseBody;
}

export type InspectorProps = {
  delivery: Delivery;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
};

export function Inspector({ delivery, tab, onTabChange }: InspectorProps) {
  const codePhrase = codePhraseOf(delivery);
  const responseBody = responseBodyOf(delivery);

  function changeTab(next: unknown) {
    const found = TABS.find((candidate) => candidate === next);
    if (found) {
      onTabChange(found);
    }
  }

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex flex-col gap-3 rounded-lg p-3'>
      <div className='flex flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-x-2.5 gap-y-1'>
          <h3 className='text-[13px] font-medium'>Response</h3>
          <Badge
            variant={codeVariantOf(delivery.status)}
            className='transition-colors duration-300'
          >
            <Swap swapKey={codePhrase}>{codePhrase}</Swap>
          </Badge>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {timingOf(delivery)}
          </span>
        </div>
        <code className='bg-card dark:bg-foreground/[0.04] hairline-ring ring-foreground/10 block rounded-md px-2.5 py-2 font-mono text-xs break-all'>
          <Swap swapKey={responseBody}>{responseBody}</Swap>
        </code>
      </div>
      <Tabs value={tab} onValueChange={changeTab} className='gap-2'>
        <TabsList variant='segmented' aria-label='What was sent'>
          <TabsTab value='payload'>Payload</TabsTab>
          <TabsTab value='headers'>Headers</TabsTab>
        </TabsList>
        <AnimatedSize>
          <TabsPanel value='payload'>
            <JsonView
              value={delivery.payload}
              className='bg-card dark:bg-foreground/[0.04] max-h-56'
            />
          </TabsPanel>
          <TabsPanel value='headers'>
            <JsonView
              value={headersOf(delivery)}
              className='bg-card dark:bg-foreground/[0.04] max-h-56'
            />
          </TabsPanel>
        </AnimatedSize>
      </Tabs>
    </div>
  );
}
