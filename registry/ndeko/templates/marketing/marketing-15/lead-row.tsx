import { motion, type Transition } from 'motion/react';
import { memo } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Badge, type BadgeProps } from '@/registry/ndeko/ui/badge';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import { STAGE_LABEL, type Lead, type LeadStage } from './data';
import { valueOf } from './leads';

export const LEAD_GRID =
  'grid grid-cols-[minmax(0,1fr)_5rem_3rem] items-center gap-3 px-3 @xl/leads:grid-cols-[minmax(0,1fr)_6rem_5.5rem_2rem_4rem]';

const STAGE_TONE: Record<LeadStage, BadgeProps['variant']> = {
  new: 'secondary',
  qualified: 'info',
  proposal: 'warning',
  won: 'success',
};

type LeadRowProps = {
  lead: Lead;
  orderKey: string;
  transition: Transition;
};

export const LeadRow = memo(function LeadRow({
  lead,
  orderKey,
  transition,
}: LeadRowProps) {
  return (
    <motion.div
      role='row'
      layout='position'
      layoutDependency={orderKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={transition}
      className={cn('h-14 text-[13px]', LEAD_GRID)}
    >
      <div role='cell' className='flex min-w-0 items-center gap-3'>
        <Avatar
          seed={lead.name}
          role='img'
          aria-label={lead.name}
          className='size-8'
        />
        <div className='flex min-w-0 flex-col gap-0.5'>
          <p className='truncate font-medium'>{lead.name}</p>
          <p className='text-muted-foreground flex items-center gap-1.5 truncate text-xs'>
            <CompanyMark seed={lead.company} size='sm' />
            <span className='truncate'>{lead.company}</span>
            <span className='@xl/leads:hidden'>{STAGE_LABEL[lead.stage]}</span>
          </p>
        </div>
      </div>
      <div role='cell' className='hidden @xl/leads:block'>
        <Badge variant={STAGE_TONE[lead.stage]}>
          {STAGE_LABEL[lead.stage]}
        </Badge>
      </div>
      <div role='cell' className='text-end font-medium tabular-nums'>
        {valueOf(lead)}
      </div>
      <div role='cell' className='hidden @xl/leads:block'>
        <Avatar
          seed={lead.owner}
          role='img'
          aria-label={lead.owner}
          className='size-6'
        />
      </div>
      <div
        role='cell'
        className='text-muted-foreground text-end text-xs tabular-nums'
      >
        {lead.touchedDaysAgo}d
      </div>
    </motion.div>
  );
});
