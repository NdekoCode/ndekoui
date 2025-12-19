import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

const QUEUES = [
  { value: 'to-do', label: 'To do', count: 3 },
  { value: 'in-review', label: 'In review', count: 0 },
  { value: 'done', label: 'Done', count: 7 },
];

const INDICATOR =
  'pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-lg bg-foreground/[0.05] transition-[translate,width] duration-200 ease-(--ease-out-strong)';

const STACKED_TAB = 'group/tab flex-1 flex-col gap-1.5 rounded-lg p-3 text-xs';

const COUNT = [
  'keycap-3d inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums text-muted-foreground',
  'opacity-50 transition-opacity group-data-active/tab:opacity-100',
].join(' ');

function summaryOf(count: number) {
  if (count === 0) {
    return 'No tasks in this list.';
  }
  if (count === 1) {
    return '1 task in this list.';
  }
  return `${count} tasks in this list.`;
}

export default function Tabs14() {
  return (
    <Tabs defaultValue='to-do' className='w-full'>
      <TabsPrimitive.List className='relative mx-auto flex w-full max-w-xs'>
        {QUEUES.map((queue) => (
          <TabsTab
            key={queue.value}
            value={queue.value}
            className={STACKED_TAB}
          >
            <span className={COUNT}>{queue.count}</span>
            {queue.label}
          </TabsTab>
        ))}
        <TabsPrimitive.Indicator className={INDICATOR} />
      </TabsPrimitive.List>
      <AnimatedSize>
        {QUEUES.map((queue) => (
          <TabsPanel key={queue.value} value={queue.value}>
            <p className='text-muted-foreground p-4 text-center text-xs'>
              {summaryOf(queue.count)}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
