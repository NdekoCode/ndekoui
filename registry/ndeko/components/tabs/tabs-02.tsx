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

const INDICATOR =
  'pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-md bg-foreground/[0.06] transition-[translate,width] duration-200 ease-(--ease-out-strong)';

export default function Tabs02() {
  return (
    <Tabs defaultValue='overview' className='items-center'>
      <TabsPrimitive.List className='relative inline-flex items-center gap-0.5'>
        {TABS.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            className='h-7 rounded-md px-3'
          >
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
