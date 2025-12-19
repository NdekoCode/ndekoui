import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tabs, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

const TABS = [
  {
    value: 'overview',
    label: 'Overview',
    content: 'Open tasks, recent activity and the next deadlines.',
  },
  {
    value: 'projects',
    label: 'Projects',
    content: 'Three active projects, sorted by their latest update.',
  },
  {
    value: 'packages',
    label: 'Packages',
    content:
      'Packages published from this workspace, with their latest version.',
  },
];

const LIST = [
  'relative inline-flex h-8 overflow-hidden rounded-full bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15',
].join(' ');

const INDICATOR =
  'pointer-events-none absolute inset-y-0 left-0 w-(--active-tab-width) translate-x-(--active-tab-left) bg-foreground/[0.06] transition-[translate,width] duration-200 ease-(--ease-out-strong)';

const SEGMENT = [
  'h-full px-3.5 first-of-type:rounded-s-full last-of-type:rounded-e-full focus-visible:ring-inset',
  'not-first-of-type:hairline-l border-foreground/12 dark:border-foreground/15',
].join(' ');

export default function Tabs06() {
  return (
    <Tabs defaultValue='overview' className='items-center'>
      <TabsPrimitive.List className={LIST}>
        {TABS.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} className={SEGMENT}>
            {tab.label}
          </TabsTab>
        ))}
        <TabsPrimitive.Indicator className={INDICATOR} />
      </TabsPrimitive.List>
      <AnimatedSize>
        {TABS.map((tab) => (
          <TabsPanel key={tab.value} value={tab.value}>
            <p className='text-muted-foreground p-4 text-center text-xs'>
              {tab.content}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
