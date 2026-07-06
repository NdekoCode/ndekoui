import { cn } from '@/registry/ndeko/lib/utils';
import { SettleItem } from '@/registry/ndeko/ui/settle';

import {
  DEAL_FLOW,
  REPLY_DRAFT,
  TASK_CAPTURE,
  WORK_ANCHOR,
  WORK_SECTION,
} from './data';
import { DealFlow } from './deal-flow';
import { ReplyDraft } from './reply-draft';
import { Reveal } from './reveal';
import { TaskCapture } from './task-capture';

type CapabilityCardProps = {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
};

function CapabilityCard({
  title,
  description,
  className,
  children,
}: CapabilityCardProps) {
  return (
    <article
      className={cn(
        'bg-card hairline-ring ring-border dark:bg-foreground/[0.04] flex flex-col gap-4 rounded-2xl p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='flex flex-col gap-1'>
        <h3 className='text-[15px] font-medium'>{title}</h3>
        <p className='text-muted-foreground text-[13px] text-pretty'>
          {description}
        </p>
      </div>
      <div className='bg-foreground/[0.04] flex-1 rounded-xl p-3'>
        {children}
      </div>
    </article>
  );
}

export function Capabilities() {
  return (
    <section
      id={WORK_ANCHOR}
      className='px-4 py-16 @sm:px-6 @sm:py-20 @5xl:px-8'
    >
      <Reveal
        className='mx-auto max-w-6xl'
        groupClassName='flex flex-col gap-8'
      >
        <SettleItem className='flex max-w-2xl flex-col gap-3'>
          <h2 className='text-2xl font-semibold text-balance @2xl:text-3xl'>
            {WORK_SECTION.title}
          </h2>
          <p className='text-muted-foreground text-base text-pretty'>
            {WORK_SECTION.description}
          </p>
        </SettleItem>
        <SettleItem className='grid gap-3 @3xl:grid-cols-2'>
          <CapabilityCard
            title={DEAL_FLOW.title}
            description={DEAL_FLOW.description}
            className='@3xl:col-span-2'
          >
            <DealFlow />
          </CapabilityCard>
          <CapabilityCard
            title={REPLY_DRAFT.title}
            description={REPLY_DRAFT.description}
          >
            <ReplyDraft />
          </CapabilityCard>
          <CapabilityCard
            title={TASK_CAPTURE.title}
            description={TASK_CAPTURE.description}
          >
            <TaskCapture />
          </CapabilityCard>
        </SettleItem>
      </Reveal>
    </section>
  );
}
