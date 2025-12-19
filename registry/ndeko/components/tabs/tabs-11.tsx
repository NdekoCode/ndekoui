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

const LIST =
  'relative mb-2.5 flex w-max min-w-full gap-0.5 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-(--hairline) before:bg-border';

const FOLDER_TAB = [
  'h-8 rounded-t-lg px-3 hairline-x hairline-t border-border bg-foreground/[0.03]',
  'data-active:bg-card',
].join(' ');

export default function Tabs11() {
  return (
    <Tabs defaultValue='overview' className='w-full min-w-0'>
      <ScrollArea>
        <TabsPrimitive.List className={LIST}>
          {TABS.map((tab) => (
            <TabsTab key={tab.value} value={tab.value} className={FOLDER_TAB}>
              <tab.icon className='-ms-0.5 opacity-60' />
              {tab.label}
            </TabsTab>
          ))}
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
