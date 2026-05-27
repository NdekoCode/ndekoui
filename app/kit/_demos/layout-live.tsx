'use client';

import { useState } from 'react';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

const SHORT_SUMMARY = 'Three pages ship with the redesign.';

const FULL_SUMMARY = [
  'Three pages ship with the redesign: pricing, docs and the changelog.',
  'Pricing gets one plan per row, docs get a search that reads the whole site, and the changelog groups entries by month.',
].join(' ');

function summaryOf(isExpanded: boolean) {
  if (isExpanded) {
    return FULL_SUMMARY;
  }
  return SHORT_SUMMARY;
}

function toggleLabelOf(isExpanded: boolean) {
  if (isExpanded) {
    return 'Show less';
  }
  return 'Read the full summary';
}

export function AnimatedSizeDemo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = summaryOf(isExpanded);
  const toggleLabel = toggleLabelOf(isExpanded);

  function toggleSummary() {
    setIsExpanded((current) => !current);
  }

  return (
    <div className='flex w-full max-w-xs flex-col items-start gap-3'>
      <AnimatedSize className='w-full'>
        <p className='text-muted-foreground text-[13px] leading-relaxed'>
          {summary}
        </p>
      </AnimatedSize>
      <Button variant='outline' size='sm' onClick={toggleSummary}>
        {toggleLabel}
      </Button>
    </div>
  );
}
