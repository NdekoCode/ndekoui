import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import {
  BoxIcon,
  HouseIcon,
  PanelsTopLeftIcon,
} from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { ScrollArea } from '@/registry/ndeko/ui/scroll-area';
import { Tabs, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

const TABS = [
  {
    value: 'overview',
    label: 'Overview',
    icon: HouseIcon,
    content: 'Open tasks, recent activity and the next deadlines.',
  },
  {
    value: 'projects',
    label: 'Projects',
    icon: PanelsTopLeftIcon,
    content: 'Three active projects, sorted by their latest update.',
  },
  {
    value: 'packages',
    label: 'Packages',
    icon: BoxIcon,
    content:
      'Packages published from this workspace, with their latest version.',
  },
];

const INDICATOR =
  'pointer-events-none absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-[translate,width] duration-200 ease-(--ease-out-strong)';

const TAB = 'h-7 rounded-full px-3 data-active:text-primary-foreground';

export default function Tabs09() {
  return (
    <Tabs defaultValue='overview' className='w-full min-w-0'>
      <ScrollArea>
        <TabsPrimitive.List className='relative mb-2.5 inline-flex items-center gap-1'>
          {TABS.map((tab) => (
            <TabsTab key={tab.value} value={tab.value} className={TAB}>
              <tab.icon className='-ms-0.5 opacity-60' />
              {tab.label}
            </TabsTab>
          ))}
          <TabsPrimitive.Indicator className={INDICATOR} />
        </TabsPrimitive.List>
      </ScrollArea>
      <AnimatedSize>
        {TABS.map((tab) => (
          <TabsPanel key={tab.value} value={tab.value}>
            <p className='text-muted-foreground px-4 pb-4 text-center text-xs'>
              {tab.content}
            </p>
          </TabsPanel>
        ))}
      </AnimatedSize>
    </Tabs>
  );
}
